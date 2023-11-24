<script
  setup
  lang="ts"
  generic="T extends StateContent, Transition extends string"
>
import { useI18n } from 'vue-i18n'

import ContentType from '@/contentTypes/ContentType'
import { StateContent } from '@/contentTypes/types'
import { dialogQuery } from '@/utils'
import { ThemeColor } from '@/utils/types'

const props = defineProps<{
  contentType: ContentType<T, Transition, any>
  obj: T
  transition: Transition
}>()

const { t } = useI18n()

async function openDialog(title: string, blocking?: boolean) {
  const response = dialogQuery(
    blocking
      ? { title, no: false, yes: t('ok') }
      : { title, theme: ThemeColor.Warning }
  )
  return !blocking && response
}

async function onClick() {
  const guard = props.contentType.transitions.checkGuards(
    props.obj,
    props.transition,
    t
  )
  if (!guard || (await openDialog(guard.message, guard.blocking)))
    await props.contentType.transitions.make(props.obj.pk, props.transition)
}
</script>

<template>
  <slot :props="{ onClick }"></slot>
</template>
