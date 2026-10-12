import { afterEach, expect, test, vi } from 'vitest'

import submitLogin from './submitLogin'

const submit = vi
  .spyOn(HTMLFormElement.prototype, 'submit')
  .mockImplementation(() => {})

afterEach(() => {
  submit.mockClear()
  document.body.replaceChildren()
  document.cookie = 'csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 GMT'
})

function submitted() {
  const form = submit.mock.contexts.at(-1) as HTMLFormElement
  return {
    method: form.method,
    action: form.action,
    fields: Object.fromEntries(new FormData(form))
  }
}

test('one of our login URLs is posted, with the CSRF token', () => {
  document.cookie = 'csrftoken=a-token'

  submitLogin('/login/scoutid/', { next: '/m/1/a-meeting' })

  expect(submitted()).toEqual({
    method: 'post',
    action: `${location.origin}/login/scoutid/`,
    fields: { next: '/m/1/a-meeting', csrfmiddlewaretoken: 'a-token' }
  })
})

test('a login URL on another origin is visited, without our token', () => {
  document.cookie = 'csrftoken=a-token'
  const assign = vi.spyOn(location, 'assign').mockImplementation(() => {})

  submitLogin('https://id.example.com/login-to/testserver', { next: '/here' })

  expect(submit).not.toHaveBeenCalled()
  expect(assign).toHaveBeenCalledWith(
    'https://id.example.com/login-to/testserver?next=%2Fhere'
  )
  assign.mockRestore()
})
