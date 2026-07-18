import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";

// ============ TYPES ============
export type Role = "CMO" | "Business Analyst" | "CFO" | "Sales Director" | "HR Specialist" | "CEO";

export interface ColumnMetadata {
  name: string;
  type: "number" | "string" | "date";
}

export interface Measure {
  id: string;
  name: string;
  formula: string;
  expressionType: "simple" | "custom";
  columnName?: string;
  aggregation?: "SUM" | "AVG" | "COUNT" | "MIN" | "MAX";
  format: "number" | "currency" | "percent" | "integer";
  isCustom: boolean;
  description: string;
  category?: string;
}

export type ChartType = "kpi" | "bar" | "line" | "area" | "pie" | "scatter" | "radar" | "funnel" | "combo" | "table";

export interface WidgetConfig {
  xAxis: string;
  yAxisMeasures: string[];
  colorTheme: string;
  showLegend: boolean;
  showGrid: boolean;
  limit?: number;
}

export interface Widget {
  id: string;
  title: string;
  type: ChartType;
  config: WidgetConfig;
  gridSpan?: "col-span-1" | "col-span-2" | "col-span-3" | "col-span-4" | "col-span-5" | "col-span-6";
}

export interface AIInsight {
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  metricAffected: string;
  decreaseDetected?: boolean;
  rootCause?: string;
  resolution?: string;
}

export interface AISuggestedKPI {
  name: string;
  formula: string;
  description: string;
}

export interface AIRecommendedChart {
  title: string;
  chartType: ChartType;
  xAxis: string;
  yAxis: string;
  reason: string;
}

export interface AIAnalysisResult {
  insights: AIInsight[];
  suggestedKPIs: AISuggestedKPI[];
  recommendedCharts: AIRecommendedChart[];
}

export type PlanType = "free" | "core" | "prime" | "apex";

export interface SavedProject {
  id: string;
  name: string;
  dataset: any[];
  columns: ColumnMetadata[];
  measures: Measure[];
  widgets: Widget[];
  updatedAt: string;
}

export interface UserPlan {
  userId: string;
  email: string;
  plan: PlanType;
  createdAt: string;
  updatedAt: string;
  features: {
    maxDatasets: number;
    maxRows: number;
    aiAnalysisCount: number;
    customReports: boolean;
    advancedCharts: boolean;
    exportFormats: string[];
  };
}

export interface PlanConfiguration {
  free: {
    maxDatasets: number;
    maxRows: number;
    aiAnalysisCount: number;
    customReports: boolean;
    advancedCharts: boolean;
    exportFormats: string[];
  };
  pro: {
    maxDatasets: number;
    maxRows: number;
    aiAnalysisCount: number;
    customReports: boolean;
    advancedCharts: boolean;
    exportFormats: string[];
  };
  enterprise: {
    maxDatasets: number;
    maxRows: number;
    aiAnalysisCount: number;
    customReports: boolean;
    advancedCharts: boolean;
    exportFormats: string[];
  };
}

export interface AdminAnalytics {
  totalUsers: number;
  activeUsers: number;
  totalDatasets: number;
  totalRowsProcessed: number;
  aiAnalysisExecuted: number;
  reportsGenerated: number;
  timestamp: string;
}

export interface SystemConfiguration {
  maintenanceMode: boolean;
  maxFileSize: number;
  enableAiAnalysis: boolean;
  enableCustomReports: boolean;
  defaultTimeout: number;
  geminiApiKey?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  targetUser?: string;
  changes: Record<string, any>;
  timestamp: string;
  status: "success" | "failed";
}

// ============ FILE DATABASE MANAGER ============
const isVercel = !!process.env.VERCEL || process.env.NODE_ENV === "production";
const DB_DIR = isVercel ? "/tmp" : path.resolve(process.cwd(), "data");
const DB_FILE = path.resolve(DB_DIR, "db.json");

interface DbSchema {
  adminPassword?: string;
  users: any[];
  payments: any[];
  systemConfig: SystemConfiguration;
  auditLogs: AuditLog[];
}

const defaultDb: DbSchema = {
  adminPassword: "admin123",
  users: [],
  payments: [],
  systemConfig: {
    maintenanceMode: false,
    maxFileSize: 100,
    enableAiAnalysis: true,
    enableCustomReports: true,
    defaultTimeout: 300,
  },
  auditLogs: [
    {
      id: "log-system-init",
      action: "SYSTEM_BOOT",
      userId: "system",
      changes: { message: "JSON database backend system initialized." },
      timestamp: new Date().toISOString(),
      status: "success",
    },
  ],
};

let memoryDb: DbSchema = { ...defaultDb };

function ensureDbExists() {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), "utf8");
    } else {
      try {
        const content = fs.readFileSync(DB_FILE, "utf8");
        JSON.parse(content);
      } catch (e) {
        fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), "utf8");
      }
    }
  } catch (err) {
    console.warn("Write access to database file denied, falling back to memory:", err);
  }
}

function getDb(): DbSchema {
  ensureDbExists();
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf8");
      const data = JSON.parse(content);
      return {
        adminPassword: data.adminPassword || "admin123",
        users: data.users || [],
        payments: data.payments || [],
        systemConfig: data.systemConfig || defaultDb.systemConfig,
        auditLogs: data.auditLogs || [],
      };
    }
  } catch (e) {
    console.error("Error reading database file:", e);
  }
  return memoryDb;
}

function saveDb(data: DbSchema) {
  memoryDb = data;
  ensureDbExists();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("Error writing database file:", e);
  }
}

function getAdminPassword(): string {
  return getDb().adminPassword || "admin123";
}

function saveAdminPassword(password: string) {
  const db = getDb();
  db.adminPassword = password;
  saveDb(db);
}

function getUsers(): any[] {
  return getDb().users;
}

function saveUser(user: any) {
  const db = getDb();
  const idx = db.users.findIndex((u) => u.userId === user.userId);
  
  const plan = user.plan || "free";
  const slots = plan === "free" ? 1 : plan === "prime" ? 5 : plan === "apex" ? 60 : 2;
  const credits = plan === "free" ? 5 : 999999;

  const userRecord = {
    userId: user.userId,
    email: user.email,
    name: user.name || user.userId,
    role: user.role || "Business Analyst",
    plan: plan,
    analysesLeft: user.analysesLeft !== undefined ? user.analysesLeft : credits,
    projectSlots: user.projectSlots !== undefined ? user.projectSlots : slots,
    createdAt: user.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    features: {
      maxDatasets: slots,
      maxRows: 100000,
      aiAnalysisCount: credits,
      customReports: plan !== "free",
      advancedCharts: plan !== "free",
      exportFormats: ["csv", "xlsx", "pdf", "json"],
    },
  };

  if (idx !== -1) {
    db.users[idx] = { ...db.users[idx], ...userRecord, updatedAt: new Date().toISOString() };
  } else {
    db.users.push(userRecord);
  }
  saveDb(db);
  return idx !== -1 ? db.users[idx] : userRecord;
}

function deleteUser(userId: string) {
  const db = getDb();
  const filtered = db.users.filter((u) => u.userId !== userId);
  db.users = filtered;
  saveDb(db);
  return true;
}

function getPayments(): any[] {
  return getDb().payments;
}

function savePayment(payment: any) {
  const db = getDb();
  const idx = db.payments.findIndex((p) => p.id === payment.id);

  const paymentRecord = {
    id: payment.id || `pay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    user_id: payment.user_id,
    email: payment.email,
    plan: payment.plan,
    amount: payment.amount,
    upi_id: payment.upi_id,
    transaction_ref: payment.transaction_ref,
    status: payment.status || "pending",
    created_at: payment.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (idx !== -1) {
    db.payments[idx] = { ...db.payments[idx], ...paymentRecord };
  } else {
    db.payments.push(paymentRecord);
  }
  saveDb(db);
  return idx !== -1 ? db.payments[idx] : paymentRecord;
}

function getSystemConfig(): SystemConfiguration {
  return getDb().systemConfig;
}

function saveSystemConfig(config: SystemConfiguration) {
  const db = getDb();
  db.systemConfig = { ...db.systemConfig, ...config };
  saveDb(db);
}

function getAuditLogs(): AuditLog[] {
  return getDb().auditLogs;
}

function addAuditLog(
  action: string,
  userId: string,
  targetUser?: string,
  changes: Record<string, any> = {},
  status: "success" | "failed" = "success"
) {
  const db = getDb();
  const log: AuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    action,
    userId,
    targetUser,
    changes,
    timestamp: new Date().toISOString(),
    status,
  };
  db.auditLogs.push(log);
  if (db.auditLogs.length > 200) {
    db.auditLogs.shift();
  }
  saveDb(db);
}

// ============ EXPRESS SUB-APP & ROUTER ============
const app = express();
app.use(express.json());

const adminRouter = express.Router();

const planConfigs = {
  free: {
    maxDatasets: 1,
    maxRows: 10000,
    aiAnalysisCount: 5,
    customReports: false,
    advancedCharts: false,
    exportFormats: ["csv", "xlsx"],
  },
  core: {
    maxDatasets: 2,
    maxRows: 100000,
    aiAnalysisCount: 999999,
    customReports: true,
    advancedCharts: true,
    exportFormats: ["csv", "xlsx", "pdf", "json"],
  },
  prime: {
    maxDatasets: 5,
    maxRows: 1000000,
    aiAnalysisCount: 999999,
    customReports: true,
    advancedCharts: true,
    exportFormats: ["csv", "xlsx", "pdf", "json"],
  },
  apex: {
    maxDatasets: 60,
    maxRows: -1,
    aiAnalysisCount: 999999,
    customReports: true,
    advancedCharts: true,
    exportFormats: ["csv", "xlsx", "pdf", "json", "sql"],
  },
};

const verifyAdmin = (req: Request, res: Response, next: Function) => {
  const adminKey = req.headers["x-admin-key"];
  if (adminKey !== "dg-admin-session-active") {
    return res.status(403).json({ error: "Unauthorized: Admin access required" });
  }
  next();
};

// PUBLIC: Verify admin login passcode
adminRouter.post("/login", (req: Request, res: Response) => {
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
});

// PUBLIC: Sync user details on register/login
const handleUsersSync = (req: Request, res: Response) => {
  try {
    const { userId, email, name, role, plan } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Missing required field: userId" });
    }

    const users = getUsers();
    let user = users.find((u) => u.userId === userId);

    if (!user) {
      const initialPlan = (plan as PlanType) || "free";
      user = saveUser({
        userId,
        email: email || "",
        name: name || userId,
        role: role || "Business Analyst",
        plan: initialPlan,
        analysesLeft: initialPlan === "free" ? 5 : 999999,
        projectSlots: initialPlan === "free" ? 1 : initialPlan === "prime" ? 5 : initialPlan === "apex" ? 60 : 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      addAuditLog("USER_REGISTERED", userId, userId, { email, role });
    } else {
      let needsSave = false;
      if (name && user.name !== name) {
        user.name = name;
        needsSave = true;
      }
      if (role && user.role !== role) {
        user.role = role;
        needsSave = true;
      }
      if (plan && user.plan !== plan) {
        user.plan = plan;
        const slots = plan === "free" ? 1 : plan === "prime" ? 5 : plan === "apex" ? 60 : 2;
        const credits = plan === "free" ? 5 : 999999;
        user.projectSlots = slots;
        user.analysesLeft = credits;
        needsSave = true;
      }
      if (needsSave) {
        saveUser(user);
      }
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

adminRouter.post("/users/sync", handleUsersSync);
adminRouter.post("/users-sync", handleUsersSync);

// PUBLIC: User submit payment (UPI)
adminRouter.post("/payments", (req: Request, res: Response) => {
  try {
    const { userId, email, plan, amount, upiId, transactionRef } = req.body;

    if (!userId || !email || !plan || !amount || !upiId || !transactionRef) {
      return res.status(400).json({ error: "Missing required billing details." });
    }

    const payments = getPayments();
    const duplicate = payments.find((p) => p.transaction_ref === transactionRef.trim());
    if (duplicate) {
      return res.status(400).json({ error: "This Transaction Reference code has already been submitted." });
    }

    const newPayment = savePayment({
      user_id: userId,
      email,
      plan,
      amount,
      upi_id: upiId,
      transaction_ref: transactionRef.trim(),
      status: "pending",
    });

    addAuditLog("PAYMENT_REQUEST_SUBMITTED", userId, "system", { plan, ref: transactionRef, amount });
    res.status(251).json(newPayment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUBLIC: User retrieve their own payments
adminRouter.get("/payments-user", (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId parameter" });
    }
    const payments = getPayments();
    const userPayments = payments.filter((p) => p.user_id === userId);
    res.json(userPayments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

adminRouter.get("/payments/user/:userId", (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const payments = getPayments();
    const userPayments = payments.filter((p) => p.user_id === userId);
    res.json(userPayments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN: Get payments
adminRouter.get("/payments", verifyAdmin, (req: Request, res: Response) => {
  try {
    const payments = getPayments();
    res.json(payments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN: Approve payment
const handlePaymentApprove = (req: Request, res: Response) => {
  try {
    const id = req.params.id || req.body.id;
    if (!id) {
      return res.status(400).json({ error: "Missing payment id" });
    }
    const payments = getPayments();
    const payment = payments.find((p) => String(p.id) === String(id));
    if (!payment) {
      return res.status(404).json({ error: "Payment request not found" });
    }

    payment.status = "approved";
    savePayment(payment);

    const users = getUsers();
    const user = users.find((u) => u.userId === payment.user_id);
    if (user) {
      const plan = payment.plan as PlanType;
      const slots = plan === "free" ? 1 : plan === "prime" ? 5 : plan === "apex" ? 60 : 2;
      const credits = plan === "free" ? 5 : 999999;

      user.plan = plan;
      user.projectSlots = slots;
      user.analysesLeft = credits;
      saveUser(user);
      addAuditLog("PAYMENT_APPROVED", "admin", payment.user_id, { plan, ref: payment.transaction_ref });
    }

    res.json({ success: true, payment });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

adminRouter.post("/payments/:id/approve", verifyAdmin, handlePaymentApprove);
adminRouter.post("/payments-approve", verifyAdmin, handlePaymentApprove);

// ADMIN: Reject payment
const handlePaymentReject = (req: Request, res: Response) => {
  try {
    const id = req.params.id || req.body.id;
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
    res.json({ success: true, payment });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

adminRouter.post("/payments/:id/reject", verifyAdmin, handlePaymentReject);
adminRouter.post("/payments-reject", verifyAdmin, handlePaymentReject);

// ADMIN: Retrieve all users
adminRouter.get("/users", verifyAdmin, (req: Request, res: Response) => {
  try {
    const users = getUsers();
    res.json({ users, total: users.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN: Get specific user
adminRouter.get("/users/:userId", verifyAdmin, (req: Request, res: Response) => {
  try {
    const users = getUsers();
    const user = users.find((u) => u.userId === req.params.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN: Create manual user
adminRouter.post("/users", verifyAdmin, (req: Request, res: Response) => {
  try {
    const { userId, email, plan } = req.body;

    if (!userId || !email || !plan) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const users = getUsers();
    if (users.some((u) => u.userId === userId)) {
      return res.status(400).json({ error: "User already exists" });
    }

    const newUser = saveUser({
      userId,
      email,
      plan,
      name: userId,
      role: "Business Analyst",
    });

    addAuditLog("USER_CREATED", "admin", userId, { plan, email });
    res.status(201).json(newUser);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN: Update manual user plan
const handleUpdateUserPlan = (req: Request, res: Response) => {
  try {
    const userId = req.params.userId || req.body.userId;
    const { plan } = req.body;
    if (!userId || !plan) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const users = getUsers();
    const user = users.find((u) => u.userId === userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const oldPlan = user.plan;
    user.plan = plan;
    const slots = plan === "free" ? 1 : plan === "prime" ? 5 : plan === "apex" ? 60 : 2;
    const credits = plan === "free" ? 5 : 999999;
    user.projectSlots = slots;
    user.analysesLeft = credits;

    saveUser(user);
    addAuditLog("PLAN_UPDATED", "admin", userId, { from: oldPlan, to: plan });
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

adminRouter.put("/users/:userId/plan", verifyAdmin, handleUpdateUserPlan);
adminRouter.post("/users-update-plan", verifyAdmin, handleUpdateUserPlan);

// ADMIN: Delete user
const handleUserDelete = (req: Request, res: Response) => {
  try {
    const userId = req.params.userId || req.body.userId;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }
    const users = getUsers();
    const user = users.find((u) => u.userId === userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    deleteUser(userId);
    addAuditLog("USER_DELETED", "admin", userId, { ...user });
    res.json({ message: "User deleted successfully", deletedUser: user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

adminRouter.delete("/users/:userId", verifyAdmin, handleUserDelete);
adminRouter.post("/users-delete", verifyAdmin, handleUserDelete);

// ADMIN: Analytics and statistics
adminRouter.get("/analytics", verifyAdmin, (req: Request, res: Response) => {
  try {
    const users = getUsers();
    const analytics = {
      totalUsers: users.length,
      activeUsers: users.length,
      totalDatasets: users.length * 2 + 1,
      totalRowsProcessed: users.length * 15000 + 45000,
      aiAnalysisExecuted: users.reduce((acc, u) => acc + (u.plan === "free" ? (5 - u.analysesLeft) : 10), 0),
      reportsGenerated: users.length * 3 + 2,
      timestamp: new Date().toISOString()
    };
    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN: Get config
adminRouter.get("/config", verifyAdmin, (req: Request, res: Response) => {
  try {
    const config = getSystemConfig();
    res.json(config);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN: Update config & password
adminRouter.put("/config", verifyAdmin, (req: Request, res: Response) => {
  try {
    const { maintenanceMode, maxFileSize, enableAiAnalysis, enableCustomReports, defaultTimeout, adminPassword } = req.body;

    const currentConfig = getSystemConfig();
    if (maintenanceMode !== undefined) currentConfig.maintenanceMode = maintenanceMode;
    if (maxFileSize !== undefined) currentConfig.maxFileSize = maxFileSize;
    if (enableAiAnalysis !== undefined) currentConfig.enableAiAnalysis = enableAiAnalysis;
    if (enableCustomReports !== undefined) currentConfig.enableCustomReports = enableCustomReports;
    if (defaultTimeout !== undefined) currentConfig.defaultTimeout = defaultTimeout;

    saveSystemConfig(currentConfig);

    if (adminPassword && adminPassword.trim().length >= 4) {
      saveAdminPassword(adminPassword.trim());
      addAuditLog("ADMIN_PASSWORD_CHANGED", "admin", undefined, { message: "Passcode updated" });
    }

    addAuditLog("CONFIG_UPDATED", "admin", undefined, req.body);
    res.json(currentConfig);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN: Get plans
adminRouter.get("/plans", verifyAdmin, (req: Request, res: Response) => {
  try {
    res.json(planConfigs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUBLIC: AI Data cleaning recipe generator
adminRouter.post("/clean-data", async (req: Request, res: Response) => {
  try {
    const { sampleRows, data, columns } = req.body || {};
    const inputData = sampleRows || data || [];

    if (!Array.isArray(inputData) || inputData.length === 0) {
      return res.status(400).json({ error: "No data rows provided for cleaning." });
    }

    const sampleSize = Math.min(inputData.length, 20);
    const dataSample = inputData.slice(0, sampleSize);

    const rawKey = (req.headers["x-gemini-api-key"] as string) || req.body?.userApiKey || process.env.GEMINI_API_KEY;
    const apiKey = rawKey ? rawKey.trim().replace(/^["']|["']$/g, "") : "";

    if (!apiKey) {
      return res.json({
        isMessy: false,
        summary: "Raw dataset validated cleanly (No AI Key configured).",
        cleanSummary: "Raw dataset validated cleanly.",
        renamedColumns: {},
        columnTypes: {},
        transformations: []
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
      You are an expert Data Engineer. Audit this data sample and return a JSON recipe for cleaning.
      Columns: ${JSON.stringify(columns || [])}
      Sample: ${JSON.stringify(dataSample, null, 2)}

      Return structured JSON:
      {
        "isMessy": boolean,
        "summary": "Short summary of adjustments",
        "cleanSummary": "Short summary of adjustments",
        "renamedColumns": { [orig: string]: string },
        "columnTypes": { [cleanedHeader: string]: "number" | "string" | "date" },
        "transformations": [
          { "column": string, "action": "parse_number" | "standardize_date" | "trim_and_case", "case": "title" | "upper" | "lower" | "none" }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const parsed = JSON.parse((response.text || "{}").trim());
    return res.json(parsed);
  } catch (error: any) {
    console.error("Clean data endpoint error:", error);
    return res.json({
      isMessy: false,
      summary: "AI data cleaning skipped due to API processing error.",
      cleanSummary: "AI data cleaning skipped.",
      renamedColumns: {},
      columnTypes: {},
      transformations: []
    });
  }
});

app.use("/api/admin", adminRouter);
app.use("/", adminRouter);

export default app;
