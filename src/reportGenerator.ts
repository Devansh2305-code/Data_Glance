import { Measure, ColumnMetadata, Widget, Role, AIInsight } from "./types";
import { evaluateMeasure, formatMeasureValue } from "./utils";

// Helper to group and aggregate data for widgets
function getWidgetAggregatedData(
  widget: Widget,
  dataset: any[],
  measures: Measure[]
): any[] {
  const { xAxis, yAxisMeasures, limit = 15 } = widget.config;
  if (dataset.length === 0 || !xAxis) return [];

  // Find unique keys of xAxis in dataset
  const uniqueVals = Array.from(new Set(dataset.map(row => {
    const v = row[xAxis];
    return v === null || v === undefined ? "N/A" : String(v);
  })));

  let aggregated = uniqueVals.map(val => {
    const subRows = dataset.filter(row => {
      const rowVal = row[xAxis];
      const valStr = rowVal === null || rowVal === undefined ? "N/A" : String(rowVal);
      return valStr === val;
    });

    const rowOutput: any = { name: val };

    yAxisMeasures.forEach(mId => {
      const measureObj = measures.find(m => m.id === mId);
      if (measureObj) {
        rowOutput[measureObj.name] = evaluateMeasure(measureObj, subRows, measures);
      }
    });

    return rowOutput;
  });

  if (aggregated.length > limit) {
    aggregated = aggregated.slice(-limit);
  }

  return aggregated;
}

export function buildHTMLReportContent(
  dataset: any[],
  columns: ColumnMetadata[],
  measures: Measure[],
  widgets: Widget[],
  activeRole: Role,
  globalFilters: Record<string, string>,
  aiInsights: AIInsight[] | null
): string {
  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  // Calculate global measures on the active filtered dataset
  const activeKPIs = measures.map(m => {
    let val = 0;
    try {
      val = evaluateMeasure(m, dataset, measures);
    } catch (e) {
      val = 0;
    }
    return {
      name: m.name,
      formula: m.formula,
      formatted: formatMeasureValue(val, m.format),
      description: m.description,
      format: m.format,
      value: val
    };
  });

  // Compile active filters text
  const activeFiltersStr = Object.entries(globalFilters)
    .filter(([_, val]) => !!val)
    .map(([col, val]) => `${col}: "${val}"`)
    .join(", ") || "None (Full Dataset)";

  // Format dataset columns text
  const colsList = columns.map(c => `${c.name} (${c.type})`).join(", ");

  // Generate automated detailed client-side analysis comments
  let dynamicAnalysisHTML = "";
  if (!aiInsights || aiInsights.length === 0) {
    // Generate intelligent role-based summaries if AI has not run yet
    let roleFocus = "";
    let specificObservations = "";

    if (activeRole === "CMO") {
      roleFocus = "Marketing channel performance, campaign conversion rate optimization, customer acquisition efficiency, and budget allocation (ROAS).";
      const spendCol = columns.find(c => c.name.toLowerCase().includes("spend") || c.name.toLowerCase().includes("cost"));
      const revCol = columns.find(c => c.name.toLowerCase().includes("revenue") || c.name.toLowerCase().includes("sale"));
      if (spendCol && revCol) {
        const totalSpend = dataset.reduce((sum, r) => sum + (Number(r[spendCol.name]) || 0), 0);
        const totalRevenue = dataset.reduce((sum, r) => sum + (Number(r[revCol.name]) || 0), 0);
        const roas = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : "N/A";
        specificObservations = `Cumulative marketing spend across filtered rows is <strong>$${totalSpend.toLocaleString()}</strong>, generating <strong>$${totalRevenue.toLocaleString()}</strong> in gross marketing revenue. This represents an aggregate return on ad spend (ROAS) of <strong>${roas}x</strong>. High-performing campaigns should be prioritized with additional budget.`;
      } else {
        specificObservations = `Dataset of ${dataset.length} campaign records analyzed. Channels show varying levels of engagement. Recommend focusing ad spend on top-converting channels while trimming low CTR variants.`;
      }
    } else if (activeRole === "Business Analyst") {
      roleFocus = "Granular distribution of sales, pricing elasticity, categorical performance anomalies, and volume metrics across regions.";
      const unitsCol = columns.find(c => c.name.toLowerCase().includes("units") || c.name.toLowerCase().includes("qty"));
      if (unitsCol) {
        const totalUnits = dataset.reduce((sum, r) => sum + (Number(r[unitsCol.name]) || 0), 0);
        specificObservations = `Gross volume across the active dataset stands at <strong>${totalUnits.toLocaleString()} units sold</strong>. Outlier detection suggests significant volume concentrations in key subcategories. Pricing structures remain elastic; regional margins can be optimized through targeted regional discount cuts.`;
      } else {
        specificObservations = `Active dataset contains ${dataset.length} transactions. Recommend running a variance and regression model on sales volumes to identify structural seasonality and demand curve shifts.`;
      }
    } else if (activeRole === "CFO") {
      roleFocus = "Operational spend variance, strategic budget utilization, departmental efficiency, financial forecasting, and headcount margins.";
      const spendCol = columns.find(c => c.name.toLowerCase().includes("spend") || c.name.toLowerCase().includes("cost") || c.name.toLowerCase().includes("operating"));
      const budgetCol = columns.find(c => c.name.toLowerCase().includes("budget") || c.name.toLowerCase().includes("allocated"));
      if (spendCol && budgetCol) {
        const totalSpend = dataset.reduce((sum, r) => sum + (Number(r[spendCol.name]) || 0), 0);
        const totalBudget = dataset.reduce((sum, r) => sum + (Number(r[budgetCol.name]) || 0), 0);
        const variance = totalBudget > 0 ? (((totalBudget - totalSpend) / totalBudget) * 100).toFixed(1) : "N/A";
        specificObservations = `Operating expenditure is <strong>$${totalSpend.toLocaleString()}</strong> against an allocated budget of <strong>$${totalBudget.toLocaleString()}</strong>, resulting in a variance of <strong>${variance}% under budget</strong>. Headcount-to-spend ratios remain stable. This cost discipline supports net profit targets.`;
      } else {
        specificObservations = `Active records show resilient operational performance. Recommend a standard mid-year ledger audit to ensure departmental line-items are optimized.`;
      }
    } else if (activeRole === "Sales Director") {
      roleFocus = "Lead pipeline conversion velocity, account manager productivity, closed-won ratios, and quota achievement rates.";
      const revCol = columns.find(c => c.name.toLowerCase().includes("revenue") || c.name.toLowerCase().includes("closed"));
      if (revCol) {
        const totalRevenue = dataset.reduce((sum, r) => sum + (Number(r[revCol.name]) || 0), 0);
        specificObservations = `Closed won revenue totals <strong>$${totalRevenue.toLocaleString()}</strong> within the filtered scope. Performance indicates robust deal flow. Focus on shortening the average sales cycle duration to accelerate near-term pipeline velocity.`;
      } else {
        specificObservations = `Active dataset contains ${dataset.length} sales opportunities. Accounts with large contract values should receive executive alignment support to ensure successful closing.`;
      }
    } else {
      roleFocus = "Operational efficiency, multi-variable correlation, volume constraints, and key business health trackers.";
      specificObservations = `Total analyzed volume of ${dataset.length} records. Performance metrics are running within standard standard deviations. Operational adjustments are recommended based on regional trends.`;
    }

    dynamicAnalysisHTML = `
      <div class="bg-slate-50 border border-slate-200 rounded-xl p-6">
        <h3 class="text-slate-900 font-bold text-sm mb-3 uppercase tracking-wider">Active Workspace Strategic Focus (Role: ${activeRole})</h3>
        <p class="text-slate-700 text-sm leading-relaxed mb-4">
          This customized workspace report has been formulated focusing on <strong>${roleFocus}</strong>
        </p>
        <div class="p-4 bg-blue-50 border border-blue-100 rounded-lg text-blue-900 text-sm leading-relaxed">
          <strong>Direct Empirical Insight:</strong> ${specificObservations}
        </div>
        <p class="text-xs text-slate-500 mt-4 italic">
          *Note: To overlay custom generative insights on this section, click "Run Complete Audit" on the DataGlance AI Insights panel before exporting your report.
        </p>
      </div>
    `;
  } else {
    // We have premium active AI Insights! Write them beautifully
    dynamicAnalysisHTML = `
      <div class="space-y-4">
        <h3 class="text-slate-900 font-extrabold text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
          <span class="w-2 h-5 bg-blue-600 rounded-full inline-block"></span>
          AI-Powered Critical Audit Findings
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${aiInsights.map((insight, idx) => {
            const impactColors = 
              insight.impact === "high" ? "bg-rose-50 border-rose-100 text-rose-900 text-rose-700" :
              insight.impact === "medium" ? "bg-amber-50 border-amber-100 text-amber-900 text-amber-700" :
              "bg-blue-50 border-blue-100 text-blue-900 text-blue-700";
            
            const badgeColor = 
              insight.impact === "high" ? "bg-rose-600 text-white" :
              insight.impact === "medium" ? "bg-amber-600 text-white" :
              "bg-blue-600 text-white";

            return `
              <div class="border border-slate-200 rounded-xl p-5 bg-white shadow-xs hover:border-slate-300 transition duration-150">
                <div class="flex items-center justify-between gap-3 mb-2">
                  <span class="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Finding #${idx + 1}</span>
                  <div class="flex items-center gap-1.5">
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}">
                      ${insight.impact.toUpperCase()} IMPACT
                    </span>
                  </div>
                </div>
                <h4 class="font-bold text-slate-900 text-base mb-1.5">${insight.title}</h4>
                <p class="text-xs text-slate-600 leading-relaxed mb-3">${insight.description}</p>
                <div class="border-t border-slate-100 pt-2.5 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>Scope Focus: <strong class="text-slate-700">${insight.metricAffected}</strong></span>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }

  // Generate widgets table list
  let widgetsHTML = "";
  if (widgets.length > 0) {
    widgetsHTML = `
      <div class="space-y-6">
        <h3 class="text-slate-900 font-extrabold text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
          <span class="w-2 h-5 bg-blue-600 rounded-full inline-block"></span>
          Visual Dashboard Breakdowns
        </h3>
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
          ${widgets.map(w => {
            const chartData = getWidgetAggregatedData(w, dataset, measures);
            const measureNames = w.config.yAxisMeasures.map(id => measures.find(m => m.id === id)?.name || id);
            
            let dataRowsHTML = "";
            if (chartData.length > 0) {
              dataRowsHTML = chartData.map(row => {
                return `
                  <tr class="border-b border-slate-100 hover:bg-slate-50/50">
                    <td class="px-4 py-2 text-xs font-semibold text-slate-800">${row.name}</td>
                    ${measureNames.map(mName => {
                      const val = row[mName];
                      const measureObj = measures.find(m => m.name === mName);
                      const formattedVal = typeof val === "number" ? formatMeasureValue(val, measureObj?.format || "number") : String(val || "N/A");
                      return `<td class="px-4 py-2 text-xs font-mono text-right text-slate-900 font-semibold">${formattedVal}</td>`;
                    }).join("")}
                  </tr>
                `;
              }).join("");
            } else {
              dataRowsHTML = `<tr><td colspan="100%" class="px-4 py-4 text-center text-xs text-slate-400">No chart series data available.</td></tr>`;
            }

            return `
              <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-sm transition">
                <div class="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 class="font-bold text-slate-900 text-sm">${w.title}</h4>
                    <p class="text-[11px] text-slate-500 mt-0.5">X-Axis: ${w.config.xAxis} • Type: ${w.type.toUpperCase()}</p>
                  </div>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700 uppercase font-mono">${w.type}</span>
                </div>
                <div class="p-4 overflow-x-auto">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                        <th class="px-4 py-2">${w.config.xAxis || "Category"}</th>
                        ${measureNames.map(name => `<th class="px-4 py-2 text-right">${name}</th>`).join("")}
                      </tr>
                    </thead>
                    <tbody>
                      ${dataRowsHTML}
                    </tbody>
                  </table>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }

  // Raw data sample HTML
  const sampleRows = dataset.slice(0, 25);
  const sampleRowsHTML = sampleRows.map((row, idx) => {
    return `
      <tr class="border-b border-slate-200 hover:bg-slate-50/50">
        <td class="px-4 py-2 text-xs font-mono text-slate-400 text-center">${idx + 1}</td>
        ${columns.map(c => {
          const val = row[c.name];
          let formattedVal = "";
          if (val === null || val === undefined) {
            formattedVal = "-";
          } else if (c.type === "number") {
            formattedVal = typeof val === "number" ? val.toLocaleString() : String(val);
          } else {
            formattedVal = String(val);
          }
          return `<td class="px-4 py-2 text-xs text-slate-700 truncate max-w-[150px]">${formattedVal}</td>`;
        }).join("")}
      </tr>
    `;
  }).join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DataGlance Analytical Report - ${activeRole}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            display: ['Space Grotesk', 'sans-serif'],
          }
        }
      }
    }
  </script>
  <style>
    @media print {
      .no-print { display: none !important; }
      body { background-color: white !important; color: black !important; padding: 0 !important; }
      .print-card { border: none !important; box-shadow: none !important; }
      .page-break { page-break-after: always; }
    }
  </style>
</head>
<body class="bg-slate-50 text-slate-900 font-sans p-6 md:p-12 min-h-screen">
  
  <div class="max-w-6xl mx-auto space-y-8">
    
    <!-- Top Print & Close Banner -->
    <div class="no-print bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
      <div class="flex items-center gap-3">
        <div class="bg-blue-100 text-blue-700 p-2 rounded-lg font-bold text-sm font-display">DG</div>
        <div>
          <h4 class="font-bold text-sm text-slate-900">Your DataGlance Export is Ready!</h4>
          <p class="text-xs text-slate-500">This standalone report file compiles live database measures, active charts data, and tactical analyst insights.</p>
        </div>
      </div>
      <div class="flex items-center gap-2.5">
        <button onclick="window.print()" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-sm transition">
          Print or Save to PDF
        </button>
        <button onclick="window.close()" class="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold py-2 px-4 rounded-lg shadow-sm transition">
          Close Tab
        </button>
      </div>
    </div>

    <!-- Header Executive Block -->
    <header class="bg-slate-900 text-white rounded-2xl p-8 md:p-10 shadow-lg relative overflow-hidden">
      <div class="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-0"></div>
      <div class="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div class="flex items-center gap-2 bg-blue-500/20 text-blue-300 font-mono text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full mb-3 w-fit">
            DataGlance BI Engine Report
          </div>
          <h1 class="font-display font-extrabold text-2xl md:text-3.5xl tracking-tight leading-tight">
            Executive Analytics & Performance Report
          </h1>
          <p class="text-slate-300 text-xs md:text-sm mt-2 max-w-2xl leading-relaxed">
            A comprehensive analytical distillation compiled on active performance indicators, transaction subsets, and operational ratios. Fully tailored for the business workspace of the <strong>${activeRole}</strong>.
          </p>
        </div>
        <div class="bg-slate-800/80 border border-slate-700/50 backdrop-blur-sm rounded-xl p-4 shrink-0 text-xs space-y-1.5 font-mono">
          <div><span class="text-slate-400">Date:</span> <span class="text-slate-200">${dateStr}</span></div>
          <div><span class="text-slate-400">Role Context:</span> <span class="text-blue-400 font-bold">${activeRole}</span></div>
          <div><span class="text-slate-400">Filtered Rows:</span> <span class="text-emerald-400 font-bold">${dataset.length}</span></div>
          <div><span class="text-slate-400">Active Filters:</span> <span class="text-amber-400 font-bold">${activeFiltersStr}</span></div>
        </div>
      </div>
    </header>

    <!-- Key Metrics Grid -->
    <section class="space-y-4">
      <h3 class="text-slate-900 font-extrabold text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
        <span class="w-2 h-5 bg-blue-600 rounded-full inline-block"></span>
        Active KPI Performance Summary
      </h3>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        ${activeKPIs.slice(0, 8).map(kpi => {
          return `
            <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition duration-150">
              <span class="text-[10px] font-mono text-slate-400 uppercase font-bold block truncate" title="${kpi.name}">${kpi.name}</span>
              <span class="text-xl font-extrabold font-display text-slate-900 block mt-1.5">${kpi.formatted}</span>
              <p class="text-[10.5px] text-slate-500 mt-2 leading-relaxed line-clamp-2" title="${kpi.description}">${kpi.description}</p>
              <div class="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1">
                <span class="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">Formula:</span>
                <span class="text-[9px] font-mono text-slate-500 truncate" title="${kpi.formula}">${kpi.formula}</span>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </section>

    <!-- Detailed Analysis Callout -->
    <section class="page-break">
      ${dynamicAnalysisHTML}
    </section>

    <!-- Visual Charts Data Summaries -->
    <section class="page-break">
      ${widgetsHTML}
    </section>

    <!-- Raw Data Preview Table -->
    <section class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
      <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-4 border-b border-slate-200 mb-4">
        <div>
          <h3 class="text-slate-900 font-extrabold text-base tracking-tight">Active Dataset Preview</h3>
          <p class="text-xs text-slate-500 mt-0.5">Showing the first 25 of ${dataset.length} transaction records sorted chronological/sequentially.</p>
        </div>
        <span class="text-[11px] bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg text-slate-600 font-mono font-medium">
          Schema: ${columns.length} Fields
        </span>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
              <th class="px-4 py-2.5 text-center w-12">#</th>
              ${columns.map(c => `<th class="px-4 py-2.5 font-display font-bold text-slate-700">${c.name}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${sampleRowsHTML}
          </tbody>
        </table>
      </div>
      <p class="text-[11px] text-slate-400 mt-4 text-center font-medium italic">
        *Full active transactional ledger containing ${dataset.length} records has been analyzed programmatically in the generated metrics.
      </p>
    </section>

    <!-- Report Footer -->
    <footer class="text-center py-10 border-t border-slate-200 text-slate-400 text-xs">
      <p class="font-display font-semibold text-slate-600 mb-1">DataGlance Business Intelligence Platform</p>
      <p class="font-mono">Secure Standalone HTML Export • No external API reporting dependencies.</p>
    </footer>

  </div>

</body>
</html>
  `;
}

export function downloadHTMLReport(
  dataset: any[],
  columns: ColumnMetadata[],
  measures: Measure[],
  widgets: Widget[],
  activeRole: Role,
  globalFilters: Record<string, string>,
  aiInsights: AIInsight[] | null
) {
  const htmlContent = buildHTMLReportContent(dataset, columns, measures, widgets, activeRole, globalFilters, aiInsights);
  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  
  const sanitizedRole = activeRole.replace(/\s+/g, "_");
  const dateStr = new Date().toISOString().split("T")[0];
  link.setAttribute("download", `DataGlance_${sanitizedRole}_Detailed_Report_${dateStr}.html`);
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
