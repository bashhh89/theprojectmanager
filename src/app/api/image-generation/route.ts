import { NextResponse } from "next/server";
import { generateImageUrl } from "@/lib/pollinationsApi";
import { getSession } from "@/lib/authUtils";
import { saveGeneratedImage } from "@/lib/api/generated-content";

export async function POST(req: Request) {
  try {
    // Get the current user session
    const { session, error } = await getSession();
    
    if (error || !session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { 
      prompt, 
      model = "turbo", 
      width = 1024, 
      height = 1024, 
      project_id = null,
      task_id = null
    } = body;

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: "Prompt is required" },
        { status: 400 }
      );
    }

    console.log("Image generation request:", { prompt, model, width, height, project_id, task_id });

    // Validate model is one of the supported models
    const validModels = ["flux", "turbo"];
    const finalModel = validModels.includes(model) ? model : "turbo";

    // Generate the image URL using our utility function
    const imageUrl = generateImageUrl(prompt, {
      width,
      height,
      model: finalModel,
      nologo: true
    });

    console.log("Generated image URL:", imageUrl);
    
    // Save the generated image to the database
    const saveResult = await saveGeneratedImage({
      user_id: session.user.id,
      prompt,
      image_url: imageUrl,
      project_id: project_id || undefined,
      task_id: task_id || undefined
    });
    
    if (!saveResult.success) {
      console.error("Error saving generated image to database:", saveResult.error);
      // Continue anyway and return the image URL
    }

    return NextResponse.json({
      success: true,
      image: imageUrl,
      saved: saveResult.success,
      image_id: saveResult.success ? saveResult.data.id : null
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