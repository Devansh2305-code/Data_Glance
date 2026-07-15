import React, { useState, useEffect } from "react";
import { UserPlan, AdminAnalytics, SystemConfiguration, AuditLog, PlanType } from "../types";
import {
  Users,
  Settings,
  BarChart3,
  FileText,
  ChevronDown,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  AlertCircle,
  Check,
  Clock,
  Activity,
} from "lucide-react";

type AdminTab = "users" | "analytics" | "reporting" | "configuration";

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [users, setUsers] = useState<UserPlan[]>([]);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfiguration | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserPlan | null>(null);
  const [newUserForm, setNewUserForm] = useState({ userId: "", email: "", plan: "free" as PlanType });
  const [editPlan, setEditPlan] = useState<PlanType>("free");

  const ADMIN_KEY = localStorage.getItem("admin-key") || "";

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/users", {
        headers: { "x-admin-key": ADMIN_KEY },
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data.users);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch analytics
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/analytics", {
        headers: { "x-admin-key": ADMIN_KEY },
      });
      if (!response.ok) throw new Error("Failed to fetch analytics");
      const data = await response.json();
      setAnalytics(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/audit-logs?limit=100", {
        headers: { "x-admin-key": ADMIN_KEY },
      });
      if (!response.ok) throw new Error("Failed to fetch audit logs");
      const data = await response.json();
      setAuditLogs(data.logs);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch system config
  const fetchSystemConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/config", {
        headers: { "x-admin-key": ADMIN_KEY },
      });
      if (!response.ok) throw new Error("Failed to fetch system config");
      const data = await response.json();
      setSystemConfig(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Create new user
  const handleCreateUser = async () => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": ADMIN_KEY,
        },
        body: JSON.stringify(newUserForm),
      });
      if (!response.ok) throw new Error("Failed to create user");
      setSuccess("User created successfully");
      setShowUserModal(false);
      setNewUserForm({ userId: "", email: "", plan: "free" });
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Update user plan
  const handleUpdatePlan = async () => {
    if (!selectedUser) return;
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.userId}/plan`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": ADMIN_KEY,
        },
        body: JSON.stringify({ plan: editPlan }),
      });
      if (!response.ok) throw new Error("Failed to update plan");
      setSuccess("Plan updated successfully");
      setShowEditModal(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Delete user
  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { "x-admin-key": ADMIN_KEY },
      });
      if (!response.ok) throw new Error("Failed to delete user");
      setSuccess("User deleted successfully");
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Update system config
  const handleUpdateConfig = async () => {
    if (!systemConfig) return;
    try {
      const response = await fetch("/api/admin/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": ADMIN_KEY,
        },
        body: JSON.stringify(systemConfig),
      });
      if (!response.ok) throw new Error("Failed to update config");
      setSuccess("Configuration updated successfully");
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Load data on tab change
  useEffect(() => {
    if (activeTab === "users") fetchUsers();
    else if (activeTab === "analytics") fetchAnalytics();
    else if (activeTab === "reporting") fetchAuditLogs();
    else if (activeTab === "configuration") fetchSystemConfig();
  }, [activeTab]);

  const getPlanColor = (plan: PlanType) => {
    switch (plan) {
      case "free":
        return "bg-gray-100 text-gray-800";
      case "pro":
        return "bg-blue-100 text-blue-800";
      case "enterprise":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    return status === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Admin Dashboard</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">Manage users, plans, analytics, and system configuration</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900 dark:text-red-100">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-600 dark:text-red-400 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="mx-6 mt-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
          <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-900 dark:text-green-100">{success}</p>
          </div>
          <button onClick={() => setSuccess(null)} className="text-green-600 dark:text-green-400 hover:text-green-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="px-6 flex gap-8">
          {[
            { id: "users", label: "Users", icon: Users },
            { id: "analytics", label: "Analytics", icon: BarChart3 },
            { id: "reporting", label: "Reporting", icon: FileText },
            { id: "configuration", label: "Configuration", icon: Settings },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as AdminTab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition ${
                activeTab === id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {loading && activeTab !== "users" && (
          <div className="text-center py-12">
            <Activity className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400">Loading...</p>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === "users" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">User Management</h2>
              <button
                onClick={() => setShowUserModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition"
              >
                <Plus className="w-4 h-4" />
                Add User
              </button>
            </div>

            {users.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 dark:text-slate-400">No users found. Create one to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">User ID</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Email</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Plan</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Created</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.userId} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition">
                        <td className="px-4 py-3 font-mono text-xs text-slate-900 dark:text-slate-100">{user.userId}</td>
                        <td className="px-4 py-3 text-slate-900 dark:text-slate-100">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getPlanColor(user.plan)}`}>
                            {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-center flex justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setEditPlan(user.plan);
                              setShowEditModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                            title="Edit Plan"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.userId)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === "analytics" && analytics && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">System Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: "Total Users", value: analytics.totalUsers, icon: Users, color: "blue" },
                { label: "Active Users", value: analytics.activeUsers, icon: Activity, color: "green" },
                { label: "Total Datasets", value: analytics.totalDatasets, icon: BarChart3, color: "purple" },
                { label: "Rows Processed", value: `${(analytics.totalRowsProcessed / 1000000).toFixed(1)}M`, icon: FileText, color: "orange" },
                { label: "AI Analysis Executed", value: analytics.aiAnalysisExecuted, icon: BarChart3, color: "indigo" },
                { label: "Reports Generated", value: analytics.reportsGenerated, icon: FileText, color: "cyan" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg bg-${color}-100 dark:bg-${color}-900/30 flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">{label}</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REPORTING TAB */}
        {activeTab === "reporting" && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Audit Logs & Reporting</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {auditLogs.length === 0 ? (
                <div className="text-center py-8 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-600 dark:text-slate-400">No audit logs available</p>
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(log.status)}`}>{log.status}</span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{log.action}</span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">User ID: {log.userId}</p>
                    {log.targetUser && <p className="text-xs text-slate-600 dark:text-slate-400">Target: {log.targetUser}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* CONFIGURATION TAB */}
        {activeTab === "configuration" && systemConfig && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">System Configuration</h2>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 max-w-2xl space-y-6">
              {/* Maintenance Mode */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Maintenance Mode</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Disable system access for maintenance</p>
                </div>
                <input
                  type="checkbox"
                  checked={systemConfig.maintenanceMode}
                  onChange={(e) => setSystemConfig({ ...systemConfig, maintenanceMode: e.target.checked })}
                  className="w-5 h-5 cursor-pointer"
                />
              </div>

              {/* Max File Size */}
              <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
                <label className="block font-semibold text-slate-900 dark:text-white mb-2">Max File Size (MB)</label>
                <input
                  type="number"
                  value={systemConfig.maxFileSize}
                  onChange={(e) => setSystemConfig({ ...systemConfig, maxFileSize: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Enable AI Analysis */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Enable AI Analysis</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Allow users to access AI-powered insights</p>
                </div>
                <input
                  type="checkbox"
                  checked={systemConfig.enableAiAnalysis}
                  onChange={(e) => setSystemConfig({ ...systemConfig, enableAiAnalysis: e.target.checked })}
                  className="w-5 h-5 cursor-pointer"
                />
              </div>

              {/* Enable Custom Reports */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Enable Custom Reports</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Allow users to generate custom reports</p>
                </div>
                <input
                  type="checkbox"
                  checked={systemConfig.enableCustomReports}
                  onChange={(e) => setSystemConfig({ ...systemConfig, enableCustomReports: e.target.checked })}
                  className="w-5 h-5 cursor-pointer"
                />
              </div>

              {/* Default Timeout */}
              <div>
                <label className="block font-semibold text-slate-900 dark:text-white mb-2">Default Timeout (seconds)</label>
                <input
                  type="number"
                  value={systemConfig.defaultTimeout}
                  onChange={(e) => setSystemConfig({ ...systemConfig, defaultTimeout: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Save Button */}
              <button
                onClick={handleUpdateConfig}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition mt-6"
              >
                <Save className="w-4 h-4" />
                Save Configuration
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Create New User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">User ID</label>
                <input
                  type="text"
                  value={newUserForm.userId}
                  onChange={(e) => setNewUserForm({ ...newUserForm, userId: e.target.value })}
                  placeholder="user_123"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Plan</label>
                <select
                  value={newUserForm.plan}
                  onChange={(e) => setNewUserForm({ ...newUserForm, plan: e.target.value as PlanType })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowUserModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Plan Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Update User Plan</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">User: {selectedUser.userId}</p>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Select New Plan</label>
              <select
                value={editPlan}
                onChange={(e) => setEditPlan(e.target.value as PlanType)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePlan}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold"
              >
                Update Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
