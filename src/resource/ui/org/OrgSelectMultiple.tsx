import type { OrgModel } from "#src/org/org_model/OrgModel.ts"
import { orgSelectStateCreate } from "#src/resource/ui/org/orgSelectStateCreate.ts"
import { CheckMultiple } from "#ui/input/check/CheckMultiple.jsx"
import type { createSignalObject } from "#ui/utils/createSignalObject.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

interface OrgSelectMultipleProps extends MayHaveClass {
  valueSignal: ReturnType<typeof createSignalObject<string[]>>
  orgOptions: OrgModel[]
}

export function OrgSelectMultiple(p: OrgSelectMultipleProps) {
  const state = orgSelectStateCreate({ orgOptions: () => p.orgOptions })

  return (
    <CheckMultiple
      valueSignal={p.valueSignal}
      getOptions={state.getOptions}
      valueText={state.valueText}
      optionClass="bg-gray-50"
    />
  )
}
