import { createMemo } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import type { OrgModel } from "#src/org/org_model/OrgModel.ts"
import { constructOrgRecord } from "#src/resource/ui/org/constructOrgRecord.tsx"

export function orgSelectStateCreate(p: { orgOptions: () => OrgModel[] }) {
  const idNameRecord = createMemo(() => constructOrgRecord(p.orgOptions()))

  function getOptions() {
    return p.orgOptions().map((o) => o.orgHandle)
  }

  function valueText(value: string) {
    return idNameRecord()[value] ?? ttc("Untitled")
  }

  return { getOptions, valueText }
}
