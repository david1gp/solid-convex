export function pageTitleFormat(title: string): string {
  const suffix = " · Solid Convex"
  return title.endsWith(suffix) ? title : `${title}${suffix}`
}
