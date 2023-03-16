import { expect, test } from 'vitest'

import PluginHandler from './PluginHandler'

test('PluginHandler', () => {
  const handler = new PluginHandler()
  expect(handler).toBeTruthy()
  expect(handler.hasPlugin('test')).toEqual(false)
  expect(handler.getPlugin('test')).toBeUndefined()
  handler.register({ id: 'test' })
  expect(handler.hasPlugin('test')).toEqual(true)
  expect(handler.getPlugin('test')).toEqual({ id: 'test' })
  expect(handler.getPlugins(Boolean)).toEqual([{ id: 'test' }])

  handler.register({ id: 'test-2' })
  handler.register({ id: '' })
  expect(handler.getPlugins(p => p.id.startsWith('test')).length).toEqual(2)
  expect(handler.getPlugins(p => !p.id.startsWith('test')).length).toEqual(1)
})
