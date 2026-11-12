import type { AppSidebarDemoUser } from "#src/app/layout/AppSidebarContent.tsx"

/** Shared fake session for no-auth shell demos; the real app never calls this. */
export function appDemoUserCreate(): AppSidebarDemoUser {
  return { profile: { name: "Test User", email: "test@example.com" } }
}
