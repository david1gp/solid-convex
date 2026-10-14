/* @refresh reload */

import { RouterProvider } from "@tanstack/solid-router"
import { render } from "solid-js/web"
import { demoRoutesCreate } from "#src/app/demos/demoRoutesCreate.tsx"
import { getRoutesApp } from "#src/app/getRoutesApp.tsx"
import { LayoutWrapperApp } from "#src/app/layout/LayoutWrapperApp.tsx"
import { posthogInit } from "#src/app/posthog/posthogInit.ts"
import { buildRouter } from "#src/app/router/buildRouter.tsx"
import { getRoutesAuth } from "#src/auth/ui/getRoutesAuth.tsx"
import { getRoutesOrgInvitation } from "#src/org/invitation_url/getRoutesOrgInvitation.ts"
import { getRoutesOrgMember } from "#src/org/member_url/getRoutesOrgMember.ts"
import { getRoutesOrg } from "#src/org/org_url/getRoutesOrg.ts"
import { getRoutesResource } from "#src/resource/url/getRoutesResource.ts"
import { projectRoutesCreate } from "#src/project/url/projectRoutesCreate.ts"
import { teamRoutesCreate } from "#src/team/url/teamRoutesCreate.ts"
import { noteRoutesCreate } from "#src/note/url/noteRoutesCreate.ts"
import { userManagementRoutesCreate } from "#src/user_management/url/userManagementRoutesCreate.ts"
import { LayoutWrapperDemo } from "#ui/static/layout/LayoutWrapperDemo.tsx"
import "./tailwind.css"

posthogInit()

const routesApp = [
  {
    component: LayoutWrapperApp,
    children: [
      ...getRoutesApp(),
      ...getRoutesOrg(),
      ...getRoutesOrgMember(),
      ...getRoutesOrgInvitation(),
      ...getRoutesResource(),
      ...teamRoutesCreate(),
      ...projectRoutesCreate(),
      ...noteRoutesCreate(),
      ...userManagementRoutesCreate(),
    ],
  },
]

const routesDemo = [
  {
    component: LayoutWrapperDemo,
    children: [...demoRoutesCreate()],
  },
]

const allRoutes = [...getRoutesAuth(), ...routesApp, ...routesDemo]

const router = buildRouter(allRoutes)

declare module "@tanstack/solid-router" {
  interface Register {
    router: typeof router
  }
}

const root = document.getElementById("root")
render(() => <RouterProvider router={router} />, root!)
