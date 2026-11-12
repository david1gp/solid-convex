import { useParams } from "@tanstack/solid-router"

/** Route params for user-management demo routes. */
export function userManagementPageDemoRendererStateCreate() {
  const params = useParams({ strict: false })
  return {
    userId: () => params().userId as string | undefined,
  }
}
