import { InjectionKey, Ref } from 'vue'

export const agendaIdKey = Symbol('agendaId') as InjectionKey<Ref<number>>
