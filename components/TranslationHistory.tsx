// components/TranslationHistory.tsx
"use client";

import { useState } from "react";
import { Search, Trash2, Clock, Copy, Check } from "lucide-react";
import { TranslationHistory as HistoryType } from "@/types";

interface TranslationHistoryProps {
  history: HistoryType[];
  onLoad: (item: HistoryType) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function TranslationHistory({
  history,
  onLoad,
  onDelete,
  onClose,
}: TranslationHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredHistory = history.filter(
    (item) =>
      item.source_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.translated_text.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Translation History ({history.length})
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search translations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* History List */}
        <div className="overflow-y-auto flex-1">
          {filteredHistory.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No translations found
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                className="p-4 border-b hover:bg-gray-50 cursor-pointer transition group"
                onClick={() => onLoad(item)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">
                      {item.source_language.toUpperCase()} →{" "}
                      {item.target_language.toUpperCase()}
                      <span className="ml-2">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="font-medium mb-1 line-clamp-2 text-gray-800">
                      {item.source_text}
                    </div>
                    <div className="text-gray-600 text-sm line-clamp-2">
                      {item.translated_text}
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(item.translated_text, item.id);
                      }}
                      className="p-1 text-gray-500 hover:text-blue-600"
                      title="Copy translation"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id);
                      }}
                      className="p-1 text-gray-500 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
