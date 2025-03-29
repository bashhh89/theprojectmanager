import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Helper to get authenticated Supabase client
async function getServerSupabaseClient() {
  const cookieStore = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name, options) {
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );
}

// GET /api/leads - Get all leads for current user by agent or all agents
export async function GET(req: NextRequest) {
  try {
    const supabase = await getServerSupabaseClient();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Parse query parameters
    const url = new URL(req.url);
    const agentId = url.searchParams.get("agent_id");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;
    
    // Start building the query to get leads for agents owned by the current user
    let query = supabase
      .from("leads")
      .select(`
        *,
        agents (
          id,
          name
        )
      `)
      .eq("agents.owner_id", user.id);
    
    // Add agent filter if specified
    if (agentId) {
      query = query.eq("agent_id", agentId);
    }
    
    // Add pagination and execute query
    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)
      .limit(limit);
    
    if (error) {
      throw new Error(error.message);
    }
    
    return NextResponse.json({
      leads: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: count ? Math.ceil(count / limit) : 0
      }
    });
  } catch (error: any) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

// PUT /api/leads - Update lead status
export async function PUT(req: NextRequest) {
  try {
    const supabase = await getServerSupabaseClient();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get lead data from request body
    const { id, status, notes } = await req.json();
    
    if (!id) {
      return NextResponse.json(
        { error: "Lead ID is required" },
        { status: 400 }
      );
    }
    
    // First check if the lead is associated with an agent owned by the current user
    const { data: leadData, error: fetchError } = await supabase
      .from("leads")
      .select(`
        *,
        agents (
          owner_id
        )
      `)
      .eq("id", id)
      .single();
    
    if (fetchError || !leadData) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }
    
    // @ts-ignore - handle the nested structure from join
    if (leadData.agents.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized to update this lead" },
        { status: 403 }
      );
    }
    
    // Prepare update data
    const updateData: { status?: string; notes?: string } = {};
    
    if (status) {
      updateData.status = status;
    }
    
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    
    // Update the lead
    const { data, error } = await supabase
      .from("leads")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return NextResponse.json({ lead: data });
  } catch (error: any) {
    console.error("Error updating lead:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update lead" },
      { status: 500 }
    );
  }
}

// DELETE /api/leads - Delete a lead
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await getServerSupabaseClient();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get lead ID from query params
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "Lead ID is required" },
        { status: 400 }
      );
    }
    
    // First check if the lead is associated with an agent owned by the current user
    const { data: leadData, error: fetchError } = await supabase
      .from("leads")
      .select(`
        *,
        agents (
          owner_id
        )
      `)
      .eq("id", id)
      .single();
    
    if (fetchError || !leadData) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }
    
    // @ts-ignore - handle the nested structure from join
    if (leadData.agents.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized to delete this lead" },
        { status: 403 }
      );
    }
    
    // Delete the lead
    const { error } = await supabase
      .from("leads")
      .delete()
      .eq("id", id);
    
    if (error) {
      throw new Error(error.message);
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting lead:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete lead" },
      { status: 500 }
    );
  }
}