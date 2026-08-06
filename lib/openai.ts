import "server-only";

import OpenAI from "openai";

export function createOpenAIClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export const openAIModel = process.env.OPENAI_MODEL || "gpt-5-mini";
