import { useEffect } from 'react'
import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { BottomNav } from './components/layout/BottomNav'
import { LocationBridge } from './components/LocationBridge'
import { ScrollToTop } from './components/ScrollToTop'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AdminAuthGate } from './components/admin/AdminAuthGate'
import { AdminLayout } from './components/admin/AdminLayout'
import { DiscoveryPage } from './pages/DiscoveryPage'
import { HomePage } from './pages/HomePage'
import { HomeV1Page } from './pages/HomeV1Page'
import { HomeExperiment1Page } from './pages/HomeExperiment1Page'
import { HomeExperiment2Page } from './pages/HomeExperiment2Page'
import { HomeExperiment3Page } from './pages/HomeExperiment3Page'
import { HomeExperiment4Page } from './pages/HomeExperiment4Page'
import { ExperimentBrowsePage } from './pages/ExperimentBrowsePage'
import { ExperimentBrowseMapPage } from './pages/ExperimentBrowseMapPage'
import { ExperimentBrowseTwoColumnPage } from './pages/ExperimentBrowseTwoColumnPage'
import { BrowsePage } from './pages/BrowsePage'
import { BrowseV1Page } from './pages/BrowseV1Page'
import { BrowseV2Page } from './pages/BrowseV2Page'
import { BROWSE_PAGE_PROPS } from './pages/browsePageConfigs'
import { SharePage } from './pages/SharePage'
import { ExperimentSharePage } from './pages/ExperimentSharePage'
import { AboutPage } from './pages/AboutPage'
import { AboutExperimentPage } from './pages/AboutExperimentPage'
import { TypographyExperimentHomePage } from './pages/TypographyExperimentHomePage'
import { TypographyExperimentAboutPage } from './pages/TypographyExperimentAboutPage'
import { TypographyAboutStyleHomePage } from './pages/TypographyAboutStyleHomePage'
import { TypographyAboutStyleSharePage } from './pages/TypographyAboutStyleSharePage'
import { TypographyExperimentsIndexPage } from './pages/TypographyExperimentsIndexPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { MaintenancePage } from './pages/MaintenancePage'
import { LogoLabPage } from './pages/LogoLabPage'
import { CityLandingPage } from './pages/CityLandingPage'
import { EventDetailPage } from './pages/EventDetailPage'
import { EventDetailModalOverlay } from './pages/EventDetailModalOverlay'
import { ExperimentEventModalPage } from './pages/ExperimentEventModalPage'
import { AdminEventsPage } from './pages/admin/AdminEventsPage'
import { AdminSubmissionsPage } from './pages/admin/AdminSubmissionsPage'
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
