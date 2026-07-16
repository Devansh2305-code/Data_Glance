import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getPayments, savePayment, addAuditLog } from "../dbStore";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "GET") {
      const adminKey = req.headers["x-admin-key"];
      if (adminKey !== "dg-admin-session-active") {
        return res.status(403).json({ error: "Unauthorized: Admin access required" });
      }
      const list = getPayments();
      return res.json(list);
    } else if (req.method === "POST") {
      const { userId, email, plan, amount, upiId, transactionRef } = req.body;
      if (!userId || !email || !plan || !amount || !upiId || !transactionRef) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const list = getPayments();
      if (list.some((p) => p.transaction_ref === transactionRef.trim())) {
        return res.status(400).json({ error: "This transaction reference code has already been submitted." });
      }

      const newPayment = savePayment({
        user_id: userId,
        email,
        plan,
        amount,
        upi_id: upiId,
        transaction_ref: transactionRef.trim(),
        status: "pending"
      });

      addAuditLog("PAYMENT_SUBMITTED", userId, undefined, { plan, ref: transactionRef });
      return res.status(201).json(newPayment);
    } else {
      res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
