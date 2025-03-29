import { NextResponse } from "next/server";
import { generateImageUrl } from "@/lib/pollinationsApi";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, width, height, seed, model, nologo } = body;

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Generate the image URL using our utility function
    const imageUrl = generateImageUrl(prompt, {
      width,
      height,
      seed,
      model,
      nologo
    });

    return NextResponse.json({
      success: true,
      imageUrl
    });

  } catch (error: any) {
    console.error("Error in image generation API:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "An error occurred while generating the image" 
      },
      { status: 500 }
    );
  }
}