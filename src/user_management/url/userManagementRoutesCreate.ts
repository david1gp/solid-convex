import { lazy } from "solid-js"
import type { RouteObject } from "#ui/utils/RouteConfig.ts"

const UserManagementPage = lazy(() =>
  import("#src/user_management/ui/UserManagementPage.tsx").then((module) => ({
    default: module.UserManagementPage,
  })),
)

export function userManagementRoutesCreate(): RouteObject[] {
  return [
    { path: "/user-management", component: UserManagementPage },
    { path: "/user-management/:userId", component: UserManagementPage },
  ]
}
