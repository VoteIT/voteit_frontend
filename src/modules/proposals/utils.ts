import { stripHTML } from '@/utils'

import { getHTMLTags } from '../meetings/useTags'

import { UNRESOLVED_STATES } from './constants'
import type { Proposal } from './types'

export function isUnresolved({ state }: Pick<Proposal, 'state'>) {
  return UNRESOLVED_STATES.includes(state)
}

/**
 * Split proposal HTML into its non-empty top level paragraphs.
 * Text without block elements counts as a single paragraph.
 */
export function getParagraphs(html: string): string[] {
  const container = document.createElement('div')
  container.innerHTML = html
  if (!container.children.length)
    return container.textContent?.trim() ? [html] : []
  return [...container.children]
    .filter((elem) => elem.textContent?.trim())
    .map((elem) => elem.outerHTML)
}

const approveDenyPattern =
  /^[\s\p{P}]*(bifall|bifaller|avslag|avslår|bifald|afslag|approve|approval|support|reject|deny|denial)(?![\p{L}\p{N}])/iu

/**
 * Does the proposal seem to approve or reject another proposal, instead of proposing something?
 */
export function isApproveDenyProposal(html: string): boolean {
  return approveDenyPattern.test(stripHTML(html))
}

/**
 * Tags that are neither the proposal's own id nor written in its text.
 */
export function getExtraTags({
  body,
  prop_id,
  tags
}: Pick<Proposal, 'body' | 'prop_id' | 'tags'>) {
  const docTags = getHTMLTags(body)
  return tags.filter((tag) => !docTags.has(tag) && tag !== prop_id)
}
