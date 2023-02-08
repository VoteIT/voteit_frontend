import { expect, test } from 'vitest'
import { ComposerTranslation } from 'vue-i18n'

import useRules from './useRules'

const correctEmails = `test@example.com
test2@example.com
`
const incorrectEmails = `test@example.com
@example.com
`
const correctMix = `test@example.com
1212121212
`
const correctSSNs = `1212121211
1212121212
`
const incorrectSSN = `1212121211
x212121212
`

test('rules', () => {
  const rules = useRules(((key: string) => key) as ComposerTranslation)

  const multiEmail = rules.multiline(rules.email)
  const multiMix = rules.multiline(rules.email, rules.swedishSSN)
  const multiSSN = rules.multiline(rules.swedishSSN)

  expect(multiEmail(correctEmails)).toBe(true)
  expect(multiEmail(incorrectEmails)).toBe('rules.multilineFailed')
  expect(multiEmail(correctMix)).toBe('rules.multilineFailed')
  expect(multiMix(correctEmails)).toBe(true)
  expect(multiMix(correctMix)).toBe(true)
  expect(multiMix(correctSSNs)).toBe(true)
  expect(multiMix(incorrectSSN)).toBe('rules.multilineFailed')
  expect(multiSSN(correctSSNs)).toBe(true)
  expect(multiSSN(incorrectSSN)).toBe('rules.multilineFailed')
  expect(multiSSN(correctMix)).toBe('rules.multilineFailed')
})
