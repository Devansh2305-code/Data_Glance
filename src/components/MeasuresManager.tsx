import React, { useState } from "react";
import { 
  Calculator, 
  Plus, 
  Trash2, 
  Edit, 
  HelpCircle, 
  CheckCircle,
  AlertCircle,
  Info,
  DollarSign,
  Percent,
  Hash
} from "lucide-react";
import { Measure, ColumnMetadata } from "../types";
import { evaluateMeasure, formatMeasureValue } from "../utils";

interface MeasuresManagerProps {
  measures: Measure[];
  columns: ColumnMetadata[];
  dataset: any[];
  onAddMeasure: (measure: Measure) => void;
  onRemoveMeasure: (id: string) => void;
  onUpdateMeasure: (id: string, updated: Partial<Measure>) => void;
}

export default function MeasuresManager({
  measures,
  columns,
  dataset,
  onAddMeasure,
  onRemoveMeasure,
  onUpdateMeasure,
}: MeasuresManagerProps) {
  const [showCreator, setShowCreator] = useState(false);
  const [measureName, setMeasureName] = useState("");
  const [format, setFormat] = useState<Measure["format"]>("currency");
  const [description, setDescription] = useState("");
  const [customFormula, setCustomFormula] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Editing state
  const [editingMeasureId, setEditingMeasureId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDaxFunc, setEditDaxFunc] = useState("SUM");
  const [editColName, setEditColName] = useState("");
  const [editFormat, setEditFormat] = useState<Measure["format"]>("currency");
  const [editDescription, setEditDescription] = useState("");

  const numericColumns = columns.filter(c => c.type === "number");

  const handleCreateMeasure = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!measureName.trim()) {
      setErrorMsg("Please provide a name for your measure.");
      return;
    }

    // Check for duplicate names
    const nameDup = measures.some(
      m => m.id !== editingMeasureId && m.name.toLowerCase().trim() === measureName.toLowerCase().trim()
    );
    if (nameDup) {
      setErrorMsg(`A measure named "${measureName}" already exists.`);
      return;
    }

    if (!customFormula.trim()) {
      setErrorMsg("Please write a DAX formula.");
      return;
    }

    const newMeasure: Measure = {
      id: "measure_" + Date.now(),
      name: measureName.trim(),
      formula: customFormula.trim(),
      expressionType: "custom",
      format,
      isCustom: true,
      description: description.trim() || `Custom calculated DAX measure.`,
    };

    // Quick test run evaluation to verify the formula parses successfully
    try {
      evaluateMeasure(newMeasure, dataset, measures);
    } catch (err: any) {
      setErrorMsg(`Invalid formula syntax: ${err.message || "Failed to parse DAX expression."}`);
      return;
    }

    onAddMeasure(newMeasure);
    resetForm();
  };

  const handleStartEdit = (measure: Measure) => {
    setEditingMeasureId(measure.id);
    setEditName(measure.name);
    setEditFormat(measure.format);
    setEditDescription(measure.description || "");

    // Parse existing formula if it's a simple aggregation like "SUM(column)"
    const match = /^(SUM|AVERAGE|AVG|COUNT|MIN|MAX)\((.+)\)$/i.exec(measure.formula);
    if (match) {
      let func = match[1].toUpperCase();
      if (func === "AVG") func = "AVERAGE";
      setEditDaxFunc(func);
      setEditColName(match[2].trim());
    } else {
      setEditDaxFunc("SUM");
      setEditColName(numericColumns[0]?.name || columns[0]?.name || "");
    }

    setErrorMsg(null);
    setShowCreator(false); // Hide creator if editing
    
    // Scroll to panel
    setTimeout(() => {
      document.getElementById("measure-editor-panel")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!editName.trim()) {
      setErrorMsg("Please provide a name for the measure.");
      return;
    }

    // Check for duplicate names
    const nameDup = measures.some(
      m => m.id !== editingMeasureId && m.name.toLowerCase().trim() === editName.toLowerCase().trim()
    );
    if (nameDup) {
      setErrorMsg(`A measure named "${editName}" already exists.`);
      return;
    }

    if (!editColName) {
      setErrorMsg("Please select a target column.");
      return;
    }

    // Construct formula matching edit state
    const formula = `${editDaxFunc}(${editColName})`;

    const dummyMeasure: Measure = {
      id: editingMeasureId!,
      name: editName.trim(),
      formula,
      expressionType: "custom",
      format: editFormat,
      isCustom: true,
      description: editDescription.trim(),
    };

    // Test evaluation
    try {
      evaluateMeasure(dummyMeasure, dataset, measures);
    } catch (err: any) {
      setErrorMsg(`Invalid edit formula: ${err.message || "Evaluation failed."}`);
      return;
    }

    onUpdateMeasure(editingMeasureId!, {
      name: editName.trim(),
      formula,
      format: editFormat,
      description: editDescription.trim(),
      isCustom: true,
    });

    setEditingMeasureId(null);
    setErrorMsg(null);
  };

  const resetForm = () => {
    setMeasureName("");
    setFormat("currency");
    setDescription("");
    setCustomFormula("");
    setErrorMsg(null);
    setShowCreator(false);
  };

  const insertMeasurePlaceholder = (name: string) => {
    setCustomFormula(prev => prev + ` [${name}] `);
  };

  const insertMathOperator = (op: string) => {
    setCustomFormula(prev => prev + ` ${op} `);
  };

  return (
    <div id="measures-manager-container" className="space-y-6 max-w-5xl mx-auto p-4">
      
      {/* Header Panel */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Measures & Calculations Modeling</h2>
          <p className="text-sm text-slate-500 mt-1">
            Configure business metrics, aggregations, and write advanced formula logic matching departmental goals.
          </p>
        </div>
        {!showCreator && !editingMeasureId && (
          <button
            id="btn-open-creator"
            onClick={() => setShowCreator(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-all duration-150 flex items-center space-x-2 shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Custom Measure</span>
          </button>
        )}
      </div>

      {/* ERROR MESSAGE (SHARED) */}
      {errorMsg && (showCreator || editingMeasureId) && (
        <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Measure Creator Dialog / Section */}
      {showCreator && (
        <div id="measure-creator-panel" className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm transition-all duration-300">
          <div className="flex justify-between items-center mb-5 border-b border-slate-200 pb-3">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              <span>Define New Calculated Measure</span>
            </h3>
            <button
              id="btn-close-creator"
              onClick={resetForm}
              className="text-slate-400 hover:text-slate-600 text-xs font-semibold px-2 py-1"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreateMeasure} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Left Form Items */}
              <div className="space-y-4 md:col-span-1">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Measure Display Name</label>
                  <input
                    id="input-measure-name"
                    type="text"
                    required
                    placeholder="e.g. Total Revenue Margin"
                    value={measureName}
                    onChange={(e) => setMeasureName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Output Format</label>
                  <select
                    id="select-measure-format"
                    value={format}
                    onChange={(e) => setFormat(e.target.value as Measure["format"])}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="currency">Currency ($1,234)</option>
                    <option value="integer">Integer (1,234)</option>
                    <option value="number">Decimal (1,234.56)</option>
                    <option value="percent">Percent (12.3%)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Documentation Description</label>
                  <input
                    id="input-measure-desc"
                    type="text"
                    placeholder="Describe how this calculation affects departmental metrics"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Right Calculation Logic Fields (ONLY DAX TEXT INPUT, NO DROPDOWNS AS REQUESTED!) */}
              <div className="space-y-4 md:col-span-2 bg-white border border-slate-200 rounded-xl p-4">
                <div id="creator-custom-panel" className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                      <Calculator className="w-4 h-4 text-blue-600" />
                      <span>Advanced DAX Formulator</span>
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">Formula Editor</span>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-normal">
                    Write any DAX formula directly (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600 font-mono">SUM(Clicks)</code>, 
                    <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600 font-mono">AVERAGE(Revenue ($))</code>, or formulas combining multiple aggregates 
                    like <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600 font-mono">SUM(Revenue ($)) / SUM(Ad Spend ($))</code>).
                  </p>

                  <textarea
                    id="textarea-custom-formula"
                    rows={3}
                    required
                    placeholder="e.g. SUM(Revenue ($)) / SUM(Ad Spend ($))"
                    value={customFormula}
                    onChange={(e) => setCustomFormula(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-lg font-mono text-xs focus:ring-1 focus:ring-blue-500 outline-none bg-slate-50/50"
                  />

                  {/* Auto Insertion Utilities */}
                  <div className="space-y-2 pt-1 border-t border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase font-mono">Quick-insert existing measures</div>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-slate-50 rounded-lg">
                      {measures.map((m) => (
                        <button
                          type="button"
                          key={m.id}
                          onClick={() => insertMeasurePlaceholder(m.name)}
                          className="bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-400/45 text-slate-700 text-[11px] px-2.5 py-1 rounded transition-colors flex items-center gap-1 font-mono shadow-xs"
                        >
                          <Calculator className="w-3 h-3 text-slate-400" />
                          <span>{m.name}</span>
                        </button>
                      ))}
                    </div>

                    <div className="text-[11px] font-semibold text-slate-500 uppercase font-mono pt-1">Quick operators</div>
                    <div className="flex gap-1.5">
                      {["SUM(", "AVERAGE(", "COUNT(", "+", "-", "*", "/", "(", ")"].map(op => (
                        <button
                          type="button"
                          key={op}
                          onClick={() => insertMathOperator(op)}
                          className="bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold text-xs px-2.5 py-1 rounded border border-slate-250 transition"
                        >
                          {op}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                id="btn-cancel-creation"
                onClick={resetForm}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100"
              >
                Reset & Close
              </button>
              <button
                type="submit"
                id="btn-save-measure"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Compile Measure</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDITING DIALOG - DROPDOWN SHOWN ONLY WHILE EDITING (AS REQUESTED) */}
      {editingMeasureId && (
        <div id="measure-editor-panel" className="bg-amber-50/20 border-2 border-amber-300 rounded-xl p-6 shadow-sm transition-all duration-300">
          <div className="flex justify-between items-center mb-5 border-b border-amber-200 pb-3">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Edit className="w-5 h-5 text-amber-600" />
              <span>Format & Edit Calculated Measure</span>
            </h3>
            <button
              id="btn-close-editor"
              onClick={() => setEditingMeasureId(null)}
              className="text-slate-400 hover:text-slate-600 text-xs font-semibold px-2 py-1"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSaveEdit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Left Edit Inputs */}
              <div className="space-y-4 md:col-span-1">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Measure Display Name</label>
                  <input
                    id="edit-measure-name"
                    type="text"
                    required
                    placeholder="e.g. Adjusted Sum Clicks"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Output Format</label>
                  <select
                    id="edit-measure-format"
                    value={editFormat}
                    onChange={(e) => setEditFormat(e.target.value as Measure["format"])}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="currency">Currency ($1,234)</option>
                    <option value="integer">Integer (1,234)</option>
                    <option value="number">Decimal (1,234.56)</option>
                    <option value="percent">Percent (12.3%)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Documentation Description</label>
                  <input
                    id="edit-measure-desc"
                    type="text"
                    placeholder="Describe how this calculation affects metrics"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              {/* Right Edit Selectors - DAX Function and Column Name Dropdowns */}
              <div className="space-y-4 md:col-span-2 bg-white border border-slate-200 rounded-xl p-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-amber-500" />
                  <span>DAX Aggregation Rule Settings</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">DAX</label>
                    <select
                      id="edit-simple-agg"
                      value={editDaxFunc}
                      onChange={(e) => setEditDaxFunc(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                    >
                      <option value="SUM">SUM</option>
                      <option value="AVERAGE">AVERAGE</option>
                      <option value="COUNT">COUNT</option>
                      <option value="MIN">MIN</option>
                      <option value="MAX">MAX</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">Column</label>
                    <select
                      id="edit-simple-col"
                      value={editColName}
                      onChange={(e) => setEditColName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                    >
                      {columns.map(col => (
                        <option key={col.name} value={col.name}>{col.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="text-xs text-slate-500 bg-slate-50 p-4 rounded-lg border border-slate-150 font-mono">
                  Constructed DAX: <span className="text-amber-700 font-bold">{editDaxFunc}({editColName || "Column"})</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                id="btn-cancel-edit"
                onClick={() => setEditingMeasureId(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btn-save-edit"
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle className="w-4 h-4 text-amber-200" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Measures Registry Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">Active Modeling Measures Registry</h3>
          <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-semibold border border-slate-200">
            {measures.length} measures compiled
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] uppercase font-mono font-semibold tracking-wider">
                <th className="py-3 px-5">Measure Name</th>
                <th className="py-3 px-5">Formula / Mapping</th>
                <th className="py-3 px-5 text-right">Dataset Evaluation</th>
                <th className="py-3 px-5">Format</th>
                <th className="py-3 px-5">Description</th>
                <th className="py-3 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
              {measures.map((measure) => {
                let evalValue = 0;
                let evalFormatted = "N/A";
                try {
                  evalValue = evaluateMeasure(measure, dataset, measures);
                  evalFormatted = formatMeasureValue(evalValue, measure.format);
                } catch (e) {
                  evalFormatted = "Error";
                }

                return (
                  <tr key={measure.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${measure.isCustom ? "bg-blue-500" : "bg-slate-400"}`} />
                        <span>{measure.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-blue-700 bg-blue-50/50 max-w-[180px] truncate rounded">
                      {measure.formula}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono font-bold text-slate-900 text-sm">
                      {evalFormatted}
                    </td>
                    <td className="py-3.5 px-5 capitalize text-slate-400 font-semibold font-mono text-[10px]">
                      {measure.format}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 text-[11.5px] max-w-[200px] truncate leading-tight">
                      {measure.description}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Edit Button is ALWAYS provided for measures so they can update formula using the dropdowns */}
                        <button
                          id={`btn-edit-measure-${measure.id}`}
                          onClick={() => handleStartEdit(measure)}
                          className="text-amber-600 hover:text-amber-800 hover:bg-amber-50 p-1.5 rounded transition-colors"
                          title="Edit DAX Formula"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        
                        {measure.isCustom ? (
                          <button
                            id={`btn-delete-measure-${measure.id}`}
                            onClick={() => onRemoveMeasure(measure.id)}
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded transition-colors"
                            title="Delete Custom Measure"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[9px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-150 uppercase tracking-wider">
                            System
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
