// TODO: Task 4.1 - Implement project CRUD operations
// TODO: Task 4.2 - Create project listing and dashboard interface

/*
TODO: Implementation Notes for Interns:

Custom hook for project data management:
- Fetch projects list
- Create new project
- Update project
- Delete project
- Search/filter projects
- Pagination

Features:
- React Query/SWR for caching
- Optimistic updates
- Error handling
- Loading states
- Infinite scrolling (optional)

Example structure:
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useProjects() {
  const queryClient = useQueryClient()
  
  const {
    data: projects,
    isLoading,
    error
  } = useQuery({
    queryKey: ['projects'],
    queryFn: () => queries.projects.getAll()
  })
  
  const createProject = useMutation({
    mutationFn: queries.projects.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    }
  })
  
  return {
    projects,
    isLoading,
    error,
    createProject: createProject.mutate,
    isCreating: createProject.isPending
  }
}

Dependencies to install:
- @tanstack/react-query (recommended)
- OR swr (alternative)
*/

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createProjectAction } from "@/actions/projects";

// 1. Fetching (Read)
export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      return response.json();
    },
  });
}

// 2. Mutations (Write)
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description: string; dueDate: string | null; memberIds: string[] }) => {
      // Call your Server Action!
      const result = await createProjectAction(data.name, data.description, data.dueDate, data.memberIds);
      if (!result.success) throw new Error(result.error);
      return result.project;
    },
    onSuccess: () => {
      // MAGICAL STEP: This tells React Query to instantly re-fetch the 'projects' API
      // so your new project appears on the screen without reloading the page!
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
