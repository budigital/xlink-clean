/**
 * X/Twitter appends a per-share attribution tail to copied post links, e.g.
 * `?a=OZij9U5d1dIw3zPRA3A&s=20` or `?t=AbCdEf-12345_xyz&s=46`.
 *
 * `s` encodes the device + share method, `t` and `a` are opaque per-device /
 * per-share tokens. X keeps inventing new ones, so we do not keep a list of
 * known trackers: for a post URL the path alone is enough to render it, so the
 * whole query and any trailing path segment (`/photo/1`, `/video/1`) goes.
 */

const X_HOSTS: Record<string, true> = {
  'x.com': true,
  'www.x.com': true,
  'mobile.x.com': true,
  'twitter.com': true,
  'www.twitter.com': true,
  'mobile.twitter.com': true,
}

/** `/handle/status/123…`, `/i/status/123…`, `/i/web/status/123…` */
const STATUS_PATH = /^\/(?:[A-Za-z0-9_]{1,15}|i(?:\/web)?)\/status\/(?:\d+)/

/**
 * Canonical form of an X/Twitter post link, or `input` untouched when it is
 * not one (profiles, other hosts, YouTube `?t=42` timestamps, plain text).
 */
export function cleanXUrl(input: string): string {
  const trimmed = input.trim()
  if (trimmed === '') return input

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return input
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return input
  if (X_HOSTS[url.hostname] !== true) return input

  const path = STATUS_PATH.exec(url.pathname)?.[0]
  if (path === undefined) return input

  const cleaned = `${url.protocol}//${url.host}${path}`
  if (cleaned === trimmed) return trimmed === input ? input : trimmed
  return cleaned
}
