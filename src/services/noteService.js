import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

// ── Notebooks ─────────────────────────────────────────────

export async function createNotebook(userId, name) {
  return addDoc(collection(db, 'notebooks'), {
    userId,
    name,
    createdAt: serverTimestamp(),
  })
}

export async function updateNotebook(notebookId, fields) {
  return updateDoc(doc(db, 'notebooks', notebookId), fields)
}

export async function deleteNotebook(notebookId) {
  return deleteDoc(doc(db, 'notebooks', notebookId))
}

export async function getUserNotebooks(userId) {
  const q = query(
    collection(db, 'notebooks'),
    where('userId', '==', userId),
    orderBy('createdAt', 'asc')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// ── Notes ─────────────────────────────────────────────────

export async function saveNote(userId, content, notebookId = null) {
  return addDoc(collection(db, 'notes'), {
    userId,
    notebookId,
    content,
    createdAt: serverTimestamp(),
  })
}

export async function getNotesByNotebook(notebookId, userId) {
  const q = query(
    collection(db, 'notes'),
    where('userId', '==', userId),
    where('notebookId', '==', notebookId),
    orderBy('createdAt', 'desc')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/**
 * Updates specific fields on a note document (e.g. content, notebookId for moving).
 */
export async function updateNote(noteId, fields) {
  return updateDoc(doc(db, 'notes', noteId), fields)
}

/**
 * Deletes a single note by its Firestore document ID.
 */
export async function deleteNote(noteId) {
  return deleteDoc(doc(db, 'notes', noteId))
}
