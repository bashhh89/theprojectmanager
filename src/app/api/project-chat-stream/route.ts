import { NextRequest, NextResponse } from "next/server";
import { streamChatWithProject } from "@/lib/anythingllm-service";
import { supabase } from "@/lib/supabaseClient";
import { verifyProjectAccess } from "@/lib/projectAuth";

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    const { projectId, message, mode = 'chat' } = body;
    
    if (!projectId) {
      return NextResponse.json(
        { error: "No project ID provided" },
        { status: 400 }
      );
    }
    
    if (!message) {
      return NextResponse.json(
        { error: "No message provided" },
        { status: 400 }
      );
    }
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Verify the user has access to the project
    const accessCheck = await verifyProjectAccess(user.id, projectId);
    if (!accessCheck.success) {
      return NextResponse.json(
        { error: accessCheck.message || "Access denied" },
        { status: 403 }
      );
    }
    
    // Verify project exists
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, anythingllm_workspace_slug')
      .eq('id', projectId)
      .single();
      
    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }
    
    if (!project.anythingllm_workspace_slug) {
      return NextResponse.json(
        { error: "Project does not have an AnythingLLM workspace" },
        { status: 400 }
      );
    }
    
    // Stream chat response from AnythingLLM
    const stream = await streamChatWithProject(projectId, message, { mode });
    
    if (!stream) {
      return NextResponse.json(
        { error: "Stream chat failed or AnythingLLM integration is not enabled" },
        { status: 500 }
      );
    }
    
    // Return the stream response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
    
  } catch (error: any) {
    console.error("Project stream chat error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to stream chat with project" },
      { status: 500 }
    );
  }
} 