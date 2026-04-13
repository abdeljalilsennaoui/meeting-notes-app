// Thin wrapper over Firebase Auth so components never touch firebase directly.
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { auth } from './firebase'

export function signUp(email, password) {
  return createUserWithEmailAndPassword(auth, email, password)
}

export function logIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
}

export function logOut() {
  return signOut(auth)
}
