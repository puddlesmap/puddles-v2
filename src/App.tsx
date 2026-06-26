import { useEffect } from 'react'
import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import { BottomNav } from './components/layout/BottomNav'
import { LocationBridge } from './components/LocationBridge'
import { EventModal } from './components/EventModal'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AdminLayout } from './components/admin/AdminLayout'
import { DiscoveryPage } from './pages/DiscoveryPage'
import { HomePage } from './pages/HomePage'
import { HomeV1Page } from './pages/HomeV1Page'
import { HomeExperiment1Page } from './pages/HomeExperiment1Page'
import { HomeExperiment2Page } from './pages/HomeExperiment2Page'
import { HomeExperiment3Page } from './pages/HomeExperiment3Page'
import { HomeExperiment4Page } from './pages/HomeExperiment4Page'
import { ExperimentBrowsePage } from './pages/ExperimentBrowsePage'
import { BrowsePage } from './pages/BrowsePage'
import { BrowseV1Page } from './pages/BrowseV1Page'
import { SharePage } from './pages/SharePage'
import { ExperimentSharePage } from './pages/ExperimentSharePage'
import { AboutPage } from './pages/AboutPage'
import { AboutExperimentPage } from './pages/AboutExperimentPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { MaintenancePage } from './pages/MaintenancePage'
import { LogoLabPage } from './pages/LogoLabPage'
import { AdminEventsPage } from './pages/admin/AdminEventsPage'
import { AdminSubmissionsPage } from './pages/admin/AdminSubmissionsPage'
import { initAnalytics, pageNameFromPath, trackPageView } from './utils/analytics'

function AppShell() {
  const { selectedEvent, eventOpenSource, closeEvent } = useApp()
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')
  const isLogoLab = location.pathname === '/logo-lab'

  useEffect(() => {
    const pageName = pageNameFromPath(location.pathname)
    if (pageName) {
      trackPageView(location.pathname, pageName)
    }
  }, [location.pathname])

  return (
    <div className="layout-root min-h-dvh bg-white">
      <main>
        <ErrorBoundary title="Puddles failed to load">
          <Routes>
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
            <Route
              path="/browse"
              element={
                <BrowsePage
                  shellClassName="browse-page-shell--experiment browse-page-shell--experiment-3"
                  resultsCountStyle="contextual"
                />
              }
            />
            <Route path="/browse-v1" element={<BrowseV1Page />} />
            <Route path="/experiment-browse" element={<ExperimentBrowsePage />} />
            <Route path="/experiment-browse-3" element={<Navigate to="/browse" replace />} />
            <Route path="/browse-experiment" element={<Navigate to="/experiment-browse" replace />} />
            <Route path="/share" element={<SharePage />} />
            <Route path="/share-experiment" element={<ExperimentSharePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/about-experiment" element={<AboutExperimentPage />} />
            <Route path="/experiment_about" element={<AboutExperimentPage />} />
            <Route path="/typography-experiment" element={<Navigate to="/" replace />} />
            <Route path="/typography-experiment/home" element={<Navigate to="/" replace />} />
            <Route path="/typography-experiment/discovery" element={<Navigate to="/discovery" replace />} />
            <Route path="/typography-experiment/about" element={<Navigate to="/about" replace />} />
            <Route path="/typography-experiment/share" element={<Navigate to="/share" replace />} />
            <Route path="/logo-lab" element={<LogoLabPage />} />
            <Route path="/maintenance" element={<MaintenancePage />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="events" replace />} />
              <Route path="events" element={<AdminEventsPage />} />
              <Route path="submissions" element={<AdminSubmissionsPage />} />
            </Route>
            <Route path="/Admin" element={<Navigate to="/admin/events" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ErrorBoundary>
      </main>
      {!isAdminRoute && !isLogoLab && <BottomNav />}
      {!isAdminRoute && <LocationBridge />}
      {selectedEvent && !isAdminRoute && (
        <EventModal
          event={selectedEvent}
          eventOpenSource={eventOpenSource}
          onClose={closeEvent}
        />
      )}
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
