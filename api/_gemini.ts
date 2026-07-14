import { GoogleGenAI } from "@google/genai";

export function sanitizeApiKey(value?: string) {
  if (!value) return "";
  return value.replace(/[\r\n\t]/g, "").trim().replace(/^["']|["']$/g, "");
}

export function getApiKeyFromRequest(req: any) {
  const headerKey = req.headers?.["x-gemini-api-key"];
  const bodyKey = req.body?.userApiKey;
  const envKey = process.env.GEMINI_API_KEY;
  return sanitizeApiKey((headerKey as string) || bodyKey || envKey);
}

export function getGenAIClient(req: any) {
  const apiKey = getApiKeyFromRequest(req);
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing/empty after sanitization.");
  }
  return new GoogleGenAI({ apiKey });
}
