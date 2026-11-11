import { computed, shallowRef, watch } from 'vue'

import useOrgStore from './useOrgStore'

/**
 * Draft of the organisation's vote retention settings, saved together.
 * Validating the input is up to the form.
 */
export default function useVoteRetention() {
  const orgStore = useOrgStore()

  const savedDays = computed(() => orgStore.organisation?.vote_retention_days)
  const savedAutoClear = computed(
    () => !!orgStore.organisation?.auto_clear_votes
  )

  const days = shallowRef<number | string | undefined>(savedDays.value)
  const autoClear = shallowRef(savedAutoClear.value)

  // Follow saved values, without touching the draft when other organisation fields change
  watch(savedDays, (value) => (days.value = value))
  watch(savedAutoClear, (value) => (autoClear.value = value))

  const changed = computed(
    () =>
      days.value !== savedDays.value ||
      autoClear.value !== savedAutoClear.value
  )

  /**
   * Saving may remove votes at the next daily run: turning auto clear on, or
   * shortening the period while it's on.
   */
  const needsConfirm = computed(
    () =>
      changed.value &&
      autoClear.value &&
      (!savedAutoClear.value ||
        (savedDays.value !== undefined && Number(days.value) < savedDays.value))
  )

  async function save() {
    await orgStore.updateOrganisation({
      auto_clear_votes: autoClear.value,
      vote_retention_days: Number(days.value)
    })
  }

  return { autoClear, changed, days, needsConfirm, save }
}
