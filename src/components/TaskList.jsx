import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

const PRIORITIES = ['Low', 'Medium', 'High']
const STATUSES = ['To Do', 'In Progress', 'Done']
const PRIORITY_CLASS = { Low: 'badge-priority-low', Medium: 'badge-priority-medium', High: 'badge-priority-high' }
const STATUS_CLASS = { 'To Do': 'badge-status-todo', 'In Progress': 'badge-status-inprogress', 'Done': 'badge-status-done' }

/**
 * Modes:
 *   view        — displays task data; footer shows Edit / Move / Delete
 *   edit        — inline edit form replacing the card body
 *   moving      — move-to-notebook selector shown below task body; footer hidden
 *   confirming  — delete confirmation in footer
 */
function TaskCard({ task, notebooks, activeNotebookId, onUpdate, onMove, onDelete }) {
  const [mode, setMode] = useState('view')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Edit form mirrors current task values; reset on open
  const [editForm, setEditForm] = useState({
    title: task.title,
    assignee: task.assignee,
    dueDate: task.dueDate,
    priority: task.priority ?? 'Medium',
    status: task.status ?? 'To Do',
  })

  // All notebooks except the one this task is currently in
  const otherNotebooks = notebooks.filter((nb) => nb.id !== activeNotebookId)
  const [moveTarget, setMoveTarget] = useState('')

  function setField(key, value) {
    setEditForm((prev) => ({ ...prev, [key]: value }))
    if (error) setError('')
  }

  async function handleToggleDone() {
    const newStatus = task.status === 'Done' ? 'To Do' : 'Done'
    try {
      await onUpdate(task.id, { status: newStatus })
    } catch {
      // silently ignore — the badge still shows the correct stored state
    }
  }

  function openEdit() {
    setEditForm({
      title: task.title,
      assignee: task.assignee,
      dueDate: task.dueDate,
      priority: task.priority ?? 'Medium',
      status: task.status ?? 'To Do',
    })
    setError('')
    setMode('edit')
  }

  function openMove() {
    setMoveTarget(otherNotebooks[0]?.id ?? '')
    setError('')
    setMode('moving')
  }

  async function handleSaveEdit() {
    if (!editForm.title.trim() || !editForm.assignee.trim() || !editForm.dueDate) {
      setError('Title, assignee, and due date are required.')
      return
    }
    setBusy(true)
    try {
      await onUpdate(task.id, editForm)
      setMode('view')
    } catch {
      setError('Could not save changes. Try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleMove() {
    if (!moveTarget) return
    setBusy(true)
    try {
      await onMove(task.id, moveTarget)
      // parent removes this card from state; AnimatePresence handles exit
    } catch {
      setBusy(false)
      setError('Could not move task. Try again.')
    }
  }

  async function handleConfirmDelete() {
    setBusy(true)
    try {
      await onDelete(task.id)
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
      className={`task-card${task.status === 'Done' ? ' task-card--done' : ''}`}
    >
      {mode === 'edit' ? (

        /* ── Edit mode ── */
        <div className="task-card__edit-form">
          <p className="task-card__edit-label">Editing task</p>

          <div className="form-field">
            <label className="form-label">Title <span className="required">*</span></label>
            <input
              className="form-input"
              value={editForm.title}
              onChange={(e) => setField('title', e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-field">
            <label className="form-label">Assignee <span className="required">*</span></label>
            <input
              className="form-input"
              value={editForm.assignee}
              onChange={(e) => setField('assignee', e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Due date <span className="required">*</span></label>
            <input
              type="date"
              className="form-input"
              value={editForm.dueDate}
              onChange={(e) => setField('dueDate', e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Priority</label>
              <select className="form-select" value={editForm.priority} onChange={(e) => setField('priority', e.target.value)}>
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Status</label>
              <select className="form-select" value={editForm.status} onChange={(e) => setField('status', e.target.value)}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="task-card__edit-actions">
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
              {busy ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>

      ) : (

        /* ── View / moving / confirming modes ── */
        <>
          <div className="task-card__header">
            <button
              className={`task-card__complete-btn${task.status === 'Done' ? ' task-card__complete-btn--done' : ''}`}
              onClick={handleToggleDone}
              title={task.status === 'Done' ? 'Mark incomplete' : 'Mark complete'}
              aria-label={task.status === 'Done' ? 'Mark incomplete' : 'Mark complete'}
            />
            <h3 className="task-card__title">{task.title}</h3>
            <div className="task-card__badges">
              <span className={`badge ${PRIORITY_CLASS[task.priority] ?? 'badge-status-todo'}`}>{task.priority}</span>
              <span className={`badge ${STATUS_CLASS[task.status] ?? 'badge-status-todo'}`}>{task.status}</span>
            </div>
          </div>

          <div className="task-card__meta">
            <span>Assignee: <strong>{task.assignee}</strong></span>
            <span>Due: <strong>{task.dueDate}</strong></span>
          </div>

          {task.sourceNote && (
            <p className="task-card__source" title={task.sourceNote}>
              &ldquo;{task.sourceNote}&rdquo;
            </p>
          )}

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
            <div className="task-card__footer">
              {mode === 'confirming' ? (
                <div className="task-card__confirm">
                  <span className="task-card__confirm-text">Delete this task?</span>
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

export default function TaskList({ tasks, notebooks, activeNotebookId, notebookName, onUpdate, onMove, onDelete }) {
  const [priorityFilter, setPriorityFilter] = useState([])
  const [statusFilter, setStatusFilter] = useState([])
  const [sortBy, setSortBy] = useState('newest')

  function togglePriority(p) {
    setPriorityFilter((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])
  }

  function toggleStatus(s) {
    setStatusFilter((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])
  }

  const visibleTasks = tasks
    .filter((t) => priorityFilter.length === 0 || priorityFilter.includes(t.priority))
    .filter((t) => statusFilter.length === 0 || statusFilter.includes(t.status))
    .sort((a, b) => {
      if (sortBy === 'oldest')   return (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0)
      if (sortBy === 'due_asc')  return (a.dueDate ?? '').localeCompare(b.dueDate ?? '')
      if (sortBy === 'due_desc') return (b.dueDate ?? '').localeCompare(a.dueDate ?? '')
      return 0 // 'newest' — server order preserved
    })

  if (!tasks.length) {
    return (
      <div className="empty-state">
        <p className="empty-state__text">
          No tasks in <strong>{notebookName}</strong> yet.
        </p>
        <p className="empty-state__hint">Write a note on the left and hit "Convert to Task".</p>
      </div>
    )
  }

  return (
    <div className="task-list">
      <div className="task-filters">
        <div className="task-filters__group">
          {PRIORITIES.map((p) => (
            <button
              key={p}
              className={`task-filter-btn${priorityFilter.includes(p) ? ' task-filter-btn--active' : ''}`}
              onClick={() => togglePriority(p)}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="task-filters__group">
          {STATUSES.map((s) => (
            <button
              key={s}
              className={`task-filter-btn${statusFilter.includes(s) ? ' task-filter-btn--active' : ''}`}
              onClick={() => toggleStatus(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <select
          className="form-select task-filters__sort"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="due_asc">Due date ↑</option>
          <option value="due_desc">Due date ↓</option>
        </select>
      </div>

      {visibleTasks.length === 0 ? (
        <p className="task-filters__empty">No tasks match the current filters.</p>
      ) : (
        <AnimatePresence>
          {visibleTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              notebooks={notebooks}
              activeNotebookId={activeNotebookId}
              onUpdate={onUpdate}
              onMove={onMove}
              onDelete={onDelete}
            />
          ))}
        </AnimatePresence>
      )}
    </div>
  )
}
