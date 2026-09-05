# Puddles Event Discovery Layers

Puddles can surface events through three complementary layers. Each layer serves a different discovery need while keeping the core product focused on useful outings for families with little ones.

## 1. Regular Discovery

**Purpose**

The core Puddles event feed for everyday activity discovery.

Events appear naturally in regular discovery when they meet Puddles’ inclusion standards, regardless of whether they are a storytime, Parent & Me class, festival, open house, or other community event.

**How it works**

- Events are shown alongside other activities in the main feed.
- They use their most relevant activity type.
- Broader family-friendly events should only appear when there is a clear experience for ages 0–5.
- No special “family-friendly” section is needed.

**Examples**

- Storytime
- Parent & Me yoga
- Community festival with a Kids Zone
- Art studio open house
- Outdoor music event

**Core principle**

> If an event is useful enough for a Puddles family **and** it is in a core city (Palo Alto · Los Altos · Mountain View · Sunnyvale), it can belong in regular discovery.

Out-of-area events stay out of the main feed unless curated into Seasonal Discovery / Worth a little drive.

---

## 2. Seasonal Discovery

**Purpose**

A curated editorial layer that helps families discover timely outings around a season, holiday, or moment.

Seasonal Discovery pulls relevant events from the broader Puddles inventory and groups them around a clear parent intent.

**Examples**

- Halloween with little ones
- Hello, Fall
- Holiday magic
- Lunar New Year
- Valentine’s outings
- Spring farms & flowers
- Summer splash & outdoor fun

Seasonal collections can include both everyday Puddles activities and larger community events such as:

- Fall festivals
- Pumpkin events
- Holiday markets with kids programming
- Cultural celebrations
- Seasonal performances
- Community fairs

**Core principle**

> Seasonal Discovery answers: **What feels special to do right now?**

---

## 3. Worth a Little Drive

**Purpose**

Surface standout experiences beyond Puddles’ core local area when the outing may justify traveling farther.

This layer is especially useful for larger festivals, seasonal experiences, farms, museums, cultural events, or unique one-time activities.

A 20–30 minute drive may feel worthwhile for a major festival or special experience, even when it would not make sense for a regular storytime.

### Suggested structure

**Nearby**

Palo Alto · Los Altos · Mountain View · Sunnyvale

[event cards]

**Worth a little drive**

Special outings around the Peninsula & South Bay.

[event cards]

**Guidelines**

- Keep Nearby as the primary section.
- Only select stronger, destination-worthy events for Worth a Little Drive.
- Do not use it simply to fill inventory.
- Clearly show the city and distance context so parents understand why the event is separated.
- This is an editorial layer, not a new geographic promise for regular Puddles coverage.

**Core principle**

> Worth a Little Drive answers: **What is special enough to go farther for?**

---

## How the layers work together

Each event has one underlying **Activity Type**, then appears in the appropriate discovery layer based on **location, seasonality, and editorial value**.

### Core-city event

**Mountain View Art & Wine Festival — Kids Zone**

- Activity type: **Festivals & Community**
- Location: Mountain View
- Appears in: **Regular Discovery**
- Can also appear in: **Seasonal Discovery → Hello, Fall**

Because Mountain View is a core Puddles city, the event can live naturally in the main event feed while also being featured in a seasonal collection.

### Core-city Parent & Me activity

**Parent & Me yoga in Palo Alto**

- Activity type: **Parent & Me**
- Location: Palo Alto
- Appears in: **Regular Discovery**
- May appear in a seasonal or editorial collection when relevant.

Most everyday local activities primarily live in Regular Discovery.

### Out-of-area destination event

**Large pumpkin festival in San Jose**

- Activity type: **Festivals & Community**
- Location: San Jose
- Does **not** appear in Regular Discovery.
- Appears in: **Seasonal Discovery → Halloween → Worth a Little Drive**

Because San Jose is outside the core Puddles cities, the event should only surface through a curated editorial experience where the additional travel is intentional and clearly communicated.

### Geographic rule

> **Regular Discovery stays focused on Palo Alto · Los Altos · Mountain View · Sunnyvale.**

Events outside these four core cities should **not** enter the normal Browse feed just because they are strong outings.

Surface them only when intentionally curated into:

- **Seasonal Discovery**
- **Worth a little drive**

This keeps everyday Browse local while still recommending exceptional regional farms, festivals, and trains through editorial layers.

**Hello Fall** stays live through Oct 31, 2026. From **Oct 5**, Home shows **two seasonal themes at once** (Hello Fall + Halloween) via `getActiveSeasonalCollections()` — dual Home modules + badge rules. **Rename decision:** keep **Halloween with little ones** (slug unchanged); consider a broader “October with little ones” name only if non-Halloween October curation expands.

## Simple model

**Activity Type** = What kind of activity is this?

**Regular Discovery** = What can we do nearby in Puddles’ core cities?

**Seasonal Discovery** = What feels especially relevant right now?

**Worth a Little Drive** = What seasonal or special outing is worth leaving the core area for?
