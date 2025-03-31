import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Helper to get authenticated Supabase client
async function getServerSupabaseClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name) {
          const cookieStore = await cookies();
          return cookieStore.get(name)?.value;
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

// POST /api/create-lead - Create a new lead from the widget
export async function POST(req: NextRequest) {
  try {
    const supabase = await getServerSupabaseClient();
    
    // Get lead data from request body
    const { name, email, initial_message, agent_id } = await req.json();
    
    // Validate required fields
    if (!name || !email || !agent_id) {
      return NextResponse.json(
        { error: "Name, email, and agent_id are required" },
        { status: 400 }
      );
    }
    
    // Validate email format (basic validation)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }
    
    // Verify the agent exists
    const { data: agentData, error: agentError } = await supabase
      .from("agents")
      .select("id, owner_id")
      .eq("id", agent_id)
      .single();
    
    if (agentError || !agentData) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }
    
    // Insert the new lead
    const { data, error } = await supabase
      .from("leads")
      .insert({
        name,
        email,
        initial_message: initial_message || "",
        agent_id,
        status: "new", // Initial status
        source: "widget" // Track source as widget
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    // Send notification to the agent owner (this could be implemented via a Supabase webhook or here)
    // This would typically use an email service like SendGrid or Resend
    
    return NextResponse.json({
      success: true,
      lead: data
    });
  } catch (error: any) {
    console.error("Error creating lead:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create lead" },
      { status: 500 }
    );
  }
}

// Enable CORS for this API endpoint since it will be called from external sites
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*", // In production, restrict this to specific domains
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    },
  });
}