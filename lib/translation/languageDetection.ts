// // lib/translation/languageDetection.ts
// export function detectLanguage(text: string): string {
//   // Simple detection based on character ranges
//   const hasAmharic = /[\u1200-\u137F]/.test(text); // Ethiopic script range
//   const hasOromo =
//     /[a-zA-Z]/.test(text) && /[dhntgqx]/.test(text.toLowerCase()); // Oromo specific letters
//   const hasEnglish = /[a-zA-Z]/.test(text);

//   if (hasAmharic) return "am";
//   if (hasOromo && !hasEnglish) return "om";
//   return "en";
// }

// // Updated Translation Interface with auto-detection
// const handleAutoDetect = () => {
//   const detected = detectLanguage(sourceText);
//   setSourceLang(detected as Language);
//   // Show user feedback
//   setMessage(`Detected language: ${LANGUAGE_NAMES[detected as Language]}`);
//   setTimeout(() => setMessage(""), 3000);
// };
