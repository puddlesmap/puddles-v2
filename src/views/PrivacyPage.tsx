import { AppHeader } from '../components/layout/AppHeader'
import { Footer } from '../components/layout/Footer'
import { PageContainer } from '../components/layout/PageContainer'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'

export function PrivacyPage() {
  return (
    <div className="privacy-page-shell">
      <AppHeader
        logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
        logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
        showBrandName={false}
      />
      <PageContainer layout="editorial" className="privacy-page pb-16">
        <article className="privacy-article">
          <header className="privacy-header">
            <h1 className="privacy-title">Privacy Policy</h1>
            <p className="privacy-kicker">Puddles — The Tot Map</p>
            <p className="privacy-effective">Effective date: November 6, 2026</p>
          </header>

          <div className="privacy-body">
            <p>
              At Puddles, we believe finding things to do with your little ones should be easy. We
              also believe your privacy matters.
            </p>
            <p>
              Puddles LLC (&quot;Puddles,&quot; &quot;we,&quot; or &quot;our&quot;) operates{' '}
              <a href="https://puddlesmap.com">puddlesmap.com</a>, helping parents and caregivers
              discover activities and local guides for families with children ages 0–5.
            </p>
            <p>This policy explains what information we collect, how we use it, and your choices.</p>

            <h2>1. Information We Collect</h2>
            <p>When you use Puddles, we may collect:</p>
            <ul>
              <li>
                <strong>Information you provide:</strong> Email addresses, account information,
                saved activities, city or ZIP code preferences, event submissions, and messages you
                send us.
              </li>
              <li>
                <strong>Website usage:</strong> Information such as browser and device type, IP
                address, pages visited, and interactions with Puddles.
              </li>
              <li>
                <strong>Location:</strong> With your permission, we use your device&apos;s location
                to show nearby activities. Your precise location is not saved to your Puddles
                account or included in our analytics. When you view a map, your location may be
                shared with the map provider to display your position.
              </li>
            </ul>
            <p>You can browse public activities and guides without creating an account.</p>

            <h2>2. How We Use Information</h2>
            <p>
              We use information to help you discover activities, maintain your Saved list, respond
              to messages and event submissions, improve Puddles, and keep our services secure.
            </p>
            <p>
              If you subscribe to updates, we may email you newsletters, activity recommendations,
              or news about Puddles expanding to your area.
            </p>
            <p>
              You can unsubscribe from marketing emails at any time using the link in each email.
            </p>
            <p>
              Information submitted with an event tip may be used to review and publish event
              details. We do not publish personal contact information submitted with tips without
              authorization.
            </p>

            <h2>3. Analytics and Cookies</h2>
            <p>
              We use analytics to understand how visitors use Puddles and improve the experience.
              When signed in, some usage information may be associated with your account identifier.
            </p>
            <p>
              We may use cookies or similar technologies for account sign-in, Saved activities, and
              website functionality. You can manage cookies through your browser settings, although
              some features may be affected.
            </p>
            <p>
              We do not currently respond to browser Do Not Track signals. Third-party services,
              such as map providers, may collect information about activity across websites
              according to their own privacy practices.
            </p>

            <h2>4. How We Share Information</h2>
            <p>
              We use trusted third-party services for hosting, account management, analytics, maps,
              and email delivery. These providers may process information as needed to support
              Puddles.
            </p>
            <p>
              We may also disclose information when required by law or to protect our services and
              users.
            </p>
            <p>
              Puddles may display sponsored content or advertisements. We do not use your personal
              information to personalize these ads across websites.
            </p>
            <p>
              <strong>
                We do not sell personal information or share it for cross-context behavioral
                advertising.
              </strong>
            </p>

            <h2>5. Children&apos;s Privacy</h2>
            <p>
              Puddles is designed for parents and caregivers, not for children to use independently.
            </p>
            <p>
              We do not knowingly collect personal information directly from children under 13. If
              we learn that a child has provided personal information, we will promptly delete it
              unless legally required to retain it.
            </p>

            <h2>6. Your Choices and Rights</h2>
            <p>You can browse Puddles without creating an account or subscribing to emails.</p>
            <p>
              You may request access to, correction of, or deletion of your personal information
              through our{' '}
              <a href="/contact">Contact Form</a>. We may need to verify your identity before
              processing certain requests and will respond in accordance with applicable law.
            </p>
            <p>
              You can also unsubscribe from marketing emails and manage location permissions through
              your browser or device settings.
            </p>

            <h2>7. Data Retention and Security</h2>
            <p>
              We keep account information and Saved activities while your account is active, and
              subscription information as needed to manage your email preferences. Other information
              is retained only as reasonably necessary to operate Puddles, maintain security, or
              meet legal obligations.
            </p>
            <p>
              We take reasonable measures to protect your information, although no online service
              can guarantee complete security.
            </p>

            <h2>8. External Links</h2>
            <p>
              Puddles links to event organizers, registration services, maps, and other websites.
              These services have their own privacy practices, which we encourage you to review.
            </p>

            <h2>9. Changes to This Policy</h2>
            <p>
              We may update this policy as Puddles evolves. We&apos;ll update the effective date and
              post a notice on our website when we make significant changes.
            </p>

            <h2>10. Contact Us</h2>
            <p>Have a question about privacy or want to make a personal data request?</p>
            <p>
              Please reach out through our <a href="/contact">Contact Form</a>.
            </p>
            <p>
              <strong>Puddles LLC</strong>
            </p>
            <p>
              Website:{' '}
              <a href="https://puddlesmap.com">https://puddlesmap.com</a>
            </p>
          </div>
        </article>
      </PageContainer>
      <Footer fullBleed className="mt-0" />
    </div>
  )
}
