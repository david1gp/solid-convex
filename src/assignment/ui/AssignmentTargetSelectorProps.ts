import type { AssignmentTarget } from "#src/assignment/model/assignmentTargetSchema.ts"
import type { SignalObject } from "#ui/utils/createSignalObject.ts"

export interface AssignmentTargetSelectorProps {
  valueSignal: SignalObject<AssignmentTarget | undefined>
  disabled?: () => boolean
}
