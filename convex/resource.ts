import { resourceCreateInternalMutation, resourceCreateMutation } from "#src/resource/convex/resourceCreateMutation.ts"
import {
  resourceDeleteInternalMutation,
  resourceDeleteMutation,
  resourceFileRelationshipsDeleteInternalMutation,
  resourceOrgResourcesDeleteInternalMutation,
} from "#src/resource/convex/resourceDeleteMutation.ts"
import {
  resourceDeletePreviewInternalQuery,
  resourceDeletePreviewQuery,
} from "#src/resource/convex/resourceDeletePreviewQuery.ts"
import {
  resourceEditInternalMutation,
  resourceEditMutation,
  resourceEditOrgResourceProjectionsInternalMutation,
} from "#src/resource/convex/resourceEditMutation.ts"
import {
  resourceFileAddInternalMutation,
  resourceFileAddMutation,
} from "#src/resource/convex/resourceFileAddMutation.ts"
import { resourceFileListInternalQuery, resourceFileListQuery } from "#src/resource/convex/resourceFileListQuery.ts"
import {
  resourceFileRemoveInternalMutation,
  resourceFileRemoveMutation,
} from "#src/resource/convex/resourceFileRemoveMutation.ts"
import { resourceFilesGetInternalQuery, resourceFilesGetQuery } from "#src/resource/convex/resourceFilesGetQuery.ts"
import { resourceGetInternalQuery, resourceGetQuery } from "#src/resource/convex/resourceGetQuery.ts"
import { resourcesListInternalQuery, resourcesListQuery } from "#src/resource/convex/resourceListQuery.ts"
import { resourceSearchProjectionBackfillInternalMutation } from "#src/resource/convex/resourceSearchProjectionBackfillMutation.ts"

export {
  resourceCreateInternalMutation,
  resourceCreateMutation,
  resourceDeleteInternalMutation,
  resourceDeleteMutation,
  resourceDeletePreviewInternalQuery,
  resourceDeletePreviewQuery,
  resourceEditInternalMutation,
  resourceEditMutation,
  resourceEditOrgResourceProjectionsInternalMutation,
  // Resource
  resourceFileAddInternalMutation,
  resourceFileAddMutation,
  resourceFileListInternalQuery,
  resourceFileListQuery,
  resourceFileRelationshipsDeleteInternalMutation,
  resourceFileRemoveInternalMutation,
  resourceFileRemoveMutation,
  // Resource Files Get
  resourceFilesGetInternalQuery,
  resourceFilesGetQuery,
  // Get
  resourceGetInternalQuery,
  resourceGetQuery,
  resourceOrgResourcesDeleteInternalMutation,
  resourceSearchProjectionBackfillInternalMutation,
  // List
  resourcesListInternalQuery,
  resourcesListQuery,
}
