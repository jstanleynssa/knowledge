'use client'
/**
 * LazyFeedback — staggered-render SectionFeedback wrapper.
 *
 * Problem: N SectionFeedback instances rendering simultaneously = one long blocking task.
 * TBT gets worse as article length increases.
 *
 * Solution:
 * 1. Share a single module import (one network fetch for all instances)
 * 2. After the module loads, each instance renders independently staggered by
 *    sectionIndex × 16ms (≈ one frame each) — breaking React batching so each
 *    render is its own small task, none exceeding the 50ms long-task threshold.
 * 3. Initial load is deferred until after first user interaction OR 4s,
 *    whichever comes first — keeps initial page TBT clean.
 */
import { useState, useEffect } from 'react'

type Props = {
  sectionIndex: number
  label?: string
  onFeedback: (idx: number, type: 'verified' | 'flag', note?: string) => void
  learned?: string
  rewriting?: boolean
  existingFeedback?: { type: 'verified' | 'flag'; reviewer_name: string; created_at: string; note?: string | null } | null
}

// Shared module cache — fetched once, used by all instances
let cachedModule: null | React.ComponentType<Props> = null
let loadPromise: null | Promise<void> = null
const listeners: Array<() => void> = []

function loadModule() {
  if (loadPromise) return loadPromise
  loadPromise = import('./SectionFeedback')
    .then(m => { cachedModule = m.SectionFeedback as React.ComponentType<Props> })
    .then(() => { listeners.forEach(fn => fn()); listeners.length = 0 })
  return loadPromise
}

export function SectionFeedback(props: Props) {
  const [ready, setReady] = useState(false)
  const { sectionIndex } = props

  useEffect(() => {
    if (cachedModule) {
      // Module already loaded — stagger render by frame × index
      const id = setTimeout(() => setReady(true), sectionIndex * 16)
      return () => clearTimeout(id)
    }

    // Queue this instance to render once module loads, staggered by index
    const onLoaded = () => {
      setTimeout(() => setReady(true), sectionIndex * 16)
    }
    listeners.push(onLoaded)

    // Trigger load on first user interaction or after 4s fallback
    const events = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart'] as const
    let triggered = false
    const trigger = () => {
      if (triggered) return
      triggered = true
      events.forEach(e => document.removeEventListener(e, trigger))
      clearTimeout(fallback)
      loadModule()
    }
    events.forEach(e => document.addEventListener(e, trigger, { passive: true, once: true }))
    const fallback = setTimeout(trigger, 4000)

    return () => {
      events.forEach(e => document.removeEventListener(e, trigger))
      clearTimeout(fallback)
      const i = listeners.indexOf(onLoaded)
      if (i > -1) listeners.splice(i, 1)
    }
  }, [sectionIndex])

  if (!ready || !cachedModule) return null
  const Comp = cachedModule
  return <Comp {...props} />
}
