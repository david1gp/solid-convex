import { For, Show } from "solid-js"
import { Dynamic } from "solid-js/web"
import { AuthPageDemoRenderer } from "#src/app/demos/AuthPageDemoRenderer.tsx"
import { appPageDemoRendererMap } from "#src/app/demos/appPageDemoRendererMap.tsx"
import { pageDemoBoundaryStateCreate } from "#src/app/demos/pageDemoBoundaryStateCreate.ts"
import { pageDemoHref } from "#src/app/demos/pageDemoHref.ts"
import { pageDemoRouteIsMounted } from "#src/app/demos/pageDemoRouteIsMounted.ts"
import { pageRouteInventory } from "#src/app/demos/pageRouteInventory.ts"
import { AuthRemainingPageDemoRenderer } from "#src/auth/ui/demo/AuthRemainingPageDemoRenderer.tsx"
import { UserProfileMeApiKeysView } from "#src/auth/ui/profile_me/UserProfileMeApiKeysView.tsx"
import { userProfileMeApiKeysDemoStateCreate } from "#src/auth/ui/profile_me/userProfileMeApiKeysDemoStateCreate.ts"
import { orgDemoRendererMap } from "#src/org/org_ui/demo/orgDemoRendererMap.tsx"
import { ResourcePageDemoRenderer } from "#src/resource/ui/demo/ResourcePageDemoRenderer.tsx"
import { ConvexContext } from "#src/utils/convex_client/convexContext.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.tsx"

const orgDemoRoutes = Object.keys(orgDemoRendererMap)
const authDemoRoutes = ["/sign-in", "/sign-in-enter-otp", "/sign-in-error"]
const authRemainingDemoRoutes = [
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
const resourceDemoRoutes = [
  "/resources",
  "/resources/add",
  "/resources/:resourceId",
  "/resources/:resourceId/edit",
  "/resources/:resourceId/remove",
]

/** Only explicitly opted-in views can mount here; all other routes remain guarded.
 * Opted-in views use isolated fixtures and demo-only navigation; all unregistered routes remain guarded.
 */
export function PageDemoBoundary(p: { entry?: (typeof pageRouteInventory)[number] }) {
  const state = pageDemoBoundaryStateCreate(p.entry)
  return (
    <ConvexContext.Provider value={undefined}>
      <main class="mx-auto max-w-4xl p-4">
        <nav class="flex gap-4">
          <LinkButtonInternal to="/demos">All demos</LinkButtonInternal>
        </nav>
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
              <h1 class="my-4 text-2xl font-semibold">{entry().title}</h1>
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
              </Show>
            </>
          )}
        </Show>
      </main>
    </ConvexContext.Provider>
  )
}
