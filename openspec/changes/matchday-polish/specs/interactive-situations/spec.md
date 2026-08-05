# Interactive Situations Specification

## Purpose

Replaces the shallow 3-direction penalty with a generalized `SituacionInteractiva` system: a 6-zone shot grid (goal or save side choice), a new interactive free kick with a barrier mechanic, pure deterministic resolution that never re-simulates the match, bounded to at most two interactive situations per match, and a `ShotTargetGrid` UI with brief visual feedback. The legacy `/penalty` narrative plane is retired.

## Requirements

### Requirement: SituacionInteractiva generalization

The system MUST generalize `PenalTimeline` into an `SituacionInteractiva` interface carrying the keeper/barrier zone and a result of `'gol' | 'atajado' | 'palo' | 'afuera'`. The shot/zone grid MUST expose six zones: top-left/center/right and bottom-left/center/right.

#### Scenario: Situations carry six-zone geometry

- GIVEN an interactive situation is generated
- WHEN its zone data is inspected
- THEN it SHALL reference one of the six grid zones and one of the four result values

### Requirement: Pure deterministic resolution

`resolverPenalConEleccion` and the new `resolverTiroLibreConEleccion` MUST be pure and deterministic: given the user's chosen zone and the precomputed keeper/barrier side, the outcome SHALL be uniquely determined. Resolution MUST NOT re-simulate the match (preserving penalty spec R2).

#### Scenario: Deterministic goal on winning choice

- GIVEN the user picks a zone the keeper is not covering
- WHEN the resolution runs
- THEN the outcome SHALL be `'gol'` deterministically, with no re-simulation

#### Scenario: Guarded outcome for covered zones

- GIVEN the user picks the keeper's covered zone
- WHEN the resolution runs
- THEN the outcome SHALL be one of `'atajado'`, `'palo'`, or `'afuera'` per the deterministic model, never a re-simulated score

### Requirement: Interactive free kick

The system MUST support an `tiro-libre-interactivo` event that reuses the zone-vs-gk resolution but adds a barrier probability: a shot aimed at a low or center zone has a chance to be blocked by the barrier, resolving as a rebound rather than `'afuera'`. The existing narrative `'falta'` event SHALL remain for fouls that do not yield a free kick.

#### Scenario: Low/center free kick can hit the barrier

- GIVEN a free-kick situation whose chosen zone is low or center
- WHEN the barrier chance triggers
- THEN the outcome SHALL resolve as a rebound (not `'afuera'`)

### Requirement: Interactive free kick resolution registration

An interactive free kick MUST be resolved via `resolverTiroLibreConEleccion` and appended to the timeline deterministically, without altering minutes or the final score beyond the registered event.

#### Scenario: Free kick outcome logged

- GIVEN an interactive free kick is resolved
- WHEN the event is appended
- THEN the timeline SHALL record the same outcome produced by the pure resolver

### Requirement: Bounded situations per match

Each match SHALL allow at most two interactive situations: one penalty and one free kick, never both in the same minute.

#### Scenario: At most two situations

- GIVEN a match whose simulation yields multiple triggers
- WHEN the replay completes
- THEN at most two interactive situations SHALL be shown, with at most one being a penalty at a given minute

### Requirement: ShotTargetGrid with feedback

The system MUST present the choice via a `ShotTargetGrid` SVG component (goal with six tappable zones, themed from the app colors) and SHALL show brief visual feedback for 0.6–0.8 seconds before resolving: the ball traveling to the chosen zone, the keeper diving to the precomputed side, and the result rendered with a color and icon.

#### Scenario: Zones rendered and tappable

- GIVEN an interactive situation is active
- WHEN the grid renders
- THEN six distinguishable tappable zones SHALL be shown

#### Scenario: Feedback precedes resolution

- GIVEN a zone is tapped
- WHEN the play animation runs
- THEN the outcome SHALL be displayed with feedback lasting 0.6–0.8 seconds before the timeline continues