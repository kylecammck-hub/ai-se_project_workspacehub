import { describe, expect, it } from "vitest";
import type { Comment, User, UserRole } from "../types/models";
import {
  canCreateProject,
  canManageComment,
  isPrivilegedRole,
} from "./permissions";

const makeUser = (role: UserRole): User => ({
  _id: "user-1",
  firstName: "Test",
  lastName: "User",
  email: "test@workspacehub.dev",
  organizationId: "org-1",
  role,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

describe("isPrivilegedRole", () => {
  it("returns true for owners and admins", () => {
    expect(isPrivilegedRole("owner")).toBe(true);
    expect(isPrivilegedRole("admin")).toBe(true);
  });

  it("returns false for members", () => {
    expect(isPrivilegedRole("member")).toBe(false);
  });

  it("returns false when there is no role", () => {
    expect(isPrivilegedRole(undefined)).toBe(false);
    expect(isPrivilegedRole(null)).toBe(false);
  });
});

describe("canCreateProject", () => {
  it("allows owners and admins", () => {
    expect(canCreateProject(makeUser("owner"))).toBe(true);
    expect(canCreateProject(makeUser("admin"))).toBe(true);
  });

  it("blocks members", () => {
    expect(canCreateProject(makeUser("member"))).toBe(false);
  });

  it("blocks signed-out visitors", () => {
    expect(canCreateProject(null)).toBe(false);
  });
});

describe("canManageComment", () => {
  const makeComment = (authorId: string): Comment => ({
    _id: "comment-1",
    organizationId: "org-1",
    taskId: "task-1",
    authorId,
    content: "Hello",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  });

  it("lets owners and admins manage any comment", () => {
    expect(canManageComment(makeUser("owner"), makeComment("other"))).toBe(
      true,
    );
    expect(canManageComment(makeUser("admin"), makeComment("other"))).toBe(
      true,
    );
  });

  it("lets members manage only their own comments", () => {
    expect(canManageComment(makeUser("member"), makeComment("user-1"))).toBe(
      true,
    );
    expect(canManageComment(makeUser("member"), makeComment("other"))).toBe(
      false,
    );
  });

  it("blocks signed-out visitors", () => {
    expect(canManageComment(null, makeComment("user-1"))).toBe(false);
  });
});
