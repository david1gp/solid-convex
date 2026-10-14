import { useParams } from "@tanstack/solid-router"
import { createMemo } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import type { HierarchyDeleteTarget } from "#src/hierarchy_delete/model/hierarchyDeleteTargetSchema.ts"
import { urlOrgList, urlOrgView } from "#src/org/org_url/urlOrg.ts"
import { navigateTo } from "#src/utils/router/navigateTo.ts"
import { formMode, getFormModeTitle } from "#ui/input/form/formMode.ts"

export function orgDeletePageStateCreate() {
  const params = useParams({ strict: false })
  const orgHandle = createMemo(() => params().orgHandle)

  const target = createMemo<HierarchyDeleteTarget | undefined>(() => {
    const handle = orgHandle()
    if (!handle) return undefined
    return {
      kind: "org",
      orgHandle: handle,
    }
  })

  const onCancel = () => {
    const handle = orgHandle()
    if (handle) {
      navigateTo(urlOrgView(handle))
      return
    }
    navigateTo(urlOrgList())
  }

  const onSuccess = () => {
    navigateTo(urlOrgList())
  }

  const pageTitle = (_orgName?: string, orgNameAlt?: string) => {
    return getFormModeTitle(formMode.remove, orgNameAlt ?? ttc("Organization"))
  }

  return {
    orgHandle,
    target,
    onCancel,
    onSuccess,
    pageTitle,
  }
}
