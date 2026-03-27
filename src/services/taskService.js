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

/**
 * Creates a new task document in Firestore.
 * Expected shape of `task`:
 *   { userId, notebookId, title, assignee, dueDate, priority, status, sourceNote,
 *     ambiguityCount, timeToTaskMs }
 */
export async function createTask(task) {
  return addDoc(collection(db, 'tasks'), {
    ...task,
    createdAt: serverTimestamp(),
  })
}


/**
 * Returns all tasks for a given notebook, ordered newest first.
 * Requires composite index: notebookId ASC + createdAt DESC.
 */
export async function getTasksByNotebook(notebookId) {
  const q = query(
    collection(db, 'tasks'),
    where('notebookId', '==', notebookId),
    orderBy('createdAt', 'desc')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/**
 * Updates specific fields on a task document.
 */
export async function updateTask(taskId, fields) {
  return updateDoc(doc(db, 'tasks', taskId), fields)
}

/**
 * Deletes a single task by its Firestore document ID.
 */
export async function deleteTask(taskId) {
  return deleteDoc(doc(db, 'tasks', taskId))
}
