import { Show } from "solid-js"
import { pageDemoHref } from "#src/app/demos/pageDemoHref.ts"
import { OrgInvitationAcceptView } from "#src/org/invitation_ui/accept/OrgInvitationAcceptView.tsx"
import { orgInvitationDemoStateCreate } from "#src/org/invitation_ui/demo/orgInvitationDemoStateCreate.ts"
import { OrgInvitationForm } from "#src/org/invitation_ui/form/OrgInvitationForm.tsx"
import { OrgInvitationListView } from "#src/org/invitation_ui/list/OrgInvitationListView.tsx"
import { orgMemberDemoStateCreate } from "#src/org/member_ui/demo/orgMemberDemoStateCreate.ts"
import { OrgMemberForm } from "#src/org/member_ui/form/OrgMemberForm.tsx"
import { OrgMemberListView } from "#src/org/member_ui/list/OrgMemberListView.tsx"
import { orgDemoStateCreate } from "#src/org/org_ui/demo/orgDemoStateCreate.ts"
import { OrgForm } from "#src/org/org_ui/form/OrgForm.tsx"
import { OrgListView } from "#src/org/org_ui/list/OrgListView.tsx"
import { OrgLeaveView } from "#src/org/org_ui/mutate/OrgLeaveView.tsx"
import { OrgViewContent } from "#src/org/org_ui/view/OrgViewContent.tsx"
import { formMode } from "#ui/input/form/formMode.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.tsx"
import { PageWrapper } from "#ui/static/page/PageWrapper.jsx"

function OrgDemoList() {
  const state = orgDemoStateCreate()
  return (
    <PageWrapper>
      <OrgListView
        orgs={state.orgs()}
        createHref={pageDemoHref("/org/create")}
        viewHref={(orgHandle) => pageDemoHref("/org/:orgHandle", { orgHandle })}
      />
    </PageWrapper>
  )
}

function OrgDemoCreate() {
  const state = orgDemoStateCreate()
  return (
    <PageWrapper>
      <LinkButtonInternal to={pageDemoHref("/org")}>Organizations</LinkButtonInternal>
      <OrgForm mode={state.form.mode} sm={state.form} demo />
    </PageWrapper>
  )
}

function OrgDemoView() {
  const state = orgDemoStateCreate()
  const memberState = orgMemberDemoStateCreate()
  const invitationState = orgInvitationDemoStateCreate()
  return (
    <PageWrapper>
      <nav class="flex flex-wrap gap-3 my-4">
        <LinkButtonInternal to={pageDemoHref("/org/:orgHandle/leave", { orgHandle: state.orgHandle() })}>
          Leave demo
        </LinkButtonInternal>
        <LinkButtonInternal to={pageDemoHref("/org/:orgHandle/remove", { orgHandle: state.orgHandle() })}>
          Remove demo
        </LinkButtonInternal>
        <LinkButtonInternal to={pageDemoHref("/org")}>Organizations</LinkButtonInternal>
        <LinkButtonInternal to={pageDemoHref("/org/create")}>Create organization</LinkButtonInternal>
      </nav>
      <Show when={state.org()} fallback={<p>Organization not found in demo fixtures. Return to the list.</p>}>
        {(org) => (
          <OrgViewContent
            org={org()}
            members={memberState.members()}
            invitations={invitationState.invitations()}
            demo
            editHref={pageDemoHref("/org/:orgHandle/edit", { orgHandle: state.orgHandle() })}
            invitationAddHref={pageDemoHref("/org/:orgHandle/invitations/add", { orgHandle: state.orgHandle() })}
          />
        )}
      </Show>
      <nav class="flex flex-wrap gap-3 my-4">
        <LinkButtonInternal to={pageDemoHref("/org/:orgHandle/members", { orgHandle: state.orgHandle() })}>
          Members demo
        </LinkButtonInternal>
        <LinkButtonInternal to={pageDemoHref("/org/:orgHandle/invitations", { orgHandle: state.orgHandle() })}>
          Invitations demo
        </LinkButtonInternal>
      </nav>
    </PageWrapper>
  )
}

function OrgDemoEdit() {
  const state = orgDemoStateCreate(formMode.edit)
  return (
    <PageWrapper>
      <LinkButtonInternal to={pageDemoHref("/org/:orgHandle", { orgHandle: state.orgHandle() })}>
        Organization
      </LinkButtonInternal>
      <Show when={state.org()} fallback={<p>Organization not found in demo fixtures.</p>}>
        <OrgForm mode={formMode.edit} sm={state.form} demo />
      </Show>
      <LinkButtonInternal to={pageDemoHref("/org/:orgHandle/remove", { orgHandle: state.orgHandle() })}>
        Remove organization demo
      </LinkButtonInternal>
    </PageWrapper>
  )
}

function OrgDemoRemove() {
  const state = orgDemoStateCreate(formMode.remove)
  return (
    <PageWrapper>
      <LinkButtonInternal to={pageDemoHref("/org/:orgHandle", { orgHandle: state.orgHandle() })}>
        Cancel — organization
      </LinkButtonInternal>
      <Show when={state.org()} fallback={<p>Organization not found in demo fixtures.</p>}>
        <OrgForm mode={formMode.remove} sm={state.form} demo />
      </Show>
    </PageWrapper>
  )
}

function OrgDemoLeave() {
  const state = orgDemoStateCreate()
  return (
    <PageWrapper>
      <LinkButtonInternal to={pageDemoHref("/org/:orgHandle", { orgHandle: state.orgHandle() })}>
        Cancel — organization
      </LinkButtonInternal>
      <Show when={state.org()} fallback={<p>Organization not found in demo fixtures.</p>}>
        {(org) => <OrgLeaveView org={org()} onLeave={state.leave} />}
      </Show>
    </PageWrapper>
  )
}

function OrgDemoMembers() {
  const state = orgMemberDemoStateCreate()
  return (
    <PageWrapper>
      <nav class="flex flex-wrap gap-3 my-4">
        <LinkButtonInternal to={pageDemoHref("/org/:orgHandle", { orgHandle: state.orgHandle() })}>
          Organization
        </LinkButtonInternal>
        <LinkButtonInternal to={pageDemoHref("/org/:orgHandle/members/add", { orgHandle: state.orgHandle() })}>
          Add member
        </LinkButtonInternal>
      </nav>
      <OrgMemberListView
        members={state.members()}
        addHref={pageDemoHref("/org/:orgHandle/members/add", { orgHandle: state.orgHandle() })}
        viewHref={(memberId) =>
          pageDemoHref("/org/:orgHandle/members/:memberId/view", { orgHandle: state.orgHandle(), memberId })
        }
      />
    </PageWrapper>
  )
}

function OrgDemoMemberAdd() {
  const state = orgMemberDemoStateCreate()
  return (
    <PageWrapper>
      <LinkButtonInternal to={pageDemoHref("/org/:orgHandle/members", { orgHandle: state.orgHandle() })}>
        Members
      </LinkButtonInternal>
      <label class="block mt-6" for="org-demo-user">
        Demo user to add
      </label>
      <select
        id="org-demo-user"
        value={state.selectedUser()}
        onChange={(event) => state.chooseUser(event.currentTarget.value)}
      >
        <option value="new-user">New User</option>
        <option value="another-user">Another User</option>
      </select>
      <Show when={state.userError()}>{(error) => <p role="alert">{error()}</p>}</Show>
      <OrgMemberForm mode={formMode.add} sm={state.form} />
    </PageWrapper>
  )
}

function OrgDemoMemberView() {
  const state = orgMemberDemoStateCreate()
  return (
    <PageWrapper>
      <nav class="flex flex-wrap gap-3 my-4">
        <LinkButtonInternal to={pageDemoHref("/org/:orgHandle/members", { orgHandle: state.orgHandle() })}>
          Members
        </LinkButtonInternal>
        <Show when={state.member()}>
          <LinkButtonInternal
            to={pageDemoHref("/org/:orgHandle/members/:memberId/edit", {
              orgHandle: state.orgHandle(),
              memberId: state.memberId(),
            })}
          >
            Edit member
          </LinkButtonInternal>
          <LinkButtonInternal
            to={pageDemoHref("/org/:orgHandle/members/:memberId/remove", {
              orgHandle: state.orgHandle(),
              memberId: state.memberId(),
            })}
          >
            Remove member
          </LinkButtonInternal>
        </Show>
      </nav>
      <Show when={state.member()} fallback={<p>Member not found in demo fixtures.</p>}>
        {(member) => (
          <section class="mx-auto max-w-2xl space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-slate-700 dark:bg-stone-800">
            <h1 class="text-2xl font-semibold">{member().profile.name}</h1>
            <dl class="grid gap-2 sm:grid-cols-2">
              <div>
                <dt class="font-medium">User ID</dt>
                <dd>{member().userId}</dd>
              </div>
              <div>
                <dt class="font-medium">Organization role</dt>
                <dd class="capitalize">{member().role}</dd>
              </div>
            </dl>
          </section>
        )}
      </Show>
    </PageWrapper>
  )
}

function OrgDemoMemberEdit() {
  const state = orgMemberDemoStateCreate(formMode.edit)
  return (
    <PageWrapper>
      <LinkButtonInternal
        to={pageDemoHref("/org/:orgHandle/members/:memberId/view", {
          orgHandle: state.orgHandle(),
          memberId: state.memberId(),
        })}
      >
        Cancel — member
      </LinkButtonInternal>
      <Show when={state.member()} fallback={<p>Member not found in demo fixtures.</p>}>
        <OrgMemberForm mode={formMode.edit} sm={state.form} />
      </Show>
    </PageWrapper>
  )
}

function OrgDemoMemberRemove() {
  const state = orgMemberDemoStateCreate(formMode.remove)
  return (
    <PageWrapper>
      <LinkButtonInternal
        to={pageDemoHref("/org/:orgHandle/members/:memberId/view", {
          orgHandle: state.orgHandle(),
          memberId: state.memberId(),
        })}
      >
        Cancel — member
      </LinkButtonInternal>
      <Show when={state.member()} fallback={<p>Member not found in demo fixtures.</p>}>
        <OrgMemberForm mode={formMode.remove} sm={state.form} />
      </Show>
    </PageWrapper>
  )
}

function OrgDemoInvitations() {
  const state = orgInvitationDemoStateCreate()
  return (
    <PageWrapper>
      <LinkButtonInternal to={pageDemoHref("/org/:orgHandle", { orgHandle: state.orgHandle() })}>
        Organization
      </LinkButtonInternal>
      <OrgInvitationListView
        orgHandle={state.orgHandle()}
        invitations={state.invitations()}
        demo
        addHref={pageDemoHref("/org/:orgHandle/invitations/add", { orgHandle: state.orgHandle() })}
        acceptHref={(invitationCode) =>
          pageDemoHref("/org/:orgHandle/invitations/:invitationCode/accept", {
            orgHandle: state.orgHandle(),
            invitationCode,
          })
        }
      />
    </PageWrapper>
  )
}

function OrgDemoInvitationAdd() {
  const state = orgInvitationDemoStateCreate()
  return (
    <PageWrapper>
      <LinkButtonInternal to={pageDemoHref("/org/:orgHandle/invitations", { orgHandle: state.orgHandle() })}>
        Invitations
      </LinkButtonInternal>
      <OrgInvitationForm title={`Invite to ${state.orgHandle()}`} mode={formMode.add} sm={state.form} />
    </PageWrapper>
  )
}

function OrgDemoInvitationAccept() {
  const state = orgInvitationDemoStateCreate()
  const orgState = orgDemoStateCreate()
  return (
    <PageWrapper>
      <LinkButtonInternal to={pageDemoHref("/org/:orgHandle/invitations", { orgHandle: state.orgHandle() })}>
        Invitations
      </LinkButtonInternal>
      <Show when={state.invitation() && orgState.org()} fallback={<p>Invitation not found in demo fixtures.</p>}>
        <OrgInvitationAcceptView
          invitation={state.invitation()!}
          org={orgState.org()!}
          onAccept={state.accept}
          accepted={state.accepted()}
        />
      </Show>
      <Show when={state.accepted()}>
        <p role="status">Invitation accepted locally. No membership or session was changed.</p>
        <LinkButtonInternal to={pageDemoHref("/org/:orgHandle", { orgHandle: state.orgHandle() })}>
          Organization
        </LinkButtonInternal>
      </Show>
    </PageWrapper>
  )
}

/** Opt-in map: caller mounts only these isolated entries inside the demo boundary. */
export const orgDemoRendererMap = {
  "/org": OrgDemoList,
  "/org/create": OrgDemoCreate,
  "/org/:orgHandle": OrgDemoView,
  "/org/:orgHandle/edit": OrgDemoEdit,
  "/org/:orgHandle/leave": OrgDemoLeave,
  "/org/:orgHandle/remove": OrgDemoRemove,
  "/org/:orgHandle/members": OrgDemoMembers,
  "/org/:orgHandle/members/add": OrgDemoMemberAdd,
  "/org/:orgHandle/members/:memberId/view": OrgDemoMemberView,
  "/org/:orgHandle/members/:memberId/edit": OrgDemoMemberEdit,
  "/org/:orgHandle/members/:memberId/remove": OrgDemoMemberRemove,
  "/org/:orgHandle/invitations": OrgDemoInvitations,
  "/org/:orgHandle/invitations/add": OrgDemoInvitationAdd,
  "/org/:orgHandle/invitations/:invitationCode/accept": OrgDemoInvitationAccept,
} as const
