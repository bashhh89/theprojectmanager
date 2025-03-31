import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { createWorkspaceForProject } from "@/lib/anythingllm-service";

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const projectData = await req.json();
    
    if (!projectData) {
      return NextResponse.json(
        { error: "No project data provided" },
        { status: 400 }
      );
    }
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Extract relevant data from the JSON
    const projectTitle = projectData.title || "New Project";
    const projectDescription = projectData.description || "";
    const projectType = projectData.type || "business";
    const projectObjectives = projectData.objectives || [];
    const projectTimeline = projectData.timeline || {};
    const projectBranding = projectData.branding || {};
    
    // Create the project in Supabase
    const { data: projectResult, error: projectError } = await supabase
      .from('projects')
      .insert([
        {
          name: projectTitle,
          title: projectTitle,
          description: projectDescription,
          type: projectType,
          status: 'active',
          objectives: projectObjectives,
          timeline: projectTimeline,
          branding: projectBranding,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();
      
    if (projectError) {
      console.error("Error creating project:", projectError);
      return NextResponse.json(
        { error: projectError.message },
        { status: 500 }
      );
    }
    
    // Add the creator as an owner in the project_members table
    const { error: memberError } = await supabase
      .from('project_members')
      .insert([
        {
          project_id: projectResult.id,
          user_id: user.id,
          role: 'owner',
          invite_accepted: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
      
    if (memberError) {
      console.error("Error adding project owner:", memberError);
      // We'll continue even if this fails, as the project was created successfully
    }
    
    // Create AnythingLLM workspace for the project
    try {
      await createWorkspaceForProject(projectResult.id, projectTitle);
    } catch (workspaceError) {
      console.error('Error creating AnythingLLM workspace:', workspaceError);
      // Continue with project creation even if workspace creation fails
    }
    
    // Process milestones if they exist
    if (projectData.milestones && Array.isArray(projectData.milestones)) {
      for (const milestone of projectData.milestones) {
        const { data: milestoneResult, error: milestoneError } = await supabase
          .from('milestones')
          .insert([
            {
              project_id: projectResult.id,
              title: milestone.title,
              description: milestone.description,
              deadline: milestone.deadline,
              status: 'pending',
              user_id: user.id
            }
          ])
          .select()
          .single();
          
        if (milestoneError) {
          console.error('Error creating milestone:', milestoneError);
          continue;
        }
        
        // Process tasks if they exist
        if (milestone.tasks && Array.isArray(milestone.tasks)) {
          for (const task of milestone.tasks) {
            const { data: taskResult, error: taskError } = await supabase
              .from('tasks')
              .insert([
                {
                  project_id: projectResult.id,
                  milestone_id: milestoneResult.id,
                  title: task.title,
                  description: task.description,
                  priority: task.priority || 'medium',
                  status: 'pending',
                  estimated_hours: task.estimatedHours || null,
                  requirements: task.requirements || [],
                  skills: task.skills || [],
                  user_id: user.id
                }
              ])
              .select()
              .single();
              
            if (taskError) {
              console.error('Error creating task:', taskError);
              continue;
            }
            
            // Process subtasks if they exist
            if (task.subtasks && Array.isArray(task.subtasks)) {
              const subtaskInserts = task.subtasks.map((subtask: { 
                title: string; 
                description: string; 
                status?: string;
              }) => ({
                task_id: taskResult.id,
                project_id: projectResult.id,
                title: subtask.title,
                description: subtask.description,
                status: subtask.status || 'pending',
                user_id: user.id
              }));
              
              const { error: subtaskError } = await supabase
                .from('subtasks')
                .insert(subtaskInserts);
                
              if (subtaskError) {
                console.error('Error creating subtasks:', subtaskError);
              }
            }
          }
        }
      }
    }
    
    // Process risks if they exist
    if (projectData.risks && Array.isArray(projectData.risks)) {
      const { error: risksError } = await supabase
        .from('project_risks')
        .insert(
          projectData.risks.map((risk: string, index: number) => ({
            project_id: projectResult.id,
            title: `Risk ${index + 1}`,
            description: risk,
            severity: 'medium',
            status: 'active',
            user_id: user.id
          }))
        );
        
      if (risksError) {
        console.error('Error creating risks:', risksError);
      }
    }
    
    // Process kanban structure if it exists
    if (projectData.visualElements?.kanbanStructure?.columns) {
      const { error: kanbanError } = await supabase
        .from('kanban_columns')
        .insert(
          projectData.visualElements.kanbanStructure.columns.map((column: any, index: number) => ({
            project_id: projectResult.id,
            title: column.title,
            description: column.description,
            order_index: index,
            user_id: user.id
          }))
        );
        
      if (kanbanError) {
        console.error('Error creating kanban columns:', kanbanError);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: "Project created successfully",
      project: projectResult
    });
    
  } catch (error: any) {
    console.error("Project creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create project" },
      { status: 500 }
    );
  }
} 