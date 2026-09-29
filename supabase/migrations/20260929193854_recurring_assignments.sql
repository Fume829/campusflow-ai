-- Phase 2: recurring assignment data model

create table public.assignment_templates (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  title text not null,
  subject text not null,
  frequency text not null default 'weekly'::text,
  due_weekday smallint not null,
  due_time time without time zone not null,
  priority text not null default '中'::text,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  constraint assignment_templates_pkey primary key (id),
  constraint assignment_templates_user_id_fkey
    foreign key (user_id)
    references auth.users(id)
    on delete cascade,
  constraint assignment_templates_title_check
    check (char_length(trim(title)) > 0),
  constraint assignment_templates_subject_check
    check (char_length(trim(subject)) > 0),
  constraint assignment_templates_frequency_check
    check (frequency = 'weekly'::text),
  constraint assignment_templates_due_weekday_check
    check (due_weekday >= 0 and due_weekday <= 6),
  constraint assignment_templates_priority_check
    check (priority = any (array['高'::text, '中'::text, '低'::text]))
);

create index assignment_templates_user_active_idx
  on public.assignment_templates (user_id, is_active);

alter table public.assignment_templates enable row level security;

create policy "Users can create own assignment templates"
on public.assignment_templates
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can delete own assignment templates"
on public.assignment_templates
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can update own assignment templates"
on public.assignment_templates
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can view own assignment templates"
on public.assignment_templates
for select
to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, update, delete
on table public.assignment_templates
to authenticated;

create trigger assignment_templates_set_updated_at
before update on public.assignment_templates
for each row
execute function private.set_updated_at();

alter table public.assignments
  add column template_id uuid;

alter table public.assignments
  add constraint assignments_template_id_fkey
  foreign key (template_id)
  references public.assignment_templates(id)
  on delete set null;

create or replace function public.create_recurring_assignment(
  p_title text,
  p_subject text,
  p_due_at timestamptz,
  p_priority text,
  p_status text,
  p_due_weekday smallint,
  p_due_time time without time zone
)
returns public.assignments
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_template public.assignment_templates;
  v_assignment public.assignments;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if char_length(trim(p_title)) = 0 then
    raise exception 'Title must not be empty';
  end if;

  if char_length(trim(p_subject)) = 0 then
    raise exception 'Subject must not be empty';
  end if;

  if p_due_at is null then
    raise exception 'Due date and time are required';
  end if;

  if p_priority not in ('高', '中', '低') then
    raise exception 'Invalid priority';
  end if;

  if p_status not in ('未着手', '進行中', '完了') then
    raise exception 'Invalid status';
  end if;

  if p_due_weekday < 0 or p_due_weekday > 6 then
    raise exception 'Invalid due weekday';
  end if;

  insert into public.assignment_templates (
    user_id,
    title,
    subject,
    frequency,
    due_weekday,
    due_time,
    priority,
    is_active
  )
  values (
    v_user_id,
    trim(p_title),
    trim(p_subject),
    'weekly',
    p_due_weekday,
    p_due_time,
    p_priority,
    true
  )
  returning *
  into v_template;

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
    trim(p_title),
    trim(p_subject),
    (p_due_at at time zone 'Asia/Tokyo')::date,
    p_due_at,
    p_priority,
    p_status,
    v_template.id
  )
  returning *
  into v_assignment;

  return v_assignment;
end;
$$;