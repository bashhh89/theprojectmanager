import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Mock agents data for users who are not authenticated
const MOCK_AGENTS = [
  {
    id: "mock-agent-1",
    name: "Customer Support Agent",
    system_prompt: "You are a helpful customer support agent for a software company. Your task is to assist users with technical problems, guide them through troubleshooting steps, and escalate issues when needed.",
    created_at: new Date().toISOString(),
    owner_id: "mock-user-id",
    knowledge_source_info: {
      text: "Sample knowledge base content for support agent",
    }
  },
  {
    id: "mock-agent-2",
    name: "Sales Assistant",
    system_prompt: "You are a sales assistant for a SaaS platform. Your role is to understand potential customers' needs, explain product features, handle objections, and collect prospect information for the sales team.",
    created_at: new Date().toISOString(),
    owner_id: "mock-user-id",
    knowledge_source_info: {
      website: "https://example.com/products"
    }
  },
  {
    id: "mock-agent-3",
    name: "Lead Qualification Bot",
    system_prompt: "You are a lead qualification bot. Your job is to ask relevant questions, determine if visitors are qualified leads, and collect important information before connecting them with sales representatives.",
    created_at: new Date().toISOString(),
    owner_id: "mock-user-id",
    knowledge_source_info: {
      files: ["product-info.pdf"]
    }
  }
];

// Helper to get authenticated Supabase client
async function getServerSupabaseClient() {
  return createServerClient(
    'https://fdbnkgicweyfixbhfcgx.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkYm5rZ2ljd2V5Zml4YmhmY2d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxMjYyMjQsImV4cCI6MjA1ODcwMjIyNH0.lPLD1le6i0Y64x_uXyMndUqMKQ2XEyIUn0sEvfL5KNk',
    {
      cookies: {
        async get(name) {
          const cookieStore = await cookies();
          const cookie = await cookieStore.get(name);
          return cookie?.value;
        },
        async set(name, value, options) {
          const cookieStore = await cookies();
          cookieStore.set({ name, value, ...options });
        },
        async remove(name, options) {
          const cookieStore = await cookies();
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );
}

// GET /api/agents - Get all agents for current user
export async function GET(req: NextRequest) {
  try {
    const supabase = await getServerSupabaseClient();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log("User not authenticated, returning mock agents data");
      return NextResponse.json({ agents: MOCK_AGENTS });
    }
    
    // Get agents belonging to current user
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return NextResponse.json({ agents: data });
  } catch (error: any) {
    console.error("Error fetching agents:", error);
    // Return mock data on error
    return NextResponse.json({ agents: MOCK_AGENTS });
  }
}

// POST /api/agents - Create a new agent
export async function POST(req: NextRequest) {
  try {
    const supabase = await getServerSupabaseClient();
    
    // Get agent data from request body
    const agentData = await req.json();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log("User not authenticated, returning mock success response");
      // Return a mock success response with a fake ID
      const mockAgent = {
        ...agentData,
        id: `mock-agent-${Date.now()}`,
        created_at: new Date().toISOString(),
        owner_id: "mock-user-id"
      };
      
      return NextResponse.json({ agent: mockAgent });
    }
    
    // Validate required fields
    const { 
      name, 
      system_prompt, 
      knowledge_source_info, 
      model_selection, 
      voice_selection, 
      intelligence_tools 
    } = agentData;
    
    if (!name || !system_prompt) {
      return NextResponse.json(
        { error: "Name and system prompt are required" },
        { status: 400 }
      );
    }
    
    // Insert new agent
    const { data, error } = await supabase
      .from("agents")
      .insert({
        name,
        system_prompt,
        owner_id: user.id,
        knowledge_source_info: knowledge_source_info || null,
        model_selection: model_selection || null,
        voice_selection: voice_selection || null,
        intelligence_tools: intelligence_tools || null
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return NextResponse.json({ agent: data });
  } catch (error: any) {
    console.error("Error creating agent:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create agent" },
      { status: 500 }
    );
  }
}

// PUT /api/agents - Update an agent
export async function PUT(req: NextRequest) {
  try {
    const supabase = await getServerSupabaseClient();
    
    // Get agent data from request body
    const agentData = await req.json();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log("User not authenticated, returning mock success response for update");
      // Return a mock success response
      return NextResponse.json({ 
        agent: {
          ...agentData,
          updated_at: new Date().toISOString()
        } 
      });
    }
    
    // Validate required fields
    const { 
      id, 
      name, 
      system_prompt, 
      knowledge_source_info, 
      model_selection, 
      voice_selection, 
      intelligence_tools 
    } = agentData;
    
    if (!id) {
      return NextResponse.json(
        { error: "Agent ID is required" },
        { status: 400 }
      );
    }
    
    // First check if the agent belongs to the current user
    const { data: agentData2, error: fetchError } = await supabase
      .from("agents")
      .select("owner_id")
      .eq("id", id)
      .single();
    
    if (fetchError) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }
    
    if (agentData2.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized to update this agent" },
        { status: 403 }
      );
    }
    
    // Prepare update data
    const updateData: any = {};
    
    if (name !== undefined) {
      updateData.name = name;
    }
    
    if (system_prompt !== undefined) {
      updateData.system_prompt = system_prompt;
    }
    
    if (knowledge_source_info !== undefined) {
      updateData.knowledge_source_info = knowledge_source_info;
    }
    
    if (model_selection !== undefined) {
      updateData.model_selection = model_selection;
    }
    
    if (voice_selection !== undefined) {
      updateData.voice_selection = voice_selection;
    }
    
    if (intelligence_tools !== undefined) {
      updateData.intelligence_tools = intelligence_tools;
    }
    
    // Update the agent
    const { data, error } = await supabase
      .from("agents")
      .update(updateData)
      .eq("id", id)
      .eq("owner_id", user.id)
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return NextResponse.json({ agent: data });
  } catch (error: any) {
    console.error("Error updating agent:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update agent" },
      { status: 500 }
    );
  }
}

// DELETE /api/agents - Delete an agent
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await getServerSupabaseClient();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get agent ID from query params
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "Agent ID is required" },
        { status: 400 }
      );
    }
    
    if (!user) {
      console.log("User not authenticated, returning mock success response for delete");
      // Return a mock success response
      return NextResponse.json({ success: true });
    }
    
    // First check if the agent belongs to the current user
    const { data: agentData, error: fetchError } = await supabase
      .from("agents")
      .select("owner_id")
      .eq("id", id)
      .single();
    
    if (fetchError) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }
    
    if (agentData.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized to delete this agent" },
        { status: 403 }
      );
    }
    
    // Delete the agent
    const { error } = await supabase
      .from("agents")
      .delete()
      .eq("id", id)
      .eq("owner_id", user.id);
    
    if (error) {
      throw new Error(error.message);
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting agent:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete agent" },
      { status: 500 }
    );
  }
}