export type Language = "om" | "en" | "am";

export type TranslationRequest = {
  text: string;
  sourceLang: Language;
  targetLang: Language;
};

export type TranslationResponse = {
  translatedText: string;
  sourceLang: Language;
  targetLang: Language;
};

export type TranslationHistory = {
  id: string;
  source_text: string;
  translated_text: string;
  source_language: Language;
  target_language: Language;
  created_at: string;
  user_id: string;
};

export const LANGUAGE_NAMES: Record<Language, string> = {
  om: "Afaan Oromo",
  en: "English",
  am: "Amharic",
};

export const LANGUAGE_CODES: Record<string, Language> = {
  "Afaan Oromo": "om",
  English: "en",
  Amharic: "am",
};
