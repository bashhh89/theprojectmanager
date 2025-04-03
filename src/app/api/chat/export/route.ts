import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Message } from '@/store/chatStore';
import { logger } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { chatId, format = 'json', includeMetadata = true } = await request.json();
    
    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }
    
    // Retrieve chat from storage or database
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', chatId)
      .eq('user_id', user.id)
      .single();
      
    if (error || !data) {
      logger.error('Error fetching chat for export', error, { context: 'chat-export', data: { chatId } });
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }
    
    // Format data based on requested format
    let exportData;
    
    switch (format.toLowerCase()) {
      case 'json':
        exportData = formatAsJSON(data, includeMetadata);
        break;
      case 'markdown':
      case 'md':
        exportData = formatAsMarkdown(data, includeMetadata);
        break;
      case 'text':
      case 'txt':
        exportData = formatAsText(data, includeMetadata);
        break;
      case 'html':
        exportData = formatAsHTML(data, includeMetadata);
        break;
      case 'csv':
        exportData = formatAsCSV(data, includeMetadata);
        break;
      default:
        return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
    }
    
    // Record the export activity
    await supabase.from('chat_exports').insert({
      chat_id: chatId,
      user_id: user.id,
      format: format.toLowerCase(),
      export_date: new Date().toISOString()
    });
    
    // Return the formatted data
    return NextResponse.json({
      success: true,
      format: format.toLowerCase(),
      data: exportData,
      filename: `chat-${chatId}-${new Date().toISOString().split('T')[0]}.${format.toLowerCase().replace('markdown', 'md')}`
    });
    
  } catch (error) {
    logger.error('Error in chat export API', error, { context: 'chat-export' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function formatAsJSON(data: any, includeMetadata: boolean): string {
  // Return either just the messages or the entire chat object
  const exportData = includeMetadata ? data : { messages: data.messages };
  return JSON.stringify(exportData, null, 2);
}

function formatAsMarkdown(data: any, includeMetadata: boolean): string {
  const { name, messages, created_at } = data;
  let output = '';
  
  if (includeMetadata) {
    output += `# ${name || 'Chat Export'}\n\n`;
    output += `- Created: ${new Date(created_at).toLocaleString()}\n`;
    output += `- Messages: ${messages.length}\n\n`;
    output += `---\n\n`;
  }
  
  messages.forEach((message: Message) => {
    const role = message.role === 'user' ? '**You**' : '**QanDuAI**';
    output += `### ${role}\n\n`;
    
    message.content.forEach((item) => {
      if (item.type === 'text') {
        output += `${item.content}\n\n`;
      } else if (item.type === 'image' && item.content !== 'placeholder') {
        output += `![Image](${item.content})\n\n`;
      }
    });
  });
  
  return output;
}

function formatAsText(data: any, includeMetadata: boolean): string {
  const { name, messages, created_at } = data;
  let output = '';
  
  if (includeMetadata) {
    output += `${name || 'Chat Export'}\n\n`;
    output += `Created: ${new Date(created_at).toLocaleString()}\n`;
    output += `Messages: ${messages.length}\n\n`;
    output += `----------\n\n`;
  }
  
  messages.forEach((message: Message) => {
    const role = message.role === 'user' ? 'You' : 'QanDuAI';
    output += `${role}:\n`;
    
    message.content.forEach((item) => {
      if (item.type === 'text') {
        output += `${item.content}\n`;
      } else if (item.type === 'image') {
        output += `[Image: ${item.content}]\n`;
      }
    });
    
    output += '\n';
  });
  
  return output;
}

function formatAsHTML(data: any, includeMetadata: boolean): string {
  const { name, messages, created_at } = data;
  let output = '<!DOCTYPE html>\n<html>\n<head>\n';
  output += '  <meta charset="UTF-8">\n';
  output += `  <title>${name || 'Chat Export'}</title>\n`;
  output += '  <style>\n';
  output += '    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }\n';
  output += '    .metadata { color: #666; margin-bottom: 20px; }\n';
  output += '    .message { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #eee; }\n';
  output += '    .user { background-color: #f5f5f5; padding: 10px; border-radius: 5px; }\n';
  output += '    .assistant { background-color: #e6f7ff; padding: 10px; border-radius: 5px; }\n';
  output += '    .role { font-weight: bold; margin-bottom: 5px; }\n';
  output += '    img { max-width: 100%; height: auto; margin-top: 10px; border-radius: 5px; }\n';
  output += '  </style>\n';
  output += '</head>\n<body>\n';
  
  if (includeMetadata) {
    output += `  <h1>${name || 'Chat Export'}</h1>\n`;
    output += '  <div class="metadata">\n';
    output += `    <p>Created: ${new Date(created_at).toLocaleString()}</p>\n`;
    output += `    <p>Messages: ${messages.length}</p>\n`;
    output += '  </div>\n';
  }
  
  messages.forEach((message: Message) => {
    const role = message.role === 'user' ? 'You' : 'QanDuAI';
    const className = message.role === 'user' ? 'user' : 'assistant';
    
    output += `  <div class="message ${className}">\n`;
    output += `    <div class="role">${role}</div>\n`;
    
    message.content.forEach((item) => {
      if (item.type === 'text') {
        output += `    <p>${item.content.replace(/\n/g, '<br>')}</p>\n`;
      } else if (item.type === 'image' && item.content !== 'placeholder') {
        output += `    <img src="${item.content}" alt="Generated image">\n`;
      }
    });
    
    output += '  </div>\n';
  });
  
  output += '</body>\n</html>';
  return output;
}

function formatAsCSV(data: any, includeMetadata: boolean): string {
  let output = 'Role,Type,Content\n';
  
  data.messages.forEach((message: Message) => {
    message.content.forEach((item) => {
      const role = message.role === 'user' ? 'You' : 'QanDuAI';
      // Escape double quotes and wrap content in quotes to handle commas and line breaks
      const content = item.content ? `"${item.content.replace(/"/g, '""')}"` : '';
      output += `${role},${item.type},${content}\n`;
    });
  });
  
  return output;
} 