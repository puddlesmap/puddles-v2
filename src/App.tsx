import { useEffect } from 'react'
import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { BottomNav } from './components/layout/BottomNav'
import { LocationBridge } from './components/LocationBridge'
import { ScrollToTop } from './components/ScrollToTop'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AdminAuthGate } from './components/admin/AdminAuthGate'
import { AdminLayout } from './components/admin/AdminLayout'
import { DiscoveryPage } from './views/DiscoveryPage'
import { HomePage } from './views/HomePage'
import { HomeV1Page } from './views/HomeV1Page'
import { HomeExperiment1Page } from './views/HomeExperiment1Page'
import { HomeExperiment2Page } from './views/HomeExperiment2Page'
import { HomeExperiment3Page } from './views/HomeExperiment3Page'
import { HomeExperiment4Page } from './views/HomeExperiment4Page'
import { ExperimentBrowsePage } from './views/ExperimentBrowsePage'
import { ExperimentBrowseMapPage } from './views/ExperimentBrowseMapPage'
import { ExperimentBrowseTwoColumnPage } from './views/ExperimentBrowseTwoColumnPage'
import { BrowsePage } from './views/BrowsePage'
import { BrowseV1Page } from './views/BrowseV1Page'
import { BrowseV2Page } from './views/BrowseV2Page'
import { BROWSE_PAGE_PROPS } from './views/browsePageConfigs'
import { SharePage } from './views/SharePage'
import { ExperimentSharePage } from './views/ExperimentSharePage'
import { AboutPage } from './views/AboutPage'
import { AboutExperimentPage } from './views/AboutExperimentPage'
import { TypographyExperimentHomePage } from './views/TypographyExperimentHomePage'
import { TypographyExperimentAboutPage } from './views/TypographyExperimentAboutPage'
import { TypographyAboutStyleHomePage } from './views/TypographyAboutStyleHomePage'
import { TypographyAboutStyleSharePage } from './views/TypographyAboutStyleSharePage'
import { TypographyExperimentsIndexPage } from './views/TypographyExperimentsIndexPage'
import { NotFoundPage } from './views/NotFoundPage'
import { MaintenancePage } from './views/MaintenancePage'
import { LogoLabPage } from './views/LogoLabPage'
import { CityLandingPage } from './views/CityLandingPage'
import { EventDetailPage } from './views/EventDetailPage'
import { EventDetailModalOverlay } from './views/EventDetailModalOverlay'
import { ExperimentEventModalPage } from './views/ExperimentEventModalPage'
import { ExperimentExpiredActivityLayout } from './views/ExperimentExpiredActivityLayout'
import { ExperimentExpiredActivityPage } from './views/ExperimentExpiredActivityPage'
import { ExperimentExpiredActivityBrowsePage } from './views/ExperimentExpiredActivityBrowsePage'
import { ExperimentExpiredActivityDetailPage } from './views/ExperimentExpiredActivityDetailPage'
import { AdminEventsPage } from './views/admin/AdminEventsPage'
import { AdminSubmissionsPage } from './views/admin/AdminSubmissionsPage'
import { initAnalytics, trackPageView } from './utils/analytics'
import { applySiteMeta } from './utils/siteMeta'
import { getEventDetailBackground } from './utils/eventDetailNavigation'

function AppShell() {
  const location = useLocation()
  const backgroundLocation = getEventDetailBackground(location.state)
  const isAdminRoute = location.pathname.startsWith('/admin')
  const isLogoLab = location.pathname === '/logo-lab'
  const isStandaloneEventDetail =
    /^\/event\/[^/]+$/.test(location.pathname) && !backgroundLocation

  useEffect(() => {
    applySiteMeta(location.pathname, location.search)
    trackPageView(location.pathname)
  }, [location.pathname, location.search])

  const primaryRoutes = (
    <>
      <Route path="/" element={<HomePage />} />
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
      <Route path="/event/:eventId" element={<EventDetailPage />} />
      <Route path="/browse-v1" element={<BrowseV1Page />} />
      <Route path="/experiment-browse" element={<ExperimentBrowsePage />} />
      <Route path="/experiment-browse-map" element={<ExperimentBrowseMapPage />} />
      <Route path="/experiments/browse-2-column" element={<ExperimentBrowseTwoColumnPage />} />
      <Route path="/browse-experiment-2-column" element={<Navigate to="/experiments/browse-2-column" replace />} />
      <Route path="/experiment-event-modal" element={<ExperimentEventModalPage />} />
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
          <Route path="submissions" element={<AdminSubmissionsPage />} />
        </Route>
      </Route>
      <Route path="/Admin" element={<Navigate to="/admin/events" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </>
  )

  return (
    <div className="layout-root min-h-dvh bg-white">
      <ScrollToTop />
      <main>
        <ErrorBoundary title="Puddles failed to load">
          <Routes location={backgroundLocation ?? location}>{primaryRoutes}</Routes>
        </ErrorBoundary>
      </main>

      {backgroundLocation ? (
        <Routes>
          <Route path="/event/:eventId" element={<EventDetailModalOverlay />} />
        </Routes>
      ) : null}
      {!isAdminRoute && !isLogoLab && !isStandaloneEventDetail && <BottomNav />}
      {!isAdminRoute && <LocationBridge />}
    </div>
  )
}

export default function App() {
  useEffect(() => {
    initAnalytics()
  }, [])

  return (
    <BrowserRouter>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </BrowserRouter>
  )
}
