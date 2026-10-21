import { Link } from 'react-router-dom'
import { HalloweenGuideDraft } from './experimentLocalGuidesDraft'
import './experiment-local-guides-layouts.css'
import { PUDDLES_WORDMARK_LOGO_SRC } from './experimentShared'

import { HALLOWEEN_GUIDE_COVER } from '../data/halloweenGuide'
const SEASONAL_PHOTOS = [
  HALLOWEEN_GUIDE_COVER,
  '/events/witches-delight-2026.png',
  'https://www.gamblegarden.org/wp-content/uploads/2018/09/mini-pumpkins-890x890.jpg',
] as const

const HALLOWEEN_COLLECTION = '/experiment/seasonal-discovery/halloween-with-little-ones'

type HomeVariant = 'card' | 'quiet' | 'cover'

function Wordmark() {
  return <img className="lgl-wordmark" src={PUDDLES_WORDMARK_LOGO_SRC} alt="Puddles" />
}

function TopNav({ current }: { current?: 'guides' }) {
  return (
    <div className="lgl-topnav" aria-hidden>
      <span>Home</span>
      <span>Browse</span>
      <span className="is-new" aria-current={current === 'guides' ? 'page' : undefined}>
        Guides
      </span>
      <span>Share with us</span>
      <span>About</span>
    </div>
  )
}

function SeasonalBand() {
  return (
    <section className="lgl-season" aria-label="Seasonal picks">
      <div className="lgl-season-photos">
        {SEASONAL_PHOTOS.map((src) => (
          <img key={src} src={src} alt="" />
        ))}
      </div>
      <div className="lgl-season-copy">
        <p className="lgl-eyebrow">October</p>
        <h2>Tiny trick-or-treaters welcome</h2>
        <p>Pumpkin patches, costume parades, and not-too-scary fun near you</p>
        <Link className="lgl-textlink" to={HALLOWEEN_COLLECTION}>
          Explore picks →
        </Link>
      </div>
    </section>
  )
}

function GuideModule({ variant }: { variant: HomeVariant }) {
  return (
    <section className="lgl-guides" aria-label="Local Guides">
      <div className="lgl-guides-head">
        <h2>Local Guides</h2>
        <a className="lgl-textlink" href="#guides-index">
          View all →
        </a>
      </div>
      {variant === 'card' ? (
        <a className="lgl-card" href="#guide-article">
          <img src={HALLOWEEN_GUIDE_COVER} alt="" />
          <div>
            <p className="lgl-eyebrow">October guide</p>
            <h3>Halloween with Little Ones</h3>
            <p>Events, famous Halloween streets, and trick-or-treating.</p>
            <span className="lgl-textlink">Read guide →</span>
          </div>
        </a>
      ) : null}
      {variant === 'quiet' ? (
        <div className="lgl-quiet">
          <p className="lgl-eyebrow">October guide</p>
          <h3>Halloween with Little Ones</h3>
          <p>How to plan the month with ages 0–5.</p>
          <a className="lgl-textlink" href="#guide-article">
            Read guide →
          </a>
        </div>
      ) : null}
      {variant === 'cover' ? (
        <a className="lgl-cover" href="#guide-article">
          <img src={HALLOWEEN_GUIDE_COVER} alt="" />
          <span className="lgl-cover-shade" aria-hidden />
          <span className="lgl-cover-copy">
            <span className="lgl-eyebrow">October guide</span>
            <h3>Halloween with Little Ones</h3>
            <span className="lgl-textlink">Read guide →</span>
          </span>
        </a>
      ) : null}
    </section>
  )
}

function ExploreSlice() {
  return (
    <section className="lgl-explore" aria-label="Activities">
      <h2>Find storytimes, music, and local moments</h2>
      <p>Browse by city, date, and age</p>
      <div className="lgl-chips">
        <span>All cities</span>
        <span>This weekend</span>
        <span>Free</span>
      </div>
    </section>
  )
}

function HomeFrame({
  device,
  variant,
}: {
  device: 'phone' | 'desktop'
  variant: HomeVariant
}) {
  const desktop = device === 'desktop'
  return (
    <div>
      <p className="lgl-frame-label">{desktop ? 'Desktop' : 'Phone'}</p>
      <div className={desktop ? 'lgl-desktop' : 'lgl-phone'}>
        <div className="lgl-chrome" aria-hidden>
          <span />
          <span />
          <span />
          <em>puddlesmap.com</em>
        </div>
        <div className="lgl-header">
          <Wordmark />
          <TopNav />
        </div>
        <div className="lgl-slice">
          <SeasonalBand />
          {desktop ? (
            <p className="lgl-home-headline">
              Find storytimes, music, drop-ins, and local moments for ages 0–5.
            </p>
          ) : null}
          <GuideModule variant={variant} />
          <ExploreSlice />
        </div>
        <div className="lgl-bottom" aria-hidden>
          <span>Home</span>
          <span>Browse</span>
          <span>Share</span>
          <span>About</span>
        </div>
      </div>
    </div>
  )
}

function GuideArticle({
  idPrefix,
  jumps,
  rail,
}: {
  idPrefix: string
  jumps: boolean
  rail: boolean
}) {
  return <HalloweenGuideDraft idPrefix={idPrefix} jumps={jumps} rail={rail} cover={HALLOWEEN_GUIDE_COVER} />
}

function GuideFrame({
  device,
  jumps,
  rail,
}: {
  device: 'phone' | 'desktop'
  jumps: boolean
  rail: boolean
}) {
  const desktop = device === 'desktop'
  const prefix = `${device}-${jumps ? 'jumps' : rail ? 'rail' : 'article'}`
  return (
    <div>
      <p className="lgl-frame-label">{desktop ? 'Desktop' : 'Phone'}</p>
      <div className={desktop ? 'lgl-desktop' : 'lgl-phone'}>
        <div className="lgl-chrome" aria-hidden>
          <span />
          <span />
          <span />
          <em>puddlesmap.com/guides/halloween-with-little-ones</em>
        </div>
        <div className="lgl-scroll">
          <div className="lgl-header">
            <Wordmark />
            <TopNav current="guides" />
          </div>
          <p className="lgg-back">
            <a href="#guides-index">← Guides</a>
          </p>
          <GuideArticle idPrefix={prefix} jumps={jumps} rail={rail} />
          <div className="lgl-bottom" aria-hidden>
            <span>Home</span>
            <span>Browse</span>
            <span>Share</span>
            <span>About</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function IndexFrame({ device }: { device: 'phone' | 'desktop' }) {
  const desktop = device === 'desktop'
  return (
    <div>
      <p className="lgl-frame-label">{desktop ? 'Desktop' : 'Phone'}</p>
      <div className={desktop ? 'lgl-desktop' : 'lgl-phone'}>
        <div className="lgl-chrome" aria-hidden>
          <span />
          <span />
          <span />
          <em>puddlesmap.com/guides</em>
        </div>
        <div className="lgl-header">
          <Wordmark />
          <TopNav current="guides" />
        </div>
        <div className="lgg-index">
          <p className="lgl-eyebrow">Local Guides</p>
          <h2>Guides for ages 0–5</h2>
          <a className="lgg-feature" href="#guide-article">
            <img src={HALLOWEEN_GUIDE_COVER} alt="" />
            <div>
              <p className="lgl-eyebrow">October guide</p>
              <h3>Halloween with Little Ones</h3>
              <p>Events, famous Halloween streets, and trick-or-treating.</p>
              <span className="lgl-textlink">Read guide →</span>
            </div>
          </a>
          <div className="lgg-grid">
            <article className="lgg-mini">
              <img src="/seasonal/holiday-magic.png" alt="" />
              <div>
                <span className="lgg-sample">Layout sample</span>
                <h3>Holiday lights with little ones</h3>
                <p>Same card, once a December guide exists.</p>
              </div>
            </article>
            <article className="lgg-mini">
              <img src="/seasonal/rainy-day-favorites.png" alt="" />
              <div>
                <span className="lgg-sample">Layout sample</span>
                <h3>Rainy days with toddlers</h3>
                <p>Same card. Not a published guide.</p>
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ExperimentLocalGuidesLayoutsPage() {
  return (
    <article className="lgl">
      <p className="lgl-kicker">Design exploration</p>
      <h1>Local Guides on Puddles</h1>
      <p className="lgl-lede">
        Three ways to add a planning guide without turning the homepage into a blog. Seasonal Picks
        stays the event collection. A guide helps a parent decide how to spend the month.
      </p>
      <p className="lgl-note">
        The live homepage is unchanged. The guide frames below use the Halloween draft. Where Puddles
        already has the event, the card opens that page. Neighborhood streets stay editorial.
      </p>
      <div className="lgl-recommend">
        <strong>Use the editorial card on the homepage, and the simple article for the guide.</strong>
        <p>
          That is Version A. It matches the placement in your sketch, stays smaller than Seasonal
          Picks, and reuses event pages for hours, cost, and photos. Add the chapter links from
          Version B only if a guide gets hard to scan. Skip the cover banner and the side planner.
        </p>
      </div>

      <nav className="lgl-nav" aria-label="Layout versions">
        <a href="#version-a">Version A</a>
        <a href="#version-b">Version B</a>
        <a href="#version-c">Version C</a>
        <a href="#guides-index">Guides index</a>
        <a href="#navigation">Navigation</a>
        <a href="#content">Content</a>
      </nav>

      <section className="lgl-section" id="version-a">
        <h2>
          Version A — Editorial card
          <span className="lgl-badge">Recommended</span>
        </h2>
        <p>
          One guide, with a photo, a short description, and Read guide. View all sits on the section
          label. On a phone this is under the seasonal teaser and above activities. On desktop the
          seasonal band stays full width under the header, and this card stays in the activity column
          so the headline is still first.
        </p>
        <div className="lgl-stage">
          <HomeFrame device="phone" variant="card" />
          <HomeFrame device="desktop" variant="card" />
        </div>
        <h3 id="guide-article">Guide page — simple article</h3>
        <p>
          The full draft sits in this article: ten sections, from free celebrations through famous
          streets and a short “which plan fits” close. Event cards open the Puddles page when we
          have one. Streets stay labeled with their 2026 status.
        </p>
        <div className="lgl-stage">
          <GuideFrame device="phone" jumps={false} rail={false} />
          <GuideFrame device="desktop" jumps={false} rail={false} />
        </div>
      </section>

      <section className="lgl-section" id="version-b">
        <h2>Version B — Quiet row, with chapter links</h2>
        <p>
          The homepage row has no photo, so it cannot compete with Seasonal Picks. It is also easy
          to miss. The guide page adds a row of section links for a long Halloween article. Useful
          later. Unnecessary while a guide is still this short.
        </p>
        <div className="lgl-stage">
          <HomeFrame device="phone" variant="quiet" />
          <HomeFrame device="desktop" variant="quiet" />
        </div>
        <h3>Guide page — chapter links</h3>
        <div className="lgl-stage">
          <GuideFrame device="phone" jumps rail={false} />
          <GuideFrame device="desktop" jumps rail={false} />
        </div>
      </section>

      <section className="lgl-section" id="version-c">
        <h2>Version C — Cover banner and a planner rail</h2>
        <p>
          The homepage becomes a second photo, directly under Seasonal Picks. The guide page adds a
          planning box beside the article. Both are more magazine than Puddles, and the rail repeats
          advice the sections already give.
        </p>
        <div className="lgl-stage">
          <HomeFrame device="phone" variant="cover" />
          <HomeFrame device="desktop" variant="cover" />
        </div>
        <h3>Guide page — planner rail</h3>
        <div className="lgl-stage">
          <GuideFrame device="phone" jumps={false} rail />
          <GuideFrame device="desktop" jumps={false} rail />
        </div>
      </section>

      <section className="lgl-section" id="guides-index">
        <h2>Guides index</h2>
        <p>
          One page at /guides. The current guide is the feature. Later guides use the same card.
          The holiday and rainy-day cards below are layout samples, not published guides. No
          filters until there are more than a handful.
        </p>
        <div className="lgl-stage">
          <IndexFrame device="phone" />
          <IndexFrame device="desktop" />
        </div>
      </section>

      <section className="lgl-section" id="navigation">
        <h2>Navigation</h2>
        <p>
          Add Guides to the desktop header, between Browse and Share with us. Leave the phone tab
          bar as Home, Browse, Share with us, and About. A fifth tab crowds Share with us. On a
          phone, parents reach guides from the homepage card, the footer, and the guide pages.
        </p>
      </section>

      <section className="lgl-section" id="content">
        <h2>How a guide should be stored</h2>
        <p>
          Keep guides next to seasonal collections, in a small file such as src/data/guides.ts, with
          cover images in public/guides. One guide a month does not need a new CMS, a sheet tab, or
          a second copy of event details. Sections store event IDs. The page looks up the live
          event for the title, photo, time, cost, and link. When that event is updated, the guide
          follows. When it is over, the card stays and is labeled Ended. Streets and tips are
          editorial and do not become events.
        </p>
        <div className="lgl-fit">
          <article>
            <h3>A guide record</h3>
            <ul>
              <li>Title, slug, excerpt, cover, topic</li>
              <li>Published and updated dates</li>
              <li>Draft or Published, and featured on the homepage</li>
              <li>Sections: heading, paragraphs, images, event IDs</li>
              <li>SEO title and description</li>
            </ul>
          </article>
          <article>
            <h3>The first URL</h3>
            <ul>
              <li>/guides for the index</li>
              <li>/guides/halloween-with-little-ones for this guide</li>
              <li>The year stays in the title, so 2027 updates the same URL</li>
              <li>Share image is the cover. Article markup uses the existing metadata helpers.</li>
            </ul>
          </article>
        </div>
        <p>
          Publishing stays the current deploy. Drafts stay out of /guides and off the homepage.
          Admin can preview the same file later. The seasonal calendar admin is for event windows,
          so it should not become the guide editor.
        </p>
      </section>
    </article>
  )
}
