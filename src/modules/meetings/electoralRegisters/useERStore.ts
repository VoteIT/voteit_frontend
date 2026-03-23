import { filter, Predicate } from 'itertools'
import { defineStore } from 'pinia'
import { computed, reactive, shallowRef } from 'vue'

import { sleep } from '@/utils'
import { electoralRegisterType, erMethodType } from '../contentTypes'
import type { ElectoralRegister, ErMethod } from './types'

export default defineStore('electoralRegisters', () => {
  const registers = reactive(new Map<number, ElectoralRegister>())
  const erMethods = shallowRef<ErMethod[]>()

  electoralRegisterType.updateMap(
    registers as Map<number, ElectoralRegister>, // Don't bother about that null value. That's ok.
    { meeting: 'meeting' }
  )

  async function fetchErMethods() {
    try {
      const { data } = await erMethodType.api.list()
      erMethods.value = data
    } catch {} // TODO
  }

  function filterRegisters(predicate: Predicate<ElectoralRegister>) {
    return filter(registers.values(), predicate)
  }

  function getErMethod(name: string) {
    return erMethods.value?.find((erm) => erm.name === name)
  }

  // Handle register fetching (try to avoid self-DDOS)
  const fetchingRegisters = new Set<number>() // Register ids that are already being fetched
  async function fetchRegister(pk: number, retries = 3) {
    // Wait 250-1250 ms to avoid self-DDOS of fetch when already got value from websocket channel
    await sleep(250 + Math.random())
    if (registers.has(pk) || fetchingRegisters.has(pk)) return // Stop: Got it, or already fetching
    fetchingRegisters.add(pk)
    try {
      const { data } = await electoralRegisterType.api.retrieve(pk)
      registers.set(pk, data)
    } catch (e) {
      if (retries < 1) return console.error(e)
      fetchingRegisters.delete(pk)
      fetchRegister(pk, retries - 1)
    }
    fetchingRegisters.delete(pk)
  }

  async function fetchMeetingRegisters(meeting: number) {
    const { data } = await electoralRegisterType.api.list({ meeting })
    for (const er of data) registers.set(er.pk, er)
  }

  function getRegister(pk: number) {
    if (!registers.has(pk)) fetchRegister(pk) // computed objects will trigger again if registers changes
    return registers.get(pk)
  }

  function hasWeightedVotes({ weights }: ElectoralRegister) {
    return weights.some(({ weight }) => weight !== 1)
  }

  return {
    erMethods: computed(() => {
      if (!erMethods.value) fetchErMethods()
      return erMethods.value
    }),
    fetchErMethods,
    fetchMeetingRegisters,
    fetchRegister,
    filterRegisters,
    getErMethod,
    getRegister,
    hasWeightedVotes
  }
})
