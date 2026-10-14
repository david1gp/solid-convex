export interface ZitadelUserAssignmentSaveResult {
  readonly userId: string
  readonly rolesUpdated: boolean
  readonly teamIdsUpdated: boolean
  readonly roleKeys?: readonly string[]
  readonly teamIds?: readonly string[]
}
