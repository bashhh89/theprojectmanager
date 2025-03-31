import { supabase } from './supabaseClient';

/**
 * Check if a user is a member of a project with a specific role
 * @param userId User ID to check
 * @param projectId Project ID to check
 * @param roles Array of roles to check (e.g., ['owner', 'editor'])
 * @returns Boolean indicating if the user has one of the specified roles
 */
export async function isProjectMember(
  userId: string, 
  projectId: string,
  roles: ('owner' | 'editor')[] = ['owner', 'editor']
): Promise<boolean> {
  if (!userId || !projectId) {
    return false;
  }

  const { data, error } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .eq('invite_accepted', true)
    .in('role', roles);

  if (error || !data || data.length === 0) {
    return false;
  }

  return true;
}

/**
 * Check if a user is an owner of a project
 * @param userId User ID to check
 * @param projectId Project ID to check
 * @returns Boolean indicating if the user is an owner
 */
export async function isProjectOwner(userId: string, projectId: string): Promise<boolean> {
  return isProjectMember(userId, projectId, ['owner']);
}

/**
 * Check if a user is an editor of a project
 * @param userId User ID to check
 * @param projectId Project ID to check
 * @returns Boolean indicating if the user is an editor
 */
export async function isProjectEditor(userId: string, projectId: string): Promise<boolean> {
  return isProjectMember(userId, projectId, ['editor']);
}

/**
 * Get all projects a user is a member of (either as owner or editor)
 * @param userId User ID to check
 * @returns Array of project IDs the user is a member of
 */
export async function getUserProjects(userId: string): Promise<string[]> {
  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('user_id', userId)
    .eq('invite_accepted', true);

  if (error || !data) {
    return [];
  }

  return data.map(item => item.project_id);
}

/**
 * Middleware-style function to verify project access
 * @param userId User ID to check
 * @param projectId Project ID to verify access to
 * @param requiredRoles Array of acceptable roles (if empty, any role is acceptable)
 * @returns Object with success flag and error message if applicable
 */
export async function verifyProjectAccess(
  userId: string,
  projectId: string,
  requiredRoles: ('owner' | 'editor')[] = []
): Promise<{ success: boolean; message?: string }> {
  if (!userId) {
    return { success: false, message: 'Authentication required' };
  }

  if (!projectId) {
    return { success: false, message: 'Project ID is required' };
  }

  // First check if the project exists
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    return { success: false, message: 'Project not found' };
  }

  // If no specific roles are required, check if user is a member with any role
  if (requiredRoles.length === 0) {
    const isMember = await isProjectMember(userId, projectId);
    if (!isMember) {
      return { success: false, message: 'You do not have access to this project' };
    }
    return { success: true };
  }

  // Check if user has one of the required roles
  const { data: membership, error: membershipError } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .eq('invite_accepted', true)
    .in('role', requiredRoles)
    .single();

  if (membershipError || !membership) {
    const roleText = requiredRoles.length === 1 
      ? `a ${requiredRoles[0]}` 
      : `one of these roles: ${requiredRoles.join(', ')}`;
    return { 
      success: false, 
      message: `You must be ${roleText} to perform this action`
    };
  }

  return { success: true };
} 