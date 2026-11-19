import { For, Show } from "solid-js"
import { Dynamic } from "@solidjs/web"
import { AuthPageDemoRenderer } from "#src/app/demos/AuthPageDemoRenderer.tsx"
import { appPageDemoRendererMap } from "#src/app/demos/appPageDemoRendererMap.tsx"
import { pageDemoBoundaryStateCreate } from "#src/app/demos/pageDemoBoundaryStateCreate.ts"
import { pageDemoHref } from "#src/app/demos/pageDemoHref.ts"
import { pageDemoRouteIsMounted } from "#src/app/demos/pageDemoRouteIsMounted.ts"
import { pageRouteInventory } from "#src/app/demos/pageRouteInventory.ts"
import { AuthRemainingPageDemoRenderer } from "#src/auth/ui/demo/AuthRemainingPageDemoRenderer.tsx"
import { UserProfileMeApiKeysView } from "#src/auth/ui/profile_me/UserProfileMeApiKeysView.tsx"
import { userProfileMeApiKeysDemoStateCreate } from "#src/auth/ui/profile_me/userProfileMeApiKeysDemoStateCreate.ts"
import { notePageDemoRendererMap } from "#src/note/ui/demo/NotePageDemoRenderer.tsx"
import { orgDemoRendererMap } from "#src/org/org_ui/demo/orgDemoRendererMap.tsx"
import { projectPageDemoRendererMap } from "#src/project/ui/demo/ProjectPageDemoRenderer.tsx"
import { ResourcePageDemoRenderer } from "#src/resource/ui/demo/ResourcePageDemoRenderer.tsx"
import { teamPageDemoRendererMap } from "#src/team/ui/demo/TeamPageDemoRenderer.tsx"
import { userManagementPageDemoRendererMap } from "#src/user_management/ui/demo/UserManagementPageDemoRenderer.tsx"
import { ConvexContext } from "#src/utils/convex_client/convexContext.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.tsx"

export const orgDemoRoutes = Object.keys(orgDemoRendererMap)
export const teamDemoRoutes = Object.keys(teamPageDemoRendererMap)
export const projectDemoRoutes = Object.keys(projectPageDemoRendererMap)
export const noteDemoRoutes = Object.keys(notePageDemoRendererMap)
export const userManagementDemoRoutes = Object.keys(userManagementPageDemoRendererMap)
export const authDemoRoutes = ["/sign-in", "/sign-in-enter-otp", "/sign-in-error"]
export const authRemainingDemoRoutes = [
  "/sign-up",
  "/sign-up-confirm-email",
  "/sso",
  "/profile",
  "/profile/edit",
  "/profile/change-password",
  "/profile/change-email",
  "/profile/update-image",
  "/profile/delete",
  "/u/:username",
]
export const resourceDemoRoutes = [
  "/resources",
  "/resources/add",
  "/resources/:resourceId",
  "/resources/:resourceId/edit",
  "/resources/:resourceId/remove",
]

/** Transport-only page demo: the same Convex isolation + fixture renderers as the
 * gallery boundary, without the gallery chrome (All demos link, centering, title).
 * Gallery and shell-wrapped routes share this so fixtures exist exactly once. */
export function PageDemoContent(p: { entry?: (typeof pageRouteInventory)[number] }) {
  const state = pageDemoBoundaryStateCreate(p.entry)
  return (
    <ConvexContext value={undefined}>
      <Show
        when={p.entry}
        fallback={
          <>
            <h1 class="my-4 text-2xl font-semibold">Page demo not found</h1>
          </>
        }
      >
        {(entry) => (
          <>
            <Show
              when={pageDemoRouteIsMounted(entry().route)}
              fallback={
                <>
                  <p>Page view not mounted yet. Fixture transport isolation is required before enabling this demo.</p>
                  <p>
                    Production route: <code>{entry().route}</code>
                  </p>
                  <For each={state.paramEntries()}>
                    {([key, value]) => (
                      <p>
                        {key}: <code>{value}</code>
                      </p>
                    )}
                  </For>
                </>
              }
            >
              <Show when={entry().route === "/profile/api-keys"}>
                <UserProfileMeApiKeysView
                  demo
                  stateFactory={userProfileMeApiKeysDemoStateCreate}
                  profileHref={pageDemoHref("/profile")}
                  apiKeysHref={pageDemoHref("/profile/api-keys")}
                />
              </Show>
              <Show when={entry().route in appPageDemoRendererMap}>
                <Dynamic component={appPageDemoRendererMap[entry().route as keyof typeof appPageDemoRendererMap]} />
              </Show>
              <Show when={authDemoRoutes.includes(entry().route)}>
                <AuthPageDemoRenderer route={entry().route} />
              </Show>
              <Show when={authRemainingDemoRoutes.includes(entry().route)}>
                <AuthRemainingPageDemoRenderer route={entry().route} />
              </Show>
              <Show when={orgDemoRoutes.includes(entry().route)}>
                <Dynamic component={orgDemoRendererMap[entry().route as keyof typeof orgDemoRendererMap]} />
              </Show>
              <Show when={resourceDemoRoutes.includes(entry().route)}>
                <ResourcePageDemoRenderer route={entry().route} />
              </Show>
              <Show when={entry().route in teamPageDemoRendererMap}>
                <Dynamic component={teamPageDemoRendererMap[entry().route as keyof typeof teamPageDemoRendererMap]} />
              </Show>
              <Show when={entry().route in projectPageDemoRendererMap}>
                <Dynamic
                  component={projectPageDemoRendererMap[entry().route as keyof typeof projectPageDemoRendererMap]}
                />
              </Show>
              <Show when={entry().route in notePageDemoRendererMap}>
                <Dynamic component={notePageDemoRendererMap[entry().route as keyof typeof notePageDemoRendererMap]} />
              </Show>
              <Show when={entry().route in userManagementPageDemoRendererMap}>
                <Dynamic
                  component={
                    userManagementPageDemoRendererMap[entry().route as keyof typeof userManagementPageDemoRendererMap]
                  }
                />
              </Show>
            </Show>
          </>
        )}
      </Show>
    </ConvexContext>
  )
}
