import { describe, expect, it } from "vitest"
import { hierarchyDeleteFingerprintCreate } from "#src/hierarchy_delete/model/hierarchyDeleteFingerprintCreate.ts"

describe("hierarchyDeleteFingerprintCreate", () => {
  it("produces deterministic SHA-256 fingerprint regardless of ID insertion order", async () => {
    const scope1 = {
      orgIds: ["org_1", "org_2"],
      teamIds: ["team_b", "team_a"],
      projectIds: ["proj_2", "proj_1"],
      noteIds: ["note_1"],
      resourceIds: ["res_x", "res_y"],
      fileIds: ["file_2", "file_1"],
    }

    const scope2 = {
      orgIds: ["org_2", "org_1"],
      teamIds: ["team_a", "team_b"],
      projectIds: ["proj_1", "proj_2"],
      noteIds: ["note_1"],
      resourceIds: ["res_y", "res_x"],
      fileIds: ["file_1", "file_2"],
    }

    const fingerprint1 = await hierarchyDeleteFingerprintCreate(scope1)
    const fingerprint2 = await hierarchyDeleteFingerprintCreate(scope2)

    expect(fingerprint1).toBe(fingerprint2)
    expect(fingerprint1).toHaveLength(64)
  })

  it("changes fingerprint when any entity is added, removed, or changed", async () => {
    const baseScope = {
      orgIds: ["org_1"],
      teamIds: ["team_1"],
      projectIds: ["proj_1"],
      noteIds: ["note_1"],
      resourceIds: ["res_1"],
      fileIds: ["file_1"],
    }

    const baseFingerprint = await hierarchyDeleteFingerprintCreate(baseScope)

    const scopeWithExtraNote = {
      ...baseScope,
      noteIds: ["note_1", "note_2"],
    }
    const extraFingerprint = await hierarchyDeleteFingerprintCreate(scopeWithExtraNote)

    expect(extraFingerprint).not.toBe(baseFingerprint)
  })

  it("deduplicates redundant IDs before computing fingerprint", async () => {
    const scopeWithDups = {
      orgIds: ["org_1", "org_1"],
      teamIds: ["team_1"],
      projectIds: ["proj_1"],
      noteIds: ["note_1"],
      resourceIds: ["res_1"],
      fileIds: ["file_1", "file_1"],
    }

    const scopeClean = {
      orgIds: ["org_1"],
      teamIds: ["team_1"],
      projectIds: ["proj_1"],
      noteIds: ["note_1"],
      resourceIds: ["res_1"],
      fileIds: ["file_1"],
    }

    const fp1 = await hierarchyDeleteFingerprintCreate(scopeWithDups)
    const fp2 = await hierarchyDeleteFingerprintCreate(scopeClean)

    expect(fp1).toBe(fp2)
  })

  it("changes fingerprint when org members or invitations are added", async () => {
    const scopeWithout = {
      orgIds: ["org_1"],
      teamIds: [],
      projectIds: [],
      noteIds: [],
      resourceIds: [],
      fileIds: [],
      orgMemberIds: [],
      orgInvitationIds: [],
    }

    const fpBase = await hierarchyDeleteFingerprintCreate(scopeWithout)

    const scopeWithMember = {
      ...scopeWithout,
      orgMemberIds: ["member_1"],
    }
    const fpMember = await hierarchyDeleteFingerprintCreate(scopeWithMember)
    expect(fpMember).not.toBe(fpBase)

    const scopeWithInvitation = {
      ...scopeWithout,
      orgInvitationIds: ["invitation_1"],
    }
    const fpInvitation = await hierarchyDeleteFingerprintCreate(scopeWithInvitation)
    expect(fpInvitation).not.toBe(fpBase)
    expect(fpInvitation).not.toBe(fpMember)
  })
})
