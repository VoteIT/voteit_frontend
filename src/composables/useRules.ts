import { ComposerTranslation } from 'vue-i18n'

const emailPattern =
  /^(([^<>()[\].,:\s@"]+(\.[^<>()[\].,:\s@"]+)*)|(".+"))@(([^<>()[\].,:\s@"]+\.)+[^<>()[\].,:\s@"]{2,})$/i
const swedishSSNPattern = /^(\d{6}|\d{8})-?\d{4}$/

export default function useRules (t: ComposerTranslation) {
  function email (value: string) {
    return !value.length || emailPattern.test(value) || t('invites.email.invalid')
  }

  function required (value: unknown) {
    return !!value || t('required')
  }

  function multiLineEmail (value: string) {
    for (const line of value.split('\n')) {
      if (line && !emailPattern.test(line)) return t('invites.email.invalid')
    }
    return true
  }

  function multiLineSwedishSSN (value: string) {
    for (const line of value.split('\n')) {
      if (line && !swedishSSNPattern.test(line)) return t('invites.swedish_ssn.invalid')
    }
    return true
  }

  function swedishSSN (value: string) {
    return !value.length || emailPattern.test(value) || t('invites.swedish_ssn.invalid')
  }

  return {
    email,
    required,
    multiLineEmail,
    multiLineSwedishSSN,
    swedishSSN
  }
}
