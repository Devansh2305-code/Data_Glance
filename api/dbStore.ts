import fs from "fs";
import path from "path";
import { UserPlan, SystemConfiguration, AuditLog, PlanType } from "../src/types";

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

export function getDb(): DbSchema {
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

export function saveDb(data: DbSchema) {
  memoryDb = data;
  ensureDbExists();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("Error writing database file:", e);
  }
}

export function getAdminPassword(): string {
  return getDb().adminPassword || "admin123";
}

export function saveAdminPassword(password: string) {
  const db = getDb();
  db.adminPassword = password;
  saveDb(db);
}

export function getUsers(): any[] {
  return getDb().users;
}

export function saveUser(user: any) {
  const db = getDb();
  const idx = db.users.findIndex((u) => u.userId === user.userId);
  
  const plan = user.plan || "free";
  const slots = plan === "free" ? 1 : plan === "prime" ? 5 : plan === "apex" ? 60 : 1;
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

export function deleteUser(userId: string) {
  const db = getDb();
  const filtered = db.users.filter((u) => u.userId !== userId);
  db.users = filtered;
  saveDb(db);
}

export function getPayments(): any[] {
  return getDb().payments;
}

export function savePayment(payment: any) {
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

export function getSystemConfig(): SystemConfiguration {
  return getDb().systemConfig;
}

export function saveSystemConfig(config: SystemConfiguration) {
  const db = getDb();
  db.systemConfig = { ...db.systemConfig, ...config };
  saveDb(db);
}

export function getAuditLogs(): AuditLog[] {
  return getDb().auditLogs;
}

export function addAuditLog(
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
  // Cap logs at 200
  if (db.auditLogs.length > 200) {
    db.auditLogs.shift();
  }
  saveDb(db);
}
