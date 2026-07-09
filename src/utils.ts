import { Measure, ColumnMetadata, Role } from "./types";
import * as XLSX from "xlsx";

// ==========================================
// 1. MOCK DATASETS & SCHEMAS FOR ROES
// ==========================================

export const CMO_COLUMNS: ColumnMetadata[] = [
  { name: "Date", type: "date" },
  { name: "Campaign", type: "string" },
  { name: "Channel", type: "string" },
  { name: "Ad Spend ($)", type: "number" },
  { name: "Impressions", type: "number" },
  { name: "Clicks", type: "number" },
  { name: "Conversions", type: "number" },
  { name: "Revenue ($)", type: "number" },
];

export const generateCMOData = () => {
  const campaigns = ["Summer Launch", "Black Friday Prep", "Google Search Core", "TikTok Brand awareness", "Meta Retargeting V2", "Newsletter Campaign"];
  const channels = ["Google Ads", "Meta Ads", "TikTok", "YouTube", "Email"];
  const data: any[] = [];
  
  // Seed with 40 rows over the past 30 days
  for (let i = 40; i >= 1; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    
    const camp = campaigns[i % campaigns.length];
    const chan = channels[i % channels.length];
    
    // Core marketing metrics with relative correlations
    let spend = 150 + Math.floor(Math.random() * 850);
    if (chan === "Google Ads") spend *= 1.2;
    if (chan === "Email") spend = 20 + Math.floor(Math.random() * 50); // Low spend
    
    const cpm = chan === "Meta Ads" ? 8 : chan === "TikTok" ? 5 : chan === "YouTube" ? 12 : 10;
    const impressions = Math.floor((spend / cpm) * 1000);
    
    const ctr = chan === "Email" ? 0.08 : chan === "Google Ads" ? 0.04 : chan === "Meta Ads" ? 0.025 : 0.015;
    const clicks = Math.floor(impressions * ctr * (0.8 + Math.random() * 0.4));
    
    const convRate = chan === "Email" ? 0.05 : chan === "Google Ads" ? 0.035 : chan === "Meta Ads" ? 0.02 : 0.012;
    const conversions = Math.floor(clicks * convRate * (0.9 + Math.random() * 0.3));
    
    const avgOrderValue = 85 + Math.floor(Math.random() * 50);
    const revenue = conversions * avgOrderValue;
    
    data.push({
      Date: dateStr,
      Campaign: camp,
      Channel: chan,
      "Ad Spend ($)": spend,
      Impressions: impressions,
      Clicks: clicks,
      Conversions: conversions,
      "Revenue ($)": revenue,
    });
  }
  return data;
};

export const ANALYST_COLUMNS: ColumnMetadata[] = [
  { name: "Date", type: "date" },
  { name: "Product Category", type: "string" },
  { name: "Region", type: "string" },
  { name: "Unit Price ($)", type: "number" },
  { name: "Units Sold", type: "number" },
  { name: "Discounts Given ($)", type: "number" },
  { name: "Return Units", type: "number" },
  { name: "Gross Sales ($)", type: "number" },
];

export const generateAnalystData = () => {
  const categories = ["Electronics", "Home & Kitchen", "Apparel", "Sporting Goods", "Office Supplies"];
  const regions = ["North America", "Europe", "APAC", "LATAM", "Middle East"];
  const data: any[] = [];
  
  for (let i = 50; i >= 1; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    
    const category = categories[i % categories.length];
    const region = regions[Math.floor(Math.random() * regions.length)];
    
    const unitPrice = category === "Electronics" ? 299 : category === "Home & Kitchen" ? 89 : category === "Apparel" ? 45 : category === "Sporting Goods" ? 120 : 15;
    const unitsSold = 20 + Math.floor(Math.random() * 180);
    const grossSales = unitsSold * unitPrice;
    
    const discountRate = Math.random() > 0.4 ? 0.05 + Math.random() * 0.15 : 0;
    const discounts = Math.floor(grossSales * discountRate);
    
    const returnRate = category === "Apparel" ? 0.12 : category === "Electronics" ? 0.04 : 0.02;
    const returnUnits = Math.floor(unitsSold * returnRate * Math.random());
    
    data.push({
      Date: dateStr,
      "Product Category": category,
      Region: region,
      "Unit Price ($)": unitPrice,
      "Units Sold": unitsSold,
      "Discounts Given ($)": discounts,
      "Return Units": returnUnits,
      "Gross Sales ($)": grossSales,
    });
  }
  return data;
};

export const CFO_COLUMNS: ColumnMetadata[] = [
  { name: "Month", type: "string" },
  { name: "Department", type: "string" },
  { name: "Operating Spend ($)", type: "number" },
  { name: "Budget Allocated ($)", type: "number" },
  { name: "Revenue Goal ($)", type: "number" },
  { name: "Actual Income ($)", type: "number" },
  { name: "Headcount", type: "number" },
];

export const generateCFOData = () => {
  const departments = ["Sales & Marketing", "R&D / Engineering", "Customer Success", "Operations & HR", "General & Admin"];
  const months = ["Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026", "May 2026", "Jun 2026"];
  const data: any[] = [];
  
  months.forEach((month) => {
    departments.forEach((dept, index) => {
      let baseBudget = dept === "R&D / Engineering" ? 500000 : dept === "Sales & Marketing" ? 400000 : 150000;
      let spend = baseBudget * (0.9 + Math.random() * 0.18); // slight variance
      
      let revGoal = dept === "Sales & Marketing" ? 1200000 : 0;
      let income = revGoal > 0 ? revGoal * (0.85 + Math.random() * 0.3) : 0;
      
      let headcount = dept === "R&D / Engineering" ? 45 : dept === "Sales & Marketing" ? 30 : dept === "Customer Success" ? 15 : 10;
      headcount += Math.floor(Math.random() * 3);
      
      data.push({
        Month: month,
        Department: dept,
        "Operating Spend ($)": Math.floor(spend),
        "Budget Allocated ($)": baseBudget,
        "Revenue Goal ($)": revGoal,
        "Actual Income ($)": Math.floor(income),
        Headcount: headcount,
      });
    });
  });
  return data;
};

export const SALES_COLUMNS: ColumnMetadata[] = [
  { name: "Date", type: "date" },
  { name: "Region", type: "string" },
  { name: "Account Manager", type: "string" },
  { name: "Lead Source", type: "string" },
  { name: "Leads Contacted", type: "number" },
  { name: "Deals Won", type: "number" },
  { name: "Pipeline Value ($)", type: "number" },
  { name: "Closed Revenue ($)", type: "number" },
  { name: "Days to Close", type: "number" },
];

export const generateSalesData = () => {
  const regions = ["North America", "Europe", "APAC", "LATAM"];
  const managers = ["Alice Smith", "Bob Jones", "Charlie Brown", "Diana Prince", "Evan Wright"];
  const sources = ["Inbound Web", "Cold Outreach", "Partner Referral", "Webinar", "LinkedIn Ads"];
  const data: any[] = [];
  
  for (let i = 45; i >= 1; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    
    const region = regions[i % regions.length];
    const manager = managers[i % managers.length];
    const source = sources[(i + 2) % sources.length];
    
    const leads = 50 + Math.floor(Math.random() * 150);
    const winRate = source === "Partner Referral" ? 0.25 : source === "Inbound Web" ? 0.15 : 0.08;
    const dealsWon = Math.floor(leads * winRate * (0.8 + Math.random() * 0.4));
    
    const avgDealValue = 5000 + Math.floor(Math.random() * 8000);
    const pipeline = leads * 1200;
    const closedRev = dealsWon * avgDealValue;
    const daysToClose = 15 + Math.floor(Math.random() * 45);
    
    data.push({
      Date: dateStr,
      Region: region,
      "Account Manager": manager,
      "Lead Source": source,
      "Leads Contacted": leads,
      "Deals Won": dealsWon,
      "Pipeline Value ($)": pipeline,
      "Closed Revenue ($)": closedRev,
      "Days to Close": daysToClose,
    });
  }
  return data;
};

export const HR_COLUMNS: ColumnMetadata[] = [
  { name: "Month", type: "string" },
  { name: "Department", type: "string" },
  { name: "Headcount", type: "number" },
  { name: "New Hires", type: "number" },
  { name: "Attritions", type: "number" },
  { name: "Payroll Cost ($)", type: "number" },
  { name: "Training Hours Logged", type: "number" },
  { name: "Satisfaction Score", type: "number" },
];

export const generateHRData = () => {
  const departments = ["Sales & Marketing", "R&D / Engineering", "Customer Success", "Operations & HR", "General & Admin"];
  const months = ["Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026", "May 2026", "Jun 2026"];
  const data: any[] = [];
  
  months.forEach((month) => {
    departments.forEach((dept) => {
      let baseHeadcount = dept === "R&D / Engineering" ? 50 : dept === "Sales & Marketing" ? 35 : dept === "Customer Success" ? 20 : 10;
      let newHires = Math.floor(Math.random() * 4);
      let attritions = Math.random() > 0.7 ? 1 : 0;
      let headcount = baseHeadcount + newHires - attritions;
      
      let avgSalary = dept === "R&D / Engineering" ? 8500 : dept === "Sales & Marketing" ? 6500 : 4500;
      let payroll = headcount * avgSalary;
      let training = headcount * (1.5 + Math.random() * 3);
      let satScore = 7.2 + Math.random() * 2.2;
      
      data.push({
        Month: month,
        Department: dept,
        Headcount: headcount,
        "New Hires": newHires,
        Attritions: attritions,
        "Payroll Cost ($)": payroll,
        "Training Hours Logged": Math.floor(training),
        "Satisfaction Score": parseFloat(satScore.toFixed(1)),
      });
    });
  });
  return data;
};

export const CEO_COLUMNS: ColumnMetadata[] = [
  { name: "Date", type: "date" },
  { name: "Region", type: "string" },
  { name: "Gross Margin %", type: "number" },
  { name: "Revenue ($)", type: "number" },
  { name: "Operating Expenses ($)", type: "number" },
  { name: "Net New Customers", type: "number" },
  { name: "NPS Score", type: "number" },
];

export const generateCEOData = () => {
  const regions = ["North America", "Europe", "APAC", "LATAM"];
  const data: any[] = [];
  
  for (let i = 40; i >= 1; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 2); // Spread across 80 days
    const dateStr = d.toISOString().split("T")[0];
    
    const region = regions[i % regions.length];
    const revenue = 150000 + Math.floor(Math.random() * 350000);
    const grossMargin = 65 + Math.floor(Math.random() * 20); // 65% - 85%
    const opex = revenue * (0.45 + Math.random() * 0.15); // opex around 45%-60% of revenue
    const netCustomers = 50 + Math.floor(Math.random() * 200);
    const nps = 45 + Math.floor(Math.random() * 40); // 45 to 85 NPS
    
    data.push({
      Date: dateStr,
      Region: region,
      "Gross Margin %": grossMargin,
      "Revenue ($)": revenue,
      "Operating Expenses ($)": Math.floor(opex),
      "Net New Customers": netCustomers,
      "NPS Score": nps,
    });
  }
  return data;
};

// ==========================================
// 2. DEFAULT MEASURES FOR ROLES
// ==========================================

export const DEFAULT_CMO_MEASURES: Measure[] = [
  {
    id: "spend_sum",
    name: "Total Spend",
    formula: "SUM(Ad Spend ($))",
    expressionType: "simple",
    columnName: "Ad Spend ($)",
    aggregation: "SUM",
    format: "currency",
    isCustom: false,
    description: "Total advertising expenditures across all campaigns.",
    category: "Marketing Metrics",
  },
  {
    id: "rev_sum",
    name: "Total Revenue",
    formula: "SUM(Revenue ($))",
    expressionType: "simple",
    columnName: "Revenue ($)",
    aggregation: "SUM",
    format: "currency",
    isCustom: false,
    description: "Total gross sales value driven directly by marketing campaigns.",
    category: "Marketing Metrics",
  },
  {
    id: "clicks_sum",
    name: "Total Clicks",
    formula: "SUM(Clicks)",
    expressionType: "simple",
    columnName: "Clicks",
    aggregation: "SUM",
    format: "integer",
    isCustom: false,
    description: "Aggregate click-through count on all active ads.",
    category: "Traffic Metrics",
  },
  {
    id: "imp_sum",
    name: "Total Impressions",
    formula: "SUM(Impressions)",
    expressionType: "simple",
    columnName: "Impressions",
    aggregation: "SUM",
    format: "integer",
    isCustom: false,
    description: "Number of times ads were loaded on screen.",
    category: "Traffic Metrics",
  },
  {
    id: "conv_sum",
    name: "Total Conversions",
    formula: "SUM(Conversions)",
    expressionType: "simple",
    columnName: "Conversions",
    aggregation: "SUM",
    format: "integer",
    isCustom: false,
    description: "Total successful customer purchases or target actions.",
    category: "Conversion Metrics",
  },
  // Custom formula measures
  {
    id: "roas",
    name: "ROAS (Return on Ad Spend)",
    formula: "[Total Revenue] / [Total Spend]",
    expressionType: "custom",
    format: "number",
    isCustom: false,
    description: "Revenue earned divided by marketing spend. Targets > 3.0x.",
    category: "ROI Analytics",
  },
  {
    id: "ctr",
    name: "Avg Click-Through Rate (CTR)",
    formula: "[Total Clicks] / [Total Impressions]",
    expressionType: "custom",
    format: "percent",
    isCustom: false,
    description: "Percentage of impressions that resulted in an advertisement click.",
    category: "Traffic Metrics",
  },
  {
    id: "cac",
    name: "CAC (Customer Acquisition Cost)",
    formula: "[Total Spend] / [Total Conversions]",
    expressionType: "custom",
    format: "currency",
    isCustom: false,
    description: "Average marketing spend required to capture a single converting customer.",
    category: "ROI Analytics",
  },
];

export const DEFAULT_ANALYST_MEASURES: Measure[] = [
  {
    id: "sales_sum",
    name: "Gross Sales",
    formula: "SUM(Gross Sales ($))",
    expressionType: "simple",
    columnName: "Gross Sales ($)",
    aggregation: "SUM",
    format: "currency",
    isCustom: false,
    description: "Sum of total transactions before discounts and returns.",
    category: "Core Revenue",
  },
  {
    id: "units_sum",
    name: "Total Units Sold",
    formula: "SUM(Units Sold)",
    expressionType: "simple",
    columnName: "Units Sold",
    aggregation: "SUM",
    format: "integer",
    isCustom: false,
    description: "Total product quantity dispatched to customers.",
    category: "Core Revenue",
  },
  {
    id: "discounts_sum",
    name: "Discounts Applied",
    formula: "SUM(Discounts Given ($))",
    expressionType: "simple",
    columnName: "Discounts Given ($)",
    aggregation: "SUM",
    format: "currency",
    isCustom: false,
    description: "Sum of total financial markdown deductions.",
    category: "Deductions",
  },
  {
    id: "returns_sum",
    name: "Total Return Units",
    formula: "SUM(Return Units)",
    expressionType: "simple",
    columnName: "Return Units",
    aggregation: "SUM",
    format: "integer",
    isCustom: false,
    description: "Product units returned back due to quality or change of mind.",
    category: "Deductions",
  },
  // Custom formula measures
  {
    id: "net_sales",
    name: "Net Sales",
    formula: "[Gross Sales] - [Discounts Applied]",
    expressionType: "custom",
    format: "currency",
    isCustom: false,
    description: "Sales actualized after discounting deduction.",
    category: "Core Revenue",
  },
  {
    id: "avg_unit_price",
    name: "Average Order Value",
    formula: "[Gross Sales] / [Total Units Sold]",
    expressionType: "custom",
    format: "currency",
    isCustom: false,
    description: "Aggregate transaction sale size divided by quantity ordered.",
    category: "Performance Metrics",
  },
  {
    id: "discount_percentage",
    name: "Effective Discount %",
    formula: "[Discounts Applied] / [Gross Sales]",
    expressionType: "custom",
    format: "percent",
    isCustom: false,
    description: "The percentage value of discounting relative to sales volume.",
    category: "Performance Metrics",
  },
];

export const DEFAULT_CFO_MEASURES: Measure[] = [
  {
    id: "cfo_spend",
    name: "Total Operating Spend",
    formula: "SUM(Operating Spend ($))",
    expressionType: "simple",
    columnName: "Operating Spend ($)",
    aggregation: "SUM",
    format: "currency",
    isCustom: false,
    description: "Sum of expenses across operational departments.",
    category: "Expenses",
  },
  {
    id: "cfo_budget",
    name: "Total Allocated Budget",
    formula: "SUM(Budget Allocated ($))",
    expressionType: "simple",
    columnName: "Budget Allocated ($)",
    aggregation: "SUM",
    format: "currency",
    isCustom: false,
    description: "Approved fiscal limits allocated to departments.",
    category: "Expenses",
  },
  {
    id: "cfo_income",
    name: "Actual Income",
    formula: "SUM(Actual Income ($))",
    expressionType: "simple",
    columnName: "Actual Income ($)",
    aggregation: "SUM",
    format: "currency",
    isCustom: false,
    description: "Total revenue actualized during reporting months.",
    category: "Revenue Streams",
  },
  {
    id: "cfo_headcount",
    name: "Average Headcount",
    formula: "AVG(Headcount)",
    expressionType: "simple",
    columnName: "Headcount",
    aggregation: "AVG",
    format: "integer",
    isCustom: false,
    description: "Average human resource count over reporting window.",
    category: "Workforce",
  },
  // Custom formulas
  {
    id: "cfo_variance",
    name: "Budget Variance ($)",
    formula: "[Total Allocated Budget] - [Total Operating Spend]",
    expressionType: "custom",
    format: "currency",
    isCustom: false,
    description: "Leftover capital. Positive means under-budget, negative represents cost-overrun.",
    category: "Control",
  },
  {
    id: "cfo_efficiency",
    name: "Income per Employee",
    formula: "[Actual Income] / [Average Headcount]",
    expressionType: "custom",
    format: "currency",
    isCustom: false,
    description: "Calculated productivity of the company staff members.",
    category: "Performance Metrics",
  },
  {
    id: "budget_burn_rate",
    name: "Budget Utilization %",
    formula: "[Total Operating Spend] / [Total Allocated Budget]",
    expressionType: "custom",
    format: "percent",
    isCustom: false,
    description: "Percentage of approved funding utilized in operations.",
    category: "Control",
  },
];

export const DEFAULT_SALES_MEASURES: Measure[] = [
  {
    id: "sales_leads",
    name: "Total Leads",
    formula: "SUM(Leads Contacted)",
    expressionType: "simple",
    columnName: "Leads Contacted",
    aggregation: "SUM",
    format: "integer",
    isCustom: false,
    description: "Sum of all sales leads contacted.",
    category: "Pipeline Dynamics",
  },
  {
    id: "sales_won",
    name: "Total Deals Won",
    formula: "SUM(Deals Won)",
    expressionType: "simple",
    columnName: "Deals Won",
    aggregation: "SUM",
    format: "integer",
    isCustom: false,
    description: "Number of successfully closed-won business deals.",
    category: "Sales Velocity",
  },
  {
    id: "sales_revenue",
    name: "Closed Revenue",
    formula: "SUM(Closed Revenue ($))",
    expressionType: "simple",
    columnName: "Closed Revenue ($)",
    aggregation: "SUM",
    format: "currency",
    isCustom: false,
    description: "Gross contract value won from sales closures.",
    category: "Financial Impact",
  },
  {
    id: "sales_pipeline",
    name: "Total Pipeline Value",
    formula: "SUM(Pipeline Value ($))",
    expressionType: "simple",
    columnName: "Pipeline Value ($)",
    aggregation: "SUM",
    format: "currency",
    isCustom: false,
    description: "Estimated gross worth of active prospective pipeline opportunities.",
    category: "Pipeline Dynamics",
  },
  {
    id: "sales_avg_days",
    name: "Average Deal Cycle (Days)",
    formula: "AVG(Days to Close)",
    expressionType: "simple",
    columnName: "Days to Close",
    aggregation: "AVG",
    format: "number",
    isCustom: false,
    description: "Average days elapsed from lead ingestion to closed status.",
    category: "Sales Velocity",
  },
  {
    id: "sales_win_rate",
    name: "Lead Win Rate %",
    formula: "[Total Deals Won] / [Total Leads]",
    expressionType: "custom",
    format: "percent",
    isCustom: false,
    description: "Percentage of leads successfully converted to paying customers.",
    category: "Performance Metrics",
  },
  {
    id: "sales_avg_deal_size",
    name: "Average Deal Size",
    formula: "[Closed Revenue] / [Total Deals Won]",
    expressionType: "custom",
    format: "currency",
    isCustom: false,
    description: "Average financial contract size of won accounts.",
    category: "Performance Metrics",
  },
];

export const DEFAULT_HR_MEASURES: Measure[] = [
  {
    id: "hr_headcount",
    name: "Total Headcount",
    formula: "SUM(Headcount)",
    expressionType: "simple",
    columnName: "Headcount",
    aggregation: "SUM",
    format: "integer",
    isCustom: false,
    description: "Sum of active personnel across the organization.",
    category: "Workforce Structure",
  },
  {
    id: "hr_hires",
    name: "Total New Hires",
    formula: "SUM(New Hires)",
    expressionType: "simple",
    columnName: "New Hires",
    aggregation: "SUM",
    format: "integer",
    isCustom: false,
    description: "Total onboarding hire count.",
    category: "Talent Acquisition",
  },
  {
    id: "hr_attritions",
    name: "Total Attritions",
    formula: "SUM(Attritions)",
    expressionType: "simple",
    columnName: "Attritions",
    aggregation: "SUM",
    format: "integer",
    isCustom: false,
    description: "Total employee resignations or voluntary separations.",
    category: "Talent Retention",
  },
  {
    id: "hr_payroll",
    name: "Total Payroll Spend",
    formula: "SUM(Payroll Cost ($))",
    expressionType: "simple",
    columnName: "Payroll Cost ($)",
    aggregation: "SUM",
    format: "currency",
    isCustom: false,
    description: "Aggregate salaries and payroll expenditure.",
    category: "Financials",
  },
  {
    id: "hr_training",
    name: "Total Training Hours",
    formula: "SUM(Training Hours Logged)",
    expressionType: "simple",
    columnName: "Training Hours Logged",
    aggregation: "SUM",
    format: "integer",
    isCustom: false,
    description: "Total self-development training hours completed.",
    category: "Talent Retention",
  },
  {
    id: "hr_avg_sat",
    name: "Average satisfaction index",
    formula: "AVG(Satisfaction Score)",
    expressionType: "simple",
    columnName: "Satisfaction Score",
    aggregation: "AVG",
    format: "number",
    isCustom: false,
    description: "Average employee satisfaction index on a scale of 1 to 10.",
    category: "Workforce Happiness",
  },
  {
    id: "hr_turnover_rate",
    name: "Monthly Attrition Rate %",
    formula: "[Total Attritions] / [Total Headcount]",
    expressionType: "custom",
    format: "percent",
    isCustom: false,
    description: "Percentage of headcount that left during the cycle.",
    category: "Talent Retention",
  },
];

export const DEFAULT_CEO_MEASURES: Measure[] = [
  {
    id: "ceo_revenue",
    name: "Total Enterprise Revenue",
    formula: "SUM(Revenue ($))",
    expressionType: "simple",
    columnName: "Revenue ($)",
    aggregation: "SUM",
    format: "currency",
    isCustom: false,
    description: "Aggregate gross income from sales across all business segments.",
    category: "CEO Boardroom",
  },
  {
    id: "ceo_opex",
    name: "Total Opex",
    formula: "SUM(Operating Expenses ($))",
    expressionType: "simple",
    columnName: "Operating Expenses ($)",
    aggregation: "SUM",
    format: "currency",
    isCustom: false,
    description: "Total capital expended to sustain basic operations.",
    category: "CEO Boardroom",
  },
  {
    id: "ceo_customers",
    name: "Net New Customer Count",
    formula: "SUM(Net New Customers)",
    expressionType: "simple",
    columnName: "Net New Customers",
    aggregation: "SUM",
    format: "integer",
    isCustom: false,
    description: "Total customer expansion rate.",
    category: "CEO Boardroom",
  },
  {
    id: "ceo_avg_nps",
    name: "NPS Score (Net Promoter)",
    formula: "AVG(NPS Score)",
    expressionType: "simple",
    columnName: "NPS Score",
    aggregation: "AVG",
    format: "integer",
    isCustom: false,
    description: "Average score measuring consumer brand recommendation loyalty.",
    category: "CEO Boardroom",
  },
  {
    id: "ceo_ebitda",
    name: "EBITDA Operating Income",
    formula: "[Total Enterprise Revenue] - [Total Opex]",
    expressionType: "custom",
    format: "currency",
    isCustom: false,
    description: "Earnings before interest, taxes, depreciation, and amortization.",
    category: "CEO Boardroom",
  },
  {
    id: "ceo_ebitda_margin",
    name: "EBITDA Margin %",
    formula: "[EBITDA Operating Income] / [Total Enterprise Revenue]",
    expressionType: "custom",
    format: "percent",
    isCustom: false,
    description: "EBITDA profit margin expressed as percentage of total sales.",
    category: "CEO Boardroom",
  },
];

export const getTemplateForRole = (role: Role) => {
  switch (role) {
    case "CMO":
      return {
        columns: CMO_COLUMNS,
        data: generateCMOData(),
        measures: DEFAULT_CMO_MEASURES,
      };
    case "Business Analyst":
      return {
        columns: ANALYST_COLUMNS,
        data: generateAnalystData(),
        measures: DEFAULT_ANALYST_MEASURES,
      };
    case "CFO":
      return {
        columns: CFO_COLUMNS,
        data: generateCFOData(),
        measures: DEFAULT_CFO_MEASURES,
      };
    case "Sales Director":
      return {
        columns: SALES_COLUMNS,
        data: generateSalesData(),
        measures: DEFAULT_SALES_MEASURES,
      };
    case "HR Specialist":
      return {
        columns: HR_COLUMNS,
        data: generateHRData(),
        measures: DEFAULT_HR_MEASURES,
      };
    case "CEO":
      return {
        columns: CEO_COLUMNS,
        data: generateCEOData(),
        measures: DEFAULT_CEO_MEASURES,
      };
  }
};

// ==========================================
// 3. DAX & MEASURE EVALUATION ENGINE
// ==========================================

export function evaluateMeasure(
  measure: Measure,
  data: any[],
  allMeasures: Measure[],
  calculatedValuesCache: Record<string, number> = {}
): number {
  const cacheKey = measure.id;
  if (calculatedValuesCache[cacheKey] !== undefined) {
    return calculatedValuesCache[cacheKey];
  }

  let expression = measure.formula;

  // 1. Resolve dependencies first (square brackets [Measure Name])
  const bracketRegex = /\[([^\]]+)\]/g;
  let match;
  const dependencies: { placeholder: string; name: string }[] = [];

  while ((match = bracketRegex.exec(expression)) !== null) {
    dependencies.push({
      placeholder: match[0],
      name: match[1],
    });
  }

  for (const dep of dependencies) {
    const matchedMeasure = allMeasures.find(
      (m) => m.name.toLowerCase().trim() === dep.name.toLowerCase().trim()
    );

    if (matchedMeasure) {
      if (matchedMeasure.id === measure.id) {
        expression = expression.replace(dep.placeholder, "0");
        continue;
      }
      const evaluatedDepValue = evaluateMeasure(
        matchedMeasure,
        data,
        allMeasures,
        calculatedValuesCache
      );
      expression = expression.replace(dep.placeholder, evaluatedDepValue.toString());
    } else {
      expression = expression.replace(dep.placeholder, "0");
    }
  }

  // 2. Resolve inline DAX Aggregation Functions: SUM, AVERAGE, AVG, COUNT, MIN, MAX
  const functions = ["SUM", "AVERAGE", "AVG", "COUNT", "MIN", "MAX"];
  let found = true;

  while (found) {
    found = false;
    for (const func of functions) {
      const searchStr = func + "(";
      const index = expression.toUpperCase().indexOf(searchStr);
      if (index !== -1) {
        // Find matching closing parenthesis considering nested ones
        let openBrackets = 1;
        let endIndex = -1;
        const startArgIndex = index + searchStr.length;
        for (let i = startArgIndex; i < expression.length; i++) {
          if (expression[i] === "(") {
            openBrackets++;
          } else if (expression[i] === ")") {
            openBrackets--;
            if (openBrackets === 0) {
              endIndex = i;
              break;
            }
          }
        }

        if (endIndex !== -1) {
          const colName = expression.substring(startArgIndex, endIndex).trim();
          const values = data
            .map((row) => {
              const val = row[colName];
              if (typeof val === "number") return val;
              if (typeof val === "string" || val instanceof String) {
                const clean = String(val).replace(/[\$,\s]/g, "");
                const num = parseFloat(clean);
                return isNaN(num) ? 0 : num;
              }
              return 0;
            })
            .filter((v) => !isNaN(v));

          let result = 0;
          const upperFunc = func.toUpperCase();
          if (values.length > 0) {
            if (upperFunc === "SUM") {
              result = values.reduce((sum, v) => sum + v, 0);
            } else if (upperFunc === "AVERAGE" || upperFunc === "AVG") {
              result = values.reduce((sum, v) => sum + v, 0) / values.length;
            } else if (upperFunc === "COUNT") {
              result = values.length;
            } else if (upperFunc === "MIN") {
              result = Math.min(...values);
            } else if (upperFunc === "MAX") {
              result = Math.max(...values);
            }
          } else {
            if (upperFunc === "COUNT") {
              result = 0;
            }
          }

          const fullMatch = expression.substring(index, endIndex + 1);
          expression = expression.replace(fullMatch, result.toString());
          found = true;
          break;
        }
      }
    }
  }

  // 3. Safely evaluate math expression containing only numbers and standard operators
  try {
    const sanitizedExpr = expression.replace(/[^0-9\+\-\*\/\(\)\.\s]/g, "");
    if (!sanitizedExpr.trim()) {
      calculatedValuesCache[cacheKey] = 0;
      return 0;
    }
    const result = Function(`"use strict"; return (${sanitizedExpr})`)();
    const finalResult = isFinite(result) ? result : 0;
    calculatedValuesCache[cacheKey] = finalResult;
    return finalResult;
  } catch (e) {
    console.error(`Error evaluating measure "${measure.name}":`, e);
    calculatedValuesCache[cacheKey] = 0;
    return 0;
  }
}

export function formatMeasureValue(value: number, format: Measure["format"]): string {
  if (isNaN(value) || !isFinite(value)) return "N/A";
  
  switch (format) {
    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(value);
    case "percent":
      return new Intl.NumberFormat("en-US", {
        style: "percent",
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(value);
    case "integer":
      return new Intl.NumberFormat("en-US", {
        style: "decimal",
        maximumFractionDigits: 0,
      }).format(value);
    case "number":
    default:
      return new Intl.NumberFormat("en-US", {
        style: "decimal",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
  }
}

// ==========================================
// 4. EXCEL PARSER & CSV PARSER (PASTE OR FILE DRAG & DROP)
// ==========================================

export function parseExcel(arrayBuffer: ArrayBuffer): { data: any[]; columns: ColumnMetadata[] } {
  const data = new Uint8Array(arrayBuffer);
  const workbook = XLSX.read(data, { type: 'array', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  const rawRows = XLSX.utils.sheet_to_json<any>(worksheet, { defval: "" });
  if (rawRows.length === 0) {
    return { data: [], columns: [] };
  }
  
  // Collect all unique headers across all rows
  const headersSet = new Set<string>();
  rawRows.forEach(row => {
    Object.keys(row).forEach(key => headersSet.add(key));
  });
  const headers = Array.from(headersSet);
  
  const parsedData = rawRows.map((rawRow) => {
    const row: any = {};
    headers.forEach((header) => {
      let val = rawRow[header];
      if (val instanceof Date) {
        // Formatted to YYYY-MM-DD
        row[header] = val.toISOString().split("T")[0];
      } else if (typeof val === "number") {
        row[header] = val;
      } else if (val === null || val === undefined || val === "") {
        row[header] = null;
      } else {
        const strVal = String(val).trim();
        if (strVal === "") {
          row[header] = null;
        } else if (!isNaN(Number(strVal)) && strVal.toLowerCase() !== "infinity" && strVal.toLowerCase() !== "-infinity") {
          row[header] = Number(strVal);
        } else {
          row[header] = strVal;
        }
      }
    });
    return row;
  });
  
  const columns: ColumnMetadata[] = headers.map((header) => {
    let numCount = 0;
    let dateCount = 0;
    let nonNullCount = 0;
    
    parsedData.slice(0, 10).forEach((row) => {
      const val = row[header];
      if (val !== undefined && val !== null && val !== "") {
        nonNullCount++;
        if (typeof val === "number") {
          numCount++;
        } else if (typeof val === "string") {
          const dateTest = Date.parse(val);
          const hasDateSymbols = val.includes("-") || val.includes("/") || val.includes(":");
          if (!isNaN(dateTest) && hasDateSymbols) {
            dateCount++;
          }
        }
      }
    });
    
    let type: ColumnMetadata["type"] = "string";
    if (nonNullCount > 0) {
      if (numCount / nonNullCount > 0.7) {
        type = "number";
      } else if (dateCount / nonNullCount > 0.7) {
        type = "date";
      }
    }
    
    return { name: header, type };
  });
  
  return { data: parsedData, columns };
}

export function parseCSV(text: string): { data: any[]; columns: ColumnMetadata[] } {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length === 0) return { data: [], columns: [] };

  // Parse headers
  const headers = splitCSVLine(lines[0]);
  const data: any[] = [];

  // Parse rows
  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i]);
    if (values.length === 0) continue;

    const row: any = {};
    headers.forEach((header, index) => {
      const cleanHeader = header.trim().replace(/^"|"$/g, "");
      let rawVal = values[index] !== undefined ? values[index].trim() : "";
      rawVal = rawVal.replace(/^"|"$/g, ""); // remove wrapping quotes

      // Convert numbers if numeric
      if (rawVal === "") {
        row[cleanHeader] = null;
      } else if (!isNaN(Number(rawVal)) && rawVal.toLowerCase() !== "infinity" && rawVal.toLowerCase() !== "-infinity") {
        row[cleanHeader] = Number(rawVal);
      } else {
        row[cleanHeader] = rawVal;
      }
    });
    data.push(row);
  }

  // Auto-detect Column Types
  const columns: ColumnMetadata[] = headers.map((header) => {
    const cleanHeader = header.trim().replace(/^"|"$/g, "");
    
    // Scan up to 10 rows to detect the type
    let numCount = 0;
    let dateCount = 0;
    let nonNullCount = 0;

    data.slice(0, 10).forEach((row) => {
      const val = row[cleanHeader];
      if (val !== undefined && val !== null && val !== "") {
        nonNullCount++;
        if (typeof val === "number") {
          numCount++;
        } else if (typeof val === "string") {
          // Check if string can be a date
          const dateTest = Date.parse(val);
          // Simple check for standard date separators
          const hasDateSymbols = val.includes("-") || val.includes("/") || val.includes(":");
          if (!isNaN(dateTest) && hasDateSymbols) {
            dateCount++;
          }
        }
      }
    });

    let type: ColumnMetadata["type"] = "string";
    if (nonNullCount > 0) {
      if (numCount / nonNullCount > 0.7) {
        type = "number";
      } else if (dateCount / nonNullCount > 0.7) {
        type = "date";
      }
    }

    return { name: cleanHeader, type };
  });

  return { data, columns };
}

// Simple CSV helper to handle commas within quotes
function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// ==========================================
// 5. EXPORT HELPER (CSV FILE DOWNLOAD)
// ==========================================

export function downloadCSV(data: any[], filename = "export.csv") {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  
  const csvRows = [
    headers.join(","), // Headers
    ...data.map((row) =>
      headers
        .map((header) => {
          const val = row[header];
          const escaped = String(val === null || val === undefined ? "" : val).replace(/"/g, '""');
          return escaped.includes(",") || escaped.includes("\n") || escaped.includes('"') ? `"${escaped}"` : escaped;
        })
        .join(",")
    ),
  ];

  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
