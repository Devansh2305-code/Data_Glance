import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getUsers, saveUser } from "../dbStore";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { userId, email, name, role, plan } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const users = getUsers();
    const existing = users.find(u => u.userId === userId);

    if (existing) {
      // Sync plan changes if provided
      let changed = false;
      if (plan && existing.plan !== plan) {
        existing.plan = plan;
        const slots = plan === "free" ? 1 : plan === "prime" ? 5 : plan === "apex" ? 60 : 2;
        const credits = plan === "free" ? 5 : 999999;
        existing.projectSlots = slots;
        existing.analysesLeft = credits;
        changed = true;
      }
      if (email && existing.email !== email) {
        existing.email = email;
        changed = true;
      }
      if (changed) {
        saveUser(existing);
      }
      return res.json(existing);
    } else {
      // Register new user on sync if not exists
      const targetPlan = plan || "free";
      const slots = targetPlan === "free" ? 1 : targetPlan === "prime" ? 5 : targetPlan === "apex" ? 60 : 2;
      const credits = targetPlan === "free" ? 5 : 999999;

      const newUser = saveUser({
        userId,
        email: email || "",
        name: name || userId,
        role: role || "Business Analyst",
        plan: targetPlan,
        analysesLeft: credits,
        projectSlots: slots,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        features: {
          maxDatasets: slots,
          maxRows: 100000,
          aiAnalysisCount: credits,
          customReports: targetPlan !== "free",
          advancedCharts: targetPlan !== "free",
          exportFormats: ["csv", "xlsx"]
        }
      } as any);

      return res.status(201).json(newUser);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
