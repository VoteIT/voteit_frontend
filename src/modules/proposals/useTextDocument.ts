import { computed, Ref } from 'vue'

import { TextDocument } from './contentTypes'
import { canChangeDocument, canDeleteDocument } from './rules'

export default function useTextDocument (doc: Ref<TextDocument>) {
  return {
    canChange: computed(() => canChangeDocument(doc.value)),
    canDelete: computed(() => canDeleteDocument(doc.value))
  }
}
