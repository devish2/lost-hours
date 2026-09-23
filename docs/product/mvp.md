# Lost Hours — MVP product definition

## Product

**Lost Hours** — understand where digital time goes and how much is **Lost Time**.

## Problem

Users can see total screen time, but total duration alone does not explain whether time was intentional, useful, recreational, or unwanted.

## MVP goal

Help users understand, for a given day:

- **Total tracked time**
- Time by classification: **PRODUCTIVE**, **NEUTRAL**, **LEISURE**, **WASTE** (Lost Time), **UNKNOWN**
- Where **Lost Time** occurred (e.g. by platform)

## Platforms modeled (identity, not judgment)

Instagram, YouTube, Facebook, X, Reddit, LinkedIn, Other — see domain `Platform` enum.

## Classifications

| Value | Meaning (high level) |
|-------|----------------------|
| PRODUCTIVE | Intentionally useful work/learning |
| NEUTRAL | Necessary but not scored as productive or leisure |
| LEISURE | Recreational, acceptable by user policy |
| WASTE | Lost Time (MVP: counts toward Lost Hours) |
| UNKNOWN | No applicable rule or insufficient signal |

## Content types

REELS, SHORTS, FEED, MESSAGING, TUTORIAL, ENTERTAINMENT, CREATOR_ACTIVITY, OTHER, UNKNOWN — describe *what* happened, not the classification.

## Platform ≠ classification

The same platform can appear under multiple classifications. Example: **YouTube** can host PRODUCTIVE (tutorial), LEISURE (film), WASTE (shorts), or UNKNOWN activity depending on context and rules.

Demo dashboard fixtures may show Instagram as WASTE for illustration; that is **not** a built-in production rule.

## MVP exclusions (not in Day 1)

- Cloud account / sync
- Social features, leaderboards
- Payments / subscriptions
- AI classification
- Advanced blocking or parental controls
- iOS usage tracking
- Chrome ↔ mobile synchronization
- AccessibilityService-based tracking

## Current implementation note

Day 1 ships a **demo dashboard** (preview data) composed through real domain calculators. Live Android tracking and historical data from SQLite are **planned**, not shipped.
