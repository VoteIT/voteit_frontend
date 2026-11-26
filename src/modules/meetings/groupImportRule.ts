import useRules from '@/composables/useRules'

/**
 * Validate pasted group import rows. Columns: title, groupid, votes. Groupid
 * may be empty: the backend then updates the group with that title, or creates
 * one with a generated groupid. Same max length as the backend.
 */
export function groupImportRule(rules: ReturnType<typeof useRules>) {
  const optionalGroupid = rules.maxLength(100)
  return rules.multiline(
    rules.or(
      rules.tabSeparated(rules.minLength(1)),
      rules.tabSeparated(rules.minLength(1), optionalGroupid),
      rules.tabSeparated(rules.minLength(1), optionalGroupid, rules.min(0))
    )
  )
}
