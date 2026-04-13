import { useState, useId } from 'react'
import AmbiguityHighlighter from './AmbiguityHighlighter'
import { detectAmbiguity, AMBIGUOUS_WORDS } from '../utils/ambiguousWords'

/**
 * Props:
 *   onProceed(note, ambiguityCount): advances to task creation
 *   onSaveNote(content, notebookId): saves note, returns true/false
 *   activeNotebook: currently selected notebook object or null
 *   onCreateNotebook(name): creates a new notebook, returns the created object
 *   wordList: effective ambiguous word list (custom per-user)
 */
export default function NoteInput({ onProceed, onSaveNote, activeNotebook, onCreateNotebook, wordList = AMBIGUOUS_WORDS }) {
  const id = useId()
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [newNotebookName, setNewNotebookName] = useState('')
  const [creatingNotebook, setCreatingNotebook] = useState(false)

  const ambiguities = detectAmbiguity(note, wordList)
  const hasAmbiguity = ambiguities.length > 0
  const noNotebook = !activeNotebook

  async function handleSaveNote() {
    setSaveError('')
    const ok = await onSaveNote(note, activeNotebook.id)
    if (ok !== false) {
      setNote('')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      setSaveError('Could not save. Try again.')
    }
  }

  async function handleCreateAndSave(e) {
    e.preventDefault()
    if (!newNotebookName.trim()) return
    setCreatingNotebook(true)
    setSaveError('')
    try {
      const notebook = await onCreateNotebook(newNotebookName.trim())
      const ok = await onSaveNote(note, notebook.id)
      if (ok !== false) {
        setNote('')
        setNewNotebookName('')
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        setSaveError('Notebook created but the note did not save. Hit Save to retry.')
      }
    } catch {
      setSaveError('Could not create the notebook. Try again.')
    } finally {
      setCreatingNotebook(false)
    }
  }

  return (
    <div className="note-input">
      <div className="form-field">
        <label htmlFor={id} className="form-label">Meeting notes</label>
        <textarea
          id={id}
          value={note}
          onChange={(e) => { setNote(e.target.value); setSaveError('') }}
          rows={14}
          placeholder={`e.g.\nSomeone should fix the login bug soon.\nMaybe Alice can handle the report by next week.\nWe need to update the docs at some point.`}
          className="form-textarea note-input__textarea"
        />
      </div>

      {/* Live preview, only shown when there is text */}
      {note.trim() && <AmbiguityHighlighter text={note} wordList={wordList} />}

      {/* Ambiguity feedback */}
      {note.trim() && hasAmbiguity && (
        <div className="alert-warning">
          <p className="alert-warning__title">{ambiguities.length} vague {ambiguities.length === 1 ? 'term' : 'terms'} found</p>
          <ul className="alert-warning__list">
            {ambiguities.map((w) => <li key={w}>{w}</li>)}
          </ul>
          <p className="alert-warning__hint">
            Fix these before saving. Vague ownership and timelines are why tasks fall through the cracks.
          </p>
        </div>
      )}

      {note.trim() && !hasAmbiguity && (
        <div className="note-input__clean">
          Looks clear. Good to go.
        </div>
      )}

      {/* Save feedback */}
      {saved && (
        <div className="alert alert-success">
          Saved to <strong>{activeNotebook?.name}</strong>.
        </div>
      )}
      {saveError && <p className="form-error">{saveError}</p>}

      {/* Notebook creation prompt, shown only when no notebook exists and note has text */}
      {noNotebook && note.trim() && (
        <div className="note-input__notebook-prompt">
          <p className="note-input__notebook-prompt-label">Give this notebook a name:</p>
          <form onSubmit={handleCreateAndSave} className="note-input__notebook-form">
            <input
              autoFocus
              value={newNotebookName}
              onChange={(e) => setNewNotebookName(e.target.value)}
              placeholder="e.g. Morning standup"
              className="form-input"
            />
            <button
              type="submit"
              disabled={!newNotebookName.trim() || creatingNotebook || hasAmbiguity}
              className="note-input__notebook-save-btn"
            >
              {creatingNotebook ? 'Saving…' : 'Save'}
            </button>
          </form>
        </div>
      )}

      <div className="note-input__actions">
        <button
          onClick={handleSaveNote}
          disabled={!note.trim() || noNotebook || hasAmbiguity}
          title={hasAmbiguity ? 'Fix the vague terms first' : noNotebook ? 'Pick a notebook first' : `Save to "${activeNotebook?.name}"`}
          className="note-input__save-btn"
        >
          {activeNotebook ? <>Save to <strong>{activeNotebook.name}</strong></> : 'Save as note'}
        </button>
        <button
          onClick={() => onProceed(note, ambiguities.length)}
          disabled={!note.trim() || hasAmbiguity}
          className="note-input__convert-btn"
        >
          Convert to Task →
        </button>
      </div>

      {activeNotebook && (
        <p className="note-input__hint">
          Saving to <strong>{activeNotebook.name}</strong>. Switch notebooks from the panel above.
        </p>
      )}
    </div>
  )
}
