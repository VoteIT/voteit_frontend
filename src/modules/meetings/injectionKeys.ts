import { InjectionKey, Ref } from 'vue'

export const meetingIdKey = Symbol('meetingId') as InjectionKey<Ref<number>>
