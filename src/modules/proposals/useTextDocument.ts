import { computed, Ref } from 'vue'

import { ProposalText } from './contentTypes'
import { canChangeDocument, canDeleteDocument } from './rules'

export default function useTextDocument (doc: Ref<ProposalText>) {
  return {
    canChange: computed(() => canChangeDocument(doc.value)),
    canDelete: computed(() => canDeleteDocument(doc.value))
  }
}
