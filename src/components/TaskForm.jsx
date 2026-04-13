// Step 2 of the flow. Assignee and due date are required by the UI. That's the whole point: stop vague tasks getting through.
import { useState, useId } from 'react'
import { motion } from 'motion/react'
import { createTask } from '../services/taskService'
import { useAuth } from '../context/AuthContext'

const PRIORITIES = ['Low', 'Medium', 'High']
const STATUSES = ['To Do', 'In Progress', 'Done']

/**
 * Props:
 *   sourceNote: the raw note text that triggered this task
 *   notebookId: the notebook this task belongs to (links task to notes)
 *   onTaskCreated: callback fired after a successful save
 *   ambiguityCount: number of ambiguous terms in the source note (evaluation metadata)
 *   noteConvertedAt: timestamp (ms) when "Convert to Task" was clicked (evaluation metadata)
 */
export default function TaskForm({ sourceNote = '', notebookId = null, onTaskCreated, ambiguityCount = 0, noteConvertedAt = null }) {
  const id = useId()
  const { user } = useAuth()
  const [form, setForm] = useState({ title: '', assignee: '', dueDate: '', priority: 'Medium', status: 'To Do' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }))
    if (saveError) setSaveError('')
  }

  function validate() {
    const e = {}
    if (!form.title.trim()) e.title = 'Task title is required.'
    if (!form.assignee.trim()) e.assignee = 'Assignee is required.'
    if (!form.dueDate) e.dueDate = 'Due date is required.'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length) { setErrors(validationErrors); return }
    setSaving(true)
    setSaveError('')
    try {
      await createTask({
        ...form,
        userId: user.uid,
        notebookId,
        sourceNote,
        // Evaluation metadata stored on the document for later analysis
        ambiguityCount,
        timeToTaskMs: noteConvertedAt ? Date.now() - noteConvertedAt : null,
      })
      setForm({ title: '', assignee: '', dueDate: '', priority: 'Medium', status: 'To Do' })
      setErrors({})
      onTaskCreated?.()
    } catch (err) {
      console.error('Error creating task:', err)
      setSaveError('Could not save the task. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      noValidate
      className="task-form"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="form-field">
        <label htmlFor={`${id}-title`} className="form-label">
          Task title <span className="required">*</span>
        </label>
        <input
          id={`${id}-title`}
          type="text"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="e.g. Fix login bug"
          className={`form-input${errors.title ? ' form-input--error' : ''}`}
        />
        {errors.title && <p className="form-error">{errors.title}</p>}
      </div>

      <div className="form-field">
        <label htmlFor={`${id}-assignee`} className="form-label">
          Assignee <span className="required">*</span>
        </label>
        <input
          id={`${id}-assignee`}
          type="text"
          value={form.assignee}
          onChange={(e) => set('assignee', e.target.value)}
          placeholder="e.g. Alice"
          className={`form-input${errors.assignee ? ' form-input--error' : ''}`}
        />
        {errors.assignee && <p className="form-error">{errors.assignee}</p>}
      </div>

      <div className="form-field">
        <label htmlFor={`${id}-dueDate`} className="form-label">
          Due date <span className="required">*</span>
        </label>
        <input
          id={`${id}-dueDate`}
          type="date"
          value={form.dueDate}
          onChange={(e) => set('dueDate', e.target.value)}
          className={`form-input${errors.dueDate ? ' form-input--error' : ''}`}
        />
        {errors.dueDate && <p className="form-error">{errors.dueDate}</p>}
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor={`${id}-priority`} className="form-label">Priority</label>
          <select
            id={`${id}-priority`}
            value={form.priority}
            onChange={(e) => set('priority', e.target.value)}
            className="form-select"
          >
            {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor={`${id}-status`} className="form-label">Status</label>
          <select
            id={`${id}-status`}
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
            className="form-select"
          >
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <p className="form-hint">Fields marked <span className="required">*</span> are required.</p>

      {saveError && <p className="form-error">{saveError}</p>}

      <button type="submit" disabled={saving} className="task-form__submit">
        {saving ? 'Saving…' : 'Create Task'}
      </button>
    </motion.form>
  )
}
