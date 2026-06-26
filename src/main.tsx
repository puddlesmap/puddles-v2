import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './pages/elevation.css'
import './pages/app-header-shared.css'
import './pages/discovery-page.css'
import './pages/browse-page.css'
import './pages/browse-experiment.css'
import './pages/browse-experiment-3.css'
import './pages/about-page.css'
import './pages/share-page.css'
import './pages/share-experiment.css'
import './pages/event-modal.css'
import './pages/mobile-layout.css'
import './pages/home-experiment.css'
import './pages/home-experiment-pages.css'
import './pages/home-experiment-accent.css'
import './pages/home-experiment-soft.css'
import './pages/home-experiment-refined.css'
import './pages/about-experiment.css'
import './pages/visitor-status-page.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
