import type { JSX } from "@solidjs/web"
import { Show } from "solid-js"
import { pageDemoHref } from "#src/app/demos/pageDemoHref.ts"
import { resourcePageDemoAddStateCreate } from "#src/resource/ui/demo/resourcePageDemoAddStateCreate.ts"
import { resourcePageDemoEditStateCreate } from "#src/resource/ui/demo/resourcePageDemoEditStateCreate.ts"
import { resourcePageDemoFixturesGet } from "#src/resource/ui/demo/resourcePageDemoFixturesGet.ts"
import { resourcePageDemoRemoveStateCreate } from "#src/resource/ui/demo/resourcePageDemoRemoveStateCreate.ts"
import { resourcePageDemoRendererStateCreate } from "#src/resource/ui/demo/resourcePageDemoRendererStateCreate.ts"
import { ResourceListPage } from "#src/resource/ui/list/ResourceListPage.tsx"
import { ResourceAddPage } from "#src/resource/ui/mutate/ResourceAddPage.tsx"
import { ResourceDeletePage } from "#src/resource/ui/mutate/ResourceDeletePage.tsx"
import { ResourceEditPage } from "#src/resource/ui/mutate/ResourceEditPage.tsx"
import { ResourceViewPage } from "#src/resource/ui/view/ResourceViewPage.tsx"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.tsx"

/** Opt-in map: return undefined for any other family so the guarded placeholder remains. */
export function ResourcePageDemoRenderer(p: { route: string }) {
  const state = resourcePageDemoRendererStateCreate()
  const pages: Record<string, () => JSX.Element> = {
    "/resources": () => <ResourceListDemo />,
    "/resources/add": () => <ResourceAddDemo />,
    "/resources/:resourceId": () => <ResourceViewDemo resourceId={state.resourceId()} />,
    "/resources/:resourceId/edit": () => <ResourceEditDemo resourceId={state.resourceId()} />,
    "/resources/:resourceId/remove": () => <ResourceRemoveDemo resourceId={state.resourceId()} />,
  }
  return pages[p.route]?.()
}

function ResourceEditDemo(p: { resourceId: string }) {
  const state = resourcePageDemoEditStateCreate(p.resourceId)
  return (
    <>
      <LinkButtonInternal to={pageDemoHref("/resources/:resourceId", { resourceId: p.resourceId })}>
        Back to resource
      </LinkButtonInternal>
      <Show
        when={state.resource()}
        fallback={
          <p role="status">
            This resource is no longer available in the local demo.{" "}
            <LinkButtonInternal to={pageDemoHref("/resources")}>View resource list</LinkButtonInternal>
          </p>
        }
      >
        {(resource) => (
          <ResourceEditPage
            demo={{
              resourceId: p.resourceId,
              resource: resource(),
              form: state.form,
              removeHref: pageDemoHref("/resources/:resourceId/remove", { resourceId: p.resourceId }),
            }}
          />
        )}
      </Show>
      <Show when={state.saved()}>
        <p role="status">
          Resource updated locally.{" "}
          <LinkButtonInternal to={pageDemoHref("/resources/:resourceId", { resourceId: p.resourceId })}>
            View updated resource
          </LinkButtonInternal>{" "}
          <LinkButtonInternal to={pageDemoHref("/resources")}>View updated list</LinkButtonInternal>
        </p>
      </Show>
    </>
  )
}

function ResourceRemoveDemo(p: { resourceId: string }) {
  const state = resourcePageDemoRemoveStateCreate(p.resourceId)
  return (
    <>
      <LinkButtonInternal to={pageDemoHref("/resources/:resourceId", { resourceId: p.resourceId })}>
        Back to resource
      </LinkButtonInternal>
      <Show
        when={state.resource()}
        fallback={
          <p role="status">
            This resource is no longer available in the local demo.{" "}
            <LinkButtonInternal to={pageDemoHref("/resources")}>View resource list</LinkButtonInternal>
          </p>
        }
      >
        {(resource) => (
          <ResourceDeletePage demo={{ resourceId: p.resourceId, resource: resource(), form: state.form }} />
        )}
      </Show>
      <Show when={state.removed()}>
        <p role="status">
          Resource removed locally.{" "}
          <LinkButtonInternal to={pageDemoHref("/resources")}>View updated list</LinkButtonInternal>
        </p>
      </Show>
    </>
  )
}

function ResourceListDemo() {
  const fixtures = resourcePageDemoFixturesGet()
  return <ResourceListPage demo={{ resources: fixtures.resources }} />
}

function ResourceAddDemo() {
  const state = resourcePageDemoAddStateCreate()
  return (
    <>
      <LinkButtonInternal to={pageDemoHref("/resources")}>Back to resource demo list</LinkButtonInternal>
      <ResourceAddPage demoState={state.form} />
      {state.createdHref() && (
        <p role="status">
          Resource added locally.{" "}
          <LinkButtonInternal to={state.createdHref()!}>View created resource</LinkButtonInternal>{" "}
          <LinkButtonInternal to={pageDemoHref("/resources")}>View updated list</LinkButtonInternal>
        </p>
      )}
    </>
  )
}

function ResourceViewDemo(p: { resourceId: string }) {
  const fixtures = resourcePageDemoFixturesGet()
  return (
    <>
      <LinkButtonInternal to={pageDemoHref("/resources")}>Back to resource demo list</LinkButtonInternal>
      <ResourceViewPage
        demo={{
          resourceId: p.resourceId,
          resource: () => fixtures.get(p.resourceId),
          editHref: pageDemoHref("/resources/:resourceId/edit", { resourceId: p.resourceId }),
        }}
      />
    </>
  )
}
