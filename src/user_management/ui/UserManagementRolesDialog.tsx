import Dialog from "@corvu-next/dialog"
import { Show } from "solid-js"
import { userAvailableRolesRead } from "#src/user_management/ui/userAvailableRoles.ts"
import type { UserManagementRolesDialogState } from "#src/user_management/ui/userManagementRolesDialogStateCreate.ts"
import type { UserProjection } from "#src/user_management/model/userProjectionSchema.ts"
import { Button } from "#ui/interactive/button/Button.tsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { CheckMultiple } from "#ui/input/check/CheckMultiple.tsx"
import { classesDialogContentMerge, classesDialogOverlayMerge } from "#ui/interactive/dialog/classesDialogContent.js"

interface UserManagementRolesDialogProps {
  readonly dialog: UserManagementRolesDialogState
  readonly members: () => readonly UserProjection[]
}

function roleLabel(role: string): string {
  switch (role) {
    case "admin":
      return "Admin"
    case "member":
      return "Member"
    case "user":
      return "User"
    default:
      return role
  }
}

export function UserManagementRolesDialog(props: UserManagementRolesDialogProps) {
  const editingUser = () => props.dialog.editingUser()
  const isOpen = () => editingUser() !== undefined
  const roleOptions = (): string[] => {
    const user = editingUser()
    const available = userAvailableRolesRead(props.members())
    if (!user) return [...available]
    const merged = [...available]
    for (const role of user.roles) {
      if (!merged.includes(role)) merged.push(role)
    }
    return merged
  }

  return (
    <Dialog
      open={isOpen()}
      onOpenChange={(open) => {
        if (!open) props.dialog.closeEdit()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay class={classesDialogOverlayMerge()} />
        <Dialog.Content class={classesDialogContentMerge("w-full max-w-lg")}>
          <Show when={editingUser()}>
            {(user) => (
              <div class="flex flex-col gap-5">
                <div>
                  <Dialog.Label class="text-lg font-semibold">Edit project roles</Dialog.Label>
                  <Dialog.Description class="text-sm text-muted-foreground">
                    Assign Zitadel project roles for{" "}
                    <span class="font-medium text-foreground">
                      {user().displayName || user().username || user().email || user().userId}
                    </span>
                    . Changes write through to Zitadel immediately.
                  </Dialog.Description>
                </div>
                <fieldset>
                  <legend class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Project roles
                  </legend>
                  <CheckMultiple
                    id="user-management-roles-edit"
                    valueSignal={props.dialog.draftRoles}
                    getOptions={roleOptions}
                    valueText={roleLabel}
                    disabled={props.dialog.isUpdating(user().userId)}
                  />
                </fieldset>
                <Show when={props.dialog.errorMessage()}>
                  <p role="alert" class="text-sm text-destructive">
                    {props.dialog.errorMessage()}
                  </p>
                </Show>
                <div class="flex justify-end gap-2">
                  <Button type="button" variant={buttonVariant.outline} onClick={() => props.dialog.closeEdit()}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant={buttonVariant.filledIndigo}
                    onClick={() => void props.dialog.saveRoles()}
                    disabled={props.dialog.isUpdating(user().userId) || props.dialog.draftRoles.get().length === 0}
                  >
                    {props.dialog.isUpdating(user().userId) ? "Saving…" : "Save roles"}
                  </Button>
                </div>
              </div>
            )}
          </Show>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
