import React, { useState } from "react";
import { Download } from "lucide-react";

export default function ExportButton({ data, filename, columns }) {
  const [loading, setLoading] = useState(false);

  const exportCSV = () => {
    if (!data || data.length === 0) return;
    setLoading(true);
    const headers = columns.map(c => c.label).join(",");
    const rows = data.map(row =>
      columns.map(c => {
        const val = c.key.split(".").reduce((o, k) => (o ? o[k] : ""), row);
        const str = val === null || val === undefined ? "" : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      }).join(",")
    );
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setLoading(false);
  };

  return (
    <button
      onClick={exportCSV}
      disabled={loading || !data?.length}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border hover:bg-secondary text-xs text-muted-foreground hover:text-foreground transition-all disabled:opacity-40"
    >
      <Download className="w-3.5 h-3.5" />
      CSV
    </button>
  );
}