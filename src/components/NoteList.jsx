import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Download } from 'lucide-react'

function downloadTxt(notebookName, notes, tasks) {
  const noteLines = notes.map((n) => {
    const date = n.createdAt?.toDate?.()?.toLocaleDateString('en-CA') ?? ''
    return `[${date}]\n${n.content}`
  })

  const taskLines = tasks.map((t) => {
    const done = t.status === 'Done' ? '[x]' : '[ ]'
    return `${done} ${t.title}\n    Assignee: ${t.assignee}  |  Due: ${t.dueDate}  |  Priority: ${t.priority}  |  Status: ${t.status}`
  })

  let text = `${notebookName}\n${'='.repeat(notebookName.length)}\n`

  if (noteLines.length > 0) {
    text += `\nNOTES\n-----\n\n${noteLines.join('\n\n---\n\n')}\n`
  }
  if (taskLines.length > 0) {
    text += `\nTASKS\n-----\n\n${taskLines.join('\n\n')}\n`
  }

  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${notebookName.replace(/\s+/g, '_')}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Modes:
 *   view        — displays note content; footer shows Edit / Move / Delete
 *   edit        — textarea replaces content; footer shows Cancel / Save
 *   moving      — move-to-notebook selector shown below note content; footer hidden
 *   confirming  — delete confirmation in footer
 */
function NoteCard({ note, notebooks, activeNotebookId, onUpdate, onMove, onDelete }) {
  const [mode, setMode] = useState('view')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [editContent, setEditContent] = useState(note.content)

  const otherNotebooks = notebooks.filter((nb) => nb.id !== activeNotebookId)
  const [moveTarget, setMoveTarget] = useState('')

  const date = note.createdAt?.toDate?.()?.toLocaleDateString('en-CA') ?? '—'

  function openEdit() {
    setEditContent(note.content)
    setError('')
    setMode('edit')
  }

  function openMove() {
    setMoveTarget(otherNotebooks[0]?.id ?? '')
    setError('')
    setMode('moving')
  }

  async function handleSaveEdit() {
    if (!editContent.trim()) { setError('Note cannot be empty.'); return }
    setBusy(true)
    try {
      await onUpdate(note.id, editContent.trim())
      setMode('view')
    } catch {
      setError('Could not save. Try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleMove() {
    if (!moveTarget) return
    setBusy(true)
    try {
      await onMove(note.id, moveTarget)
      // parent removes this card from state; AnimatePresence handles exit
    } catch {
      setBusy(false)
      setError('Could not move note. Try again.')
    }
  }

  async function handleConfirmDelete() {
    setBusy(true)
    try {
      await onDelete(note.id)
    } catch {
      setBusy(false)
      setMode('view')
      setError('Could not delete. Try again.')
    }
  }

  return (
    <motion.div
      layout
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.92, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 350, damping: 40 }}
      className="note-card"
    >
      {mode === 'edit' ? (

        /* ── Edit mode ── */
        <div className="note-card__edit-form">
          <textarea
            className="form-textarea"
            rows={5}
            value={editContent}
            onChange={(e) => { setEditContent(e.target.value); if (error) setError('') }}
            autoFocus
          />
          {error && <p className="form-error">{error}</p>}
          <div className="note-card__edit-actions">
            <button
              className="task-card__cancel-btn"
              onClick={() => { setMode('view'); setError('') }}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              className="task-card__save-btn"
              onClick={handleSaveEdit}
              disabled={busy}
            >
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

      ) : (

        /* ── View / moving / confirming modes ── */
        <>
          <p className="note-card__content">{note.content}</p>
          <p className="note-card__date">{date}</p>

          {/* Move panel — shown when mode === 'moving' */}
          {mode === 'moving' && (
            <div className="card-move-row">
              <span className="card-move-label">Move to</span>
              <select
                className="form-select card-move-select"
                value={moveTarget}
                onChange={(e) => setMoveTarget(e.target.value)}
              >
                {otherNotebooks.map((nb) => <option key={nb.id} value={nb.id}>{nb.name}</option>)}
              </select>
              <button
                className="card-move-btn"
                onClick={handleMove}
                disabled={busy || !moveTarget}
              >
                {busy ? '…' : 'Move'}
              </button>
              <button
                className="card-move-cancel"
                onClick={() => { setMode('view'); setError('') }}
              >
                Cancel
              </button>
            </div>
          )}

          {error && <p className="form-error" style={{ marginTop: '0.25rem' }}>{error}</p>}

          {/* Footer — hidden while move panel is open */}
          {mode !== 'moving' && (
            <div className="note-card__footer">
              {mode === 'confirming' ? (
                <div className="task-card__confirm">
                  <span className="task-card__confirm-text">Delete this note?</span>
                  <button
                    className="task-card__confirm-yes"
                    onClick={handleConfirmDelete}
                    disabled={busy}
                  >
                    {busy ? '…' : 'Yes'}
                  </button>
                  <button
                    className="task-card__confirm-no"
                    onClick={() => setMode('view')}
                  >
                    No
                  </button>
                </div>
              ) : (
                <>
                  <button className="task-card__action-btn" onClick={openEdit}>Edit</button>
                  {otherNotebooks.length > 0 && (
                    <button className="task-card__action-btn" onClick={openMove}>Move</button>
                  )}
                  <button
                    className="task-card__delete-btn"
                    onClick={() => { setMode('confirming'); setError('') }}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}

export default function NoteList({ notes, tasks = [], notebooks, activeNotebookId, notebookName, onUpdate, onMove, onDelete }) {
  return (
    <div>
      {(notes.length > 0 || tasks.length > 0) && (
        <div className="note-list__export-row">
          <button onClick={() => downloadTxt(notebookName, notes, tasks)} className="note-list__export-btn">
            <Download size={13} /> Export .txt
          </button>
        </div>
      )}
      {!notes.length ? (
        <div className="empty-state">
          <p className="empty-state__text">No notes in <strong>{notebookName}</strong> yet.</p>
          <p className="empty-state__hint">Write something on the left and hit "Save as note".</p>
        </div>
      ) : (
        <div className="note-list">
          <AnimatePresence>
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                notebooks={notebooks}
                activeNotebookId={activeNotebookId}
                onUpdate={onUpdate}
                onMove={onMove}
                onDelete={onDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
