/** Incremental discovery horizon. Public display stays on its own 60-day window. */

import { daysBetweenYmd } from './verificationSchedule.mjs'

export function isWindowDue(window, lastSuccess, today) {
  if (!lastSuccess) return true
  return daysBetweenYmd(lastSuccess, today) >= window.everyDays
}

/**
 * Scrapers take a prefix (today through N), so the horizon is the farthest due window.
 * Nearer windows covered by that prefix are scanned too. That avoids a second fetch.
 */
export function selectDiscoveryHorizon({ today, state, config, full = false }) {
  const windows = config?.windows || []
  const maxHorizon = config?.maxHorizonDays ?? 90
  if (full) {
    return {
      days: maxHorizon,
      scanned: windows.map((window) => window.id),
      skipped: [],
      full: true,
      today,
    }
  }
  const due = windows.filter((window) =>
    isWindowDue(window, state?.windows?.[window.id]?.lastSuccess, today),
  )
  if (due.length === 0) {
    return {
      days: 0,
      scanned: [],
      skipped: windows.map((window) => window.id),
      full: false,
      today,
    }
  }
  const days = Math.min(maxHorizon, Math.max(...due.map((window) => window.to)))
  return {
    days,
    scanned: windows.filter((window) => window.to <= days).map((window) => window.id),
    skipped: windows.filter((window) => window.to > days).map((window) => window.id),
    full: false,
    today,
  }
}

export function commitDiscoveryRun(state, plan) {
  const windows = { ...(state?.windows || {}) }
  for (const id of plan.scanned || []) {
    windows[id] = { lastSuccess: plan.today }
  }
  return {
    windows,
    lastRun: {
      date: plan.today,
      days: plan.days,
      full: Boolean(plan.full),
      scanned: plan.scanned || [],
      skipped: plan.skipped || [],
    },
  }
}
