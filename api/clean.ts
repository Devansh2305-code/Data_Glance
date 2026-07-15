import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI, Type } from "@google/genai";

function sanitizeApiKey(value?: string) {
  if (!value) return "";
  return value.replace(/[\r\n\t]/g, "").trim().replace(/^["']|["']$/g, "");
}

function getGenAIClient(req?: VercelRequest): GoogleGenAI {
  const headerKeyRaw = req?.headers?.["x-gemini-api-key"];
  const headerKey = Array.isArray(headerKeyRaw) ? headerKeyRaw[0] : (headerKeyRaw as string | undefined);
  const bodyKey = req?.body?.userApiKey as string | undefined;
  const envKey = process.env.GEMINI_API_KEY;

  const apiKey = sanitizeApiKey(headerKey || bodyKey || envKey);

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not defined. Please configure GEMINI_API_KEY in Vercel Environment Variables, or supply your custom key in the dashboard settings."
    );
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { data, columns } = req.body || {};

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: "No data provided for cleaning." });
    }

    let ai: GoogleGenAI;
    try {
      ai = getGenAIClient(req);
    } catch (e: any) {
      return res.status(503).json({
        error:
          e?.message ||
          "AI Data Cleaning is currently unavailable (Gemini API key is not configured). Please check your Environment Variables.",
      });
    }

    // Take up to 20 rows of sample to generate rules
    const sampleSize = Math.min(data.length, 20);
    const dataSample = data.slice(0, sampleSize);

    const prompt = `
      You are an expert Data Engineer and Data Quality Auditor.
      You are auditing and designing a cleaning recipe for a raw uploaded dataset. Your goal is to detect if the data has formatting flaws, mixed types, inconsistent cases, leading/trailing white spaces, or raw string numbers (like currency symbols "$", "€", or percent "%" signs or thousand separator commas), and to output structured cleaning instructions.

      Here is metadata about the active dataset:
      - Columns uploaded: ${JSON.stringify(columns || Object.keys(data[0] || {}))}
      - Total records in dataset: ${data.length}
      
      Here is a sample of ${sampleSize} rows from the dataset:
      ${JSON.stringify(dataSample, null, 2)}

      Please audit this sample. Determine:
      1. Whether this data is "messy" and requires format cleaning for clean BI dashboard analytics (e.g. column headers are generic like Column1/Field2, numbers contain commas or currencies, dates are in mixed strings, string text has trailing spaces or inconsistent casing for the same categories). Set "isMessy" to true if anything requires cleaning, or false if it is already clean.
      2. If messy, provide cleaning rules:
         - "cleanSummary": A short bulleted summary describing what corrections the AI will apply.
         - "renamedColumns": Map of original messy headers to clean, descriptive, readable names (e.g. "col1" -> "Channel", "REVENUE (USD)" -> "Revenue"). Keep them human-readable.
         - "columnTypes": Map of clean headers to standard BI types ("number", "string", "date").
         - "transformations": List of transformation actions to run client-side:
           - For numbers: action is "parse_number"
           - For dates: action is "standardize_date"
           - For categorical string columns: action is "trim_and_case" with case option "title" | "upper" | "lower" | "none".

      Provide a structured JSON response matching this schema:
      {
        "isMessy": boolean,
        "cleanSummary": string,
        "renamedColumns": { [originalHeader: string]: string },
        "columnTypes": { [cleanedHeader: string]: "number" | "string" | "date" },
        "transformations": [
          {
            "column": string, // original header name
            "action": "parse_number" | "standardize_date" | "trim_and_case",
            "case": "title" | "upper" | "lower" | "none" // only for trim_and_case
          }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["isMessy", "cleanSummary", "renamedColumns", "columnTypes", "transformations"],
          properties: {
            isMessy: { type: Type.BOOLEAN },
            cleanSummary: { type: Type.STRING },
            renamedColumns: {
              type: Type.OBJECT,
              additionalProperties: { type: Type.STRING }
            },
            columnTypes: {
              type: Type.OBJECT,
              additionalProperties: { type: Type.STRING, enum: ["number", "string", "date"] }
            },
            transformations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["column", "action"],
                properties: {
                  column: { type: Type.STRING },
                  action: { type: Type.STRING, enum: ["parse_number", "standardize_date", "trim_and_case"] },
                  case: { type: Type.STRING, enum: ["title", "upper", "lower", "none"] }
                }
              }
            }
          }
        }
      }
    });

    const resultText = response.text || "{}";
    const parsedResult = JSON.parse(resultText.trim());
    res.json(parsedResult);
  } catch (error: any) {
    console.error("Clean route error:", error);
    res.status(500).json({ error: error.message || "Failed to parse and clean data." });
  }
}
