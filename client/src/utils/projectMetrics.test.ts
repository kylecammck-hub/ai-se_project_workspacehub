import { describe, expect, it } from "vitest";
import type { Project, Task } from "../types/models";
import { buildProjectWithTaskCount } from "./projectMetrics";

const project: Project = {
  _id: "project-1",
  organizationId: "org-1",
  name: "Launch",
  description: "Launch plan",
  createdBy: "user-1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const makeTask = (id: string, projectId: string): Task => ({
  _id: id,
  organizationId: "org-1",
  projectId,
  title: `Task ${id}`,
  description: "",
  status: "todo",
  priority: "medium",
  assignedTo: null,
  dueDate: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

describe("buildProjectWithTaskCount", () => {
  it("counts only tasks that belong to the project", () => {
    const tasks = [
      makeTask("a", "project-1"),
      makeTask("b", "project-1"),
      makeTask("c", "project-2"),
    ];

    expect(buildProjectWithTaskCount(project, tasks).taskCount).toBe(2);
  });

  it("returns 0 when the project has no tasks", () => {
    expect(buildProjectWithTaskCount(project, []).taskCount).toBe(0);
  });

  it("keeps the original project fields without mutating the input", () => {
    const result = buildProjectWithTaskCount(project, []);

    expect(result).toMatchObject(project);
    expect(project).not.toHaveProperty("taskCount");
  });
});
