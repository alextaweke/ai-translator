// app/api/list-models/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`,
    );
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch models" },
      { status: 500 },
    );
  }
}
