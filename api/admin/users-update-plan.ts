import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getUsers, saveUser, addAuditLog } from "../dbStore";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const adminKey = req.headers["x-admin-key"];
  if (adminKey !== "dg-admin-session-active") {
    return res.status(403).json({ error: "Unauthorized: Admin access required" });
  }

  if (req.method !== "PUT" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId, plan } = req.body;
    if (!userId || !plan) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const users = getUsers();
    const userIdx = users.findIndex(u => u.userId === userId);
    if (userIdx === -1) {
      return res.status(404).json({ error: "User not found" });
    }

    const oldPlan = users[userIdx].plan;
    const slots = plan === "free" ? 1 : plan === "prime" ? 5 : plan === "apex" ? 60 : 2;
    const credits = plan === "free" ? 5 : 999999;

    users[userIdx].plan = plan;
    users[userIdx].projectSlots = slots;
    users[userIdx].analysesLeft = credits;
    users[userIdx].updatedAt = new Date().toISOString();
    
    users[userIdx].features = {
      maxDatasets: slots,
      maxRows: 100000,
      aiAnalysisCount: credits,
      customReports: plan !== "free",
      advancedCharts: plan !== "free",
      exportFormats: ["csv", "xlsx"]
    };

    saveUser(users[userIdx]);
    addAuditLog("PLAN_UPDATED", "admin", userId, { from: oldPlan, to: plan });

    return res.json(users[userIdx]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
