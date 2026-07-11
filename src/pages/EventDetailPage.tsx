import { useLocation } from 'react-router-dom'
import { AppHeader } from '../components/layout/AppHeader'
import { Footer } from '../components/layout/Footer'
import { PageContainer } from '../components/layout/PageContainer'
import { EventDetailView } from '../components/EventDetailView'
import { EventUnavailableState } from '../components/empty-states/EventUnavailableState'
import { useCloseEventDetail } from '../hooks/useCloseEventDetail'
import { useEventDetailDocument } from '../hooks/useEventDetailDocument'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { parseEventDetailLocationState } from '../utils/eventDetailNavigation'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'

export function EventDetailPage() {
  const location = useLocation()
  const isMobile = useMediaQuery('(max-width: 767px)')
  const { close, hasInAppReturn } = useCloseEventDetail()
  const { publicEvent, isIndexable } = useEventDetailDocument()
  const analyticsSource = parseEventDetailLocationState(location.state)?.eventOpenSource
  const shareInHeader = isMobile && !hasInAppReturn

  return (
    <div
      className={[
        'event-detail-page-shell',
        isMobile ? 'event-detail-page-shell--mobile' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {!isMobile ? (
        <AppHeader
          logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
          logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
          showBrandName={false}
        />
      ) : null}

      <PageContainer layout={isMobile ? 'app' : 'wide'} className="event-detail-page-body">
        {publicEvent && isIndexable ? (
          <EventDetailView
            event={publicEvent}
            analyticsSource={analyticsSource}
            hasInAppReturn={hasInAppReturn}
            onClose={close}
            presentation={isMobile ? 'overlay' : 'page'}
            shareInHeader={shareInHeader}
          />
        ) : (
          <EventUnavailableState hasInAppReturn={hasInAppReturn} onClose={close} />
        )}
      </PageContainer>

      {!isMobile ? <Footer fullBleed className="mt-0" /> : null}
    </div>
  )
}
