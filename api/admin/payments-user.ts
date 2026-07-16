import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getPayments } from "../dbStore";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const userId = req.query.userId as string | undefined;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId parameter" });
    }

    const list = getPayments();
    const userPayments = list.filter((p) => p.user_id === userId);
    return res.json(userPayments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
