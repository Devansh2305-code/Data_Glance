import type { VercelRequest, VercelResponse } from "@vercel/node";
import { deleteUser, addAuditLog } from "../dbStore";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const adminKey = req.headers["x-admin-key"];
  if (adminKey !== "dg-admin-session-active") {
    return res.status(403).json({ error: "Unauthorized: Admin access required" });
  }

  if (req.method !== "POST" && req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const success = deleteUser(userId);
    if (!success) {
      return res.status(404).json({ error: "User not found" });
    }

    addAuditLog("USER_DELETED", "admin", userId, {});
    return res.json({ success: true, message: `User ${userId} deleted successfully.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
