# Parent & Me — activity type definition

## Definition

Activities designed for a young child and their caregiver to participate in together.

The caregiver is part of the experience—not simply supervising or using a separate service.

Typical examples:

- Mommy & Me / Parent & Baby yoga
- Stroller fitness
- Parent-child movement classes
- Caregiver + toddler dance
- Parent-child art or sensory classes
- Baby music classes designed for caregiver participation
- Parent-child nature or movement programs

## Include when

Use **Parent & Me** when:

- The activity is intentionally designed for both caregiver and child.
- The child actively participates, observes, moves, creates, or interacts during the program.
- Caregiver participation is expected or central to the format.
- The experience is appropriate for ages 0–5.
- The program offers a meaningful shared experience rather than simply allowing children to attend.

## Do not include when

Do not use **Parent & Me** when:

- The activity is primarily for the adult and childcare is provided separately.
- Children are simply allowed to accompany the caregiver.
- The caregiver watches while the child participates independently.
- It is a standard children’s class that happens to require an adult to stay.
- The experience is primarily a parent workshop, fitness class, networking event, or other adult activity.

### Examples

**Include**

- Parent + baby yoga
- Toddler-and-caregiver movement class
- Stroller workout where children are incorporated into the class
- Caregiver + child pottery or art session

**Not Parent & Me**

- Gym workout with on-site childcare
- Parent workshop with babysitting provided
- Kids gymnastics class where parents wait nearby
- Farmers market that welcomes families

## Classification rule

> **Use Parent & Me when the grown-up and little one are doing the experience together.**

A parent seeing **Parent & Me** should understand: *this is something we do together — not just an activity I take my child to.*

If the child is mainly being cared for while the adult participates in something else, that is **not** Parent & Me.

## Parent & Me vs Childcare available

These solve different needs. Keep them separate:

| Concept | Parent need | Examples |
|---------|-------------|----------|
| **Parent & Me** | We do it together | Parent + baby yoga, stroller fitness, caregiver + child music, family yoga |
| **Childcare available** *(future attribute — not an activity type)* | Something for me, with care for them | Gym class with babysitting, parent workshop + childcare, adult fitness with kids room |

Do **not** stretch Parent & Me to cover “kids welcome while I do my thing,” and do **not** invent a Childcare activity type. When Childcare available ships, it should be its own attribute/filter.

### Not automatically Parent & Me

- Regular toddler gymnastics where adults happen to stay / wait nearby
- Storytime that requires a caregiver (use **Stories**)
- General playground or open-play events
- Adult classes that merely allow children to accompany

## Naming recommendation

Use **Parent & Me** as the activity type.

It is more immediately recognizable than **Grown-up + Me**, especially for search and browsing. Puddles can still use more inclusive language in supporting copy—for example, “for little ones and their grown-ups.”

## Filters

**Parent & Me** is available in the Activity Type filter. Prefer it as the primary type when the grown-up participates with the child; use **Music & Movement** / **Arts & Crafts** only when that label is a clearer primary fit.

## Distinction from other types

Prefer a more specific primary type when the format is clearly something else:

| Event | Type |
|-------|------|
| Library storytime (caregiver stays; songs & books for child) | **Stories** |
| Parent + baby yoga | **Parent & Me** |
| Toddler gymnastics (parent watches from side) | **Classes** or **Build & Explore** — not Parent & Me |
| Music class where caregiver and child sing/dance together | **Parent & Me** or **Music & Movement** (pick the best primary fit) |
| Art open house where families explore together casually | **Arts & Crafts** or **Festivals & Community** |

One primary activity type per event.

## Series vs one-off (discovery / catalog)

Semester and multi-week enrollment programs (e.g. Music Together Fall Mixed Ages) are **one series**, not ten independent weekly events.

- Represent as a single catalog/discovery row: series name, start window, length, venue, ages.
- Good to know: **Weekly · registration required** (or equivalent).
- Do not explode paid recurring series into Browse — that crowds out spontaneous one-offs.
- Do not publish section-by-section seat or waitlist availability in card copy — see [class-series-availability](../.cursor/rules/class-series-availability.mdc).
- Weather-dependent weekly drop-ins (e.g. outdoor Parent & Baby yoga) may still appear as dated sessions when each Saturday is independently attendable.

### Class / series availability (public copy)

For recurring classes and multi-section series, **do not** show exact open seats, waitlisted times, or dated availability snapshots in description or Good to know — they go stale quickly.

**Show:** series dates, recurring days, age fit, registration vs drop-in, semester vs single session, free demo policy, and what little ones will do.

**For live availability:** use general language (“Some sections may fill or move to waitlist — check the official registration page”) and link `eventUrl` to the provider. Keep `lastChecked` internal (admin only).

Full rule: `.cursor/rules/class-series-availability.mdc`.

## Related

- [Community events inclusion](./community-events-inclusion.md) — festivals, markets, broader community events
- [Event discovery layers](./event-discovery-layers.md) — how Parent & Me fits regular discovery
- Open-house Cursor rule — explore-style events where caregiver explores with child
