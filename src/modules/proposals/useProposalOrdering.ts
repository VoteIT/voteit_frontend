import { MaybeRef, get } from '@vueuse/core'
import { computed } from 'vue'
import { ComposerTranslation } from 'vue-i18n'

export default function useProposalOrdering(
  t: ComposerTranslation,
  ordering?: MaybeRef<string | undefined>
) {
  const proposalOrderingOptions = computed(() => [
    { title: t('order.chronological'), value: 'c' },
    { title: t('order.alphabetical'), value: 'a' },
    { title: t('order.random'), value: 'r' }
  ])
  const proposalOrderingTitle = computed(
    () =>
      proposalOrderingOptions.value.find((o) => o.value === get(ordering))
        ?.title ?? t('unknown')
  )

  return {
    proposalOrderingOptions,
    proposalOrderingTitle
  }
}
