import { expect, test } from 'vitest'

import { getChooseAccountResume } from './chooseAccount'

test('resumes the login with the chosen account', () => {
  const resume = getChooseAccountResume('a-token', '/complete/idproxy/')
  expect(resume?.({ account: 12 })).toBe(
    '/complete/idproxy/?partial_token=a-token&choose_account=12'
  )
})

test('resumes the login asking for a merge', () => {
  const resume = getChooseAccountResume('a-token', '/complete/idproxy/')
  expect(resume?.('merge')).toBe(
    '/complete/idproxy/?partial_token=a-token&merge_accounts=1'
  )
})

test('refuses anything but our own pipeline', () => {
  for (const resumeURL of [
    'https://evil.example/complete/idproxy/',
    '//evil.example/complete/idproxy/',
    '/somewhere/else/'
  ])
    expect(getChooseAccountResume('a-token', resumeURL)).toBeUndefined()
})

test('needs a token', () => {
  expect(
    getChooseAccountResume(undefined, '/complete/idproxy/')
  ).toBeUndefined()
  expect(getChooseAccountResume('', '/complete/idproxy/')).toBeUndefined()
})
