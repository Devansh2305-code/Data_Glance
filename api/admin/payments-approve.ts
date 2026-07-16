import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getPayments, savePayment, getUsers, saveUser, addAuditLog } from "../dbStore";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const adminKey = req.headers["x-admin-key"];
  if (adminKey !== "dg-admin-session-active") {
    return res.status(403).json({ error: "Unauthorized: Admin access required" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: "Missing payment id" });
    }

    const payments = getPayments();
    const payment = payments.find((p) => String(p.id) === String(id));
    if (!payment) {
      return res.status(404).json({ error: "Payment request not found" });
    }

    if (payment.status === "approved") {
      return res.status(400).json({ error: "Payment already approved" });
    }

    payment.status = "approved";
    savePayment(payment);

    const users = getUsers();
    const user = users.find((u) => u.userId === payment.user_id);
    const plan = payment.plan;
    const slots = plan === "free" ? 1 : plan === "prime" ? 5 : plan === "apex" ? 60 : 2;
    const credits = plan === "free" ? 5 : 999999;

    if (user) {
      user.plan = plan;
      user.projectSlots = slots;
      user.analysesLeft = credits;
      user.updatedAt = new Date().toISOString();
      user.features = {
        maxDatasets: slots,
        maxRows: 100000,
        aiAnalysisCount: credits,
        customReports: plan !== "free",
        advancedCharts: plan !== "free",
        exportFormats: ["csv", "xlsx"]
      };
      saveUser(user);
    } else {
      saveUser({
        userId: payment.user_id,
        email: payment.email,
        name: payment.user_id,
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
    }

    addAuditLog("PAYMENT_APPROVED", "admin", payment.user_id, { plan, ref: payment.transaction_ref });
    return res.json({ success: true, payment });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
