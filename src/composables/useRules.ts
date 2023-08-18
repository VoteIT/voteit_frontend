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
    return (value: string) => {
      for (const [i, line] of enumerate(value.split('\n'), 1)) {
        const result = rule(line)
        if (line && typeof result === 'string') return `${t('rules.multilineFailed', i)}: ${result}`
      }
      return true
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

  /**
   * For CSV-like input, require equal columns over all non-empty rows.
   * @param [max] Expect at most this many columns
   * @param [min=1] Expect at least this many columns
   */
  function tabSeparatedEqualColumns (max: number, min: number = 1): Rule {
    return (value: string) => {
      if (!value.length) return true
      const [firstRow] = value.split('\n', 1)
      const columnCount = firstRow.split('\t').length
      if (columnCount < min) return t('rules.tabSeparatedMinColumns', min)
      if (max && columnCount > max) return t('rules.tabSeparatedMaxColumns', max)
      for (const [i, row] of enumerate(value.split('\n'), 1)) {
        if (!row.trim()) continue
        if (row.split('\t').length !== columnCount) return t('rules.tabSeparatedBadColumnCount', i)
      }
      return true
    }
  }

  function trimmed (rule: Rule): Rule {
    return (value: string) => rule(value.trim())
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
    tabSeparated,
    tabSeparatedEqualColumns,
    trimmed
  }
}
