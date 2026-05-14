/* eslint-disable react-hooks/set-state-in-effect */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Language, LANGUAGE_NAMES, TranslationHistory } from "@/types";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowRightLeft,
  Copy,
  History,
  Trash2,
  Loader2,
  Check,
  AlertCircle,
  Star,
  Download,
  Sparkles,
} from "lucide-react";
import TextToSpeech from "./TextToSpeech";

// Language detection function
const detectLanguage = (text: string): Language => {
  if (!text.trim()) return "en";

  // Check for Amharic characters (Ethiopic script range)
  const hasAmharic = /[\u1200-\u137F]/.test(text);

  // Check for Afaan Oromo specific patterns
  const oromoWords =
    /(akkam|galatoomi|bareeddu|nagaan|dhufte|jirta|jira|nan|si|ani|waan|ta'a|taate|bona|guyyaa|ganama|galgala|halkan|sa'a|wan|kan|miti|dha|ti|ni|farda|nama|mana|gara|itti|irra|ala|keessa|duuba|fulaansa)/i;
  const hasOromo = oromoWords.test(text);

  // Check for English (basic Latin alphabet with common English words)
  const englishWords =
    /\b(the|and|to|of|a|in|for|is|on|that|by|this|with|i|you|it|not|or|be|are|from|at|as|your|have|can|was|will)\b/i;
  const hasEnglish = englishWords.test(text);

  if (hasAmharic) return "am";
  if (hasOromo && !hasAmharic) return "om";
  if (hasEnglish) return "en";

  // Default to English if no specific patterns found
  return "en";
};

export default function TranslationInterface() {
  // State variables
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLang, setSourceLang] = useState<Language>("en");
  const [targetLang, setTargetLang] = useState<Language>("om");
  const [isTranslating, setIsTranslating] = useState(false);
  const [history, setHistory] = useState<TranslationHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [translationProgress, setTranslationProgress] = useState(0);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);

  const supabase = createClient();

  // Helper functions
  const getTextStats = (text: string) => {
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const sentences = text
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0).length;
    const readingTime = Math.max(1, Math.ceil(words / 200));
    return { chars, words, sentences, readingTime };
  };

  const sourceStats = getTextStats(sourceText);
  const targetStats = getTextStats(translatedText);

  // Handle language detection
  const handleAutoDetect = () => {
    if (!sourceText.trim()) {
      setError("Please enter text to detect language");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setIsDetecting(true);
    try {
      const detected = detectLanguage(sourceText);
      setSourceLang(detected);
      setSuccess(`✅ Detected language: ${LANGUAGE_NAMES[detected]}`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Language detection failed");
      setTimeout(() => setError(""), 3000);
    } finally {
      setIsDetecting(false);
    }
  };

  // Fetch history from database
  const fetchHistory = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const query = supabase
      .from("translations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    const { data, error } = await query;

    if (!error && data) {
      setHistory(data);
      const favSet = new Set(
        data.filter((item) => item.is_favorite).map((item) => item.id),
      );
      setFavorites(favSet);
    }
  };

  // Save translation to database
  const saveTranslation = async (source: string, translated: string) => {
    try {
      const response = await fetch("/api/save-translation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_text: source,
          translated_text: translated,
          source_language: sourceLang,
          target_language: targetLang,
        }),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        await fetchHistory();
      }
    } catch (error) {
      console.error("Failed to save translation:", error);
    }
  };

  // Toggle favorite status
  const toggleFavorite = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("translations")
      .update({ is_favorite: !currentStatus })
      .eq("id", id);

    if (!error) {
      if (!currentStatus) {
        setFavorites((prev) => new Set(prev).add(id));
        setSuccess("⭐ Added to favorites!");
        setTimeout(() => setSuccess(""), 2000);
      } else {
        setFavorites((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
        setSuccess("Removed from favorites");
        setTimeout(() => setSuccess(""), 2000);
      }
      await fetchHistory();
    }
  };

  // Delete translation
  const deleteTranslation = async (id: string) => {
    const { error } = await supabase.from("translations").delete().eq("id", id);
    if (!error) {
      setHistory(history.filter((item) => item.id !== id));
      setSuccess("🗑️ Translation deleted");
      setTimeout(() => setSuccess(""), 2000);
    }
  };

  // Load translation from history
  const loadFromHistory = (item: TranslationHistory) => {
    setSourceText(item.source_text);
    setTranslatedText(item.translated_text);
    setSourceLang(item.source_language);
    setTargetLang(item.target_language);
    setShowHistory(false);
    setError("");
    setSuccess("📖 Loaded from history");
    setTimeout(() => setSuccess(""), 2000);
  };

  // Translate text
  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      setError("Please enter text to translate");
      return;
    }

    if (sourceText.length > 5000) {
      setError("Text exceeds maximum length of 5000 characters");
      return;
    }

    setIsTranslating(true);
    setError("");
    setTranslationProgress(0);

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setTranslationProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: sourceText,
          sourceLang,
          targetLang,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Translation failed");
      }

      setTranslatedText(data.translatedText);
      clearInterval(progressInterval);
      setTranslationProgress(100);
      setTimeout(() => setTranslationProgress(0), 500);

      // Auto-save translation
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && data.translatedText) {
        await saveTranslation(sourceText, data.translatedText);
      }

      setSuccess("✨ Translation complete!");
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      clearInterval(progressInterval);
      setTranslationProgress(0);
      setError(err instanceof Error ? err.message : "Translation failed");
      console.error("Translation error:", err);
    } finally {
      setIsTranslating(false);
    }
  };

  // Swap languages
  const swapLanguages = () => {
    if (sourceLang === targetLang) return;
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
    setSuccess("🔄 Languages swapped");
    setTimeout(() => setSuccess(""), 2000);
  };

  // Copy to clipboard
  const copyToClipboard = async (
    text: string,
    type: "source" | "translation" = "translation",
  ) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setSuccess(
        `${type === "source" ? "📋 Source" : "📋 Translation"} copied to clipboard!`,
      );
      setTimeout(() => {
        setCopied(false);
        setSuccess("");
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Copy both source and translation
  const copyBoth = () => {
    if (!sourceText && !translatedText) return;
    const content = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📝 SOURCE (${LANGUAGE_NAMES[sourceLang]}):\n${sourceText}\n\n🌐 TRANSLATION (${LANGUAGE_NAMES[targetLang]}):\n${translatedText}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    navigator.clipboard.writeText(content);
    setSuccess("📋 Copied both source and translation!");
    setTimeout(() => setSuccess(""), 2000);
  };

  // Export translation
  const exportTranslation = () => {
    if (!sourceText && !translatedText) return;

    const exportData = {
      exportedAt: new Date().toISOString(),
      source: {
        text: sourceText,
        language: LANGUAGE_NAMES[sourceLang],
        languageCode: sourceLang,
        statistics: {
          words: sourceStats.words,
          characters: sourceStats.chars,
          sentences: sourceStats.sentences,
          readingTime: sourceStats.readingTime,
        },
      },
      translation: {
        text: translatedText,
        language: LANGUAGE_NAMES[targetLang],
        languageCode: targetLang,
        statistics: {
          words: targetStats.words,
          characters: targetStats.chars,
          sentences: targetStats.sentences,
        },
      },
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `translation_${LANGUAGE_NAMES[sourceLang]}_to_${LANGUAGE_NAMES[targetLang]}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setSuccess("💾 Translation exported successfully!");
    setTimeout(() => setSuccess(""), 2000);
  };

  // Clear all
  const clearAll = () => {
    setSourceText("");
    setTranslatedText("");
    setError("");
    setSuccess("");
    setTranslationProgress(0);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to translate
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (sourceText.trim() && !isTranslating) {
          handleTranslate();
        }
      }
      // Ctrl/Cmd + K to clear
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        clearAll();
      }
      // Ctrl/Cmd + H to show history
      if ((e.ctrlKey || e.metaKey) && e.key === "h") {
        e.preventDefault();
        setShowHistory(true);
      }
      // Ctrl/Cmd + D to detect language
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        if (sourceText.trim()) {
          handleAutoDetect();
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [sourceText, isTranslating]);

  // Auto-detect language when source text changes (optional)
  useEffect(() => {
    // Optional: Auto-detect when text is pasted or changed significantly
    if (sourceText.length > 20 && !isTranslating) {
      const detected = detectLanguage(sourceText);
      if (detected !== sourceLang && detected !== targetLang) {
        // Uncomment if you want auto-detection
        // setSourceLang(detected);
        // setSuccess(`Auto-detected: ${LANGUAGE_NAMES[detected]}`);
        // setTimeout(() => setSuccess(""), 2000);
      }
    }
  }, [sourceText]);

  // Load history on mount
  useEffect(() => {
    fetchHistory();

    const subscription = supabase
      .channel("translations_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "translations",
        },
        () => {
          fetchHistory();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Filter history based on favorites
  const displayedHistory = showFavoritesOnly
    ? history.filter((item) => favorites.has(item.id))
    : history;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6">
          {/* Language Selectors */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Translate from
              </label>
              <div className="flex gap-2">
                <select
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value as Language)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.entries(LANGUAGE_NAMES).map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAutoDetect}
                  disabled={isDetecting || !sourceText}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2"
                  title="Auto-detect language (Ctrl+D)"
                >
                  <Sparkles className="w-4 h-4" />
                  {isDetecting ? "..." : "Auto"}
                </button>
              </div>
            </div>

            <button
              onClick={swapLanguages}
              disabled={sourceLang === targetLang}
              className="self-end md:self-center p-2 hover:bg-gray-100 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Swap languages"
            >
              <ArrowRightLeft className="w-6 h-6 text-gray-600" />
            </button>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Translate to
              </label>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value as Language)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(LANGUAGE_NAMES).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Translation Area */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Source Text */}
            <div className="relative">
              <textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder={`Enter text in ${LANGUAGE_NAMES[sourceLang]}...`}
                className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={isTranslating}
              />
              <div className="flex justify-between items-center mt-2">
                <div className="flex gap-3 text-xs text-gray-400">
                  <span>📝 {sourceStats.words} words</span>
                  <span>🔤 {sourceStats.chars} chars</span>
                  <span>⏱️ {sourceStats.readingTime} min read</span>
                </div>
                <div className="flex gap-2">
                  {sourceText && (
                    <button
                      onClick={() => copyToClipboard(sourceText, "source")}
                      className="text-blue-600 hover:text-blue-700 transition"
                      aria-label="Copy source text"
                    >
                      {copied ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Translated Text */}
            <div className="relative">
              <textarea
                value={translatedText}
                readOnly
                placeholder="Translation will appear here..."
                className="w-full h-64 p-4 border border-gray-300 rounded-lg bg-gray-50 resize-none"
              />
              {translatedText && (
                <>
                  <div className="absolute top-2 right-2 flex gap-2">
                    <TextToSpeech text={translatedText} language={targetLang} />
                    <button
                      onClick={() =>
                        copyToClipboard(translatedText, "translation")
                      }
                      className="p-2 text-blue-600 hover:text-blue-700 transition bg-white rounded-lg shadow"
                      aria-label="Copy translation"
                    >
                      {copied ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    {saved && (
                      <div className="absolute -top-8 right-0 bg-green-500 text-white px-2 py-1 rounded text-xs">
                        Saved!
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-2 left-2 text-xs text-gray-400">
                    📝 {targetStats.words} words
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {isTranslating && (
            <div className="mt-4">
              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${translationProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center">
                Translating... {translationProgress}%
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mt-6">
            <button
              onClick={handleTranslate}
              disabled={isTranslating || !sourceText.trim()}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Translating...
                </>
              ) : (
                "Translate"
              )}
            </button>

            <button
              onClick={copyBoth}
              disabled={!translatedText}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Copy className="w-5 h-5" />
              Copy Both
            </button>

            <button
              onClick={exportTranslation}
              disabled={!translatedText}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-5 h-5" />
              Export
            </button>

            <button
              onClick={() => setShowHistory(true)}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
            >
              <History className="w-5 h-5" />
              History ({history.length})
            </button>

            {(sourceText || translatedText) && (
              <button
                onClick={clearAll}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                Clear
              </button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2 animate-fade-in">
              <Check className="w-5 h-5" />
              {success}
            </div>
          )}

          {/* Keyboard Shortcuts Hint */}
          <div className="mt-4 text-xs text-gray-400 text-center space-x-3">
            <span>💡 Ctrl+Enter: Translate</span>
            <span>•</span>
            <span>Ctrl+K: Clear</span>
            <span>•</span>
            <span>Ctrl+H: History</span>
            <span>•</span>
            <span>Ctrl+D: Detect Language</span>
          </div>
        </div>
      </div>

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <History className="w-5 h-5" />
                Translation History ({displayedHistory.length})
              </h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={`flex items-center gap-2 px-3 py-1 rounded-lg transition ${
                    showFavoritesOnly
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Star
                    className={`w-4 h-4 ${showFavoritesOnly ? "fill-current" : ""}`}
                  />
                  Favorites Only
                </button>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              {displayedHistory.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {showFavoritesOnly
                    ? "⭐ No favorite translations yet. Star some translations to see them here!"
                    : "📝 No translations yet. Start translating to see your history!"}
                </div>
              ) : (
                displayedHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 border-b hover:bg-gray-50 cursor-pointer transition group"
                    onClick={() => loadFromHistory(item)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 mb-1 flex items-center gap-2 flex-wrap">
                          <span className="font-medium">
                            {LANGUAGE_NAMES[item.source_language]} →{" "}
                            {LANGUAGE_NAMES[item.target_language]}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(item.created_at).toLocaleTimeString()}
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
                            toggleFavorite(item.id, favorites.has(item.id));
                          }}
                          className={`p-1 transition ${
                            favorites.has(item.id)
                              ? "text-yellow-500"
                              : "text-gray-400 hover:text-yellow-500"
                          }`}
                          aria-label="Favorite"
                        >
                          <Star
                            className={`w-4 h-4 ${favorites.has(item.id) ? "fill-current" : ""}`}
                          />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTranslation(item.id);
                          }}
                          className="p-1 text-gray-500 hover:text-red-600 transition"
                          aria-label="Delete"
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
      )}

      {/* Add animation CSS for fade-in */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
