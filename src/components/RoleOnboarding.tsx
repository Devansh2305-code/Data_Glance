import React, { useState } from "react";
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Target, 
  HeartHandshake, 
  Building,
  Loader,
  ArrowRight
} from "lucide-react";
import { Role } from "../types";

interface RoleOnboardingProps {
  userName: string;
  onSelectRole: (role: Role) => Promise<void>;
}

export default function RoleOnboarding({ userName, onSelectRole }: RoleOnboardingProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const rolesList = [
    {
      id: "CMO" as Role,
      title: "Chief Marketing Officer",
      icon: TrendingUp,
      color: "from-emerald-500 to-teal-600",
      bgLight: "bg-emerald-50 dark:bg-emerald-950/20",
      borderActive: "border-emerald-500 dark:border-emerald-500",
      desc: "Manage ad spend budgets, acquisition conversions, and return on ad outlay (ROAS)."
    },
    {
      id: "Business Analyst" as Role,
      title: "Business Analyst",
      icon: Users,
      color: "from-blue-500 to-indigo-600",
      bgLight: "bg-blue-50 dark:bg-blue-950/20",
      borderActive: "border-blue-500 dark:border-blue-500",
      desc: "Track sales performance, regional margins, and category-level discount offsets."
    },
    {
      id: "CFO" as Role,
      title: "Chief Financial Officer",
      icon: DollarSign,
      color: "from-purple-500 to-indigo-600",
      bgLight: "bg-purple-50 dark:bg-purple-950/20",
      borderActive: "border-purple-500 dark:border-purple-500",
      desc: "Evaluate budget-to-actual variance, department OpEx, and operating income parameters."
    },
    {
      id: "Sales Director" as Role,
      title: "Sales Director",
      icon: Target,
      color: "from-amber-500 to-orange-600",
      bgLight: "bg-amber-50 dark:bg-amber-950/20",
      borderActive: "border-amber-500 dark:border-amber-500",
      desc: "Oversee sales rep pipelines, regional win rates, and total closed contract values."
    },
    {
      id: "HR Specialist" as Role,
      title: "HR Specialist",
      icon: HeartHandshake,
      color: "from-rose-500 to-pink-600",
      bgLight: "bg-rose-50 dark:bg-rose-950/20",
      borderActive: "border-rose-500 dark:border-rose-500",
      desc: "Track global employee counts, attrition metrics, and department training hours."
    },
    {
      id: "CEO" as Role,
      title: "Chief Executive Officer",
      icon: Building,
      color: "from-sky-500 to-blue-600",
      bgLight: "bg-sky-50 dark:bg-sky-950/20",
      borderActive: "border-sky-500 dark:border-sky-500",
      desc: "Aggregate brand NPS, high-level enterprise margins, and key financial health charts."
    }
  ];

  const handleSubmit = async () => {
    if (!selectedRole) {
      setError("Please select a profile role before continuing.");
      return;
    }
    
    setError("");
    setIsSubmitting(true);
    try {
      await onSelectRole(selectedRole);
    } catch (err: any) {
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-4">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
      </div>

      <div className="relative w-full max-w-4xl bg-white/5 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/10 dark:border-slate-800/80 rounded-2xl p-8 sm:p-10 shadow-2xl">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="px-3 py-1 text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full uppercase tracking-wider">
            Onboarding
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-4 tracking-tight">
            Welcome, {userName || "Data Explorer"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2.5">
            To provide the most relevant template, KPI metrics, and layout configurations, please choose your functional role in the organization.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-400 text-sm font-medium flex items-center space-x-3 animate-headShake">
            <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-bold font-mono">!</span>
            <span>{error}</span>
          </div>
        )}

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {rolesList.map((item) => {
            const Icon = item.icon;
            const isSelected = selectedRole === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedRole(item.id);
                  setError("");
                }}
                className={`relative flex flex-col items-start p-5 rounded-xl border text-left cursor-pointer transition-all duration-300 group ${
                  isSelected
                    ? `${item.bgLight} ${item.borderActive} shadow-lg shadow-blue-500/5 ring-1 ring-blue-500/30`
                    : "border-slate-200 dark:border-slate-800/80 hover:border-slate-350 dark:hover:border-slate-700 bg-white/40 dark:bg-slate-950/20 hover:bg-white dark:hover:bg-slate-950/40"
                }`}
              >
                <div className={`p-2.5 rounded-lg bg-gradient-to-br ${item.color} text-white mb-4 shadow-sm`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  {item.desc}
                </p>
                {isSelected && (
                  <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-[10px] text-white font-bold font-mono">✓</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Submission Panel */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-slate-200/10 dark:border-slate-800/50 gap-4">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            * You can switch profile views dynamically inside the workspace later.
          </p>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-700 disabled:to-slate-700 text-white font-semibold text-sm rounded-xl transition duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/10 active:scale-98 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader className="w-4 h-4 animate-spin text-white" />
                <span>Configuring workspace...</span>
              </>
            ) : (
              <>
                <span>Enter Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
