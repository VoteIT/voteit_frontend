import { InjectionKey, MaybeRef } from 'vue'

export const ReadonlyViewKey = Symbol('readonly') as InjectionKey<
  MaybeRef<boolean>
>
