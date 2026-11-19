import { useMemo, type ReactNode } from 'react'
import privacyMd from '../../docs/store/privacy-policy.md?raw'
import termsMd from '../../docs/store/terms.md?raw'
import { useT, type Lang } from '../core/i18n'
import { useApp, type LegalDoc } from '../core/store'
import { LS } from '../ui/legalStrings'

const SOURCES: Record<LegalDoc, string> = { privacy: privacyMd, terms: termsMd }
const LINK_TARGETS: Record<string, LegalDoc> = { './privacy-policy.md': 'privacy', './terms.md': 'terms' }

/** The docs hold an Italian and an English section (plus internal notes on top): pick the one for `lang`, falling back to English. */
function section(md: string, lang: Lang): string {
  const flag = lang === 'it' ? '## 🇮🇹' : '## 🇬🇧'
  const lines = md.split('\n')
  const start = lines.findIndex((l) => l.startsWith(flag))
  if (start < 0) return ''
  const out: string[] = []
  for (const l of lines.slice(start)) {
    if (out.length && (l.trim() === '---' || /^## 🇮🇹|^## 🇬🇧/.test(l))) break
    out.push(l)
  }
  out[0] = out[0].replace(/^## \S+\s*/, '# ')
  return out.join('\n')
}

function inline(text: string, open: (d: LegalDoc) => void): ReactNode[] {
  const out: ReactNode[] = []
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)]+)\)|<(https?:[^>]+)>/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const k = out.length
    if (m[1] !== undefined) out.push(<b key={k}>{inline(m[1], open)}</b>)
    else if (m[2] !== undefined) out.push(<i key={k}>{m[2]}</i>)
    else if (m[3] !== undefined) {
      const target = LINK_TARGETS[m[4]]
      out.push(
        target ? (
          <a key={k} href="#" onClick={(e) => (e.preventDefault(), open(target))}>
            {m[3]}
          </a>
        ) : (
          <a key={k} href={m[4]} target="_blank" rel="noopener noreferrer">
            {m[3]}
          </a>
        ),
      )
    } else
      out.push(
        <a key={k} href={m[5]} target="_blank" rel="noopener noreferrer">
          {m[5]}
        </a>,
      )
    last = re.lastIndex
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

/** Tiny Markdown renderer for our own legal docs: headings, paragraphs, bullet lists, bold/italic, links. */
function render(md: string, open: (d: LegalDoc) => void): ReactNode[] {
  const blocks: ReactNode[] = []
  let para: string[] = []
  let list: string[] = []
  const flush = () => {
    const k = blocks.length
    if (para.length)
      blocks.push(
        <p key={k} style={{ lineHeight: 1.5, margin: '0 0 12px' }}>
          {para.flatMap((l, i) => (i ? [<br key={`b${i}`} />, ...inline(l, open)] : inline(l, open)))}
        </p>,
      )
    else if (list.length)
      blocks.push(
        <ul key={k} style={{ lineHeight: 1.5, margin: '0 0 12px', paddingLeft: 22 }}>
          {list.map((l, i) => (
            <li key={i}>{inline(l, open)}</li>
          ))}
        </ul>,
      )
    para = []
    list = []
  }
  for (const raw of md.split('\n')) {
    const l = raw.trimEnd()
    const h = /^(#{1,3}) (.*)$/.exec(l)
    if (h) {
      flush()
      const style = { margin: h[1].length === 1 ? '4px 0 14px' : '18px 0 8px', fontSize: h[1].length === 1 ? 26 : 19 }
      blocks.push(h[1].length === 1 ? <h2 key={blocks.length} style={style}>{inline(h[2], open)}</h2> : <h3 key={blocks.length} style={style}>{inline(h[2], open)}</h3>)
    } else if (/^[-*] /.test(l)) {
      if (para.length) flush()
      list.push(l.slice(2))
    } else if (!l.trim()) flush()
    else {
      if (list.length) flush()
      para.push(l)
    }
  }
  flush()
  return blocks
}

/** Privacy policy / terms rendered from docs/store (Italian for `it`, English otherwise). */
export function LegalView({ doc, onBack, onOpen }: { doc: LegalDoc; onBack: () => void; onOpen: (d: LegalDoc) => void }) {
  const { L, lang } = useT()
  const body = useMemo(() => render(section(SOURCES[doc], lang === 'it' ? 'it' : 'en'), onOpen), [doc, lang, onOpen])
  return (
    <div className="screen" style={{ gap: 4 }}>
      <div className="topbar">
        <button className="icon-btn" aria-label="←" onClick={onBack}>
          ←
        </button>
        <h2>{L(doc === 'privacy' ? LS.privacy : LS.terms)}</h2>
        <div style={{ width: 46 }} />
      </div>
      {L(LS.onlyItEn) && (
        <div className="muted" style={{ fontSize: 14, marginBottom: 8 }}>
          {L(LS.onlyItEn)}
        </div>
      )}
      <div style={{ fontSize: 15, color: 'var(--text)', userSelect: 'text', WebkitUserSelect: 'text' }}>{body}</div>
    </div>
  )
}

/** Full screen reached from Settings (`{ name: 'legal', doc }`). */
export function Legal({ doc }: { doc: LegalDoc }) {
  const go = useApp((s) => s.go)
  return <LegalView doc={doc} onBack={() => go({ name: 'settings' })} onOpen={(d) => go({ name: 'legal', doc: d })} />
}
