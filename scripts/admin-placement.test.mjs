import assert from 'node:assert/strict'
import test from 'node:test'
import {
  browseCityBucket,
  catalogFlagsFromCandidate,
  includeInSeasonalFromCandidate,
  seasonalSectionForCandidate,
  suggestIncludeInSeasonal,
} from '../src/utils/adminCatalogPlacement.mjs'
import { outOfCoreListingIsExpected } from '../src/utils/adminOutOfArea.mjs'

test('non-core cities browse as Other cities and stay off seasonal unless tagged', () => {
  assert.equal(browseCityBucket('Fremont'), 'other')
  assert.equal(browseCityBucket('Palo Alto'), 'core')
  assert.equal(suggestIncludeInSeasonal({ city: 'Fremont', title: 'Haunted Train' }), false)
  assert.equal(suggestIncludeInSeasonal({ source: 'Seasonal · Halloween · drive' }), true)
  assert.equal(includeInSeasonalFromCandidate({ placement: 'drive' }), true)
  assert.equal(includeInSeasonalFromCandidate({ placement: 'browse', source: 'Seasonal · Holiday' }), false)
  assert.deepEqual(catalogFlagsFromCandidate({ city: 'Palo Alto' }, true), {
    isSeasonal: true,
    isRegional: false,
  })
  assert.deepEqual(catalogFlagsFromCandidate({ id: 'regional-fairyland-2026', city: 'Oakland' }, true), {
    isSeasonal: true,
    isRegional: true,
  })
  assert.equal(seasonalSectionForCandidate({ id: 'regional-fairyland' }), 'worthADrive')
  assert.equal(seasonalSectionForCandidate({ city: 'Palo Alto' }), 'closeToHome')
})

test('out-of-area is expected for Filoli and for Browse-only other cities', () => {
  assert.equal(
    outOfCoreListingIsExpected({
      id: 'regional-filoli-holidays-2026-11-14',
      city: 'Woodside',
      isSeasonal: true,
      isRegional: true,
    }),
    true,
  )
  assert.equal(
    outOfCoreListingIsExpected({
      id: 'san-mateo-storytime',
      city: 'San Mateo',
      status: 'Published',
      isSeasonal: false,
      isRegional: false,
    }),
    true,
  )
  assert.equal(
    outOfCoreListingIsExpected({
      id: 'palo-alto-library',
      city: 'Palo Alto',
      address: '86 Cañada Road, Woodside, CA 94062',
      isSeasonal: false,
      isRegional: false,
    }),
    false,
  )
})
