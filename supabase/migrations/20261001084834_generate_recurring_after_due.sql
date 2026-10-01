create or replace function public.generate_recurring_assignments()
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_template public.assignment_templates;
  v_last_assignment public.assignments;
  v_next_due_at timestamptz;
  v_next_due_date date;
  v_generated_count integer := 0;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  for v_template in
    select *
    from public.assignment_templates
    where user_id = v_user_id
      and is_active = true
      and frequency = 'weekly'
  loop
    select *
    into v_last_assignment
    from public.assignments
    where user_id = v_user_id
      and template_id = v_template.id
    order by due_at desc
    limit 1;

    if not found then
      continue;
    end if;

    -- Generate the next occurrence only after the latest
    -- assignment's due date and time has passed.
    if v_last_assignment.due_at > now() then
      continue;
    end if;

    v_next_due_at := v_last_assignment.due_at + interval '7 days';
    v_next_due_date := (v_next_due_at at time zone 'Asia/Tokyo')::date;

    insert into public.assignments (
      user_id,
      title,
      subject,
      due_date,
      due_at,
      priority,
      status,
      template_id
    )
    values (
      v_user_id,
      v_template.title,
      v_template.subject,
      v_next_due_date,
      v_next_due_at,
      v_template.priority,
      '未着手',
      v_template.id
    )
    on conflict (template_id, due_date)
      where template_id is not null
    do nothing;

    if found then
      v_generated_count := v_generated_count + 1;
    end if;
  end loop;

  return v_generated_count;
end;
$$;