import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { source_text, translated_text, source_language, target_language } =
      await request.json();

    const { data, error } = await supabase
      .from("translations")
      .insert([
        {
          source_text,
          translated_text,
          source_language,
          target_language,
          user_id: user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Save error:", error);
      return NextResponse.json(
        { error: "Failed to save translation" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, translation: data });
  } catch (error) {
    console.error("Save API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
