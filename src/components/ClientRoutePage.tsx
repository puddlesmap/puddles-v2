'use client'

import { Suspense, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Navigate, Route, Routes } from 'react-router-dom'
import { MemoryRouter } from 'react-router-dom'
import { BottomNav } from '@/components/layout/BottomNav'
import { LocationBridge } from '@/components/LocationBridge'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ScrollToTop } from '@/components/ScrollToTop'
import { AdminAuthGate } from '@/components/admin/AdminAuthGate'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DiscoveryPage } from '@/views/DiscoveryPage'
import { HomePage } from '@/views/HomePage'
import { HomeLaunchPreviewPage } from '@/views/HomeLaunchPreviewPage'
import { ExperimentHallmarkHelloFallMockupPage } from '@/views/ExperimentHallmarkHelloFallMockupPage'
import { ExperimentHallmarkHomeMockupPage } from '@/views/ExperimentHallmarkHomeMockupPage'
import { ExperimentHomeApricotBandMockupPage } from '@/views/ExperimentHomeApricotBandMockupPage'
import { ExperimentSeasonalBackNavMockupPage } from '@/views/ExperimentSeasonalBackNavMockupPage'
import { ExperimentHomeBrowseChipsMockupPage } from '@/views/ExperimentHomeBrowseChipsMockupPage'
import { HomeV1Page } from '@/views/HomeV1Page'
import { HomeExperiment1Page } from '@/views/HomeExperiment1Page'
import { HomeExperiment2Page } from '@/views/HomeExperiment2Page'
import { HomeExperiment3Page } from '@/views/HomeExperiment3Page'
import { HomeExperiment4Page } from '@/views/HomeExperiment4Page'
import { ExperimentBrowsePage } from '@/views/ExperimentBrowsePage'
import { ExperimentBrowseMapPage } from '@/views/ExperimentBrowseMapPage'
import { ExperimentBrowseTwoColumnPage } from '@/views/ExperimentBrowseTwoColumnPage'
import { BrowsePage } from '@/views/BrowsePage'
import { BrowseV1Page } from '@/views/BrowseV1Page'
import { BrowseV2Page } from '@/views/BrowseV2Page'
import { BROWSE_PAGE_PROPS } from '@/views/browsePageConfigs'
import { SharePage } from '@/views/SharePage'
import { ExperimentSharePage } from '@/views/ExperimentSharePage'
import { AboutPage } from '@/views/AboutPage'
import { AboutExperimentPage } from '@/views/AboutExperimentPage'
import { TypographyExperimentHomePage } from '@/views/TypographyExperimentHomePage'
import { TypographyExperimentAboutPage } from '@/views/TypographyExperimentAboutPage'
import { TypographyAboutStyleHomePage } from '@/views/TypographyAboutStyleHomePage'
import { TypographyAboutStyleSharePage } from '@/views/TypographyAboutStyleSharePage'
import { TypographyExperimentsIndexPage } from '@/views/TypographyExperimentsIndexPage'
import { NotFoundPage } from '@/views/NotFoundPage'
import { MaintenancePage } from '@/views/MaintenancePage'
import { LogoLabPage } from '@/views/LogoLabPage'
import { CityLandingPage } from '@/views/CityLandingPage'
import { ExperimentEventModalPage } from '@/views/ExperimentEventModalPage'
import { ExperimentEventModalV3Page } from '@/views/ExperimentEventModalV3Page'
import { ExperimentExpiredActivityLayout } from '@/views/ExperimentExpiredActivityLayout'
import { ExperimentExpiredActivityPage } from '@/views/ExperimentExpiredActivityPage'
import { ExperimentExpiredActivityBrowsePage } from '@/views/ExperimentExpiredActivityBrowsePage'
import { ExperimentExpiredActivityDetailPage } from '@/views/ExperimentExpiredActivityDetailPage'
import { ExperimentSharedEventLayout } from '@/views/ExperimentSharedEventLayout'
import { ExperimentSharedEventPage } from '@/views/ExperimentSharedEventPage'
import { ExperimentSharedEventDetailPage } from '@/views/ExperimentSharedEventDetailPage'
import { ExperimentWelcomePage } from '@/views/ExperimentWelcomePage'
import { ExperimentSeasonalDiscoveryPage } from '@/views/ExperimentSeasonalDiscoveryPage'
import { ExperimentSeasonalCollectionPage } from '@/views/ExperimentSeasonalCollectionPage'
import { ExperimentSeasonalLaunchReviewPage } from '@/views/ExperimentSeasonalLaunchReviewPage'
import { ExperimentCommunityEventsMockupPage } from '@/views/ExperimentCommunityEventsMockupPage'
import { ExperimentLaunchExpandMockupPage } from '@/views/ExperimentLaunchExpandMockupPage'
import { ExperimentBrowseV2MockupPage } from '@/views/ExperimentBrowseV2MockupPage'
import { ExperimentBrowseV3MockupPage } from '@/views/ExperimentBrowseV3MockupPage'
import { ExperimentBrowseCardLayoutMockupPage } from '@/views/ExperimentBrowseCardLayoutMockupPage'
import { ExperimentBrowseCardDesignReferencePage } from '@/views/ExperimentBrowseCardDesignReferencePage'
import { ExperimentBrowseLiveVsOption2Page } from '@/views/ExperimentBrowseLiveVsOption2Page'
import { ExperimentSeasonalThemeCalendarPage } from '@/views/ExperimentSeasonalThemeCalendarPage'
import { ExperimentSeasonalBackgroundDialPage } from '@/views/ExperimentSeasonalBackgroundDialPage'
import { WelcomeOnboarding } from '@/components/welcome/WelcomeOnboarding'
import { AdminEventsPage } from '@/views/admin/AdminEventsPage'
import { AdminDiscoveryPage } from '@/views/admin/AdminDiscoveryPage'
import { AdminSubmissionsPage } from '@/views/admin/AdminSubmissionsPage'
import { AdminSeasonalCalendarPage } from '@/views/admin/AdminSeasonalCalendarPage'
import { trackPageView } from '@/utils/analytics'
import { applySiteMeta } from '@/utils/siteMeta'
import { readEventDetailOverlayState } from '@/utils/nextEventDetailState'

function ClientRoutes() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams.toString()
  const isAdminRoute = pathname.startsWith('/admin')
  const isLogoLab = pathname === '/logo-lab'
  const isStandaloneEventDetail =
    /^\/event\/[^/]+$/.test(pathname) && !readEventDetailOverlayState()

  useEffect(() => {
    if (!pathname.startsWith('/event/')) {
      applySiteMeta(pathname, search ? `?${search}` : '')
    }
    trackPageView(pathname)
  }, [pathname, search])

  return (
    <div className="layout-root min-h-dvh bg-white">
      <ScrollToTop />
      <main>
        <ErrorBoundary title="Puddles failed to load">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/experiment/home-launch-preview" element={<HomeLaunchPreviewPage />} />
            <Route path="/experiment/seasonal-launch-review" element={<ExperimentSeasonalLaunchReviewPage />} />
            <Route
              path="/experiment/hallmark-home-mockup"
              element={<ExperimentHallmarkHomeMockupPage />}
            />
            <Route
              path="/experiment/home-apricot-band"
              element={<ExperimentHomeApricotBandMockupPage />}
            />
            <Route
              path="/experiment/seasonal-back-nav-mockup"
              element={<ExperimentSeasonalBackNavMockupPage />}
            />
            <Route
              path="/experiment/home-browse-chips-mockup"
              element={<ExperimentHomeBrowseChipsMockupPage />}
            />
            <Route
              path="/experiment/hallmark-hello-fall-mockup"
              element={<ExperimentHallmarkHelloFallMockupPage />}
            />
            <Route path="/home-v1" element={<HomeV1Page />} />
            <Route path="/home-experiment" element={<Navigate to="/" replace />} />
            <Route path="/home-experiment-1" element={<HomeExperiment1Page />} />
            <Route path="/home-experiment-2" element={<HomeExperiment2Page />} />
            <Route path="/home-experiment-3" element={<HomeExperiment3Page />} />
            <Route path="/home-experiment-4" element={<HomeExperiment4Page />} />
            <Route path="/experiment-home" element={<Navigate to="/" replace />} />
            <Route path="/home-experiment-compact" element={<Navigate to="/" replace />} />
            <Route path="/discovery" element={<DiscoveryPage />} />
            <Route path="/browse" element={<BrowsePage {...BROWSE_PAGE_PROPS} />} />
            <Route path="/map" element={<BrowsePage {...BROWSE_PAGE_PROPS} defaultViewMode="map" />} />
            <Route path="/browse-v2" element={<BrowseV2Page />} />
            <Route path="/palo-alto" element={<CityLandingPage citySlug="palo-alto" />} />
            <Route path="/los-altos" element={<CityLandingPage citySlug="los-altos" />} />
            <Route path="/mountain-view" element={<CityLandingPage citySlug="mountain-view" />} />
            <Route path="/sunnyvale" element={<CityLandingPage citySlug="sunnyvale" />} />
            <Route path="/browse-v1" element={<BrowseV1Page />} />
            <Route path="/experiment-browse" element={<ExperimentBrowsePage />} />
            <Route path="/experiment-browse-map" element={<ExperimentBrowseMapPage />} />
            <Route path="/experiments/browse-2-column" element={<ExperimentBrowseTwoColumnPage />} />
            <Route path="/browse-experiment-2-column" element={<Navigate to="/experiments/browse-2-column" replace />} />
            <Route path="/experiment-event-modal" element={<ExperimentEventModalPage />} />
            <Route path="/experiment-event-modal-v3" element={<ExperimentEventModalV3Page />} />
            <Route path="/experiment-welcome" element={<ExperimentWelcomePage />} />
            <Route path="/experiment/seasonal-discovery" element={<ExperimentSeasonalDiscoveryPage />} />
            <Route
              path="/experiment/seasonal-discovery/calendar"
              element={<ExperimentSeasonalThemeCalendarPage />}
            />
            <Route path="/experiment/seasonal-bg-dial" element={<ExperimentSeasonalBackgroundDialPage />} />
            <Route
              path="/experiment/seasonal-discovery/background"
              element={<Navigate to="/experiment/seasonal-bg-dial" replace />}
            />
            <Route path="/experiment/seasonal-discovery/:slug" element={<ExperimentSeasonalCollectionPage />} />
            <Route
              path="/experiment/community-events-mockup"
              element={<ExperimentCommunityEventsMockupPage />}
            />
            <Route
              path="/experiment/launch-expand-mockup"
              element={<ExperimentLaunchExpandMockupPage />}
            />
            <Route
              path="/experiment/browse-v2-mockup"
              element={<ExperimentBrowseV2MockupPage />}
            />
            <Route
              path="/experiment/browse-v3-mockup"
              element={<ExperimentBrowseV3MockupPage />}
            />
            <Route
              path="/experiment/browse-card-layout-mockup"
              element={<ExperimentBrowseCardLayoutMockupPage />}
            />
            <Route
              path="/experiment/browse-card-design-reference"
              element={<ExperimentBrowseCardDesignReferencePage />}
            />
            <Route
              path="/experiment/browse-live-vs-option2"
              element={<ExperimentBrowseLiveVsOption2Page />}
            />
            <Route path="/experiment-shared-event" element={<ExperimentSharedEventLayout />}>
              <Route index element={<ExperimentSharedEventPage />} />
              <Route path="event/:eventId" element={<ExperimentSharedEventDetailPage />} />
            </Route>
            <Route path="/experiment-expired-activity" element={<ExperimentExpiredActivityLayout />}>
              <Route index element={<ExperimentExpiredActivityPage />} />
              <Route path="browse" element={<ExperimentExpiredActivityBrowsePage />} />
              <Route path="event/:eventId" element={<ExperimentExpiredActivityDetailPage />} />
            </Route>
            <Route path="/experiment-browse-3" element={<Navigate to="/browse" replace />} />
            <Route path="/browse-experiment" element={<Navigate to="/experiment-browse" replace />} />
            <Route path="/share" element={<SharePage />} />
            <Route path="/share-experiment" element={<ExperimentSharePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/about-experiment" element={<AboutExperimentPage />} />
            <Route path="/experiment_about" element={<AboutExperimentPage />} />
            <Route path="/typography-experiment" element={<TypographyExperimentsIndexPage />} />
            <Route path="/typography-experiment/home" element={<TypographyExperimentHomePage />} />
            <Route path="/typography-experiment/discovery" element={<Navigate to="/discovery" replace />} />
            <Route path="/typography-experiment/about" element={<TypographyExperimentAboutPage />} />
            <Route path="/typography-experiment/about-style/home" element={<TypographyAboutStyleHomePage />} />
            <Route path="/typography-experiment/about-style/share" element={<TypographyAboutStyleSharePage />} />
            <Route path="/typography-experiment/share" element={<TypographyAboutStyleSharePage />} />
            <Route path="/logo-lab" element={<LogoLabPage />} />
            <Route path="/maintenance" element={<MaintenancePage />} />
            <Route path="/admin" element={<AdminAuthGate />}>
              <Route element={<AdminLayout />}>
                <Route index element={<Navigate to="events" replace />} />
                <Route path="events" element={<AdminEventsPage />} />
                <Route path="discovery" element={<AdminDiscoveryPage />} />
                <Route path="submissions" element={<AdminSubmissionsPage />} />
                <Route path="seasonal-calendar" element={<AdminSeasonalCalendarPage />} />
              </Route>
            </Route>
            <Route path="/Admin" element={<Navigate to="/admin/events" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ErrorBoundary>
      </main>
      {!isAdminRoute && !isLogoLab && !isStandaloneEventDetail && <BottomNav />}
      {!isAdminRoute && <LocationBridge />}
      {!isAdminRoute && !isLogoLab && <WelcomeOnboarding />}
    </div>
  )
}

interface ClientRoutePageProps {
  pathname: string
  search?: string
}

function resolveClientRouterEntry(pathname: string, search: string): string {
  const currentEntry = `${pathname}${search}`
  if (!/^\/event\/[^/]+$/.test(pathname)) return currentEntry

  const overlay = readEventDetailOverlayState()
  if (overlay?.backgroundPath) return overlay.backgroundPath

  return currentEntry
}

function ClientRouteLoading() {
  return (
    <div className="admin-auth-shell" role="status" aria-live="polite">
      <p className="admin-auth-loading">Loading Puddles…</p>
    </div>
  )
}

export function ClientRoutePage({ pathname, search = '' }: ClientRoutePageProps) {
  const initialEntry = resolveClientRouterEntry(pathname, search)

  return (
    <Suspense fallback={<ClientRouteLoading />}>
      <MemoryRouter key={initialEntry} initialEntries={[initialEntry]}>
        <ClientRoutes />
      </MemoryRouter>
    </Suspense>
  )
}
