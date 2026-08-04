# Season Pacing Specification

## Purpose

Rebalances the energy and fixture economy to a medium-slow cadence: slower regeneration, unchanged energy costs, wider deterministic fixture spacing, and a shorter double-round-robin calendar, targeting a season of roughly 5–6 real weeks without data migration.

## Requirements

### Requirement: Energy regeneration rate

The system MUST regenerate energy at a rate of 1 bar per 3 hours of real time, replacing the current 1 bar per 2 hours.

#### Scenario: Regeneration at 3 hours

- GIVEN a player with 5 of 10 bars at timestamp T
- WHEN 3 real hours elapse
- THEN the available energy SHALL be 6 bars

#### Scenario: Cap preserved

- GIVEN a player at maximum energy
- WHEN any time elapses
- THEN energy SHALL NOT exceed the maximum

### Requirement: Energy costs unchanged

Playing a match MUST cost 3 bars and training MUST cost 2 bars.

#### Scenario: Match spends three bars

- GIVEN a player with 4 bars plays a match
- WHEN the match is played
- THEN 3 bars SHALL be consumed

#### Scenario: Training spends two bars

- GIVEN a player with 3 bars trains
- WHEN the training resolves
- THEN 2 bars SHALL be consumed

### Requirement: Fixture spacing

The system MUST space consecutive fixtures exactly 2 real days apart, replacing the randomized 1–2 day spacing. The spacing SHALL be deterministic.

#### Scenario: Fixed two-day gap

- GIVEN a fixture list is generated
- WHEN consecutive fixtures are compared
- THEN each gap SHALL be exactly 2 real days

#### Scenario: Deterministic generation

- GIVEN the same input options
- WHEN the fixture is generated twice
- THEN the resulting dates SHALL be identical

### Requirement: Season calendar size

The system MUST generate the league season as a double round-robin over the league's clubs (approximately 20–24 matches for leagues of 10–12 clubs), replacing the current full-season calendar of 30–42 matches.

#### Scenario: Double round-robin calendar

- GIVEN a league with 10–12 clubs
- WHEN the season calendar is generated
- THEN each club SHALL play each other club twice (home and away), totaling approximately 20–24 league matches

#### Scenario: Sustainable season length

- GIVEN the approved regeneration, spacing, and calendar constants
- WHEN a full season is played at a sustainable cadence
- THEN the season SHALL complete in the 5–6 week target range

### Requirement: Migration-free rebalance

The pacing change MUST NOT require a data migration. Existing saves MUST remain valid, and spacing changes SHALL apply only to newly generated fixtures.

#### Scenario: Existing fixture unaffected

- GIVEN a fixture already generated before the change
- WHEN the constants change
- THEN the pre-existing fixture dates SHALL remain unchanged

### Requirement: Centralized constants

All pacing constants MUST be defined in a single centralized location so the economy can be tuned without touching gameplay logic.

#### Scenario: Constants referenced centrally

- GIVEN a single source of pacing constants
- WHEN gameplay logic consumes energy or spacing
- THEN it SHALL reference that source rather than duplicating values