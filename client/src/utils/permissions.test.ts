import { describe, expect, it } from "vitest";
import type { User, UserRole } from "../types/models";
import { canCreateProject, isPrivilegedRole } from "./permissions";

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
  it("allows any signed-in user", () => {
    expect(canCreateProject(makeUser("owner"))).toBe(true);
    expect(canCreateProject(makeUser("admin"))).toBe(true);
    expect(canCreateProject(makeUser("member"))).toBe(true);
  });

  it("blocks signed-out visitors", () => {
    expect(canCreateProject(null)).toBe(false);
  });
});
