const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:', 'sms:']

/**
 * Make sure a link is either an absolute URL with an allowed protocol, or a
 * root-relative path. Values without a protocol get https:// prepended.
 * Returns undefined if the value can't be made into a safe link.
 */
export function sanitizeLink(url: string): string | undefined {
  const value = url.trim()
  if (!value) return
  // Root-relative path (but not protocol-relative "//host")
  if (value.startsWith('/') && !value.startsWith('//')) return value
  try {
    if (ALLOWED_PROTOCOLS.includes(new URL(value).protocol)) return value
  } catch {
    // Not an absolute URL - try prefixing below
  }
  // Prefixing always yields https:, so e.g. "javascript:…" can't sneak through
  const prefixed = `https://${value.replace(/^\/+/, '')}`
  try {
    new URL(prefixed)
    return prefixed
  } catch {
    return
  }
}
