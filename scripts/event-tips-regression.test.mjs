import assert from 'node:assert/strict'
import test from 'node:test'
import {
  TIP_ICON_PREFIXES,
  parseEventTipLine,
  parseEventTips,
} from '../src/utils/eventTips.ts'

test('parses every canonical Before you go prefix', () => {
  for (const icon of TIP_ICON_PREFIXES) {
    assert.deepEqual(parseEventTipLine(`${icon}|Example guidance.`), {
      icon,
      text: 'Example guidance.',
    })
  }
})

test('maps legacy prefixes to their semantic replacements', () => {
  assert.deepEqual(parseEventTipLine('access|Step-free entrance.'), {
    icon: 'accessibility',
    text: 'Step-free entrance.',
  })
  assert.deepEqual(parseEventTipLine('bath|Restrooms are inside.'), {
    icon: 'restroom',
    text: 'Restrooms are inside.',
  })
  assert.deepEqual(parseEventTipLine('sun|Bring sun protection.'), {
    icon: 'weather',
    text: 'Bring sun protection.',
  })
  assert.deepEqual(parseEventTipLine('music|Amplified sound may be loud.'), {
    icon: 'sound',
    text: 'Amplified sound may be loud.',
  })
})

test('uses Info for unprefixed legacy lines instead of a bullet', () => {
  assert.deepEqual(parseEventTipLine('Bring a blanket.'), {
    icon: 'info',
    text: 'Bring a blanket.',
  })
})

test('keeps one parsed item per non-empty line', () => {
  assert.deepEqual(parseEventTips('ticket|Register first.\n\nSupplies are limited.'), [
    { icon: 'ticket', text: 'Register first.' },
    { icon: 'info', text: 'Supplies are limited.' },
  ])
})

test('starts a new icon row when another prefix shares the line', () => {
  assert.deepEqual(
    parseEventTips(
      'ticket|Free. No registration is required. info|Supplies are limited and available first come, first served.',
    ),
    [
      { icon: 'ticket', text: 'Free. No registration is required.' },
      { icon: 'info', text: 'Supplies are limited and available first come, first served.' },
    ],
  )
  assert.deepEqual(parseEventTips('baby|For babies 0–2 and their caregivers.'), [
    { icon: 'baby', text: 'For babies 0–2 and their caregivers.' },
  ])
})
