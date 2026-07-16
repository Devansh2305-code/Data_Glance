import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSystemConfig, saveSystemConfig, saveAdminPassword, addAuditLog } from "../dbStore";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const adminKey = req.headers["x-admin-key"];
  if (adminKey !== "dg-admin-session-active") {
    return res.status(403).json({ error: "Unauthorized: Admin access required" });
  }

  try {
    if (req.method === "GET") {
      const config = getSystemConfig();
      return res.json(config);
    } else if (req.method === "PUT" || req.method === "POST") {
      const { maintenanceMode, maxFileSize, enableAiAnalysis, enableCustomReports, defaultTimeout, adminPassword } = req.body;
      
      const config = getSystemConfig();
      if (maintenanceMode !== undefined) config.maintenanceMode = !!maintenanceMode;
      if (maxFileSize !== undefined) config.maxFileSize = Number(maxFileSize);
      if (enableAiAnalysis !== undefined) config.enableAiAnalysis = !!enableAiAnalysis;
      if (enableCustomReports !== undefined) config.enableCustomReports = !!enableCustomReports;
      if (defaultTimeout !== undefined) config.defaultTimeout = Number(defaultTimeout);

      saveSystemConfig(config);

      if (adminPassword && adminPassword.trim().length >= 4) {
        saveAdminPassword(adminPassword.trim());
        addAuditLog("ADMIN_PASSWORD_CHANGED", "admin", undefined, { message: "Passcode updated" });
      }

      addAuditLog("CONFIG_UPDATED", "admin", undefined, config);
      return res.json(config);
    } else {
      res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
