import { expect, test } from 'vitest'

import { getAcceptTosResume } from './acceptTos'

test('resumes the login with the accepted version', () => {
  const resume = getAcceptTosResume({
    partial_token: 'a-token',
    resume_url: '/complete/idproxy/'
  })
  expect(resume?.(12)).toBe(
    '/complete/idproxy/?partial_token=a-token&accept_tos=12'
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
