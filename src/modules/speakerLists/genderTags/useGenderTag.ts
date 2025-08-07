import useParticipantTags from '@/modules/meetings/participantTags/useParticipantTags'
import { computed, MaybeRef, unref } from 'vue'

export default function useGenderTag(
  meeting: MaybeRef<number>,
  user: MaybeRef<number | undefined>
) {
  const { getUserTags } = useParticipantTags(meeting)

  return computed(() => {
    const u = unref(user)
    if (u) return getUserTags(u, 'gen').at(0)?.split(':')[1] as GenderTag
  })
}
