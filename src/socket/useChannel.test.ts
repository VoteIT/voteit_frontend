import { mount } from '@vue/test-utils'
import { beforeAll, expect, test } from 'vitest'
import { defineComponent, ref } from 'vue'
import type { Ref } from 'vue'

import { sleep } from '@/utils'

import { socket } from '.'
import defineChannel from './defineChannel'
import useChannel from './useChannel'

declare namespace global {
  let WS: import('vitest-websocket-mock').default
}

const CHANNEL = 'useChannelTest'
const channel = defineChannel(CHANNEL, { leaveTimeout: 0 })

/**
 * Fake a server message on the channel protocol.
 */
function serverSend(action: string, pk: number, extra: object = {}) {
  global.WS.send({
    action: `channel.${action}`,
    payload: { channel_type: CHANNEL, pk, ...extra }
  })
}

/**
 * Settle a subscription the way the backend does: subscribed, then complete.
 */
function completeSubscription(pk: number) {
  serverSend('subscribed', pk, {
    channel_name: `${CHANNEL}_${pk}`,
    collectors: ['test.section']
  })
  serverSend('state_complete', pk, { channel_name: `${CHANNEL}_${pk}` })
}

/**
 * Tell a pending promise from a settled one, without waiting for a timeout.
 */
function isPending(promise: Promise<unknown>) {
  const pending = Symbol('pending')
  return Promise.race([promise, Promise.resolve(pending)]).then(
    (value) => value === pending
  )
}

/**
 * useChannel needs a component to hang its lifecycle hooks on.
 */
function mountChannel(pk: Ref<number | undefined>) {
  let subscription!: ReturnType<typeof useChannel>
  const wrapper = mount(
    defineComponent({
      setup() {
        subscription = useChannel(channel, pk)
        return () => null
      }
    })
  )
  return { subscription, wrapper }
}

beforeAll(async () => {
  // Connecting is usually handled by OnlineStatus
  socket.connect()
  await global.WS.connected
})

test('whenSettled waits for a target that appears later', async () => {
  const pk = ref<number>()
  const { subscription, wrapper } = mountChannel(pk)
  const settled = subscription.whenSettled()
  // A ProgressPromise loses isPending's race even when settled, so watch it
  let firstAttemptSettled = false
  subscription.promise.then(() => (firstAttemptSettled = true))

  await sleep(10)
  // There was nothing to subscribe to, so the first-attempt promise is done -
  // whenSettled is what keeps waiting for the target to turn up
  expect(firstAttemptSettled).toBe(true)
  expect(await isPending(settled)).toBe(true)

  pk.value = 1
  await sleep(10)
  expect(subscription.state.value).toBe('subscribing')
  expect(await isPending(settled)).toBe(true)

  completeSubscription(1)
  await expect(settled).resolves.toBeUndefined()
  expect(subscription.state.value).toBe('subscribed')
  wrapper.unmount()
})

test('whenSettled resolves on a failed subscription', async () => {
  const pk = ref<number>()
  const { subscription, wrapper } = mountChannel(pk)
  const settled = subscription.whenSettled()

  pk.value = 2
  await sleep(10)
  serverSend('subscribe_error', 2, { detail: 'Not allowed to subscribe' })

  await expect(settled).resolves.toBeUndefined()
  expect(subscription.state.value).toBe('failed')
  wrapper.unmount()
})

test('whenSettled resolves when the subscriber unmounts', async () => {
  const pk = ref<number>()
  const { subscription, wrapper } = mountChannel(pk)
  const settled = subscription.whenSettled()

  await sleep(10)
  expect(await isPending(settled)).toBe(true)

  // Nobody is left to wait for, and a hanging promise would stall the loader
  wrapper.unmount()
  await expect(settled).resolves.toBeUndefined()
})
