import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";
import { sanitizeApiKey } from "./_gemini";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const rawKey = process.env.GEMINI_API_KEY;
    const cleanedKey = sanitizeApiKey(rawKey);
    const hasKey = !!cleanedKey;

    let geminiTestResult = "Not attempted";
    let geminiError: any = null;

    if (cleanedKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: cleanedKey });
        const out = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: "Hello from Vercel debug endpoint",
        });
        geminiTestResult = out.text || "Empty response";
      } catch (err: any) {
        geminiError = {
          name: err?.name,
          message: err?.message,
          status: err?.status,
        };
      }
    }

    return res.status(200).json({
      env: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        hasKey,
        keyLen: cleanedKey?.length || 0,
        firstChars: cleanedKey?.slice(0, 6) || "",
        lastChars: cleanedKey?.slice(-6) || "",
      },
      geminiTestResult,
      geminiError,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "debug failed" });
  }
}
