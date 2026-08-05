# Delta for Penalty Mini-Game

## ADDED Requirements

### Requirement: Six-zone shot grid

The interactive shot choice SHALL be presented as a six-zone grid (top-left/center/right, bottom-left/center/right) via a `ShotTargetGrid` component, replacing the prior three-direction prompt. On tapping a zone, the system SHALL show brief visual feedback (0.6–0.8 s) before resolving.

#### Scenario: Six zones offered

- GIVEN an interactive penalty is active
- WHEN the choice surface renders
- THEN six distinct tappable zones SHALL be presented and any selection SHALL be accepted

### Requirement: Interactive free kick

The system MUST support an interactive free kick (`tiro-libre-interactivo`) resolved with `resolverTiroLibreConEleccion`, reusing the zone-vs-opposition resolution with a barrier probability: a low or center aim SHALL have a chance to be blocked as a rebound (not `'afuera'`).

#### Scenario: Barrier blocks a low/center free kick

- GIVEN a free-kick situation where the user aims low or center
- WHEN the barrier chance triggers
- THEN the outcome SHALL resolve as a rebound and be logged to the timeline

## MODIFIED Requirements

### Requirement: Pause and prompt

The system MUST pause the match replay at each scheduled interactive situation (penalty or free kick) and present a six-zone shot choice; for an opponent penalty it SHALL present a six-zone save choice.

(Previously: the system presented a three-direction shot choice for player penalties and a save side for opponent penalties.)

#### Scenario: Player takes a penalty

- GIVEN the timeline contains a penalty awarded to the player's team at minute 55
- WHEN the replay clock reaches minute 55
- THEN the sequence SHALL pause and prompt the user to pick one of six shot zones

#### Scenario: Opponent takes a penalty

- GIVEN a penalty is awarded to the opponent
- WHEN the replay reaches that minute
- THEN the sequence SHALL prompt the user to pick one of six save zones

### Requirement: Outcome resolution

The system MUST resolve a penalty or free kick as a goal only when the chosen zone beats the opposition's side; otherwise it SHALL resolve as `'atajado'`, `'palo'`, or `'afuera'` per the deterministic model. The resolved outcome MUST be appended to the timeline and MUST NOT re-simulate the match (penalty spec R2 preserved).

(Previously: the outcome was a goal on a successful direction, otherwise saved or missed.)

#### Scenario: Goal on successful choice

- GIVEN the user picks a zone the opposition is not covering
- WHEN the resolution runs
- THEN a goal SHALL be added and the scorecard records scorer and minute

#### Scenario: Guarded zones produce a stop

- GIVEN the user picks the opposition's covered zone
- WHEN the resolution runs
- THEN the outcome SHALL be one of saved, post, or off-target, without re-simulating the match

### Requirement: Saved or missed continuation

When a penalty or free kick is saved, misses, or hits the post, the sequence MUST continue at the following minute: no goal is added, no score change occurs, and the failed attempt SHALL be recorded as an event in the timeline.

(Previously: this applied only to saved or missed penalties with three-direction resolution.)

#### Scenario: Saved situation resumes play

- GIVEN the user's penalty or free kick is saved or off-target
- WHEN the resolution completes
- THEN no goal is added AND the replay resumes at the next minute

### Requirement: Inaction default

The system MUST resolve an interactive situation with a default outcome if the user provides no choice within a bounded time, to avoid a soft-lock during the replay.

(Previously: only penalties had an inaction default.)

#### Scenario: No input provided

- GIVEN the user does not choose within the allowed window
- WHEN the timeout elapses
- THEN the situation SHALL resolve as missed and the replay SHALL continue

### Requirement: Bounded interactive situations

Each match SHALL allow at most two interactive situations — one penalty and one free kick — and SHALL NOT schedule both in the same minute.

(Previously: the interactive penalty step occurred at most once per match.)

#### Scenario: At most two situations per match

- GIVEN a match whose simulation yields any number of triggers
- WHEN the replay completes
- THEN at most two interactive situations SHALL have been shown, with at most one at any given minute

## REMOVED Requirements

### Requirement: Legacy narrative penalty flow

(Reason: the legacy `/penalty` screen, its `event.tsx` push, the `navegarA` penalty option in `eventos.ts`, and `eventService.resolverPenal` run a second, parallel penalty system that is no longer used; the inline `SituacionInteractiva` flow in `match.tsx` supersedes it.)
(Migration: retire dead code after a `grep -r penalty src/app` confirms no routes reference it; the `interactive-situations` and `penalty-minigame` specs govern the replacement.)