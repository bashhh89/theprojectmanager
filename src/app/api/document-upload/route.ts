import { NextRequest, NextResponse } from "next/server";
import { uploadDocumentToProject } from "@/lib/anythingllm-service";
import { isDocumentTypeSupported } from "@/lib/anythingllm-config";
import { supabase } from "@/lib/supabaseClient";
import { verifyProjectAccess } from "@/lib/projectAuth";

export async function POST(req: NextRequest) {
  try {
    // Get formdata with file and project ID
    const formData = await req.formData();
    
    // Get file from form data
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }
    
    if (!projectId) {
      return NextResponse.json(
        { error: "No project ID provided" },
        { status: 400 }
      );
    }
    
    // Check if file type is supported
    if (!isDocumentTypeSupported(file.name)) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF, DOCX, DOC, TXT, MD, or CSV files." },
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
    
    // Verify project exists and get metadata
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, anythingllm_workspace_slug')
      .eq('id', projectId)
      .single();
      
    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }
    
    // Upload document to AnythingLLM
    const result = await uploadDocumentToProject(projectId, file);
    
    if (!result) {
      return NextResponse.json(
        { error: "Document upload failed or AnythingLLM integration is not enabled" },
        { status: 500 }
      );
    }
    
    // Store document metadata in the database
    const { data: documentData, error: documentError } = await supabase
      .from('project_documents')
      .insert([
        {
          project_id: projectId,
          name: file.name,
          size: file.size,
          type: file.type,
          anythingllm_doc_id: result.documentId,
          user_id: user.id
        }
      ])
      .select()
      .single();
      
    if (documentError) {
      console.error("Error storing document metadata:", documentError);
      // Continue even if metadata storage fails
    }
    
    return NextResponse.json({
      success: true,
      message: "Document uploaded successfully",
      document: result,
      metadata: documentData
    });
    
  } catch (error: any) {
    console.error("Document upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload document" },
      { status: 500 }
    );
  }
} 