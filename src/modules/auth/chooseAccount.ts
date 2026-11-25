import { RESUME_PATH } from './acceptTos'

/** Fields the login pipeline reads the answer from. */
export const CHOOSE_ACCOUNT_FIELD = 'choose_account'
export const MERGE_ACCOUNTS_FIELD = 'merge_accounts'

export type ChooseAccountAnswer = { account: number } | 'merge'

/**
 * Where to send an answer to a login paused on several accounts, or
 * undefined if the resume URL isn't one we trust.
 */
export function getChooseAccountResume(
  token: string | undefined,
  resumeURL: string | undefined
) {
  if (!token || !resumeURL || !RESUME_PATH.test(resumeURL)) return
  return (answer: ChooseAccountAnswer) => {
    const params = new URLSearchParams({ partial_token: token })
    if (answer === 'merge') params.set(MERGE_ACCOUNTS_FIELD, '1')
    else params.set(CHOOSE_ACCOUNT_FIELD, String(answer.account))
    return `${resumeURL}?${params}`
  }
}
