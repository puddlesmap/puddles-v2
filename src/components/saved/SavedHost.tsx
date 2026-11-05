'use client'

import { SavedToast } from './SavedToast'
import '../../views/experiment-saved.css'

/** Global Saved toast (mount once outside admin). */
export function SavedHost() {
  return <SavedToast />
}
