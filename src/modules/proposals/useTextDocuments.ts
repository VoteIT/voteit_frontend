import { reactive, readonly } from 'vue'

import { TextDocument, textDocumentType } from './contentTypes'

const textDocuments = reactive<Map<number, TextDocument>>(new Map())

textDocumentType.channelUpdateMap(textDocuments)

type DocFilter = (document: TextDocument) => boolean

function * iterDocuments (filter: DocFilter): Generator<TextDocument, void> {
  for (const doc of textDocuments.values()) {
    if (filter(doc)) yield doc
  }
}

function getDocuments (filter: DocFilter) {
  return readonly([...iterDocuments(filter)])
}

export default function useTextDocuments () {
  return {
    textDocuments: readonly(textDocuments),
    api: textDocumentType.api,
    getDocuments
  }
}
