export function sanitizeApiKey(value?: string) {
  if (!value) return "";
  return value.replace(/[\r\n\t]/g, "").trim().replace(/^["']|["']$/g, "");
}

// Default to server env key; only use user key if explicitly provided and non-empty.
export function resolveApiKey(req: any) {
  const envKey = sanitizeApiKey(process.env.GEMINI_API_KEY);

  const headerRaw = req?.headers?.["x-gemini-api-key"];
  const headerKey = sanitizeApiKey(Array.isArray(headerRaw) ? headerRaw[0] : headerRaw);

  const bodyKey = sanitizeApiKey(req?.body?.userApiKey);

  // Optional override: user key wins only when actually provided
  const effective = headerKey || bodyKey || envKey;

  return {
    effectiveKey: effective,
    hasEnvKey: !!envKey,
    usingUserOverride: !!(headerKey || bodyKey),
  };
}
