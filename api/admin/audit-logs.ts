import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getAuditLogs } from "../dbStore";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const adminKey = req.headers["x-admin-key"];
  if (adminKey !== "dg-admin-session-active") {
    return res.status(403).json({ error: "Unauthorized: Admin access required" });
  }

  try {
    const logs = getAuditLogs();
    return res.json({ logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
