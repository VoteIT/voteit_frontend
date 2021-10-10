import { reactive, readonly } from 'vue'

import { TextDocument, textDocumentType } from './contentTypes'

const textDocuments = reactive<Map<number, TextDocument>>(new Map())

textDocumentType.channelUpdateMap(textDocuments)

export default function useTextDocuments () {
  return {
    textDocuments: readonly(textDocuments),
    api: textDocumentType.api
  }
}
