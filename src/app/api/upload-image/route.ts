import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Validate file type
    const allowedFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
    if (!allowedFileTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }
    
    // Get file extension
    const fileExtension = file.name.split('.').pop() || '';
    
    // Create unique filename
    const fileName = `${uuidv4()}.${fileExtension}`;
    const publicPath = join(process.cwd(), 'public', 'uploads');
    
    // Read file contents
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // Save to public directory
    await writeFile(join(publicPath, fileName), fileBuffer);
    
    // Return the URL for the uploaded image
    const imageUrl = `/uploads/${fileName}`;
    
    return NextResponse.json({ url: imageUrl }, { status: 200 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
} 