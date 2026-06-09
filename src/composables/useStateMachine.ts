import { computed, reactive } from 'vue'

import restApi from '@/utils/restApi'
import { Predicate } from '@/utils/types'
import { filter, ifilter, imap, sorted } from 'itertools'
import { IStateMeta } from '@/contentTypes/types'

export interface StateContent<State extends string = string> {
  state: State
}

export interface StateDefinition {
  initial?: boolean
  final?: boolean
  name: string
}

interface SMEvent<State extends string> {
  name: string
  transitions: {
    cond: string[] // Event exists
    from: State
    to: State
    validators: string[] // Event is triggerable
  }[]
}

interface IStateMachine<
  State extends string = string,
  Event extends string = string
> {
  events: Record<Event, SMEvent<State>>
  states: Record<State, StateDefinition>
  name: string // name matches IProcess.adapter_name
}

type ApiMachines = Record<string, IStateMachine>
type EventValidator<T extends StateContent> = (obj: T) => string | undefined

/**
 * Escape validation using this
 * @returns true
 */
export function noValidation(): undefined {}

class ValidatorRegistry {
  private validators: Map<string, EventValidator<StateContent>>

  constructor() {
    this.validators = new Map()
  }

  private get_validator<T extends StateContent>(
    name: string
  ): EventValidator<T> {
    return this.validators.get(name) || noValidation
  }

  has(name: string) {
    return this.validators.has(name)
  }

  validate<T extends StateContent>(validators: string[], obj: T) {
    for (const name of validators) {
      const validation = this.get_validator(name)(obj)
      if (validation) return validation
    }
  }

  register(name: string, validator: EventValidator<any>) {
    this.validators.set(name, validator)
  }
}
export const transitionValidators = new ValidatorRegistry()

// TODO: Register these elsewhere
// Probably needs to register per state machine?
transitionValidators.register('has_archive_permission', () => undefined)
transitionValidators.register('has_change_permission', () => undefined)
transitionValidators.register('has_change_state_permission', () => undefined)
transitionValidators.register('has_delete_permission', () => undefined)
transitionValidators.register('has_moderate_permission', () => undefined)
transitionValidators.register('has_retract_permission', () => undefined)
transitionValidators.register('manual_er_not_needed', () => undefined)
transitionValidators.register('meeting_is_ongoing', () => undefined)
transitionValidators.register('no_active_speaker', () => undefined)
transitionValidators.register('no_ongoing_polls', () => undefined)
transitionValidators.register('not_allowed', () => undefined)
transitionValidators.register('pre_delete_state_is_archived', () => undefined)
transitionValidators.register('pre_delete_state_is_archiving', () => undefined)
transitionValidators.register('pre_delete_state_is_closed', () => undefined)
transitionValidators.register('pre_delete_state_is_ongoing', () => undefined)
transitionValidators.register('pre_delete_state_is_upcoming', () => undefined)
transitionValidators.register('valid_er_policy', () => undefined)
transitionValidators.register('validate_er_policy', () => undefined)
transitionValidators.register('validate_method', () => undefined)
transitionValidators.register('validate_settings', () => undefined)

const stateMachines = reactive(new Map<string, IStateMachine>())
/**
 * Debugging function, should only run in dev
 */
function validateStateMachines(machines: ApiMachines) {
  for (const { events } of Object.values(machines))
    for (const { transitions } of Object.values(events)) {
      for (const { cond, validators } of transitions) {
        for (const name of validators)
          if (!transitionValidators.has(name))
            throw new Error(`Missing validator ${name}`)
        for (const name of cond)
          if (!transitionValidators.has(name))
            throw new Error(`Missing cond validator ${name}`)
      }
    }
}

export async function fetchStateMachines() {
  const { data } = await restApi.get<ApiMachines>('state-machines/')
  if (import.meta.env.DEV) validateStateMachines(data)
  for (const [id, machine] of Object.entries(data))
    stateMachines.set(id, machine)
}

export default function useStateMachine<
  T extends StateContent,
  Event extends string = never
>(name: string, meta: Record<T['state'], IStateMeta>) {
  const states = computed(() => stateMachines.get(name)?.states ?? {})
  const events = computed(
    () =>
      (stateMachines.get(name)?.events as Record<
        Event,
        SMEvent<StateContent['state']>
      >) ?? {}
  )

  function getStateList(predicate?: Predicate<ReturnType<typeof getState>>) {
    return filter(
      imap(Object.keys(states.value) as T['state'][], getState),
      (s) => !predicate || predicate(s)
    )
  }

  function getAvailableEvents(obj: T, target?: string) {
    function* iterAvailableEvents() {
      for (const [id, event] of Object.entries<SMEvent<StateContent['state']>>(
        events.value
      )) {
        if (obj.state === id) continue
        // If called with target state
        if (target !== undefined && id !== target) continue
        for (const transition of event.transitions) {
          if (obj.state !== transition.from || transition.cond.length) continue
          const validation =
            !!obj &&
            transitionValidators.validate<T>(transition.validators, obj)
          yield {
            disabled: !!validation,
            id,
            name: event.name,
            reason: validation
          }
        }
      }
    }
    return [...iterAvailableEvents()]
  }

  function getPriorityStates(
    predicate?: Predicate<ReturnType<typeof getState>>
  ) {
    return sorted(
      ifilter(
        imap(Object.keys(states.value) as T['state'][], getState),
        (s) => !!s.priority && (!predicate || predicate(s))
      ),
      (s) => s.priority!
    )
  }

  function getState(state: T['state']) {
    return {
      state,
      ...states.value[state],
      ...meta[state]
    }
  }

  return {
    states,
    getAvailableEvents,
    getPriorityStates,
    getState,
    getStateList
  }
}
