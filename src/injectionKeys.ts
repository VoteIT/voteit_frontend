import { InjectionKey, MaybeRef } from 'vue'

export const RoleContextKey = Symbol('roleContext') as InjectionKey<string>
export const ReadonlyViewKey = Symbol('readonly') as InjectionKey<
  MaybeRef<boolean>
>
