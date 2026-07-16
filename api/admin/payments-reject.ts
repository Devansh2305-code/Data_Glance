import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getPayments, savePayment, addAuditLog } from "../dbStore";

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

    payment.status = "rejected";
    savePayment(payment);

    addAuditLog("PAYMENT_REJECTED", "admin", payment.user_id, { plan: payment.plan, ref: payment.transaction_ref });
    return res.json({ success: true, payment });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
