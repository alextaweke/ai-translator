import { GoogleGenerativeAI } from "@google/generative-ai";
import { Language } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function translateWithAI(
  text: string,
  sourceLang: Language,
  targetLang: Language,
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const languageNames = {
    om: "Afaan Oromo",
    en: "English",
    am: "Amharic",
  };

  const prompt = `You are a professional translator specializing in Ethiopian languages. 
Translate the following text from ${languageNames[sourceLang]} to ${languageNames[targetLang]}.

Important rules:
1. Maintain the original meaning and tone
2. Preserve cultural context
3. For Afaan Oromo, use the Qubee alphabet
4. For Amharic, use the Ge'ez script
5. If the text contains mixed languages, focus on translating ${languageNames[sourceLang]} parts

Text to translate: "${text}"

Provide only the translation without any explanations or additional text:`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const translation = response.text();

    if (!translation) {
      throw new Error("No translation received");
    }

    return translation.trim();
  } catch (error) {
    console.error("Translation error:", error);
    throw new Error("Failed to translate text. Please try again.");
  }
}
