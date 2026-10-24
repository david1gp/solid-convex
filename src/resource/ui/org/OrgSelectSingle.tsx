import type { OrgModel } from "#src/org/org_model/OrgModel.ts"
import { orgSelectStateCreate } from "#src/resource/ui/org/orgSelectStateCreate.ts"
import { CheckSingle } from "#ui/input/check/CheckSingle.jsx"
import type { createSignalObject } from "#ui/utils/createSignalObject.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

interface OrgSelectSingleProps extends MayHaveClass {
  valueSignal: ReturnType<typeof createSignalObject<string>>
  orgOptions: OrgModel[]
}

export function OrgSelectSingle(p: OrgSelectSingleProps) {
  const state = orgSelectStateCreate({ orgOptions: () => p.orgOptions })

  return (
    <CheckSingle
      valueSignal={p.valueSignal}
      getOptions={state.getOptions}
      valueText={state.valueText}
      optionClass="bg-gray-50"
    />
  )
}
