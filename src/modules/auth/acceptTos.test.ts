import { expect, test } from 'vitest'

import { getAcceptTosResume } from './acceptTos'

test('resumes the login with the accepted version', () => {
  const resume = getAcceptTosResume({
    partial_token: 'a-token',
    resume_url: '/complete/idproxy/'
  })
  expect(resume?.('2026-09-01T12:00:00+02:00')).toBe(
    '/complete/idproxy/?partial_token=a-token&accept_tos=2026-09-01T12%3A00%3A00%2B02%3A00'
  )
})

test('refuses anything but our own pipeline', () => {
  for (const resume_url of [
    'https://evil.example/complete/idproxy/',
    '//evil.example/complete/idproxy/',
    '/complete/idproxy/../../logout/',
    '/somewhere/else/'
  ])
    expect(
      getAcceptTosResume({ partial_token: 'a-token', resume_url })
    ).toBeUndefined()
})

test('needs a token and a resume URL', () => {
  expect(
    getAcceptTosResume({ resume_url: '/complete/idproxy/' })
  ).toBeUndefined()
  expect(getAcceptTosResume({ partial_token: 'a-token' })).toBeUndefined()
  expect(getAcceptTosResume({})).toBeUndefined()
})
