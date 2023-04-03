import { expect, test } from 'vitest'
import { ComposerTranslation } from 'vue-i18n'

import useRules from './useRules'

const rules = useRules(((key: string) => key) as ComposerTranslation)

test('Required rule', () => {
  expect(rules.required('any')).toBe(true)
  expect(rules.required('')).toBe('rules.required')
})

test('Min max rules', () => {
  expect(rules.max(3)('3')).toBe(true)
  expect(rules.max(3)('4')).toBe('rules.maxValue')
  expect(rules.min(3)('3')).toBe(true)
  expect(rules.min(3)('2')).toBe('rules.minValue')
})

test('Min max length rules', () => {
  expect(rules.maxLength(3)('abc')).toBe(true)
  expect(rules.maxLength(3)('abcd')).toBe('rules.maxLength')
  expect(rules.minLength(3)('abc')).toBe(true)
  expect(rules.minLength(3)('ab')).toBe('rules.minLength')
})

test('Or rule', () => {
  expect(rules.or(rules.max(2), rules.min(4))('2')).toBe(true)
  expect(rules.or(rules.max(2), rules.min(4))('3')).toBe('rules.noMatch')
  expect(rules.or(rules.max(2), rules.min(4))('4')).toBe(true)
  const threeOr = rules.or(rules.maxLength(2), rules.minLength(4), rules.min(500))
  expect(threeOr('99')).toBe(true)
  expect(threeOr('100')).toBe('rules.noMatch')
  expect(threeOr('499')).toBe('rules.noMatch')
  expect(threeOr('500')).toBe(true)
})

test('Email rule', () => {
  const invalid = 'invites.email.invalid'
  expect(rules.email('')).toBe(true)

  expect(rules.email('test@example.com')).toBe(true)
  expect(rules.email('åäö@example.com')).toBe(true)

  expect(rules.email('test@example.com ')).toBe(invalid)
  expect(rules.email('@example.com')).toBe(invalid)
  expect(rules.email('test@@example.com')).toBe(invalid)
  expect(rules.email('test@example')).toBe(invalid)
})

test('Swedish SSN rule', () => {
  const invalid = 'invites.swedish_ssn.invalid'
  expect(rules.swedishSSN('')).toBe(true)

  expect(rules.swedishSSN('121212-1212')).toBe(true)
  expect(rules.swedishSSN('20121212-1212')).toBe(true)
  expect(rules.swedishSSN('1212121212')).toBe(true)
  expect(rules.swedishSSN('201212121212')).toBe(true)

  expect(rules.swedishSSN('letters')).toBe(invalid)
  expect(rules.swedishSSN('121212-121')).toBe(invalid)
  expect(rules.swedishSSN('121212-12122')).toBe(invalid)
  expect(rules.swedishSSN('121212121')).toBe(invalid)
  expect(rules.swedishSSN('12121212122')).toBe(invalid)
})

test('Multiline rules', () => {
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

  const invalid = 'rules.multilineFailed'
  const multiEmail = rules.multiline(rules.email)
  const multiMix = rules.multiline(rules.or(rules.email, rules.swedishSSN))
  const multiSSN = rules.multiline(rules.swedishSSN)

  expect(multiEmail(correctEmails)).toBe(true)
  expect(multiEmail(incorrectEmails)).toBe(invalid)
  expect(multiEmail(correctMix)).toBe(invalid)
  expect(multiMix(correctEmails)).toBe(true)
  expect(multiMix(correctMix)).toBe(true)
  expect(multiMix(correctSSNs)).toBe(true)
  expect(multiMix(incorrectSSN)).toBe(invalid)
  expect(multiSSN(correctSSNs)).toBe(true)
  expect(multiSSN(incorrectSSN)).toBe(invalid)
  expect(multiSSN(correctMix)).toBe(invalid)
})

test('TabSeparated', () => {
  const mixRule = rules.tabSeparated(rules.minLength(1), rules.email, rules.swedishSSN)

  expect(mixRule('One\ttwo')).toEqual('rules.tabSeparatedBadLength')
  expect(mixRule('\ttwo\tthree')).toEqual('rules.minLength')
  expect(mixRule('One\ttwo\tthree')).toEqual('invites.email.invalid')
  expect(mixRule('One\ttest@example.com\tthree')).toEqual('invites.swedish_ssn.invalid')
  expect(mixRule('One\ttest@example.com\t1212121212')).toEqual(true)
})
