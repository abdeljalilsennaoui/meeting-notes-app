// Per-user custom word list (add your own, disable built-ins). One Firestore doc per user, keyed by uid.
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase'

const EMPTY_PREFS = { removedDefaultWords: [], customWords: [] }

/**
 * Returns the stored preferences for a user, or empty defaults if none exist yet.
 */
export async function getUserPreferences(userId) {
  const ref = doc(db, 'userPreferences', userId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return { ...EMPTY_PREFS }
  return { ...EMPTY_PREFS, ...snap.data() }
}

/**
 * Saves (upserts) preferences for a user.
 * Only the provided fields are merged, other fields are preserved.
 */
export async function saveUserPreferences(userId, prefs) {
  const ref = doc(db, 'userPreferences', userId)
  await setDoc(ref, prefs, { merge: true })
}
