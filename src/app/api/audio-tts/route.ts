import { NextResponse } from "next/server";
import { generateAudioUrl } from "@/lib/pollinationsApi";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, voice = "alloy", provider = "pollinations" } = body;

    if (!text) {
      return NextResponse.json(
        { success: false, error: "Text is required" },
        { status: 400 }
      );
    }

    console.log("Audio TTS request:", { text, voice, provider });

    // Generate the audio URL using our utility function
    const audioUrl = generateAudioUrl(text, voice);

    console.log("Generated audio URL:", audioUrl);

    return NextResponse.json({
      success: true,
      audioUrl
    });

  } catch (error: any) {
    console.error("Error in audio TTS API:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "An error occurred while generating the audio" 
      },
      { status: 500 }
    );
  }
} 