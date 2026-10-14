import { type UserRole, userRole } from "#src/auth/model_field/userRole.ts"
import type { SignalObject } from "#ui/utils/createSignalObject.ts"

interface UserRoleCheckMultipleFieldStateProps {
  rolesSignal: () => SignalObject<UserRole[]>
  disabled?: () => boolean | undefined
}

const userRoleOptions: readonly UserRole[] = [userRole.user, userRole.member, userRole.admin]

export function userRoleCheckMultipleFieldStateCreate(props: UserRoleCheckMultipleFieldStateProps) {
  const getOptions = (): UserRole[] => [...userRoleOptions]

  const valueText = (role: UserRole): string => {
    switch (role) {
      case userRole.admin:
        return "Admin"
      case userRole.member:
        return "Member"
      case userRole.user:
        return "User"
    }
  }

  const valueTextSubtitle = (role: UserRole): string => {
    switch (role) {
      case userRole.admin:
        return "Full organization and team administration privileges"
      case userRole.member:
        return "Standard member with team access"
      case userRole.user:
        return "Standard user access"
    }
  }

  return {
    rolesSignal: props.rolesSignal,
    getOptions,
    valueText,
    valueTextSubtitle,
    isDisabled: () => props.disabled?.() ?? false,
  }
}
