import { describe, expect, test } from 'bun:test'
import { cleanXUrl } from './clean-x-url.ts'

describe('cleanXUrl', () => {
  test('strips the share attribution tail', () => {
    expect(
      cleanXUrl('https://x.com/iAl3eez/status/2115814411512483994?a=OZij9U5d1dIw3zPRA3A&s=20'),
    ).toBe('https://x.com/iAl3eez/status/2115814411512483994')
    expect(cleanXUrl('https://x.com/handle/status/1234567890?t=AbCdEf-12345_xyz&s=46')).toBe(
      'https://x.com/handle/status/1234567890',
    )
    expect(cleanXUrl('https://twitter.com/handle/status/123?s=19')).toBe(
      'https://twitter.com/handle/status/123',
    )
  })

  test('strips unknown future parameters', () => {
    expect(cleanXUrl('https://x.com/a/status/42?z=1&utm_source=x&b=new')).toBe(
      'https://x.com/a/status/42',
    )
  })

  test('drops the media sub-path, keeping only the post', () => {
    expect(cleanXUrl('https://x.com/a/status/42/photo/1?s=20')).toBe('https://x.com/a/status/42')
    expect(cleanXUrl('https://x.com/a/status/42/video/2')).toBe('https://x.com/a/status/42')
  })

  test('handles i/ and i/web/ post paths and mobile hosts', () => {
    expect(cleanXUrl('https://x.com/i/status/42?s=20')).toBe('https://x.com/i/status/42')
    expect(cleanXUrl('https://x.com/i/web/status/42?s=20')).toBe('https://x.com/i/web/status/42')
    expect(cleanXUrl('https://mobile.twitter.com/a/status/42?s=20')).toBe(
      'https://mobile.twitter.com/a/status/42',
    )
  })

  test('trims surrounding whitespace', () => {
    expect(cleanXUrl('  https://x.com/a/status/42?s=20\n')).toBe('https://x.com/a/status/42')
    expect(cleanXUrl('\nhttps://x.com/a/status/42\n')).toBe('https://x.com/a/status/42')
  })

  test('leaves already clean post links untouched', () => {
    const clean = 'https://x.com/a/status/42'
    expect(cleanXUrl(clean)).toBe(clean)
  })

  test('leaves everything else untouched', () => {
    for (const untouched of [
      '',
      'just some text',
      'https://example.com/a/status/42?s=20',
      'https://youtube.com/watch?v=abc&t=42s',
      'https://x.com/someone',
      'https://x.com/someone?s=20',
      'https://x.com/someone/status/abc?s=20',
      'https://notx.com/a/status/42?s=20',
      'https://x.com.evil.test/a/status/42?s=20',
      'ftp://x.com/a/status/42',
      'javascript:alert(1)',
    ]) {
      expect(cleanXUrl(untouched)).toBe(untouched)
    }
  })
})
