export function urlUserManagement(userId?: string): string {
  if (userId) {
    return `/user-management/${encodeURIComponent(userId)}`
  }
  return "/user-management"
}
