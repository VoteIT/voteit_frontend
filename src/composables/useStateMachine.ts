import { chain, filter, first, ifilter, imap, sorted } from 'itertools'
import { computed, reactive } from 'vue'
import { ComposerTranslation } from 'vue-i18n'

import restApi from '@/utils/restApi'
import { Predicate, ThemeColor } from '@/utils/types'
import { IStateMeta } from '@/contentTypes/types'
import DefaultMap from '@/utils/DefaultMap'
import { dialogQuery } from '@/utils'
import ContentAPI from '@/contentTypes/ContentAPI'

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
type EventValidator<T extends StateContent> = (obj: T) => string | true

type GuardTrigger = { text: string; isBlocking?: boolean }
type eventGuard<T> = (
  obj: T,
  t: ComposerTranslation
) => GuardTrigger | undefined

/**
 * Escape validation using this
 * @returns true
 */
export function noValidation(): true {
  return true
}
/**
 * Never allowed, should probably be removed
 * @returns 'Not allowed'
 */
export function notAllowed() {
  return 'Not allowed'
}

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
      if (typeof validation === 'string') return validation
    }
  }

  register(name: string, validator: EventValidator<any>) {
    this.validators.set(name, validator)
  }
}

const validatorsByMachine = new Map<string, ValidatorRegistry>()

export function registerValidator(
  machineName: string,
  name: string,
  validator: EventValidator<any>
) {
  if (!validatorsByMachine.has(machineName))
    validatorsByMachine.set(machineName, new ValidatorRegistry())
  validatorsByMachine.get(machineName)!.register(name, validator)
}

const stateMachines = reactive(new Map<string, IStateMachine>())
/**
 * Debugging function, should only run in dev
 */
function validateStateMachines(machines: ApiMachines) {
  for (const [machineName, { events }] of Object.entries(machines)) {
    const registry = validatorsByMachine.get(machineName)
    for (const { transitions } of Object.values(events)) {
      for (const { cond, validators } of transitions) {
        for (const name of [...validators, ...cond])
          if (!registry?.has(name))
            throw new Error(
              `Machine '${machineName}': missing validator '${name}'`
            )
      }
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
  T extends StateContent & { pk: number },
  Event extends string = never
>(name: string, meta: Record<string, IStateMeta>, api: ContentAPI<T, number>) {
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
            validatorsByMachine
              .get(name)
              ?.validate<T>(transition.validators, obj)
          const { color, icon } = meta[event.transitions[0]?.to] ?? {}
          yield {
            disabled: typeof validation === 'string',
            color,
            icon,
            id: id as Event,
            name: event.name,
            reason: typeof validation === 'string' ? validation : undefined
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

  // Transition guards — only relevant when api is provided
  const guards = new DefaultMap<Event | '*', eventGuard<T>[]>(() => [])

  function isGuardTrigger(value?: GuardTrigger): value is GuardTrigger {
    return !!value
  }

  async function sendEvent(obj: T, event: Event, t: ComposerTranslation) {
    const action = () => api.action<Partial<T>>('event', obj.pk, { event })
    const guardQuery = checkGuards(obj, event, t)
    if (!guardQuery) return action()
    const dialog = { title: guardQuery.text, theme: ThemeColor.Warning }
    if (guardQuery.isBlocking) {
      dialogQuery({ ...dialog, no: false, yes: t('ok') })
      return
    }
    if (await dialogQuery(dialog)) return await action()
  }

  function registerGuard(transition: Event, guard: eventGuard<T>) {
    guards.get(transition).push(guard)
  }

  function checkGuards(
    obj: T,
    transition: Event | '*',
    t: ComposerTranslation
  ) {
    const triggeredGuards = filter(
      imap(chain(guards.get('*'), guards.get(transition)), (guard) =>
        guard(obj, t)
      ),
      isGuardTrigger
    )
    // First non-overridable or first triggered
    return (
      first(triggeredGuards, (g) => !!g?.isBlocking) ?? first(triggeredGuards)
    )
  }

  return {
    states,
    getAvailableEvents,
    getPriorityStates,
    getState,
    getStateList,
    checkGuards,
    sendEvent,
    registerGuard
  }
}
