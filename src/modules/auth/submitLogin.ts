import { getCSRFToken } from '@/utils/restApi'

/**
 * Leave for a login URL.
 *
 * social_django only starts a login on a CSRF protected POST, so one of ours
 * is submitted as a form rather than visited. A URL on another origin is
 * visited instead, and never sees our token.
 */
export default function submitLogin(
  url: string,
  fields: Record<string, string> = {}
) {
  const target = new URL(url, location.href)
  if (target.origin !== location.origin) {
    for (const [name, value] of Object.entries(fields))
      target.searchParams.set(name, value)
    location.assign(target.href)
    return
  }
  const form = document.createElement('form')
  form.method = 'post'
  form.action = target.href
  const csrfToken = getCSRFToken()
  if (csrfToken) fields = { ...fields, csrfmiddlewaretoken: csrfToken }
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = value
    form.append(input)
  }
  document.body.append(form)
  form.submit()
}
