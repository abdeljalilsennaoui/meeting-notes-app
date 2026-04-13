import { useMemo } from 'react'
import { AMBIGUOUS_WORDS } from '../utils/ambiguousWords'

export default function AmbiguityHighlighter({ text, wordList = AMBIGUOUS_WORDS }) {
  const { regex, ambiguousSet } = useMemo(() => {
    const escaped = wordList.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    return {
      regex: new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi'),
      ambiguousSet: new Set(wordList.map((w) => w.toLowerCase())),
    }
  }, [wordList])

  const parts = text.split(regex)

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
