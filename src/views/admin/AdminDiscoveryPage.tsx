import { useEffect, useMemo, useState } from 'react'
import {
  ALL_DISCOVERY_CANDIDATES,
  DISCOVERY_CATALOG,
  filterDiscoveryCandidates,
  summarizeDiscoveryCounts,
} from '../../data/discovery'
import {
  getSeasonalCollection,
  type SeasonalCollectionSlug,
} from '../../data/seasonalDiscovery'
import { AdminDiscoveryTable } from '../../components/admin/AdminDiscoveryTable'
import { AdminManualCheckList } from '../../components/admin/AdminManualCheckList'
import type { DiscoveryCandidate, DiscoveryEditableFields, DiscoveryViewFilter } from '../../types/discovery'
import { findMatchingEventIdsForCandidate, enrichCandidatesWithSiteVerifiedDates } from '../../utils/discoveryMatchEvents'
import {
  approveDiscoveryLocally,
  assertDiscoveryAgeInScope,
  ensureAdminEventsCacheSeeded,
  isOutsideCoreDiscoveryCity,
  loadWriteSheetPreference,
  reconcileAdminWithLivedCatalog,
  saveWriteSheetPreference,
} from '../../utils/discoveryApproveLocal'
import { loadAdminPublishQueue, removeStagedAdminEvent } from '../../utils/adminPublishQueue'
import { stageDiscoveryCandidateForPublish } from '../../utils/discoveryPublishStaging'
import { publishSeasonalCurationToSite } from '../../utils/publishSeasonalCuration'
import { callSheetApi } from '../../utils/sheetApi'
import {
  applyDiscoveryReviewOverrides,
  editableFieldsFromCandidate,
  loadDiscoveryReviewStore,
  pacificTodayYmd,
  saveDiscoveryReviewRecord,
} from '../../utils/discoveryReview'
import { stripInternalNotesForPublish } from '../../utils/discoveryInternalNotes'
import { summarizeDiscoveryThisWeek } from '../../utils/discoveryThisWeek'
import {
  addToSeasonalSection,
  clearSeasonalThemeStaging,
  commitSeasonalCurationPublish,
  getActiveThemeSlugForAdmin,
  getEffectiveSeasonalSectionIds,
  moveSeasonalSection,
  removeFromSeasonalSection,
  stagingHasChanges,
  type SeasonalCurationSection,
} from '../../utils/seasonalCurationStaging'
import {
  filterRegularDiscoveryCandidates,
  resolveSeasonalDiscoveryRows,
} from '../../utils/seasonalDiscoveryAdmin'
import {
  buildMultiThemeSeasonalRecommendations,
  dismissSeasonalFeatureForTheme,
} from '../../utils/seasonalRecommendations'

type ActionMessage = { type: 'success' | 'error'; text: string }
type DiscoveryMode = 'regular' | 'seasonal'

/** Matches the weekly review mockup inbox: one working list, not a status for every publish step. */
const REGULAR_VIEW_OPTIONS: { id: DiscoveryViewFilter; label: string }[] = [
  { id: 'thisWeek', label: 'This week' },
  { id: 'new', label: 'New' },
  { id: 'dismissed', label: 'Dismissed' },
  { id: 'all', label: 'All' },
]

function reloadDiscoveryCandidates(): DiscoveryCandidate[] {
  return enrichCandidatesWithSiteVerifiedDates(
    applyDiscoveryReviewOverrides(ALL_DISCOVERY_CANDIDATES, loadDiscoveryReviewStore()),
  )
}

function curationEventId(candidate: DiscoveryCandidate): string {
  return (candidate.convertedEventId || candidate.id).trim()
}

function mergeCandidate(
  candidate: DiscoveryCandidate,
  edits: DiscoveryEditableFields,
  extras: Partial<DiscoveryCandidate> = {},
): DiscoveryCandidate {
  return {
    ...candidate,
    ...edits,
    ...extras,
  }
}

function deployHint(message: string): string {
  if (/unknown action/i.test(message)) {
    return `${message} Redeploy google-apps-script/PuddlesSheetApi.gs (Deploy → Manage deployments → New version) so Sheet write works.`
  }
  return message
}

async function writeExistingToSheet(
  candidate: DiscoveryCandidate,
  edits: DiscoveryEditableFields,
  lastChecked: string,
  preferredEventId?: string,
): Promise<string> {
  const matchedIds = findMatchingEventIdsForCandidate({
    ...candidate,
    ...edits,
  })
  const ids = matchedIds.length > 0 ? matchedIds : preferredEventId ? [preferredEventId] : []

  if (ids.length > 0) {
    let primaryId = ids[0]
    for (const id of ids) {
      const result = await callSheetApi<{ eventId: string | null; verifiedDate: string }>({
        action: 'updateEventVerifiedDate',
        payload: {
          id,
          verifiedDate: lastChecked,
          discoveryId: candidate.id,
        },
      })
      primaryId = result.eventId || id
    }
    return primaryId
  }

  const result = await callSheetApi<{
    eventId: string | null
    eventIds?: string[]
    verifiedDate: string
  }>({
    action: 'updateEventVerifiedDate',
    payload: {
      eventUrl: edits.eventUrl || candidate.eventUrl,
      date: edits.date || candidate.date,
      verifiedDate: lastChecked,
      discoveryId: candidate.id,
    },
  })

  const eventId = result.eventId || result.eventIds?.[0]
  if (!eventId) {
    throw new Error('Sheet could not find a matching Events row to update.')
  }
  return eventId
}

async function writeNewDraftToSheet(
  candidate: DiscoveryCandidate,
  edits: DiscoveryEditableFields,
  lastChecked: string,
): Promise<string> {
  const result = await callSheetApi<{ eventId: string; status: string }>({
    action: 'appendEventDraft',
    payload: {
      discoveryId: candidate.id,
      title: edits.title,
      description: edits.description,
      tips: stripInternalNotesForPublish(edits.tips),
      venue: edits.venue,
      room: edits.room,
      address: edits.address,
      city: edits.city,
      date: edits.date,
      startTime: edits.startTime,
      endTime: edits.endTime,
      ageRange: edits.ageRange,
      types: edits.types,
      cost: edits.cost,
      eventUrl: edits.eventUrl,
      imageUrl: edits.imageUrl,
      verifiedDate: lastChecked,
      lat: candidate.lat,
      lng: candidate.lng,
      source: candidate.source || 'Discovery',
    },
  })
  if (!result.eventId) {
    throw new Error('Sheet approved the request but returned no Event ID.')
  }
  return result.eventId
}

export function AdminDiscoveryPage() {
  const [candidates, setCandidates] = useState<DiscoveryCandidate[]>(() => reloadDiscoveryCandidates())
  const [discoveryMode, setDiscoveryMode] = useState<DiscoveryMode>('regular')
  const [view, setView] = useState<DiscoveryViewFilter>('thisWeek')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [publishCurationBusy, setPublishCurationBusy] = useState(false)
  const [writeSheet, setWriteSheet] = useState(() => loadWriteSheetPreference())
  const [actionMessage, setActionMessage] = useState<ActionMessage | null>(null)
  const [curationTick, setCurationTick] = useState(0)
  const [featureDismissTick, setFeatureDismissTick] = useState(0)
  const [manageCurrentOpen, setManageCurrentOpen] = useState(false)
  const primaryThemeSlug = getActiveThemeSlugForAdmin()
  const [selectedThemeSlug, setSelectedThemeSlug] =
    useState<SeasonalCollectionSlug>(primaryThemeSlug)

  useEffect(() => {
    if (view === 'live' || view === 'pending' || view === 'already' || view === 'approved') {
      setView('thisWeek')
    }
  }, [view])

  const themeSlug = selectedThemeSlug
  const seasonalCollection = getSeasonalCollection(themeSlug)

  function refreshCandidatesFromStore() {
    setCandidates(reloadDiscoveryCandidates())
  }

  function runLivedReconcile() {
    const result = reconcileAdminWithLivedCatalog()
    refreshCandidatesFromStore()
    if (
      result.draftsRemoved === 0 &&
      result.readyPromoted === 0 &&
      result.pendingPromoted === 0
    ) {
      return
    }
    const parts: string[] = []
    if (result.draftsRemoved > 0) {
      parts.push(
        `cleared ${result.draftsRemoved} Draft${result.draftsRemoved === 1 ? '' : 's'} already Live`,
      )
    }
    if (result.readyPromoted > 0) {
      parts.push(`promoted ${result.readyPromoted} Ready → Live`)
    }
    if (result.pendingPromoted > 0) {
      parts.push(`promoted ${result.pendingPromoted} Pending → Live`)
    }
    setActionMessage({ type: 'success', text: parts.join(' · ') })
  }

  useEffect(() => {
    runLivedReconcile()
    const onFocus = () => runLivedReconcile()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount/focus reconcile only
  }, [])

  const regularCandidates = useMemo(
    () => filterRegularDiscoveryCandidates(candidates),
    [candidates],
  )

  const counts = useMemo(() => summarizeDiscoveryCounts(regularCandidates), [regularCandidates])

  const thisWeekSummary = useMemo(
    () => summarizeDiscoveryThisWeek(regularCandidates, undefined, DISCOVERY_CATALOG.generatedAt),
    [regularCandidates],
  )

  const filtered = useMemo(
    () =>
      filterDiscoveryCandidates(regularCandidates, {
        view,
        search,
        catalogGeneratedAt: DISCOVERY_CATALOG.generatedAt,
      }),
    [regularCandidates, view, search],
  )

  const seasonalSections = useMemo(() => {
    void curationTick
    const effective = getEffectiveSeasonalSectionIds(themeSlug)
    return {
      closeToHome: resolveSeasonalDiscoveryRows(effective.closeToHome, candidates),
      worthADrive: resolveSeasonalDiscoveryRows(effective.worthADrive, candidates),
      staging: effective.staging,
      closeIds: effective.closeToHome,
      driveIds: effective.worthADrive,
    }
  }, [candidates, themeSlug, curationTick])

  const multiThemeRecs = useMemo(() => {
    void curationTick
    void featureDismissTick
    // Scores Discovery pool per relevant theme — not a separate cron.
    return buildMultiThemeSeasonalRecommendations({ candidates })
  }, [candidates, curationTick, featureDismissTick])

  useEffect(() => {
    const withRecs = multiThemeRecs.themesWithRecs
    if (withRecs.length === 0) {
      if (selectedThemeSlug !== multiThemeRecs.primarySlug) {
        setSelectedThemeSlug(multiThemeRecs.primarySlug)
      }
      return
    }
    const stillValid = withRecs.some((theme) => theme.themeSlug === selectedThemeSlug)
    if (stillValid) return
    const primaryHit = withRecs.find((theme) => theme.themeSlug === multiThemeRecs.primarySlug)
    setSelectedThemeSlug(primaryHit?.themeSlug ?? withRecs[0]!.themeSlug)
  }, [multiThemeRecs, selectedThemeSlug])

  const seasonalRecommendations = useMemo(() => {
    const fromMulti = multiThemeRecs.byTheme[themeSlug]
    if (fromMulti) {
      return {
        suggestedAdds: fromMulti.suggestedAdds,
        suggestedFeatures: fromMulti.suggestedFeatures,
      }
    }
    return { suggestedAdds: [], suggestedFeatures: [] }
  }, [multiThemeRecs, themeSlug])

  const suggestedAddRows = useMemo(
    () => seasonalRecommendations.suggestedAdds.map((row) => row.candidate),
    [seasonalRecommendations],
  )

  const suggestedFeatureRows = useMemo(
    () => seasonalRecommendations.suggestedFeatures.map((row) => row.candidate),
    [seasonalRecommendations],
  )

  const suggestedSectionById = useMemo(() => {
    const map: Record<string, SeasonalCurationSection> = {}
    for (const row of seasonalRecommendations.suggestedAdds) {
      map[row.candidate.id] = row.suggestedSection
    }
    for (const row of seasonalRecommendations.suggestedFeatures) {
      map[row.candidate.id] = row.suggestedSection
    }
    return map
  }, [seasonalRecommendations])

  function bumpCuration() {
    setCurationTick((n) => n + 1)
  }

  function handleStageFeature(candidate: DiscoveryCandidate, section: SeasonalCurationSection) {
    addToSeasonalSection(curationEventId(candidate), section, themeSlug)
    bumpCuration()
    setActionMessage({
      type: 'success',
      text: `Staged “${candidate.title}” for ${
        section === 'closeToHome' ? 'Close to home' : 'Worth a little drive'
      }. Publish curation to update the site.`,
    })
  }

  function handleNotForTheme(candidate: DiscoveryCandidate) {
    dismissSeasonalFeatureForTheme(candidate.id, themeSlug)
    const converted = candidate.convertedEventId?.trim()
    if (converted && converted !== candidate.id) {
      dismissSeasonalFeatureForTheme(converted, themeSlug)
    }
    setFeatureDismissTick((n) => n + 1)
    setActionMessage({
      type: 'success',
      text: `“${candidate.title}” hidden from Suggested features for this theme.`,
    })
  }

  function handleApproveAndStage(
    candidate: DiscoveryCandidate,
    section: SeasonalCurationSection,
  ) {
    void handleApprove(candidate, editableFieldsFromCandidate(candidate), {
      forceSeasonalSection: section,
      successExtra: ` Staged for ${
        section === 'closeToHome' ? 'Close to home' : 'Worth a little drive'
      } — Publish curation when ready.`,
    })
  }

  function handleApproveOnlySeasonal(candidate: DiscoveryCandidate) {
    void handleApprove(candidate, editableFieldsFromCandidate(candidate), {
      skipSeasonalStaging: true,
      successExtra: ' Browse only for now — it may appear under Suggested features next.',
    })
  }

  function handleRemoveFromSeasonal(
    candidate: DiscoveryCandidate,
    section: SeasonalCurationSection,
  ) {
    removeFromSeasonalSection(curationEventId(candidate), section, themeSlug)
    bumpCuration()
    setActionMessage({
      type: 'success',
      text: `Removed “${candidate.title}” from seasonal staging.`,
    })
  }

  function handleMoveSeasonal(candidate: DiscoveryCandidate, from: SeasonalCurationSection) {
    const to: SeasonalCurationSection =
      from === 'closeToHome' ? 'worthADrive' : 'closeToHome'
    moveSeasonalSection(curationEventId(candidate), from, to, themeSlug)
    bumpCuration()
    setActionMessage({
      type: 'success',
      text: `Moved “${candidate.title}” to ${
        to === 'closeToHome' ? 'Close to home' : 'Worth a little drive'
      }.`,
    })
  }

  async function handlePublishCuration() {
    setPublishCurationBusy(true)
    setActionMessage(null)
    try {
      const message = await publishSeasonalCurationToSite({
        themeSlug,
        collectionEventIds: seasonalSections.closeIds,
        driveEventIds: seasonalSections.driveIds,
      })
      commitSeasonalCurationPublish(
        themeSlug,
        seasonalSections.closeIds,
        seasonalSections.driveIds,
      )
      bumpCuration()
      setActionMessage({ type: 'success', text: message })
    } catch (error) {
      setActionMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Could not publish seasonal curation.',
      })
    } finally {
      setPublishCurationBusy(false)
    }
  }

  function persistCandidate(
    next: DiscoveryCandidate,
    edits?: DiscoveryEditableFields,
    approvedOn?: string,
  ) {
    saveDiscoveryReviewRecord(next.id, {
      reviewStatus: next.reviewStatus,
      convertedEventId: next.convertedEventId || undefined,
      edits,
      ...(approvedOn ? { approvedOn } : next.lastChecked ? { approvedOn: next.lastChecked } : {}),
      updatedAt: new Date().toISOString(),
    })
  }

  function updateCandidate(id: string, updater: (current: DiscoveryCandidate) => DiscoveryCandidate) {
    setCandidates((current) => current.map((row) => (row.id === id ? updater(row) : row)))
  }

  function handleSelect(candidate: DiscoveryCandidate) {
    setSelectedId((current) => (current === candidate.id ? null : candidate.id))
    setActionMessage(null)
  }

  function handleSaveEdits(candidate: DiscoveryCandidate, edits: DiscoveryEditableFields) {
    const next = mergeCandidate(candidate, edits)
    updateCandidate(candidate.id, () => next)
    persistCandidate(next, edits)
    setActionMessage({
      type: 'success',
      text: 'Edits saved on this device.',
    })
  }

  function handleWriteSheetToggle(enabled: boolean) {
    setWriteSheet(enabled)
    saveWriteSheetPreference(enabled)
  }

  async function handleApprove(
    candidate: DiscoveryCandidate,
    edits: DiscoveryEditableFields,
    publishOpts?: {
      skipSeasonalStaging?: boolean
      forceSeasonalSection?: SeasonalCurationSection
      successExtra?: string
    },
  ) {
    const lastChecked = pacificTodayYmd()
    const payloadEdits = { ...edits, lastChecked }
    const isExisting = candidate.alreadyOnPuddles

    try {
      assertDiscoveryAgeInScope(candidate, payloadEdits)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Outside Puddles ages 0–5.'
      setActionMessage({ type: 'error', text: message })
      return
    }

    if (isExisting) {
      const ok = window.confirm(
        [
          `“${edits.title}” is already on Puddles.`,
          `Approve will update Last Checked / Verified date to ${lastChecked} (not add a duplicate Draft).`,
        ].join('\n\n'),
      )
      if (!ok) return
    }

    setBusyId(candidate.id)
    setActionMessage({
      type: 'success',
      text: isExisting
        ? `Approving and updating verified date for “${edits.title}”…`
        : `Approving “${edits.title}”…`,
    })

    try {
      ensureAdminEventsCacheSeeded()
      const local = approveDiscoveryLocally(candidate, payloadEdits, lastChecked, {
        isRegional: isOutsideCoreDiscoveryCity(candidate, payloadEdits),
      })

      const next = mergeCandidate(candidate, payloadEdits, {
        reviewStatus: 'approved',
        convertedEventId: local.eventId || candidate.convertedEventId || '',
        lastChecked,
      })
      updateCandidate(candidate.id, () => next)
      persistCandidate(next, payloadEdits, lastChecked)
      stageDiscoveryCandidateForPublish(next, local.eventId, {
        skipSeasonalStaging: publishOpts?.skipSeasonalStaging,
        forceSeasonalSection: publishOpts?.forceSeasonalSection,
      })
      if (publishOpts?.forceSeasonalSection) {
        bumpCuration()
      }
      setSelectedId(null)
      const publishCount = loadAdminPublishQueue().items.length

      let sheetNote = ''
      if (writeSheet) {
        try {
          const sheetEventId = isExisting
            ? await writeExistingToSheet(candidate, payloadEdits, lastChecked, local.eventId)
            : await writeNewDraftToSheet(candidate, payloadEdits, lastChecked)
          if (sheetEventId && sheetEventId !== local.eventId) {
            const withSheetId = { ...next, convertedEventId: sheetEventId }
            updateCandidate(candidate.id, () => withSheetId)
            persistCandidate(withSheetId, payloadEdits, lastChecked)
            if (publishOpts?.forceSeasonalSection) {
              addToSeasonalSection(sheetEventId, publishOpts.forceSeasonalSection, themeSlug)
              bumpCuration()
            }
          }
          sheetNote = ' Also wrote Google Sheet.'
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Sheet write failed.'
          sheetNote = ` Local approval kept; Sheet write failed: ${deployHint(message)}`
        }
      }

      setActionMessage({
        type: sheetNote.includes('Sheet write failed') ? 'error' : 'success',
        text: isExisting
          ? `Approved on ${lastChecked} for “${edits.title}”. Added to header Publish (${publishCount}). Last edit: Approved nav.${publishOpts?.successExtra ?? ''}${sheetNote}`
          : `“${edits.title}” approved (${local.eventId}). Added to header Publish (${publishCount}). Last edit: Approved nav.${publishOpts?.successExtra ?? ''}${sheetNote}`,
      })
      requestAnimationFrame(() => {
        document.getElementById('admin-discovery-action-message')?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        })
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not approve discovery candidate.'
      setActionMessage({
        type: 'error',
        text: message,
      })
    } finally {
      setBusyId(null)
    }
  }

  async function handleBulkApprove(rows: DiscoveryCandidate[]) {
    if (writeSheet && rows.length > 25) {
      const ok = window.confirm(
        `You’re approving ${rows.length} items with “Also write Google Sheet” on.\n\nLarge Sheet batches can time out. Continue?\n\nTip: turn Sheet write off for large batches, or use ~15–25 at a time.`,
      )
      if (!ok) return
    }

    setBulkBusy(true)
    setActionMessage(null)
    let okCount = 0
    let updatedExisting = 0
    let localFail = ''
    let sheetFailMessage = ''
    const lastChecked = pacificTodayYmd()

    ensureAdminEventsCacheSeeded()

    const existing = rows.filter((row) => row.alreadyOnPuddles)
    const neu = rows.filter((row) => !row.alreadyOnPuddles)
    const localEventIds = new Map<string, string>()

    // Local-first: always mark Ready + patch Admin Events cache (no Sheet required).
    for (const candidate of existing) {
      try {
        const payloadEdits = { ...editableFieldsFromCandidate(candidate), lastChecked }
        const local = approveDiscoveryLocally(candidate, payloadEdits, lastChecked, {
          isRegional: isOutsideCoreDiscoveryCity(candidate, payloadEdits),
        })
        localEventIds.set(candidate.id, local.eventId)
        const next = mergeCandidate(candidate, payloadEdits, {
          reviewStatus: 'approved',
          convertedEventId: local.eventId,
          lastChecked,
        })
        updateCandidate(candidate.id, () => next)
        persistCandidate(next, payloadEdits, lastChecked)
        stageDiscoveryCandidateForPublish(next, local.eventId)
        okCount += 1
        updatedExisting += 1
      } catch (error) {
        localFail =
          error instanceof Error ? error.message : 'Could not update one or more already-on-site items.'
        break
      }
    }

    if (!localFail) {
      for (const candidate of neu) {
        try {
          const payloadEdits = { ...editableFieldsFromCandidate(candidate), lastChecked }
          const local = approveDiscoveryLocally(candidate, payloadEdits, lastChecked, {
            isRegional: isOutsideCoreDiscoveryCity(candidate, payloadEdits),
          })
          localEventIds.set(candidate.id, local.eventId)
          const next = mergeCandidate(candidate, payloadEdits, {
            reviewStatus: 'approved',
            convertedEventId: local.eventId,
            lastChecked,
          })
          updateCandidate(candidate.id, () => next)
          persistCandidate(next, payloadEdits, lastChecked)
          stageDiscoveryCandidateForPublish(next, local.eventId)
          okCount += 1
        } catch (error) {
          localFail =
            error instanceof Error ? error.message : 'Could not approve one or more new candidates.'
          break
        }
      }
    }

    // Optional Sheet sync after local Ready (failures do not undo Ready).
    if (writeSheet && okCount > 0) {
      const approvedExisting = existing.filter((row) => localEventIds.has(row.id))
      const approvedNew = neu.filter((row) => localEventIds.has(row.id))

      if (approvedExisting.length > 0) {
        const allIds = [
          ...new Set(
            approvedExisting.flatMap((candidate) => {
              const matched = findMatchingEventIdsForCandidate(candidate)
              return matched.length > 0
                ? matched
                : localEventIds.get(candidate.id)
                  ? [localEventIds.get(candidate.id)!]
                  : []
            }),
          ),
        ]
        const CHUNK = 40
        try {
          for (let i = 0; i < allIds.length; i += CHUNK) {
            const chunk = allIds.slice(i, i + CHUNK)
            await callSheetApi({
              action: 'bulkUpdateEventVerifiedDate',
              payload: { ids: chunk, verifiedDate: lastChecked },
            })
            if (i + CHUNK < allIds.length) {
              await new Promise((r) => setTimeout(r, 400))
            }
          }
        } catch (error) {
          sheetFailMessage =
            error instanceof Error ? error.message : 'Could not update verified dates on Sheet.'
        }
      }

      if (!sheetFailMessage) {
        for (let i = 0; i < approvedNew.length; i++) {
          const candidate = approvedNew[i]
          const payloadEdits = { ...editableFieldsFromCandidate(candidate), lastChecked }
          try {
            const sheetEventId = await writeNewDraftToSheet(candidate, payloadEdits, lastChecked)
            if (sheetEventId) {
              const next = mergeCandidate(candidate, payloadEdits, {
                reviewStatus: 'approved',
                convertedEventId: sheetEventId,
                lastChecked,
              })
              updateCandidate(candidate.id, () => next)
              persistCandidate(next, payloadEdits, lastChecked)
            }
            if (i < approvedNew.length - 1) {
              await new Promise((r) => setTimeout(r, 350))
            }
          } catch (error) {
            sheetFailMessage =
              error instanceof Error ? error.message : 'Could not write one or more Drafts to Sheet.'
            break
          }
        }
      }
    }

    setBulkBusy(false)
    setSelectedId(null)
    const publishCount = loadAdminPublishQueue().items.length

    if (okCount > 0 && !localFail && !sheetFailMessage) {
      setActionMessage({
        type: 'success',
        text: writeSheet
          ? `Approved ${okCount} (${updatedExisting} already on site). Header Publish (${publishCount}). Also wrote Google Sheet.`
          : `Approved ${okCount} (${updatedExisting} already on site). Header Publish (${publishCount}). Last edit: Approved nav.`,
      })
    } else if (okCount > 0 && (localFail || sheetFailMessage)) {
      setActionMessage({
        type: 'error',
        text: localFail
          ? `Approved ${okCount}, then stopped: ${localFail}`
          : `Approved ${okCount} locally. Sheet write issue: ${deployHint(sheetFailMessage)}. Publish queue: ${publishCount}.`,
      })
    } else {
      setActionMessage({
        type: 'error',
        text: localFail || sheetFailMessage || 'Could not approve selected events.',
      })
    }
  }

  function handleDismiss(candidate: DiscoveryCandidate) {
    if (candidate.reviewStatus === 'approved') {
      removeStagedAdminEvent('discovery', candidate.id)
    }
    const next = { ...candidate, reviewStatus: 'dismissed' as const }
    updateCandidate(candidate.id, () => next)
    persistCandidate(next)
    setSelectedId((current) => (current === candidate.id ? null : current))
    setActionMessage({ type: 'success', text: 'Dismissed from the pending queue.' })
  }

  function handleRestore(candidate: DiscoveryCandidate) {
    if (candidate.reviewStatus === 'approved') {
      removeStagedAdminEvent('discovery', candidate.id)
    }
    const next = { ...candidate, reviewStatus: 'pending' as const }
    updateCandidate(candidate.id, () => next)
    persistCandidate(next)
    setActionMessage({ type: 'success', text: 'Restored to pending.' })
  }

  return (
    <>
      <section className="admin-sync-bar" aria-label="Discovery overview">
        <p className="admin-submissions-intro">
          Review library candidates here. <strong>Approve</strong> adds them to header{' '}
          <strong>Publish</strong> (~2–4 min after you publish once). Last edits:{' '}
          <strong>Approved</strong> nav. Use <strong>Seasonal picks</strong> for recommended seasonal
          adds and features (then Publish curation).
        </p>
        <aside className="admin-discovery-schedule-note" aria-label="Discovery automation schedule">
          <h2 className="admin-discovery-schedule-note__title">Automation schedule</h2>
          <ul className="admin-discovery-schedule-note__list">
            <li>
              <strong>Wednesdays @ 8:00 AM PT:</strong> Unified ingest (libraries, Linden, core +
              regional inboxes, merge). Use <strong>Open all this week</strong> below, then cron
              imports what is in the inbox files.
            </li>
          </ul>
          <p className="admin-discovery-schedule-note__foot">
            Libraries scrape automatically. City calendars, social, and roundups need you (or chat)
            first — then Approve → Publish. Core cities: everyday finds. Other cities: destination /
            once-in-a-while only → Browse under Other cities (optional seasonal feature).
          </p>
        </aside>
        <AdminManualCheckList />
        <label className="admin-discovery-sheet-toggle">
          <input
            type="checkbox"
            checked={writeSheet}
            onChange={(e) => handleWriteSheetToggle(e.target.checked)}
          />
          <span>
            Also write Google Sheet on Approve (optional). Sheet failures never undo approval or the
            Publish queue.
          </span>
        </label>
        <p className="mt-3 text-sm text-muted">
          Queue: {DISCOVERY_CATALOG.window.start} → {DISCOVERY_CATALOG.window.end} · generated{' '}
          {DISCOVERY_CATALOG.generatedAt
            ? new Date(DISCOVERY_CATALOG.generatedAt).toLocaleString('en-US', {
                timeZone: 'America/Los_Angeles',
              })
            : '—'}
          . Refresh with <code>npm run discover:bay-area</code>. Review status is saved in this
          browser.
        </p>
        {view === 'thisWeek' ? (
          <div className="admin-discovery-this-week">
            <div className="admin-discovery-this-week__head">
              <h2 className="admin-discovery-this-week__title">New to Puddles this week</h2>
              <p className="admin-discovery-this-week__lede">
                {thisWeekSummary.weekStart} → {thisWeekSummary.weekEnd} Pacific ·{' '}
                {thisWeekSummary.total} pending review · queue refreshed{' '}
                {DISCOVERY_CATALOG.generatedAt
                  ? new Date(DISCOVERY_CATALOG.generatedAt).toLocaleString('en-US', {
                      timeZone: 'America/Los_Angeles',
                    })
                  : '—'}
              </p>
            </div>
            {thisWeekSummary.highlights.length > 0 ? (
              <ul className="admin-discovery-this-week__highlights">
                {thisWeekSummary.highlights.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : null}
            <div className="admin-discovery-this-week__grid">
              <div className="admin-discovery-this-week__panel">
                <h3 className="admin-discovery-this-week__label">New cities</h3>
                <ul className="admin-discovery-this-week__list">
                  {thisWeekSummary.launchCities.map((entry) => (
                    <li key={entry.city}>
                      <strong>{entry.city}</strong> · {entry.count} this week
                      <span className="admin-discovery-this-week__meta">
                        NEW filter until {entry.newUntil}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="admin-discovery-this-week__panel">
                <h3 className="admin-discovery-this-week__label">New activity types</h3>
                <ul className="admin-discovery-this-week__list">
                  {thisWeekSummary.launchActivityTypes.map((entry) => (
                    <li key={entry.type}>
                      <strong>{entry.type}</strong> · {entry.count} this week
                      <span className="admin-discovery-this-week__meta">
                        NEW filter until {entry.newUntil}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="admin-discovery-this-week__panel">
                <h3 className="admin-discovery-this-week__label">By source</h3>
                <ul className="admin-discovery-this-week__list">
                  {thisWeekSummary.bySource.slice(0, 8).map((entry) => (
                    <li key={entry.source}>
                      {entry.source} · {entry.count}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="admin-discovery-this-week__panel">
                <h3 className="admin-discovery-this-week__label">By city</h3>
                <ul className="admin-discovery-this-week__list">
                  {thisWeekSummary.byCity.slice(0, 8).map((entry) => (
                    <li key={entry.city}>
                      {entry.city} · {entry.count}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : null}
        {actionMessage ? (
          <p
            className={`admin-action-alert admin-action-alert--${actionMessage.type}`}
            role="status"
            id="admin-discovery-action-message"
          >
            {actionMessage.text}
          </p>
        ) : null}
      </section>

      <section className="admin-events-section admin-events-section--discovery">
        <div className="admin-events-header">
          <div>
            <h2 className="font-display text-lg text-charcoal">Discovery queue</h2>
            <p className="admin-events-header__sub">
              {discoveryMode === 'regular'
                ? `${filtered.length} shown · core cities + Worth a Drive pending`
                : `${seasonalCollection?.title || themeSlug} · ${suggestedAddRows.length} adds · ${suggestedFeatureRows.length} features · scores Discovery pool (not a separate cron)`}
            </p>
          </div>
        </div>

        <div className="admin-discovery-mode-toggle" role="tablist" aria-label="Discovery mode">
          <button
            type="button"
            role="tab"
            aria-selected={discoveryMode === 'regular'}
            className={`admin-btn ${
              discoveryMode === 'regular' ? 'admin-btn-primary' : 'admin-btn-secondary'
            }`}
            onClick={() => setDiscoveryMode('regular')}
          >
            Regular Discovery
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={discoveryMode === 'seasonal'}
            className={`admin-btn ${
              discoveryMode === 'seasonal' ? 'admin-btn-primary' : 'admin-btn-secondary'
            }`}
            onClick={() => setDiscoveryMode('seasonal')}
          >
            Seasonal picks
          </button>
        </div>

        {discoveryMode === 'regular' ? (
          <>
            <div className="admin-toolbar">
              <label className="admin-search">
                <span className="sr-only">Search discovery</span>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search title, venue, tips…"
                  className="admin-search-input"
                />
              </label>
            </div>

            <div className="admin-view-tabs" role="tablist" aria-label="Discovery views">
              {REGULAR_VIEW_OPTIONS.map((option) => {
                const count =
                  option.id === 'thisWeek'
                    ? thisWeekSummary.total
                    : option.id === 'new'
                      ? counts.newPending
                      : option.id === 'dismissed'
                        ? counts.dismissed
                        : counts.queue
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="tab"
                    aria-selected={view === option.id}
                    className={`admin-btn ${view === option.id ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                    onClick={() => setView(option.id)}
                  >
                    {option.label} ({count})
                  </button>
                )
              })}
            </div>

            <AdminDiscoveryTable
              candidates={filtered}
              selectedId={selectedId}
              busyId={busyId}
              bulkBusy={bulkBusy}
              onSelect={handleSelect}
              onSaveEdits={handleSaveEdits}
              onApprove={handleApprove}
              onBulkApprove={(rows) => void handleBulkApprove(rows)}
              onDismiss={handleDismiss}
              onRestore={handleRestore}
            />
          </>
        ) : (
          <div className="admin-discovery-seasonal">
            {multiThemeRecs.themesWithRecs.length > 1 ? (
              <div
                className="admin-discovery-seasonal__theme-tabs"
                role="tablist"
                aria-label="Seasonal themes"
              >
                {multiThemeRecs.themesWithRecs.map((theme) => (
                  <button
                    key={theme.themeSlug}
                    type="button"
                    role="tab"
                    aria-selected={themeSlug === theme.themeSlug}
                    className={`admin-btn ${
                      themeSlug === theme.themeSlug ? 'admin-btn-primary' : 'admin-btn-secondary'
                    }`}
                    onClick={() => setSelectedThemeSlug(theme.themeSlug)}
                  >
                    {theme.title} ({theme.totalCount})
                  </button>
                ))}
              </div>
            ) : null}

            {multiThemeRecs.themesWithRecs.length === 0 ? (
              <p className="admin-discovery-seasonal__empty">
                No seasonal recommendations in the Discovery pool right now. Publish strip below still
                targets{' '}
                <strong>{seasonalCollection?.title || multiThemeRecs.primarySlug}</strong> if you have
                staging.
              </p>
            ) : null}

            <div className="admin-discovery-seasonal__strip" role="status">
              <p className="admin-discovery-seasonal__strip-text">
                On collection now:{' '}
                <strong>{seasonalSections.closeIds.length}</strong> Close ·{' '}
                <strong>{seasonalSections.driveIds.length}</strong> Drive
                {stagingHasChanges(seasonalSections.staging) ? (
                  <span>
                    {' '}
                    · unsaved staging (
                    {seasonalSections.staging.closeToHome.addIds.length +
                      seasonalSections.staging.worthADrive.addIds.length}{' '}
                    add
                    {seasonalSections.staging.closeToHome.removeIds.length +
                      seasonalSections.staging.worthADrive.removeIds.length >
                    0
                      ? `, ${
                          seasonalSections.staging.closeToHome.removeIds.length +
                          seasonalSections.staging.worthADrive.removeIds.length
                        } remove`
                      : ''}
                    )
                  </span>
                ) : null}
              </p>
              <div className="admin-discovery-seasonal__strip-links">
                {seasonalCollection?.slug ? (
                  <a
                    className="admin-btn admin-btn-secondary"
                    href={`/experiment/seasonal-discovery/${seasonalCollection.slug}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Preview collection ↗
                  </a>
                ) : null}
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  aria-expanded={manageCurrentOpen}
                  onClick={() => setManageCurrentOpen((open) => !open)}
                >
                  {manageCurrentOpen ? 'Hide current picks' : 'Manage current picks'}
                </button>
                {stagingHasChanges(seasonalSections.staging) ? (
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary"
                    disabled={publishCurationBusy}
                    onClick={() => {
                      clearSeasonalThemeStaging(themeSlug)
                      bumpCuration()
                      setActionMessage({ type: 'success', text: 'Cleared local seasonal staging.' })
                    }}
                  >
                    Discard staging
                  </button>
                ) : null}
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  disabled={publishCurationBusy || !stagingHasChanges(seasonalSections.staging)}
                  onClick={() => void handlePublishCuration()}
                >
                  {publishCurationBusy ? 'Publishing…' : 'Publish curation'}
                </button>
              </div>
            </div>

            {manageCurrentOpen ? (
              <div className="admin-discovery-seasonal__manage">
                <section
                  className="admin-discovery-seasonal__section"
                  aria-labelledby="close-to-home-heading"
                >
                  <div className="admin-discovery-seasonal__section-head">
                    <h3
                      id="close-to-home-heading"
                      className="admin-discovery-seasonal__section-title"
                    >
                      {seasonalCollection?.closeToHome?.title || 'Close to home'}
                    </h3>
                    <p className="admin-discovery-seasonal__section-sub">
                      {seasonalSections.closeToHome.length} on collection
                    </p>
                  </div>
                  <AdminDiscoveryTable
                    candidates={seasonalSections.closeToHome}
                    selectedId={selectedId}
                    busyId={busyId}
                    bulkBusy={bulkBusy}
                    onSelect={handleSelect}
                    onSaveEdits={handleSaveEdits}
                    onApprove={handleApprove}
                    onBulkApprove={(rows) => void handleBulkApprove(rows)}
                    onDismiss={handleDismiss}
                    onRestore={handleRestore}
                    curationSection="closeToHome"
                    onRemoveFromSeasonal={(row) => handleRemoveFromSeasonal(row, 'closeToHome')}
                    onMoveSeasonal={(row) => handleMoveSeasonal(row, 'closeToHome')}
                  />
                </section>
                <section
                  className="admin-discovery-seasonal__section"
                  aria-labelledby="worth-drive-heading"
                >
                  <div className="admin-discovery-seasonal__section-head">
                    <h3 id="worth-drive-heading" className="admin-discovery-seasonal__section-title">
                      {seasonalCollection?.worthADrive?.title || 'Worth a little drive'}
                    </h3>
                    <p className="admin-discovery-seasonal__section-sub">
                      {seasonalSections.worthADrive.length} on collection
                    </p>
                  </div>
                  <AdminDiscoveryTable
                    candidates={seasonalSections.worthADrive}
                    selectedId={selectedId}
                    busyId={busyId}
                    bulkBusy={bulkBusy}
                    onSelect={handleSelect}
                    onSaveEdits={handleSaveEdits}
                    onApprove={handleApprove}
                    onBulkApprove={(rows) => void handleBulkApprove(rows)}
                    onDismiss={handleDismiss}
                    onRestore={handleRestore}
                    curationSection="worthADrive"
                    onRemoveFromSeasonal={(row) => handleRemoveFromSeasonal(row, 'worthADrive')}
                    onMoveSeasonal={(row) => handleMoveSeasonal(row, 'worthADrive')}
                  />
                </section>
              </div>
            ) : null}

            <section
              className="admin-discovery-seasonal__section"
              aria-labelledby="suggested-adds-heading"
            >
              <div className="admin-discovery-seasonal__section-head">
                <h3 id="suggested-adds-heading" className="admin-discovery-seasonal__section-title">
                  Suggested adds
                </h3>
                <p className="admin-discovery-seasonal__section-sub">
                  Not on Puddles yet · seasonal-shaped finds · {suggestedAddRows.length}
                </p>
              </div>
              {suggestedAddRows.length === 0 ? (
                <p className="admin-discovery-seasonal__empty">
                  No pending seasonal adds right now. Regular Discovery still has the full to-add
                  queue.
                </p>
              ) : (
                <AdminDiscoveryTable
                  candidates={suggestedAddRows}
                  selectedId={selectedId}
                  busyId={busyId}
                  bulkBusy={bulkBusy}
                  onSelect={handleSelect}
                  onSaveEdits={handleSaveEdits}
                  onApprove={handleApprove}
                  onBulkApprove={(rows) => void handleBulkApprove(rows)}
                  onDismiss={handleDismiss}
                  onRestore={handleRestore}
                  recommendationMode="suggestedAdd"
                  suggestedSectionById={suggestedSectionById}
                  onApproveAndStage={handleApproveAndStage}
                  onApproveOnly={handleApproveOnlySeasonal}
                />
              )}
            </section>

            <section
              className="admin-discovery-seasonal__section"
              aria-labelledby="suggested-features-heading"
            >
              <div className="admin-discovery-seasonal__section-head">
                <h3
                  id="suggested-features-heading"
                  className="admin-discovery-seasonal__section-title"
                >
                  Suggested features
                </h3>
                <p className="admin-discovery-seasonal__section-sub">
                  Already on Puddles · fit the theme · not yet on Close / Drive ·{' '}
                  {suggestedFeatureRows.length}
                </p>
              </div>
              {suggestedFeatureRows.length === 0 ? (
                <p className="admin-discovery-seasonal__empty">
                  No feature suggestions — everything scoring for this theme is already curated or
                  dismissed.
                </p>
              ) : (
                <AdminDiscoveryTable
                  candidates={suggestedFeatureRows}
                  selectedId={selectedId}
                  busyId={busyId}
                  bulkBusy={bulkBusy}
                  onSelect={handleSelect}
                  onSaveEdits={handleSaveEdits}
                  onApprove={handleApprove}
                  onBulkApprove={(rows) => void handleBulkApprove(rows)}
                  onDismiss={handleDismiss}
                  onRestore={handleRestore}
                  recommendationMode="suggestedFeature"
                  suggestedSectionById={suggestedSectionById}
                  onStageFeature={handleStageFeature}
                  onNotForTheme={handleNotForTheme}
                />
              )}
            </section>
          </div>
        )}
      </section>
    </>
  )
}
