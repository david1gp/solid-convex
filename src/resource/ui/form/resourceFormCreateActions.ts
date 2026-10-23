import { api } from "#convex/_generated/api.js"
import type { Result } from "#result"
import { userTokenGet } from "#src/auth/ui/signals/userSessionSignal.ts"
import type { ResourceDataModel } from "#src/resource/model/resourceSchema.ts"
import { resourceFormLocalStorage } from "#src/resource/ui/form/resourceFormLocalStorage.ts"
import type { ResourceFormData } from "#src/resource/ui/form/resourceFormStateManagement.ts"
import { resourceNameSet } from "#src/resource/ui/resourceNameRecordSignal.ts"
import { urlResourceList, urlResourceView } from "#src/resource/url/urlResource.ts"
import { mutationCreate } from "#src/utils/convex_client/mutationCreate.ts"
import { navigateTo } from "#src/utils/router/navigateTo.ts"
import type { HasToken } from "#src/utils/ui/HasToken.ts"
import { type FormMode, formMode } from "#ui/input/form/formMode.ts"
import { toastAdd } from "#ui/interactive/toast/toastAdd.ts"
import { toastVariant } from "#ui/interactive/toast/toastVariant.ts"

export type ResourceFormActions = {
  create?: ResourceFormCreateFn
  edit?: ResourceFormEditFn
  delete?: ResourceFormDeleteFn
}

export type ResourceFormCreateFn = (state: ResourceFormData) => Promise<void>

export type ResourceFormEditFn = (state: Partial<ResourceFormData>) => Promise<void>

export type ResourceFormDeleteFn = () => Promise<void>

export function resourceFormCreateActions(mode: FormMode, resourceId: string | undefined): ResourceFormActions {
  const actions: ResourceFormActions = {}
  if (mode === formMode.add) {
    const addMutation = mutationCreate(api.resource.resourceCreateMutation)
    actions.create = async (data) => createAction(data, addMutation)
  }
  if (mode === formMode.edit) {
    const editMutation = mutationCreate(api.resource.resourceEditMutation)
    actions.edit = async (data) => editAction(data, resourceId, mode, editMutation)
  }
  if (mode === formMode.remove) {
    const deleteMutation = mutationCreate(api.resource.resourceDeleteMutation)
    actions.delete = async () => removeAction(resourceId, mode, deleteMutation)
  }
  return actions
}
interface ResourceCreateMutationProps extends ResourceDataModel, HasToken {}

interface ResourceEditMutationProps extends Partial<ResourceDataModel>, HasToken {
  resourceId: string
}

interface ResourceRemoveMutationProps extends HasToken {
  resourceId: string
}

async function createAction(
  data: ResourceFormData,
  addMutation: (data: ResourceCreateMutationProps) => Promise<Result<string>>,
): Promise<void> {
  const resourceIdResult = await addMutation({
    token: userTokenGet(),
    ...data,
  })
  if (!resourceIdResult.success) {
    console.error(resourceIdResult)
    toastAdd({
      title: resourceIdResult.errorMessage,
      variant: toastVariant.error,
    })
    return
  }
  resourceFormLocalStorage.clearLocalStorage()
  resourceNameSet(data.resourceId, data.name)
  const url = urlResourceView(data.resourceId)
  navigateTo(url)
}

async function editAction(
  data: Partial<ResourceFormData>,
  resourceId: string | undefined,
  mode: FormMode,
  editMutation: (data: ResourceEditMutationProps) => Promise<Result<null>>,
) {
  if (!resourceId) {
    toastAdd({ title: "!resourceId", variant: toastVariant.error })
    return
  }
  const editResult = await editMutation({
    token: userTokenGet(),
    ...data,
    resourceId,
  })
  if (!editResult.success) {
    console.error(editResult)
    toastAdd({ title: editResult.errorMessage, variant: toastVariant.error })
    return
  }
  navigateTo(getReturnPath(mode, resourceId))
}

async function removeAction(
  resourceId: string | undefined,
  mode: FormMode,
  deleteMutation: (data: ResourceRemoveMutationProps) => Promise<Result<null>>,
) {
  if (!resourceId) {
    toastAdd({ title: "!resourceId", variant: toastVariant.error })
    return
  }
  let deleteResult: Result<null> | undefined
  try {
    deleteResult = await deleteMutation({
      token: userTokenGet(),
      resourceId,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("removeAction", error)
    toastAdd({ title: errorMessage, variant: toastVariant.error })
    return
  }
  if (!deleteResult.success) {
    console.error(deleteResult)
    toastAdd({ title: deleteResult.errorMessage, variant: toastVariant.error })
    return
  }
  navigateTo(getReturnPath(mode, resourceId))
}

function getReturnPath(mode: FormMode, resourceId?: string) {
  if (mode === formMode.edit && resourceId) {
    return urlResourceView(resourceId)
  }
  return urlResourceList()
}
