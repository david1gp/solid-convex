import { describe, expect, test } from "bun:test"
import { demoCatalogDataCreate } from "#src/app/demos/demoCatalogDataCreate.ts"
import { demoList } from "#src/app/demos/demoList.ts"
import { pageDemoHref } from "#src/app/demos/pageDemoHref.ts"
import { pageRouteInventory } from "#src/app/demos/pageRouteInventory.ts"

describe("demo catalog data", () => {
  test("creates category and demo names without exposing component values", () => {
    const component = () => null
    expect(
      demoCatalogDataCreate({
        auth: { DemoSignIn: component },
        ui: { DemoButton: component, DemoModal: component },
      }),
    ).toEqual({
      componentCategories: [
        { category: "auth", demos: ["DemoSignIn"] },
        { category: "ui", demos: ["DemoButton", "DemoModal"] },
      ],
      pageDemos: pageRouteInventory.map((entry) => ({
        title: entry.title,
        route: entry.route,
        href: pageDemoHref(entry.route),
      })),
    })
  })

  test("lists all component examples and page inventory entries in distinct groups", () => {
    const catalog = demoCatalogDataCreate(demoList)
    expect(catalog.componentCategories.flatMap(({ demos }) => demos)).toHaveLength(11)
    expect(catalog.pageDemos).toHaveLength(pageRouteInventory.length)
    expect(catalog.pageDemos[0]).toMatchObject({ route: "/sign-up", href: "/demos/sign-up" })
    expect(catalog.pageDemos.find(({ route }) => route === "/")?.href).toBe("/demos/root")
  })
})
