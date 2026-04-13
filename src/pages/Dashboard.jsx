import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react'
import NoteInput from '../components/NoteInput'
import WordSettings from '../components/WordSettings'
import TaskForm from '../components/TaskForm'
import TaskList from '../components/TaskList'
import NoteList from '../components/NoteList'
import { getTasksByNotebook, updateTask, deleteTask } from '../services/taskService'
import { saveNote, getUserNotebooks, createNotebook, getNotesByNotebook, updateNote, deleteNote, updateNotebook, deleteNotebook } from '../services/noteService'
import { useAuth } from '../context/AuthContext'
import { detectAmbiguity, AMBIGUOUS_WORDS } from '../utils/ambiguousWords'
import { getUserPreferences, saveUserPreferences } from '../services/userPreferencesService'

/**
 * Inline notebook list item — handles rename and delete without leaving the panel.
 * HCI: recognition over recall (name always visible), recoverability (confirm before delete),
 *      user control (edit/delete available per item).
 */
function NotebookItem({ notebook, isActive, onSelect, onRename, onDelete }) {
  const [mode, setMode] = useState('view') // 'view' | 'editing' | 'confirming'
  const [editName, setEditName] = useState(notebook.name)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSaveRename() {
    const trimmed = editName.trim()
    if (!trimmed) { setError('Name cannot be empty.'); return }
    if (trimmed === notebook.name) { setMode('view'); return }
    setBusy(true)
    try {
      await onRename(notebook.id, trimmed)
      setMode('view')
    } catch {
      setError('Could not rename. Try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleConfirmDelete() {
    setBusy(true)
    try {
      await onDelete(notebook.id)
    } catch {
      setBusy(false)
      setMode('view')
      setError('Could not delete. Try again.')
    }
  }

  if (mode === 'editing') {
    return (
      <div className="notebook-nav__item-edit">
        <input
          className="form-input"
          value={editName}
          onChange={(e) => { setEditName(e.target.value); setError('') }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSaveRename()
            if (e.key === 'Escape') { setMode('view'); setEditName(notebook.name); setError('') }
          }}
          autoFocus
        />
        <button className="task-card__save-btn" onClick={handleSaveRename} disabled={busy || !editName.trim()}>
          {busy ? '…' : 'Save'}
        </button>
        <button className="task-card__cancel-btn" onClick={() => { setMode('view'); setEditName(notebook.name); setError('') }}>
          Cancel
        </button>
        {error && <p className="form-error" style={{ marginTop: '0.25rem' }}>{error}</p>}
      </div>
    )
  }

  if (mode === 'confirming') {
    return (
      <div className="notebook-nav__item-confirm">
        <span className="notebook-nav__confirm-text">Delete &ldquo;{notebook.name}&rdquo;?</span>
        <button className="task-card__confirm-yes" onClick={handleConfirmDelete} disabled={busy}>
          {busy ? '…' : 'Yes'}
        </button>
        <button className="task-card__confirm-no" onClick={() => setMode('view')}>No</button>
        {error && <p className="form-error" style={{ marginTop: '0.25rem' }}>{error}</p>}
      </div>
    )
  }

  return (
    <div className={`notebook-nav__item-row${isActive ? ' notebook-nav__item-row--active' : ''}`}>
      <button
        className={`notebook-nav__item${isActive ? ' notebook-nav__item--active' : ''}`}
        onClick={onSelect}
      >
        {notebook.name}
      </button>
      <div className="notebook-nav__item-actions">
        <button
          className="notebook-nav__item-action"
          onClick={() => { setEditName(notebook.name); setError(''); setMode('editing') }}
          aria-label="Rename notebook"
        >
          <Pencil size={13} />
        </button>
        <button
          className="notebook-nav__item-action notebook-nav__item-action--delete"
          onClick={() => { setError(''); setMode('confirming') }}
          aria-label="Delete notebook"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()

  // ── Step flow ──────────────────────────────────────────────
  const [step, setStep] = useState('note')
  const [currentNote, setCurrentNote] = useState('')

  // ── Evaluation metadata ────────────────────────────────────
  const [noteConvertedAt, setNoteConvertedAt] = useState(null)
  const [lastAmbiguityCount, setLastAmbiguityCount] = useState(0)

  // ID of the saved note currently being converted to a task (null when converting a fresh note from NoteInput).
  // If non-null, the note is deleted once the task is successfully created.
  const [convertingNoteId, setConvertingNoteId] = useState(null)

  // ── User preferences (custom ambiguous words) ─────────
  const [userPrefs, setUserPrefs] = useState({ removedDefaultWords: [], customWords: [] })

  // ── Tasks ──────────────────────────────────────────────────
  const [tasks, setTasks] = useState([])
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [tasksError, setTasksError] = useState(false)

  // ── Notebooks ──────────────────────────────────────────────
  const [notebooks, setNotebooks] = useState([])
  const [loadingNotebooks, setLoadingNotebooks] = useState(true)
  const [notebooksError, setNotebooksError] = useState(false)
  const [activeNotebookId, setActiveNotebookId] = useState(null)
  const [newNotebookName, setNewNotebookName] = useState('')
  const [showNewNotebook, setShowNewNotebook] = useState(false)
  const [creatingNotebook, setCreatingNotebook] = useState(false)
  const [notebookCreateError, setNotebookCreateError] = useState('')

  // ── Notes ──────────────────────────────────────────────────
  const [notebookNotes, setNotebookNotes] = useState([])
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [notesError, setNotesError] = useState(false)

  // ── Notebook nav collapsed/expanded ───────────────────────
  const [isNavExpanded, setIsNavExpanded] = useState(false)

  // ── Right panel tab ────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('tasks')

  // ── Data loaders ───────────────────────────────────────────

  async function loadNotebooks() {
    setLoadingNotebooks(true)
    setNotebooksError(false)
    try {
      const data = await getUserNotebooks(user.uid)
      setNotebooks(data)
      if (data.length > 0) setActiveNotebookId((prev) => prev ?? data[0].id)
    } catch (err) {
      console.error('Failed to load notebooks:', err)
      setNotebooksError(true)
    } finally {
      setLoadingNotebooks(false)
    }
  }

  async function loadNotebookTasks(notebookId) {
    setLoadingTasks(true)
    setTasksError(false)
    try {
      const data = await getTasksByNotebook(notebookId, user.uid)
      setTasks(data)
    } catch (err) {
      console.error('Failed to load tasks:', err)
      setTasksError(true)
    } finally {
      setLoadingTasks(false)
    }
  }

  async function loadNotebookNotes(notebookId) {
    setLoadingNotes(true)
    setNotesError(false)
    try {
      const data = await getNotesByNotebook(notebookId, user.uid)
      setNotebookNotes(data)
    } catch (err) {
      console.error('Failed to load notes:', err)
      setNotesError(true)
    } finally {
      setLoadingNotes(false)
    }
  }

  async function loadUserPrefs() {
    try {
      const prefs = await getUserPreferences(user.uid)
      console.log('[prefs] uid:', user.uid, 'loaded:', prefs)
      setUserPrefs(prefs)
    } catch (err) {
      console.error('Failed to load user preferences:', err)
      // Non-fatal — falls back to full default word list
    }
  }

  useEffect(() => { loadNotebooks(); loadUserPrefs() }, [])

  // Reload both tasks and notes whenever the active notebook changes
  useEffect(() => {
    if (activeNotebookId) {
      loadNotebookTasks(activeNotebookId)
      loadNotebookNotes(activeNotebookId)
    } else {
      setTasks([])
      setNotebookNotes([])
    }
  }, [activeNotebookId])

  // ── Notebook handlers ──────────────────────────────────────

  async function handleCreateNotebookInline(name) {
    const ref = await createNotebook(user.uid, name) // throws on error — caller handles it
    const created = { id: ref.id, name }
    setNotebooks((prev) => [...prev, created])
    setActiveNotebookId(ref.id)
    setTasks([])
    setNotebookNotes([])
    return created
  }

  async function handleCreateNotebookFromPanel(e) {
    e.preventDefault()
    if (!newNotebookName.trim()) return
    setCreatingNotebook(true)
    setNotebookCreateError('')
    try {
      const ref = await createNotebook(user.uid, newNotebookName.trim())
      const created = { id: ref.id, name: newNotebookName.trim() }
      setNotebooks((prev) => [...prev, created])
      setActiveNotebookId(ref.id)
      setTasks([])
      setNotebookNotes([])
      setNewNotebookName('')
      setShowNewNotebook(false)
    } catch (err) {
      console.error('Failed to create notebook:', err)
      setNotebookCreateError('Could not create notebook. Please try again.')
    } finally {
      setCreatingNotebook(false)
    }
  }

  // ── Note handlers ──────────────────────────────────────────

  /**
   * Called when the user clicks "Convert to Task →".
   * The note text is passed to TaskForm as sourceNote and stored on the task document.
   * It is NOT saved as a separate note entry — the user saves notes explicitly.
   */
  function handleProceed(note, ambiguityCount) {
    setCurrentNote(note)
    setNoteConvertedAt(Date.now())
    setLastAmbiguityCount(ambiguityCount)
    setStep('task')
  }

  /**
   * Called when the user saves a note to a notebook explicitly.
   * Returns true on success, false on failure so NoteInput can show feedback.
   */
  async function handleSaveNote(content, notebookId) {
    try {
      await saveNote(user.uid, content, notebookId)
      if (notebookId === activeNotebookId) loadNotebookNotes(notebookId)
      else setActiveNotebookId(notebookId)
      return true
    } catch (err) {
      console.error('Failed to save note:', err)
      return false
    }
  }

  async function handleUpdateNote(noteId, content) {
    await updateNote(noteId, { content })
    setNotebookNotes((prev) => prev.map((n) => n.id === noteId ? { ...n, content } : n))
  }

  async function handleMoveNote(noteId, newNotebookId) {
    await updateNote(noteId, { notebookId: newNotebookId })
    setNotebookNotes((prev) => prev.filter((n) => n.id !== noteId))
  }

  async function handleDeleteNote(noteId) {
    await deleteNote(noteId)
    setNotebookNotes((prev) => prev.filter((n) => n.id !== noteId))
  }

  async function handleSavePrefs(newPrefs) {
    console.log('[prefs] saving for uid:', user.uid, 'prefs:', newPrefs)
    try {
      await saveUserPreferences(user.uid, newPrefs)
      console.log('[prefs] save OK')
    } catch (err) {
      console.error('[prefs] save FAILED:', err)
      throw err
    }
    setUserPrefs(newPrefs)
  }

  // ── Task handlers ──────────────────────────────────────────

  function handleConvertNote(note) {
    setConvertingNoteId(note.id)
    handleProceed(note.content, detectAmbiguity(note.content, effectiveAmbiguousWords).length)
  }

  async function handleTaskCreated() {
    // If this task was created by converting a saved note, delete that note now.
    if (convertingNoteId) {
      try {
        await deleteNote(convertingNoteId)
        setNotebookNotes((prev) => prev.filter((n) => n.id !== convertingNoteId))
      } catch (err) {
        console.error('Failed to remove converted note:', err)
        // Non-fatal — task was created successfully; user can delete the note manually
      }
      setConvertingNoteId(null)
    }
    if (activeNotebookId) loadNotebookTasks(activeNotebookId)
    setStep('note')
    setCurrentNote('')
    setNoteConvertedAt(null)
    setLastAmbiguityCount(0)
  }

  async function handleUpdateTask(taskId, fields) {
    await updateTask(taskId, fields)
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, ...fields } : t))
  }

  async function handleMoveTask(taskId, newNotebookId) {
    await updateTask(taskId, { notebookId: newNotebookId })
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
  }

  async function handleRenameNotebook(notebookId, newName) {
    await updateNotebook(notebookId, { name: newName })
    setNotebooks((prev) => prev.map((nb) => nb.id === notebookId ? { ...nb, name: newName } : nb))
  }

  async function handleDeleteNotebook(notebookId) {
    await deleteNotebook(notebookId)
    const remaining = notebooks.filter((nb) => nb.id !== notebookId)
    setNotebooks(remaining)
    if (activeNotebookId === notebookId) {
      const next = remaining[0] ?? null
      setActiveNotebookId(next?.id ?? null)
    }
    if (remaining.length === 0) setIsNavExpanded(false)
  }

  async function handleDeleteTask(taskId) {
    await deleteTask(taskId)
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
  }

  const effectiveAmbiguousWords = useMemo(() => [
    ...AMBIGUOUS_WORDS.filter((w) => !userPrefs.removedDefaultWords.includes(w)),
    ...userPrefs.customWords,
  ], [userPrefs])

  const activeNotebook = notebooks.find((nb) => nb.id === activeNotebookId) ?? null

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h1 className="dashboard__title">Dashboard</h1>
        <p className="dashboard__subtitle">
          Write your notes, fix the vague bits, and turn action items into tasks.
        </p>
      </div>

      <div className="dashboard__grid">

        {/* ── Left panel — note entry + task creation ── */}
        <div className="panel">
          <AnimatePresence mode="wait">
            {step === 'note' ? (
              <motion.div
                key="note"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <div className="panel__step-header">
                  <div className="panel__step-left">
                    <span className="panel__step-badge">1</span>
                    <h2 className="panel__step-title">Enter notes</h2>
                  </div>
                </div>
                <NoteInput
                  onProceed={handleProceed}
                  onSaveNote={handleSaveNote}
                  activeNotebook={activeNotebook}
                  onCreateNotebook={handleCreateNotebookInline}
                  wordList={effectiveAmbiguousWords}
                />
                <WordSettings
                  defaultWords={AMBIGUOUS_WORDS}
                  userPrefs={userPrefs}
                  onSave={handleSavePrefs}
                />
              </motion.div>
            ) : (
              <motion.div
                key="task"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <div className="panel__step-header">
                  <div className="panel__step-left">
                    <span className="panel__step-badge">2</span>
                    <h2 className="panel__step-title">Create task</h2>
                  </div>
                  <button onClick={() => { setStep('note'); setConvertingNoteId(null) }} className="panel__back-btn">
                    ← Back to notes
                  </button>
                </div>
                {currentNote && (
                  <div className="panel__source-note">
                    <p className="panel__source-note-label">Source note</p>
                    <p className="panel__source-note-text">{currentNote}</p>
                  </div>
                )}
                <TaskForm
                  sourceNote={currentNote}
                  notebookId={activeNotebookId}
                  onTaskCreated={handleTaskCreated}
                  ambiguityCount={lastAmbiguityCount}
                  noteConvertedAt={noteConvertedAt}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Right panel — notebook selector + tasks/notes ── */}
        <div className="panel">

          {loadingNotebooks ? (
            <div className="spinner-wrapper"><div className="spinner" /></div>
          ) : notebooksError ? (
            <div className="error-state">
              <p className="error-state__text">Could not load notebooks.</p>
              <button className="error-state__retry" onClick={loadNotebooks}>Try again</button>
            </div>
          ) : (
            <>
              {/* Notebook navigator — collapsed by default, expand to switch/manage */}
              <div className="notebook-nav">
                <div className="notebook-nav__header">
                  <span className="notebook-nav__label">Notebooks</span>
                  <div className="notebook-nav__header-right">
                    {/* Collapsed summary — shows active notebook name; click to expand */}
                    {!isNavExpanded && activeNotebook && (
                      <button
                        className="notebook-nav__collapsed-toggle"
                        onClick={() => setIsNavExpanded(true)}
                      >
                        {activeNotebook.name}
                        <ChevronDown size={13} />
                      </button>
                    )}
                    {isNavExpanded && (
                      <button
                        className="notebook-nav__collapse-btn"
                        onClick={() => setIsNavExpanded(false)}
                      >
                        <ChevronUp size={13} /> Collapse
                      </button>
                    )}
                    <button
                      onClick={() => { setShowNewNotebook((v) => !v); setNotebookCreateError(''); setIsNavExpanded(true) }}
                      className={`notebook-nav__new-btn${showNewNotebook ? ' notebook-nav__new-btn--open' : ''}`}
                    >
                      <Plus size={13} /> New
                    </button>
                  </div>
                </div>

                {showNewNotebook && (
                  <div className="notebook-nav__create">
                    <form onSubmit={handleCreateNotebookFromPanel} className="notebook-form">
                      <input
                        autoFocus
                        value={newNotebookName}
                        onChange={(e) => setNewNotebookName(e.target.value)}
                        placeholder="e.g. Morning standup"
                        className="form-input"
                      />
                      <button
                        type="submit"
                        disabled={!newNotebookName.trim() || creatingNotebook}
                        className="notebook-form__submit"
                      >
                        {creatingNotebook ? 'Creating…' : 'Create'}
                      </button>
                    </form>
                    {notebookCreateError && (
                      <p className="form-error" style={{ marginTop: '0.375rem' }}>{notebookCreateError}</p>
                    )}
                  </div>
                )}

                {/* Expanded list — switch, rename, delete */}
                {isNavExpanded && notebooks.length > 0 && (
                  <div className="notebook-nav__list">
                    {notebooks.map((nb) => (
                      <NotebookItem
                        key={nb.id}
                        notebook={nb}
                        isActive={nb.id === activeNotebookId}
                        onSelect={() => { setActiveNotebookId(nb.id); setIsNavExpanded(false) }}
                        onRename={handleRenameNotebook}
                        onDelete={handleDeleteNotebook}
                      />
                    ))}
                  </div>
                )}
              </div>

              {notebooks.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-state__text">No notebooks yet.</p>
                  <p className="empty-state__hint">Hit "+ New" above or name one when saving a note on the left.</p>
                </div>
              ) : (
                <>
                  {/* Tabs — scoped to the active notebook */}
                  <div className="tabs">
                    <button
                      onClick={() => setActiveTab('tasks')}
                      className={`tab-btn ${activeTab === 'tasks' ? 'tab-btn--active' : 'tab-btn--inactive'}`}
                    >
                      Tasks <span className="tab-count">{tasks.length}</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('notes')}
                      className={`tab-btn ${activeTab === 'notes' ? 'tab-btn--active' : 'tab-btn--inactive'}`}
                    >
                      Notes <span className="tab-count">{notebookNotes.length}</span>
                    </button>
                  </div>

                  {/* Tasks tab */}
                  {activeTab === 'tasks' && (
                    loadingTasks ? (
                      <div className="spinner-wrapper"><div className="spinner" /></div>
                    ) : tasksError ? (
                      <div className="error-state">
                        <p className="error-state__text">Could not load tasks.</p>
                        <button className="error-state__retry" onClick={() => loadNotebookTasks(activeNotebookId)}>Try again</button>
                      </div>
                    ) : (
                      <TaskList
                        key={activeNotebookId}
                        tasks={tasks}
                        notebooks={notebooks}
                        activeNotebookId={activeNotebookId}
                        notebookName={activeNotebook?.name ?? ''}
                        onUpdate={handleUpdateTask}
                        onMove={handleMoveTask}
                        onDelete={handleDeleteTask}
                      />
                    )
                  )}

                  {/* Notes tab */}
                  {activeTab === 'notes' && (
                    loadingNotes ? (
                      <div className="spinner-wrapper"><div className="spinner" /></div>
                    ) : notesError ? (
                      <div className="error-state">
                        <p className="error-state__text">Could not load notes.</p>
                        <button className="error-state__retry" onClick={() => loadNotebookNotes(activeNotebookId)}>Try again</button>
                      </div>
                    ) : (
                      <NoteList
                        notes={notebookNotes}
                        tasks={tasks}
                        notebooks={notebooks}
                        activeNotebookId={activeNotebookId}
                        notebookName={activeNotebook?.name ?? ''}
                        onUpdate={handleUpdateNote}
                        onMove={handleMoveNote}
                        onDelete={handleDeleteNote}
                        onConvert={handleConvertNote}
                      />
                    )
                  )}
                </>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  )
}
