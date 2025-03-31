import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Get formdata with file
    const formData = await req.formData();
    
    // Get file from form data
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }
    
    console.log(`Mock uploading file: ${file.name}`);
    
    // Create mock response
    return NextResponse.json({
      path: `mock-uploads/${Date.now()}_${file.name}`,
      url: `https://example.com/mock-uploads/${Date.now()}_${file.name}`,
      name: file.name,
      size: file.size,
      type: file.type,
      extractedText: file.type === 'application/pdf' ? 'Mock PDF text content' : ''
    });
    
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
} 