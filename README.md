# Clean X Link

Chrome extension that strips tracking parameters from X/Twitter post links the
moment you copy them.

When you hit **Share → Copy Link** on a post, X appends an attribution tail you
never asked for:

```
https://x.com/iAl3eez/status/2115814411512483994?a=OZij9U5d1dIw3zPRA3A&s=20
        ^ the whole link                                            ^ tracker
```

`a` and `t` are opaque per-share / per-device tokens, `s` encodes the device and
which button you clicked. You end up with:

```
https://x.com/iAl3eez/status/2115814411512483994
```

## Why it strips everything instead of a known list

X ships new share parameters faster than any list-based cleaner patches itself
(`s`, `t`, `cn`, `refsrc`, now `a`). For a post URL the path alone renders the
post, so the entire query string — and any `/photo/1` tail — is dropped. Unknown
future parameters are handled by construction.

## How it works

Two hooks, both at the moment of copying:

1. **`navigator.clipboard.writeText`** is wrapped from a `world: "MAIN"` content
   script. This is what X's Copy Link button calls, and it is a web standard, so
   it survives X's DOM rewrites. Built for Chrome 111+.
2. **A capture-phase `copy` listener** covers the older
   `document.execCommand('copy')` path (a hidden input selected and copied),
   including a text selection that is exactly one post link.

Only arguments that parse as an `x.com` / `twitter.com` post URL are rewritten.
Profiles, other hosts, YouTube's `?t=42` timestamps, and plain text pass through
untouched.

## Permissions

None. The page still performs the clipboard write — the extension only rewrites
the argument on its way there, so it never needs clipboard access itself. The
manifest requests only `content_scripts` on `x.com` and `twitter.com`.

## Install (unpacked)

```sh
bun install
bun run build        # writes dist/
```

Then `chrome://extensions` → enable **Developer mode** → **Load unpacked** →
select `dist/`.

## Develop

```sh
bun test             # URL cleaning rules
bunx tsc --noEmit    # types
bun run build        # bundle src/main.ts -> dist/main.js (IIFE) + copy manifest
```

`dist/` is throwaway: `build.ts` wipes and regenerates it.

## Limitations

- **`t.co` short links** cannot be resolved without a network round trip, so
  they are left alone.
- **The share modal's visible URL is not rewritten** — only what reaches the
  clipboard. Changing the DOM would break on every X redesign.
- **Mobile share sheets** are outside a desktop extension's reach.
- Clipboard writes from a headless test browser are refused by Chromium, so the
  interceptor is verified by asserting what it hands to `writeText` and what the
  `copy` event payload contains (`dist/` behaviour, not OS clipboard).
- No icon in the manifest yet; the Web Store listing needs a 128×128 PNG in
  `public/` before publishing.
