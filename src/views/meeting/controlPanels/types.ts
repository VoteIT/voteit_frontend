import { ComputedRef, DefineComponent } from '@vue/runtime-core'

export type ControlPanelComponent = DefineComponent<{}, {title: ComputedRef<string>}, {}, {}, {}>
