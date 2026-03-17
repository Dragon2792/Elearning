/**
 * Shared utilities for module operations
 * Reduces code duplication across module components
 */

import { createClient } from "@/lib/supabase/client";

export interface Module {
  id: string;
  week_number: number;
  title: string;
  description: string;
  is_published: boolean;
}

export interface ModuleSection {
  id: string;
  module_id: string;
  title: string;
  content: string;
  code_example: string;
  code_language: string;
  order_number: number;
}

export interface ModuleFile {
  id: string;
  module_id: string;
  title: string;
  description: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
}

/**
 * Fetch all published modules
 */
export async function fetchPublishedModules(): Promise<Module[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("modules")
      .select("*")
      .eq("is_published", true)
      .order("week_number");

    return data || [];
  } catch (error) {
    console.error("Failed to fetch modules:", error);
    return [];
  }
}

/**
 * Fetch module by week number
 */
export async function fetchModuleByWeek(week: number): Promise<Module | null> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("modules")
      .select("*")
      .eq("week_number", week)
      .eq("is_published", true)
      .single();

    return data;
  } catch (error) {
    console.error(`Failed to fetch module for week ${week}:`, error);
    return null;
  }
}

/**
 * Fetch sections for a module
 */
export async function fetchModuleSections(
  moduleId: string,
): Promise<ModuleSection[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("module_sections")
      .select("*")
      .eq("module_id", moduleId)
      .order("order_number");

    return data || [];
  } catch (error) {
    console.error(`Failed to fetch sections for module ${moduleId}:`, error);
    return [];
  }
}

/**
 * Fetch files for a module
 */
export async function fetchModuleFiles(
  moduleId: string,
): Promise<ModuleFile[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("module_files")
      .select("*")
      .eq("module_id", moduleId);

    return data || [];
  } catch (error) {
    console.error(`Failed to fetch files for module ${moduleId}:`, error);
    return [];
  }
}

/**
 * Get public URL for a module file
 */
export function getModuleFilePublicUrl(filePath: string): string {
  const supabase = createClient();
  const { data } = supabase.storage
    .from("modules")
    .getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * Get file icon based on type
 */
export function getFileIcon(type: string): string {
  if (type.includes("pdf")) return "📄";
  if (type.includes("word") || type.includes("document")) return "📝";
  if (type.includes("presentation") || type.includes("powerpoint")) return "📊";
  return "📁";
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

/**
 * Track module access/progress
 */
export async function trackModuleAccess(
  weekNumber: number,
): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data: authResult } = await supabase.auth.getUser();
    const user = authResult.user;

    if (!user) return false;

    await supabase.from("module_progress").upsert(
      {
        user_id: user.id,
        week_number: weekNumber,
        last_accessed: new Date().toISOString(),
      },
      { onConflict: "user_id,week_number" },
    );

    return true;
  } catch (error) {
    console.error("Failed to track module access:", error);
    return false;
  }
}

/**
 * Mark module as completed
 */
export async function markModuleCompleted(
  weekNumber: number,
): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data: authResult } = await supabase.auth.getUser();
    const user = authResult.user;

    if (!user) return false;

    await supabase.from("module_progress").upsert(
      {
        user_id: user.id,
        week_number: weekNumber,
        is_completed: true,
        last_accessed: new Date().toISOString(),
      },
      { onConflict: "user_id,week_number" },
    );

    return true;
  } catch (error) {
    console.error("Failed to mark module as completed:", error);
    return false;
  }
}

/**
 * Get user's next available module to unlock
 */
export async function getNextAvailableModule(): Promise<Module | null> {
  try {
    // Get all modules
    const modules = await fetchPublishedModules();
    if (modules.length === 0) return null;

    const supabase = createClient();
    const { data: authResult } = await supabase.auth.getUser();
    const user = authResult.user;

    if (!user) return modules[0]; // Return first module if not authenticated

    // Get user's progress
    const { data: progress } = await supabase
      .from("module_progress")
      .select("week_number, is_completed")
      .eq("user_id", user.id);

    // Find first incomplete module
    for (const module of modules) {
      const moduleProgress = progress?.find(
        (p) => p.week_number === module.week_number,
      );
      if (!moduleProgress || !moduleProgress.is_completed) {
        return module;
      }
    }

    // All completed, return last module
    return modules[modules.length - 1];
  } catch (error) {
    console.error("Failed to get next available module:", error);
    return null;
  }
}
