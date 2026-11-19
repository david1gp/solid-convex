import { Show, splitProps } from "solid-js"
import { NavCrumbs } from "#src/app/nav/NavCrumbs.tsx"
import type { DemoNavDataProps } from "#ui/demo_pages/DemoNavDataProps.ts"
import { LinkBlock } from "#ui/demo_pages/LinkBlock.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { CorvuPopover } from "#ui/interactive/popover/CorvuPopover.jsx"
import { objectEntries } from "#utils/obj/objectEntries.js"
import { objectKeys } from "#utils/obj/objectKeys.js"
import { type ComponentProps } from "@solidjs/web";

export interface DemoNavProps extends DemoNavDataProps, ComponentProps<"nav"> {}

export function NavDemo(p: DemoNavProps) {
  const [s] = splitProps(p, ["children", "category", "compName", "demoList", "demoPrefix", "class"])
  return (
    <NavCrumbs class={p.class}>
      <ChildrenLeft {...s} />
    </NavCrumbs>
  )
}

function ChildrenLeft(p: DemoNavDataProps) {
  return (
    <>
      <Show when={p.category}>
        <ChildrenLeftCategory {...p} />
      </Show>
      <Show when={p.category && p.compName}>
        <ChildrenLeftComp {...p} />
      </Show>
      <NavSeparatingSlash />
      <LinkButtonInternal variant={buttonVariant.link} to="/demos" class="font-medium">
        All demos
      </LinkButtonInternal>
    </>
  )
}

function ChildrenLeftCategory(s: DemoNavDataProps) {
  return (
    <>
      <NavSeparatingSlash />
      <LinkButtonInternal variant={buttonVariant.link} to={`${s.demoPrefix}/${s.category}/`} class="font-medium">
        {s.category}
      </LinkButtonInternal>
    </>
  )
}

function ChildrenLeftComp(s: DemoNavDataProps) {
  return (
    <>
      <NavSeparatingSlash />
      <ComponentPopover demoList={s.demoList} category={s.category} compName={s.compName} demoPrefix={s.demoPrefix} />
    </>
  )
}

function ComponentPopover(
  s: Pick<DemoNavProps, "class" | "children" | "category" | "compName" | "demoList" | "demoPrefix">,
) {
  if (!s.category || !s.compName) return null
  const links = objectEntries(s.demoList)
    .filter(([category]) => category === s.category)
    .flatMap(([category, tree]) => objectKeys(tree).map((compName) => `${s.demoPrefix}/${category}/${compName}`))
  if (!links || links.length <= 0) return null
  return (
    <CorvuPopover variant={buttonVariant.ghost} buttonChildren={s.compName} class="font-medium">
      <LinkBlock header={s.category} removeUrlPrefix={`${s.demoPrefix}/${s.category}/`} links={links} />
    </CorvuPopover>
  )
}

function NavSeparatingSlash() {
  return <span class="select-none text-sm font-medium text-content-muted">/</span>
}
