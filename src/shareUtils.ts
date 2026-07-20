/**
 * Shareable Dashboard URL Helpers
 * Provides matrix compacting, decompression, and compression for dashboard links.
 */

export interface CompactDataset {
  h: string[]; // Header column names
  d: any[][];  // Data row values
}

/**
 * Converts array of record objects into a compact header + data matrix.
 */
export function compactDataset(dataset: any[]): CompactDataset | any[] {
  if (!Array.isArray(dataset) || dataset.length === 0) return dataset;
  const headers = Object.keys(dataset[0]);
  const rows = dataset.map((row) => headers.map((h) => row[h]));
  return { h: headers, d: rows };
}

/**
 * Expands a compact header + data matrix back into an array of record objects.
 */
export function decompactDataset(compactObj: any): any[] {
  if (Array.isArray(compactObj)) return compactObj;
  if (!compactObj || !Array.isArray(compactObj.h) || !Array.isArray(compactObj.d)) {
    return [];
  }
  const headers: string[] = compactObj.h;
  const rows: any[][] = compactObj.d;
  return rows.map((row) => {
    const obj: Record<string, any> = {};
    headers.forEach((h, idx) => {
      obj[h] = row[idx];
    });
    return obj;
  });
}

/**
 * Compresses a JSON payload using deflate-raw CompressionStream & URL-safe Base64.
 */
export async function compressPayload(data: any): Promise<string> {
  const jsonStr = JSON.stringify(data);
  
  if (typeof CompressionStream !== "undefined") {
    try {
      const blob = new Blob([jsonStr]);
      const compressedStream = blob.stream().pipeThrough(new CompressionStream("deflate-raw"));
      const response = new Response(compressedStream);
      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      
      let binary = "";
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
    } catch (err) {
      console.warn("CompressionStream failed, falling back to base64:", err);
    }
  }

  // Fallback to standard base64
  return btoa(unescape(encodeURIComponent(jsonStr)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Decompresses a URL-safe Base64 payload string into original JSON object.
 */
export async function decompressPayload(compressedStr: string): Promise<any> {
  let b64 = compressedStr.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4 !== 0) {
    b64 += "=";
  }
  
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  if (typeof DecompressionStream !== "undefined") {
    try {
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      const response = new Response(stream);
      const text = await response.text();
      return JSON.parse(text);
    } catch (err) {
      console.warn("DecompressionStream failed, fallback parsing:", err);
    }
  }

  const jsonStr = decodeURIComponent(escape(binary));
  return JSON.parse(jsonStr);
}
