/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/translate/route.ts
import { NextRequest, NextResponse } from "next/server";

type Language = "om" | "en" | "am";

const languageNames: Record<Language, string> = {
  om: "Afaan Oromo",
  en: "English",
  am: "Amharic",
};

// Use the models available from your list
// These are confirmed working models from your API response
const WORKING_MODELS = [
  "models/gemini-2.0-flash", // Fast and good for translation
  "models/gemini-2.5-flash", // Latest version
  "models/gemini-2.0-flash-001", // Stable version
  "models/gemini-2.5-pro", // Higher quality
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, sourceLang, targetLang } = body;

    const source = sourceLang as Language;
    const target = targetLang as Language;

    // Validation
    if (!text || !source || !target) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: "Text exceeds maximum length of 5000 characters" },
        { status: 400 },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 },
      );
    }

    let translatedText = "";
    let lastError = null;

    // Try each model until one works
    for (const modelName of WORKING_MODELS) {
      try {
        // Use v1beta API (matches your model list)
        const url = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`;

        const prompt = `You are a professional translator specializing in Ethiopian languages. Translate the following text from ${languageNames[source]} to ${languageNames[target]}.

Guidelines:
- Preserve the original meaning and tone perfectly
- Use the correct script: Qubee for Afaan Oromo, Ge'ez for Amharic
- Maintain cultural context and nuances
- Provide ONLY the translated text. No explanations, no notes, no greetings

Text to translate: "${text}"

Translation:`;

        const requestBody = {
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024,
          },
        };

        console.log(`Trying model: ${modelName}`);

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          translatedText = data.candidates[0].content.parts[0].text;
          console.log(`Success with model: ${modelName}`);
          break;
        } else {
          console.log(
            `Model ${modelName} failed:`,
            data.error?.message || "No translation",
          );
          lastError = data.error?.message;
        }
      } catch (error: any) {
        console.log(`Model ${modelName} error:`, error.message);
        lastError = error.message;
      }
    }

    if (!translatedText) {
      throw new Error(lastError || "All models failed to translate");
    }

    return NextResponse.json({
      translatedText: translatedText.trim(),
      sourceLang: source,
      targetLang: target,
    });
  } catch (error: any) {
    console.error("Translation API Error:", error);
    return NextResponse.json(
      { error: error.message || "Translation failed. Please try again." },
      { status: 500 },
    );
  }
}
