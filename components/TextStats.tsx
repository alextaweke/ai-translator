// components/TextStats.tsx
"use client";

import { FileText, Type, Clock } from "lucide-react";

interface TextStatsProps {
  text: string;
  language: string;
}

export default function TextStats({ text, language }: TextStatsProps) {
  const characters = text.length;
  const words = text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
  const sentences = text
    .split(/[.!?]+/)
    .filter((sentence) => sentence.trim().length > 0).length;

  // Estimated reading time (200 words per minute)
  const readingTime = Math.max(1, Math.ceil(words / 200));

  return (
    <div className="flex gap-4 text-sm text-gray-500 mt-2">
      <div className="flex items-center gap-1">
        <Type className="w-4 h-4" />
        <span>{characters} chars</span>
      </div>
      <div className="flex items-center gap-1">
        <FileText className="w-4 h-4" />
        <span>{words} words</span>
      </div>
      <div className="flex items-center gap-1">
        <Clock className="w-4 h-4" />
        <span>{readingTime} min read</span>
      </div>
    </div>
  );
}
