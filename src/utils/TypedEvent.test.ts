import { expect, test, vi } from 'vitest'
import TypedEvent from './TypedEvent'

test('TypedEvent', () => {
  const testEvent = new TypedEvent<string>()
  const fn = vi.fn()

  // Once listeners
  testEvent.once(fn)
  expect(fn).not.toHaveBeenCalled()
  testEvent.emit('hit me')
  testEvent.emit('hit me again')
  expect(fn).toHaveBeenCalledOnce()
  expect(fn).toHaveBeenCalledWith('hit me')

  // Disposables
  const { dispose } = testEvent.on(fn)
  testEvent.emit('dispose me 1')
  testEvent.emit('dispose me 2')
  dispose()
  testEvent.emit('dispose me 3')
  expect(fn).toHaveBeenCalledTimes(3)
  expect(fn).toHaveBeenCalledWith('dispose me 1')
  expect(fn).toHaveBeenCalledWith('dispose me 2')
  expect(fn).not.toHaveBeenCalledWith('dispose me 3')

  // Event pipes
  const pipeEvent = new TypedEvent<string>()
  pipeEvent.pipe(testEvent)
  testEvent.on(fn)
  pipeEvent.emit('pipe me')
  testEvent.off(fn)
  pipeEvent.emit('pipe me 2')
  expect(fn).toHaveBeenCalledTimes(4)
  expect(fn).toHaveBeenCalledWith('pipe me')
  expect(fn).not.toHaveBeenCalledWith('pipe me 2')
})
