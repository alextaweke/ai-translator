// components/ExportButton.tsx
"use client";

import { Download, FileJson, FileText } from "lucide-react";
import { TranslationHistory } from "@/types";

interface ExportButtonProps {
  history: TranslationHistory[];
}

export default function ExportButton({ history }: ExportButtonProps) {
  const exportAsJSON = () => {
    const dataStr = JSON.stringify(history, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `translations_${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsCSV = () => {
    const headers = [
      "Source Text",
      "Translation",
      "Source Lang",
      "Target Lang",
      "Date",
    ];
    const rows = history.map((item) => [
      `"${item.source_text.replace(/"/g, '""')}"`,
      `"${item.translated_text.replace(/"/g, '""')}"`,
      item.source_language,
      item.target_language,
      new Date(item.created_at).toLocaleString(),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `translations_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative group">
      <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
        <Download className="w-5 h-5" />
      </button>
      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg hidden group-hover:block z-10">
        <button
          onClick={exportAsJSON}
          className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
        >
          <FileJson className="w-4 h-4" /> Export as JSON
        </button>
        <button
          onClick={exportAsCSV}
          className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
        >
          <FileText className="w-4 h-4" /> Export as CSV
        </button>
      </div>
    </div>
  );
}
