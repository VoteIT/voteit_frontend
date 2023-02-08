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

  function min (min: number) {
    return (value: string) => !value || Number(value) >= min || t('rules.minValue', min)
  }

  function multiline (...rules: Rule[]) {
    /**
     * @returns true means incorrect line was found
     */
    function failChecker (line: string) {
      return !!line.length && rules.every(rule => typeof rule(line) === 'string')
    }
    return (value: string) => {
      const errLine = value.split('\n').findIndex(failChecker)
      return errLine === -1 || t('rules.multilineFailed', errLine + 1)
    }
  }

  function swedishSSN (value: string) {
    return !value.length || swedishSSNPattern.test(value) || t('invites.swedish_ssn.invalid')
  }

  return {
    email,
    required,
    max,
    min,
    multiline,
    swedishSSN
  }
}
