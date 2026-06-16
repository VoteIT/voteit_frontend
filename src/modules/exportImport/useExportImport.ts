import { computed, shallowReactive, type ComputedRef } from 'vue'
import type { ComposerTranslation } from 'vue-i18n'

export type ExportImportGroup = 'import' | 'clear' | 'include'

interface ExportImportOption {
  key: string
  default: boolean
  group: ExportImportGroup
  translate(t: ComposerTranslation): string
}

const exportImportOptions: ExportImportOption[] = [
  {
    key: 'add_participants',
    default: false,
    group: 'import',
    translate: (t) => t('exportImport.options.addParticipants')
  },
  // {
  //   key: 'use_existing_groups',
  //   default: false,
  //   group: 'import',
  //   translate: (t) => t('exportImport.options.useExistingGroups')
  // },
  {
    key: 'clear_group_authors',
    default: false,
    group: 'clear',
    translate: (t) => t('exportImport.options.clearGroupAuthors')
  },
  {
    key: 'clear_authors',
    default: false,
    group: 'clear',
    translate: (t) => t('exportImport.options.clearAuthors')
  },
  {
    key: 'clear_ai_states',
    default: false,
    group: 'clear',
    translate: (t) => t('exportImport.options.clearAiStates')
  },
  {
    key: 'clear_proposal_states',
    default: false,
    group: 'clear',
    translate: (t) => t('exportImport.options.clearProposalStates')
  },
  {
    key: 'clear_proposal_id',
    default: false,
    group: 'clear',
    translate: (t) => t('exportImport.options.clearProposalId')
  },
  {
    key: 'include_groups',
    default: true,
    group: 'include',
    translate: (t) => t('meeting.groups.groups')
  },
  {
    key: 'include_proposals',
    default: true,
    group: 'include',
    translate: (t) => t('proposal.proposals')
  },
  {
    key: 'include_discussions',
    default: true,
    group: 'include',
    translate: (t) => t('discussion.discussion')
  },
  {
    key: 'include_buttons',
    default: true,
    group: 'include',
    translate: (t) => t('reaction.buttons')
  },
  {
    key: 'include_reactions',
    default: false,
    group: 'include',
    translate: (t) => t('reaction.peopleReacted')
  }
]

// When the user sets `when[0]` to `when[1]`, force `force[0]` to `force[1]`
// to keep option combinations valid.
const constraints: Array<{
  when: [string, boolean]
  force: [string, boolean]
}> = [
  // clear_group_authors and include_groups can't both be false
  { when: ['include_groups', false], force: ['clear_group_authors', true] },
  { when: ['clear_group_authors', false], force: ['include_groups', true] },
  // include_buttons can't be false while include_reactions is true
  { when: ['include_reactions', true], force: ['include_buttons', true] },
  { when: ['include_buttons', false], force: ['include_reactions', false] }
]

/**
 * Shared option metadata, reactive values and constraint handling for the
 * meeting data export and import forms.
 */
export default function useExportImport(t: ComposerTranslation) {
  const options = computed(() =>
    exportImportOptions.map((option) => ({
      ...option,
      title: option.translate(t)
    }))
  )

  const values = shallowReactive<Record<string, boolean>>(
    Object.fromEntries(
      exportImportOptions.map((option) => [option.key, option.default])
    )
  )

  /** Translated options belonging to one of the given groups. */
  function optionsFor(...groups: ExportImportGroup[]) {
    return computed(() =>
      options.value.filter((option) => groups.includes(option.group))
    )
  }

  /** Selected keys/values for one of the given groups. */
  function valuesFor(...groups: ExportImportGroup[]): Record<string, boolean> {
    return Object.fromEntries(
      exportImportOptions
        .filter((option) => groups.includes(option.group))
        .map((option) => [option.key, values[option.key]])
    )
  }

  /** v-model for a `multiple` select bound to one of the given groups. */
  function selectionModel(...groups: ExportImportGroup[]) {
    const group: ComputedRef<{ key: string }[]> = optionsFor(...groups)
    return computed<string[]>({
      get: () =>
        group.value.filter((option) => values[option.key]).map((o) => o.key),
      set: (keys) => {
        // Apply the user's own changes first, then resolve constraints — so a
        // forced value isn't clobbered by a later option in the same group.
        const changed: string[] = []
        for (const option of group.value) {
          const next = keys.includes(option.key)
          if (values[option.key] === next) continue
          values[option.key] = next
          changed.push(option.key)
        }
        for (const key of changed) {
          for (const { when, force } of constraints) {
            if (when[0] === key && when[1] === values[key]) {
              values[force[0]] = force[1]
            }
          }
        }
      }
    })
  }

  return {
    options,
    values,
    optionsFor,
    valuesFor,
    selectionModel
  }
}
