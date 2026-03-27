import { AMBIGUOUS_WORDS } from '../utils/ambiguousWords'

export default function AmbiguityHighlighter({ text }) {
  const escaped = AMBIGUOUS_WORDS.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const regex = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi')
  const parts = text.split(regex)
  const ambiguousSet = new Set(AMBIGUOUS_WORDS.map((w) => w.toLowerCase()))

  return (
    <div className="highlighter">
      <p className="highlighter__label">Preview — ambiguous words highlighted</p>
      <p className="highlighter__text">
        {parts.map((part, i) =>
          ambiguousSet.has(part.toLowerCase()) ? (
            <mark key={i} className="highlight" title="Ambiguous — please clarify">{part}</mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </p>
    </div>
  )
}
