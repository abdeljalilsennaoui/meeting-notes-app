import { useState } from 'react'
import { ChevronDown, ChevronUp, X } from 'lucide-react'

/**
 * Collapsible panel for managing the per-user ambiguous word list.
 *
 * Props:
 *   defaultWords  — the full AMBIGUOUS_WORDS array (built-in list)
 *   userPrefs     — { removedDefaultWords: string[], customWords: string[] }
 *   onSave(prefs) — async callback; receives the updated prefs object
 */
export default function WordSettings({ defaultWords, userPrefs, onSave }) {
  const [open, setOpen] = useState(false)
  const [newWord, setNewWord] = useState('')
  const [newWordError, setNewWordError] = useState('')
  const [localRemoved, setLocalRemoved] = useState(userPrefs.removedDefaultWords)
  const [localCustom, setLocalCustom] = useState(userPrefs.customWords)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saved, setSaved] = useState(false)

  // Keep local state in sync if parent reloads prefs (e.g. after page reload)
  // We use a simple open-toggle reset: when opening, reset to current prefs
  function handleToggle() {
    if (!open) {
      setLocalRemoved(userPrefs.removedDefaultWords)
      setLocalCustom(userPrefs.customWords)
      setNewWord('')
      setNewWordError('')
      setSaveError('')
      setSaved(false)
    }
    setOpen((v) => !v)
  }

  function handleToggleDefault(word) {
    setLocalRemoved((prev) =>
      prev.includes(word) ? prev.filter((w) => w !== word) : [...prev, word]
    )
  }

  function handleAddCustom() {
    const trimmed = newWord.trim().toLowerCase()
    if (!trimmed) { setNewWordError('Word cannot be empty.'); return }
    const allWords = [...defaultWords, ...localCustom].map((w) => w.toLowerCase())
    if (allWords.includes(trimmed)) { setNewWordError('That word is already in the list.'); return }
    setLocalCustom((prev) => [...prev, trimmed])
    setNewWord('')
    setNewWordError('')
  }

  function handleRemoveCustom(word) {
    setLocalCustom((prev) => prev.filter((w) => w !== word))
  }

  async function handleSave() {
    setSaving(true)
    setSaveError('')
    setSaved(false)
    try {
      await onSave({ removedDefaultWords: localRemoved, customWords: localCustom })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setSaveError('Could not save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const disabledCount = localRemoved.length
  const customCount = localCustom.length

  return (
    <div className="word-settings">
      <button className="word-settings__toggle" onClick={handleToggle}>
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        Word settings
        {!open && (disabledCount > 0 || customCount > 0) && (
          <span className="word-settings__summary">
            {customCount > 0 && `+${customCount} custom`}
            {customCount > 0 && disabledCount > 0 && ', '}
            {disabledCount > 0 && `${disabledCount} disabled`}
          </span>
        )}
      </button>

      {open && (
        <div className="word-settings__body">

          {/* Custom words */}
          <div className="word-settings__section">
            <p className="word-settings__section-title">Your custom words</p>
            {localCustom.length === 0 && (
              <p className="word-settings__empty-hint">No custom words added yet.</p>
            )}
            {localCustom.length > 0 && (
              <ul className="word-settings__word-list">
                {localCustom.map((w) => (
                  <li key={w} className="word-settings__word-row">
                    <span>{w}</span>
                    <button
                      className="word-settings__remove-btn"
                      onClick={() => handleRemoveCustom(w)}
                      title="Remove"
                    >
                      <X size={11} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="word-settings__add-row">
              <input
                className="form-input"
                value={newWord}
                onChange={(e) => { setNewWord(e.target.value); setNewWordError('') }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustom() } }}
                placeholder="e.g. work on"
              />
              <button className="word-settings__add-btn" onClick={handleAddCustom}>Add</button>
            </div>
            {newWordError && <p className="form-error">{newWordError}</p>}
          </div>

          {/* Built-in word toggles */}
          <div className="word-settings__section">
            <p className="word-settings__section-title">
              Built-in words
              {disabledCount > 0 && (
                <span className="word-settings__disabled-count"> ({disabledCount} disabled)</span>
              )}
            </p>
            <p className="word-settings__section-hint">Uncheck words you don&apos;t consider ambiguous.</p>
            <ul className="word-settings__word-list word-settings__word-list--defaults">
              {defaultWords.map((w) => (
                <li key={w} className="word-settings__word-row">
                  <label className="word-settings__toggle-label">
                    <input
                      type="checkbox"
                      checked={!localRemoved.includes(w)}
                      onChange={() => handleToggleDefault(w)}
                    />
                    <span className={localRemoved.includes(w) ? 'word-settings__word--disabled' : ''}>
                      {w}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          {/* Save */}
          <div className="word-settings__footer">
            {saveError && <p className="form-error">{saveError}</p>}
            {saved && <p className="word-settings__saved">Saved.</p>}
            <button
              className="word-settings__save-btn"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
