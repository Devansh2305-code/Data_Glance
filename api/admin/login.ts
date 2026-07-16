import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getAdminPassword, addAuditLog } from "../dbStore";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { password } = req.body;
    const currentPass = getAdminPassword();
    if (password === currentPass) {
      addAuditLog("ADMIN_LOGIN_SUCCESS", "admin", undefined, { ip: req.headers["x-forwarded-for"] || req.socket?.remoteAddress });
      return res.json({ success: true, token: "dg-admin-session-active" });
    } else {
      addAuditLog("ADMIN_LOGIN_FAILED", "admin", undefined, { passwordAttempted: "••••" }, "failed");
      return res.status(401).json({ error: "Invalid administrative credentials." });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
