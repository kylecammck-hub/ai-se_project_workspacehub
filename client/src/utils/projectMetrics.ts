import type { Project, Task } from "../types/models";

export type ProjectWithTaskCount = Project & { taskCount: number };

export const buildProjectWithTaskCount = (
  project: Project,
  tasks: Task[],
): ProjectWithTaskCount => ({
  ...project,
  taskCount: tasks.filter((task) => task.projectId === project._id).length,
});
