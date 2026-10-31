import { cleanShareData, cleanXUrl } from './clean-x-url.ts'

/**
 * Rewrites the argument of `navigator.clipboard.writeText`, which is what X's
 * Share -> Copy Link button actually calls. Hooking the web standard instead
 * of the share modal's DOM survives X's UI churn.
 */
function patchClipboardWrite(): void {
  const clipboard: Clipboard | undefined = navigator.clipboard
  if (!clipboard || typeof clipboard.writeText !== 'function') return

  const writeText = clipboard.writeText.bind(clipboard)
  Object.defineProperty(clipboard, 'writeText', {
    configurable: true,
    writable: true,
    value(data: string): Promise<void> {
      return writeText(typeof data === 'string' ? cleanXUrl(data) : data)
    },
  })
}

/**
 * "Share post via …" hands the same tracked link to the OS share sheet via
 * `navigator.share({url})`. X only renders that menu item when
 * `navigator.share` is a function, and the browser requires transient user
 * activation, so the wrapper must stay a plain function that calls through
 * synchronously.
 */
function patchShare(): void {
  const share = navigator.share
  if (typeof share !== 'function') return

  Object.defineProperty(navigator, 'share', {
    configurable: true,
    writable: true,
    value(data: ShareData): Promise<void> {
      return share.call(navigator, cleanShareData(data))
    },
  })
}

/** Text being copied: a document selection, else a focused field's selection. */
function copiedText(): string | null {
  const selection = document.getSelection()?.toString() ?? ''
  if (selection !== '') return selection

  const active = document.activeElement
  if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
    const start = active.selectionStart ?? 0
    const end = active.selectionEnd ?? start
    if (end > start) return active.value.slice(start, end)
  }
  return null
}

/**
 * Fallback for the `document.execCommand('copy')` path: X may select a hidden
 * input's value and copy it, which never touches the Clipboard API.
 */
function onCopy(event: ClipboardEvent): void {
  const text = copiedText()
  if (text === null) return

  const cleaned = cleanXUrl(text)
  if (cleaned === text) return

  event.clipboardData?.setData('text/plain', cleaned)
  event.preventDefault()
}

patchClipboardWrite()
patchShare()
document.addEventListener('copy', onCopy, true)
