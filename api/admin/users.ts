import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getUsers, saveUser, addAuditLog } from "../dbStore";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const adminKey = req.headers["x-admin-key"];
  if (adminKey !== "dg-admin-session-active") {
    return res.status(403).json({ error: "Unauthorized: Admin access required" });
  }

  try {
    if (req.method === "GET") {
      const users = getUsers();
      return res.json({ users, total: users.length });
    } else if (req.method === "POST") {
      const { userId, email, plan } = req.body;
      if (!userId || !email || !plan) {
        return res.status(400).json({ error: "Missing fields" });
      }
      const users = getUsers();
      if (users.some((u) => u.userId === userId)) {
        return res.status(400).json({ error: "User with this ID already exists" });
      }

      const slots = plan === "free" ? 1 : plan === "prime" ? 5 : plan === "apex" ? 60 : 2;
      const credits = plan === "free" ? 5 : 999999;

      const newUser = saveUser({
        userId,
        email,
        name: userId,
        role: "Business Analyst",
        plan,
        analysesLeft: credits,
        projectSlots: slots,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        features: {
          maxDatasets: slots,
          maxRows: 100000,
          aiAnalysisCount: credits,
          customReports: plan !== "free",
          advancedCharts: plan !== "free",
          exportFormats: ["csv", "xlsx"]
        }
      } as any);

      addAuditLog("USER_CREATED", "admin", userId, { plan, email });
      return res.status(201).json(newUser);
    } else {
      res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
