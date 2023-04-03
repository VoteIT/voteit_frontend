import { enumerate, izip } from 'itertools'
import { ComposerTranslation } from 'vue-i18n'

type Rule = (value: string) => string | true

const emailPattern =
  /^(([^<>()[\].,:\s@"]+(\.[^<>()[\].,:\s@"]+)*)|(".+"))@(([^<>()[\].,:\s@"]+\.)+[^<>()[\].,:\s@"]{2,})$/i
const swedishSSNPattern = /^(\d{6}|\d{8})-?\d{4}$/

export default function useRules (t: ComposerTranslation) {
  function email (value: string) {
    return !value.length || emailPattern.test(value) || t('invites.email.invalid')
  }

  function required (value: unknown) {
    if (Array.isArray(value)) return !!value.length || t('rules.required')
    return !!value || t('rules.required')
  }

  function max (max: number) {
    return (value: string) => !value || Number(value) <= max || t('rules.maxValue', max)
  }

  function maxLength (max: number) {
    return (value: string) => value.length <= max || t('rules.maxLength', max)
  }

  function min (min: number) {
    return (value: string) => !value || Number(value) >= min || t('rules.minValue', min)
  }

  function minLength (min: number) {
    return (value: string) => value.length >= min || t('rules.minLength', min)
  }

  function multiline (rule: Rule): Rule {
    // /**
    //  * @returns true means incorrect line was found
    //  */
    // function failChecker (line: string) {
    //   return !!line.length && typeof rule(line) === 'string'
    // }
    return (value: string) => {
      for (const [i, line] of enumerate(value.split('\n'), 1)) {
        const result = rule(line)
        if (line && typeof result === 'string') return `${t('rules.multilineFailed', i)}: ${result}`
      }
      return true
      // const errLine = value.split('\n').findIndex(failChecker)
      // return errLine === -1 || `${t('rules.multilineFailed', errLine + 1)}: ${}`
    }
  }

  function or (...rules: Rule[]): Rule {
    return (value: string) => {
      return rules.some(rule => rule(value) === true) || t('rules.noMatch')
    }
  }

  function swedishSSN (value: string) {
    return !value.length || swedishSSNPattern.test(value) || t('invites.swedish_ssn.invalid')
  }

  function tabSeparated (...rules: Rule[]): Rule {
    return (value: string) => {
      const values = value.split('\t')
      if (values.length !== rules.length) return t('rules.tabSeparatedBadLength', rules.length)
      for (const [value, rule] of izip(values, rules)) {
        const result = rule(value.trim())
        if (typeof result === 'string') return result
      }
      return true
    }
  }

  return {
    email,
    required,
    max,
    maxLength,
    min,
    minLength,
    multiline,
    or,
    swedishSSN,
    tabSeparated
  }
}
