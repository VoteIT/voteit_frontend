import { computed, unref, type MaybeRef } from 'vue'
import type { ComposerTranslation } from 'vue-i18n'

export default function useProposalOrdering(
  t: ComposerTranslation,
  ordering?: MaybeRef<string | undefined>
) {
  const proposalOrderingOptions = computed(() => [
    { title: t('order.chronological'), value: 'c' },
    { title: t('order.alphabetical'), value: 'a' },
    { title: t('order.random'), value: 'r' }
  ])
  const proposalOrderingTitle = computed(() => {
    const ord = unref(ordering)
    return (
      proposalOrderingOptions.value.find((o) => o.value === ord)?.title ??
      t('unknown')
    )
  })

  return {
    proposalOrderingOptions,
    proposalOrderingTitle
  }
}
