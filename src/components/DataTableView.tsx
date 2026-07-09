import React, { useState, useMemo } from "react";
import { 
  Search, 
  ArrowUpDown, 
  FileDown, 
  ChevronLeft, 
  ChevronRight,
  Database,
  Calendar,
  Layers,
  ArrowUp,
  ArrowDown,
  Filter,
  X
} from "lucide-react";
import { ColumnMetadata, Measure } from "../types";
import { downloadCSV, evaluateMeasure, formatMeasureValue } from "../utils";

interface DataTableViewProps {
  dataset: any[];
  columns: ColumnMetadata[];
  measures: Measure[];
}

export default function DataTableView({ dataset, columns, measures }: DataTableViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [columnFilters, setColumnFilters] = useState<{ [columnName: string]: string }>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Check if any filters are active (global search or column-specific)
  const hasActiveFilters = useMemo(() => {
    return searchTerm.trim() !== "" || Object.values(columnFilters).some(v => typeof v === "string" && v.trim() !== "");
  }, [searchTerm, columnFilters]);

  // Sorting Handler
  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Filter & Sort raw records
  const processedData = useMemo(() => {
    let result = [...dataset];

    // 1. Global Search Filter
    if (searchTerm.trim() !== "") {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some(
          (val) => val !== null && String(val).toLowerCase().includes(lowerSearch)
        )
      );
    }

    // 2. Column-Specific Filters
    Object.entries(columnFilters).forEach(([colName, filterVal]) => {
      if (typeof filterVal === "string" && filterVal.trim() !== "") {
        const lowerVal = filterVal.toLowerCase().trim();
        result = result.filter((row) => {
          const cellVal = row[colName];
          if (cellVal === null || cellVal === undefined) return false;
          return String(cellVal).toLowerCase().includes(lowerVal);
        });
      }
    });

    // 3. Sort Logic
    if (sortConfig !== null) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
        }

        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();

        if (aStr < bStr) return sortConfig.direction === "asc" ? -1 : 1;
        if (aStr > bStr) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [dataset, searchTerm, columnFilters, sortConfig]);

  // Pagination bounds
  const totalPages = Math.ceil(processedData.length / rowsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return processedData.slice(startIndex, startIndex + rowsPerPage);
  }, [processedData, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleExportFilteredCSV = () => {
    downloadCSV(processedData, "bi_report_filtered_dataset.csv");
  };

  const handleExportFullCSV = () => {
    downloadCSV(dataset, "bi_report_full_raw_dataset.csv");
  };

  return (
    <div id="data-table-view-container" className="space-y-4 max-w-5xl mx-auto p-4">
      {/* Search & Export Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
        
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            id="search-data-table"
            type="text"
            placeholder="Search raw values..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset back to first page on search
            }}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-slate-50/40"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-toggle-advanced-filters"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`font-semibold text-xs py-2 px-3 rounded-lg transition duration-150 flex items-center space-x-1.5 shadow-sm border ${
              showAdvancedFilters 
                ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" 
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
            title="Toggle column-specific filters grid"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{showAdvancedFilters ? "Hide Column Filters" : "Column Filters"}</span>
            {Object.values(columnFilters).some(v => typeof v === "string" && v.trim() !== "") && (
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse ml-0.5" />
            )}
          </button>

          <span className="text-xs text-slate-400 font-mono">
            Showing {processedData.length} of {dataset.length} items
          </span>

          <div className="flex items-center gap-1.5">
            <button
              id="btn-export-filtered-csv"
              onClick={handleExportFilteredCSV}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs py-2 px-3 rounded-lg transition duration-150 flex items-center space-x-1.5 shadow-sm"
              title="Export only the active, filtered, and sorted records currently displayed below"
            >
              <FileDown className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Filtered</span>
            </button>

            <button
              id="btn-export-full-csv"
              onClick={handleExportFullCSV}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-3 rounded-lg transition duration-150 flex items-center space-x-1.5 shadow-sm border border-transparent"
              title="Export the complete imported raw dataset with all original rows"
            >
              <FileDown className="w-3.5 h-3.5 text-blue-100" />
              <span>Export Full CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Column Filters Panel */}
      {showAdvancedFilters && (
        <div id="column-filters-panel" className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Filter by Column Values
              </h3>
            </div>
            {Object.values(columnFilters).some(v => typeof v === "string" && v.trim() !== "") && (
              <button 
                id="btn-clear-column-filters"
                onClick={() => {
                  setColumnFilters({});
                  setCurrentPage(1);
                }}
                className="text-[11px] text-rose-600 hover:text-rose-700 hover:underline font-semibold flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear All Column Filters</span>
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {columns.map(col => {
              const activeVal = columnFilters[col.name] || "";
              return (
                <div key={col.name} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide truncate max-w-[150px]">
                      {col.name}
                    </label>
                    <span className="text-[9px] text-slate-400 font-mono italic">
                      ({col.type})
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      id={`filter-column-${col.name.replace(/\s+/g, "-")}`}
                      type="text"
                      placeholder={`Filter ${col.name}...`}
                      value={activeVal}
                      onChange={(e) => {
                        setColumnFilters(prev => ({
                          ...prev,
                          [col.name]: e.target.value
                        }));
                        setCurrentPage(1);
                      }}
                      className={`w-full px-3 py-2 text-xs rounded-lg border focus:ring-1 outline-none transition-all ${
                        activeVal.trim() !== ""
                          ? "border-blue-400 bg-blue-50/10 focus:ring-blue-500"
                          : "border-slate-200 bg-slate-50/30 focus:ring-blue-500"
                      }`}
                    />
                    {activeVal.trim() !== "" && (
                      <button
                        onClick={() => {
                          setColumnFilters(prev => ({
                            ...prev,
                            [col.name]: ""
                          }));
                          setCurrentPage(1);
                        }}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                        title="Clear field"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <p className="text-[10px] text-slate-400 leading-normal">
            💡 Type any text or value above. The table rows and the active Calculated Measures registry will instantly filter and re-evaluate!
          </p>
        </div>
      )}

      {/* Calculated Measures Grid */}
      {measures && measures.length > 0 && (
        <div id="compiled-measures-data-panel" className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-4 h-4 text-blue-600" />
              <span>📊 Active Calculated Measures in Data View</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
              Evaluates in real-time based on active records
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-48 overflow-y-auto pr-1">
            {measures.map((measure) => {
              let filteredVal = 0;
              let totalVal = 0;
              let filteredFormatted = "N/A";
              let totalFormatted = "N/A";
              try {
                filteredVal = evaluateMeasure(measure, processedData, measures);
                filteredFormatted = formatMeasureValue(filteredVal, measure.format);
                
                totalVal = evaluateMeasure(measure, dataset, measures);
                totalFormatted = formatMeasureValue(totalVal, measure.format);
              } catch (e) {
                filteredFormatted = "Error";
                totalFormatted = "Error";
              }

              return (
                <div
                  key={measure.id}
                  id={`dataview-measure-${measure.id}`}
                  className="bg-white border border-slate-200/80 rounded-lg p-3 flex flex-col justify-between shadow-xs hover:border-blue-300 hover:shadow-xs transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-800 truncate" title={measure.name}>
                        {measure.name}
                      </div>
                      <div className="text-[10px] font-mono text-blue-600 truncate mt-0.5" title={measure.formula}>
                        {measure.formula}
                      </div>
                    </div>
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                      measure.isCustom 
                        ? "bg-blue-50 text-blue-700 border border-blue-100" 
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                    }`}>
                      {measure.isCustom ? "Custom" : "Built-in"}
                    </span>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-baseline justify-between">
                    <span className="text-[10px] text-slate-400 font-medium">Value:</span>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900 font-mono leading-none">
                        {filteredFormatted}
                      </div>
                      {hasActiveFilters && (
                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                          Total: {totalFormatted}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Primary Table Visual Grid */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] uppercase font-mono font-semibold tracking-wider select-none">
                {columns.map((col) => {
                  const isSorted = sortConfig?.key === col.name;
                  return (
                    <th
                      key={col.name}
                      onClick={() => requestSort(col.name)}
                      className="py-3.5 px-5 hover:bg-slate-100 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{col.name}</span>
                        {isSorted ? (
                          sortConfig?.direction === "asc" ? (
                            <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />
                        )}
                        <span className="text-[9px] text-slate-400 lowercase italic font-normal ml-0.5">
                          ({col.type})
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
              {paginatedData.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-slate-50/40 transition-colors">
                  {columns.map((col) => {
                    const rawVal = row[col.name];
                    let formattedVal = rawVal === null || rawVal === undefined ? "-" : String(rawVal);
                    
                    // Add alignment formatting for numerical cells
                    const isNum = col.type === "number";

                    return (
                      <td
                        key={col.name}
                        className={`py-3 px-5 font-medium ${
                          isNum ? "font-mono text-slate-800 text-right" : "text-slate-600"
                        }`}
                      >
                        {formattedVal}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="py-12 text-center text-slate-400">
                    <Database className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-medium">No records found matching search queries.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar footer */}
        <div className="p-4 border-t border-slate-250 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Page <strong className="text-slate-700">{currentPage}</strong> of <strong className="text-slate-700">{totalPages}</strong>
          </span>
          
          <div className="flex items-center gap-1.5">
            <button
              id="btn-prev-page"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <button
              id="btn-next-page"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
