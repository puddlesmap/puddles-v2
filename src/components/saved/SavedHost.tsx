'use client'

import { SavedSignInSheet } from './SavedSignInSheet'
import { SavedToast } from './SavedToast'
import '../../views/experiment-saved.css'

/** Global Saved toast + auth sheet (mount once outside admin). */
export function SavedHost() {
  return (
    <>
      <SavedToast />
      <SavedSignInSheet />
    </>
  )
}
