import assert from 'node:assert/strict'
import test from 'node:test'
import { toPathSearch } from '../src/utils/pathSearch.ts'

test('path search ignores parameter order', () => {
  assert.equal(toPathSearch('/browse', '?b=2&a=1'), toPathSearch('/browse', '?a=1&b=2'))
  assert.equal(toPathSearch('/browse', ''), '/browse')
  assert.equal(toPathSearch('/browse', '?view=map'), '/browse?view=map')
})
