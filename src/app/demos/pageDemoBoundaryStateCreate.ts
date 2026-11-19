import { useParams } from "@tanstack/solid-router"
import { pageRouteInventory } from "#src/app/demos/pageRouteInventory.ts"

export function pageDemoBoundaryStateCreate(entry: () => (typeof pageRouteInventory)[number] | undefined) {
  const routeParams = useParams({ strict: false })
  return {
    paramEntries: () =>
      Object.keys(entry()?.params ?? {}).map((key) => [key, (routeParams() as Record<string, string>)[key]] as const),
  }
}
