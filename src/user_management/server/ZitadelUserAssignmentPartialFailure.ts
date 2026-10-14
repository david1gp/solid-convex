export interface ZitadelUserAssignmentPartialFailure {
  readonly userId: string
  readonly rolesUpdated: boolean
  readonly teamIdsUpdated: boolean
  readonly roleKeys?: readonly string[]
  readonly teamIds?: readonly string[]
  readonly rolesError?: string
  readonly teamIdsError?: string
}
