import { beforeEach, describe, expect, test, vi } from 'vitest'
import ContentType, { BaseContentType } from './ContentType'

// --- Module mocks ---
// vi.mock calls are hoisted above imports, so variables used inside factories
// must be declared with vi.hoisted() to be available at hoist time.

const {
  mockAddTypeHandler,
  mockSocketCall,
  MockContentAPI,
  MockChannel,
  mockUseStateMachine,
  mockContentCleanup,
  mockUseContextRoles,
  mockSetUser
} = vi.hoisted(() => {
  const mockApiInstance = {
    add: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
    listAction: vi.fn()
  }

  return {
    mockAddTypeHandler: vi.fn(),
    mockSocketCall: vi.fn(),
    MockContentAPI: vi.fn(function () {
      return mockApiInstance
    }),
    MockChannel: vi.fn(function () {
      return {}
    }),
    mockUseStateMachine: vi.fn(() => ({})),
    mockContentCleanup: { register: vi.fn() },
    mockUseContextRoles: vi.fn(() => ({ set: vi.fn() })),
    mockSetUser: vi.fn()
  }
})

vi.mock('@/utils/Socket', () => ({
  socket: { addTypeHandler: mockAddTypeHandler, call: mockSocketCall }
}))
vi.mock('./ContentAPI', () => ({ default: MockContentAPI }))
vi.mock('./Channel', () => ({ default: MockChannel }))
vi.mock('@/composables/useStateMachine', () => ({
  default: mockUseStateMachine
}))
vi.mock('./contentCleanup', () => ({ default: mockContentCleanup }))
vi.mock('@/composables/useContextRoles', () => ({
  default: mockUseContextRoles
}))
vi.mock('@/modules/organisations/useUserDetails', () => ({
  default: () => ({ setUser: mockSetUser })
}))

// --- Helpers ---

function captureSocketHandler() {
  const calls = mockAddTypeHandler.mock.calls
  return calls[calls.length - 1][1] as (msg: { t: string; p: unknown }) => void
}

// --- Tests ---

beforeEach(() => {
  vi.clearAllMocks()
})

describe('BaseContentType', () => {
  test('registers a socket type handler on construction', () => {
    new BaseContentType({ name: 'mytype' })
    expect(mockAddTypeHandler).toHaveBeenCalledWith(
      'mytype',
      expect.any(Function)
    )
  })

  test('name returns the content type name', () => {
    const ct = new BaseContentType({ name: 'mytype' })
    expect(ct.name).toBe('mytype')
  })

  test('handleMessage dispatches to registered handler', () => {
    const ct = new BaseContentType({ name: 'mytype' })
    const handler = vi.fn()
    ct.on('added', handler)

    captureSocketHandler()({ t: 'mytype.added', p: { pk: 1 } })

    expect(handler).toHaveBeenCalledWith({ pk: 1 })
  })

  test('handleMessage queues messages until a handler is registered, then replays them', () => {
    const ct = new BaseContentType({ name: 'mytype' })
    const socketHandler = captureSocketHandler()

    socketHandler({ t: 'mytype.added', p: { pk: 1 } })
    socketHandler({ t: 'mytype.added', p: { pk: 2 } })

    const handler = vi.fn()
    ct.on('added', handler)

    expect(handler).toHaveBeenCalledTimes(2)
    expect(handler).toHaveBeenNthCalledWith(1, { pk: 1 })
    expect(handler).toHaveBeenNthCalledWith(2, { pk: 2 })
  })

  test('queue is cleared after replay so a second handler does not receive old messages', () => {
    const ct = new BaseContentType({ name: 'mytype' })
    captureSocketHandler()({ t: 'mytype.added', p: { pk: 1 } })
    ct.on('added', vi.fn())

    const lateHandler = vi.fn()
    ct.on('added', lateHandler)

    expect(lateHandler).not.toHaveBeenCalled()
  })

  test('on with override=false does not replace an existing handler', () => {
    const ct = new BaseContentType({ name: 'mytype' })
    const first = vi.fn()
    const second = vi.fn()

    ct.on('added', first)
    ct.on('added', second, false)

    captureSocketHandler()({ t: 'mytype.added', p: { pk: 1 } })

    expect(first).toHaveBeenCalledWith({ pk: 1 })
    expect(second).not.toHaveBeenCalled()
  })

  test('onChanged registers handler for both changed and added (added as fallback)', () => {
    const ct = new BaseContentType({ name: 'mytype' })
    const handler = vi.fn()
    ct.onChanged(handler)

    const socketHandler = captureSocketHandler()
    socketHandler({ t: 'mytype.changed', p: { pk: 1 } })
    socketHandler({ t: 'mytype.added', p: { pk: 2 } })

    expect(handler).toHaveBeenNthCalledWith(1, { pk: 1 })
    expect(handler).toHaveBeenNthCalledWith(2, { pk: 2 })
  })

  test('onDeleted registers handler for deleted events', () => {
    const ct = new BaseContentType({ name: 'mytype' })
    const handler = vi.fn()
    ct.onDeleted(handler)

    captureSocketHandler()({ t: 'mytype.deleted', p: { pk: 5 } })

    expect(handler).toHaveBeenCalledWith({ pk: 5 })
  })

  test('methodCall calls socket.call with name.method', () => {
    const ct = new BaseContentType({ name: 'mytype' })
    ct.methodCall('add', { foo: 'bar' })
    expect(mockSocketCall).toHaveBeenCalledWith(
      'mytype.add',
      { foo: 'bar' },
      undefined
    )
  })

  test('methodCall forwards config to socket.call', () => {
    const ct = new BaseContentType({ name: 'mytype' })
    const config = { leaveDelay: 0 }
    ct.methodCall('add', {}, config)
    expect(mockSocketCall).toHaveBeenCalledWith('mytype.add', {}, config)
  })

  test('getContentApi throws when no restEndpoint is configured', () => {
    const ct = new BaseContentType({ name: 'mytype' })
    expect(() => ct.getContentApi()).toThrow(
      'Content Api not configured for Content Type mytype'
    )
  })

  test('getContentApi returns a ContentAPI instance with the configured endpoint', () => {
    const ct = new BaseContentType({ name: 'mytype', restEndpoint: 'my/' })
    ct.getContentApi()
    expect(MockContentAPI).toHaveBeenCalledWith('my/', undefined)
  })

  test('api getter caches the ContentAPI instance', () => {
    const ct = new BaseContentType({ name: 'mytype', restEndpoint: 'my/' })
    const first = ct.api
    const second = ct.api
    expect(first).toBe(second)
    expect(MockContentAPI).toHaveBeenCalledTimes(1)
  })
})

describe('ContentType', () => {
  test('rolesApi throws if no roles are configured', () => {
    const ct = new ContentType({ name: 'mytype' })
    expect(() => ct.rolesApi).toThrow('ContentType has no roles')
  })

  test('rolesApi returns a ContentAPI pointing at the roles endpoint', () => {
    const ct = new ContentType({
      name: 'mytype',
      roles: { definitions: {}, endpoint: 'roles/' }
    })
    ct.rolesApi
    expect(MockContentAPI).toHaveBeenCalledWith('roles/')
  })

  test('rolesApi getter caches the instance', () => {
    const ct = new ContentType({
      name: 'mytype',
      roles: { definitions: {}, endpoint: 'roles/' }
    })
    expect(ct.rolesApi).toBe(ct.rolesApi)
    expect(MockContentAPI).toHaveBeenCalledTimes(1)
  })

  test('getRole throws when no role definitions are available', () => {
    const ct = new ContentType({ name: 'mytype' })
    expect(() => ct.getRole('admin' as never)).toThrow('No role definitions')
  })

  test('getRole returns the matching role definition', () => {
    const adminDef = { label: 'Admin' } as any
    const ct = new ContentType({
      name: 'mytype',
      roles: { definitions: { admin: adminDef }, endpoint: 'roles/' }
    })
    expect(ct.getRole('admin' as never)).toBe(adminDef)
  })

  test('updateMap keeps the map in sync with added, changed, and deleted events', () => {
    const ct = new ContentType({ name: 'mytype' })
    const map = new Map<number, { pk: number; state?: string }>()
    ct.updateMap(map)

    const socketHandler = captureSocketHandler()
    socketHandler({ t: 'mytype.added', p: { pk: 1, state: 'draft' } })
    expect(map.get(1)).toEqual({ pk: 1, state: 'draft' })

    socketHandler({ t: 'mytype.changed', p: { pk: 1, state: 'published' } })
    expect(map.get(1)).toEqual({ pk: 1, state: 'published' })

    socketHandler({ t: 'mytype.deleted', p: { pk: 1 } })
    expect(map.has(1)).toBe(false)
  })

  test('updateMap registers channelMap with contentCleanup when provided', () => {
    const ct = new ContentType({ name: 'mytype' })
    const map = new Map<number, { pk: number; state?: string }>()
    const channelMap = { meeting: 'meeting' } as any
    ct.updateMap(map, channelMap)
    expect(mockContentCleanup.register).toHaveBeenCalledWith(map, channelMap)
  })

  test('updateMap skips contentCleanup when no channelMap is provided', () => {
    const ct = new ContentType({ name: 'mytype' })
    ct.updateMap(new Map())
    expect(mockContentCleanup.register).not.toHaveBeenCalled()
  })

  test('sm throws when no states are configured', () => {
    const ct = new ContentType({ name: 'mytype' })
    expect(() => ct.sm).toThrow('has no registered state machine')
  })

  test('sm calls useStateMachine composable with states name, meta and api', () => {
    const states = {
      name: 'MyMachine',
      meta: { draft: { icon: 'mdi-draft' } }
    } as any
    const ct = new ContentType({ name: 'mytype', restEndpoint: 'my/', states })
    void ct.sm
    expect(mockUseStateMachine).toHaveBeenCalledWith(
      states.name,
      states.meta,
      expect.anything()
    )
  })

  test('sm getter caches the result', () => {
    const states = { name: 'MyMachine', meta: {} } as any
    const ct = new ContentType({ name: 'mytype', restEndpoint: 'my/', states })
    expect(ct.sm).toBe(ct.sm)
    expect(mockUseStateMachine).toHaveBeenCalledTimes(1)
  })

  test('useContextRoles throws when no roles are configured', () => {
    const ct = new ContentType({ name: 'mytype' })
    expect(() => ct.useContextRoles()).toThrow(
      'not configured to have context roles'
    )
  })

  test('useContextRoles delegates to useContextRoles composable with the content type name', () => {
    const ct = new ContentType({
      name: 'mytype',
      roles: { definitions: {}, endpoint: 'roles/' }
    })
    ct.useContextRoles()
    expect(mockUseContextRoles).toHaveBeenCalledWith('mytype')
  })
})
