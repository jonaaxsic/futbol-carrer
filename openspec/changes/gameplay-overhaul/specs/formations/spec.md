# Formations Specification

## Purpose

Introduces a reusable formation model and pitch renderer so the onboarding picker, the match screen (both elevens), and the club-change position selector share one source of truth: a named tactical formation with 11 slots mapped to positions and a relative layout on a real football pitch.

## Requirements

### Requirement: Formation model

The system MUST provide a formation model covering exactly the 5 base formations: 4-3-3, 4-4-2, 4-2-3-1, 5-3-2, and 3-5-2. Each formation SHALL define 11 slots; every slot MUST map to a valid position and a relative pitch coordinate.

#### Scenario: All slots valid

- GIVEN any of the 5 base formations
- WHEN its slots are validated
- THEN all 11 slots SHALL resolve to positions accepted by the position guard

#### Scenario: Layout matches naming

- GIVEN formation 4-3-3
- WHEN slots are laid out on the pitch
- THEN it SHALL render 4 defenders, 3 midfielders, and 3 forwards above a single goalkeeper

### Requirement: Club base formation

Each club MUST have exactly one base formation. Clubs without an assigned formation MUST fall back to a default formation.

#### Scenario: Rival uses its own formation

- GIVEN a club with an assigned base formation
- WHEN its eleven renders
- THEN the eleven SHALL use that club's formation

#### Scenario: Unknown club falls back

- GIVEN a club without an assigned formation
- WHEN its eleven renders
- THEN the default formation SHALL be used

### Requirement: Reusable pitch renderer

The system MUST render both elevens on a real pitch with the goalkeeper at the bottom, followed by defense, midfield, and forward lines. The player's team SHALL render bottom-up and the rival top-down, with the player character highlighted.

#### Scenario: Match screen shows both elevens

- GIVEN a match between the player's club and a rival
- WHEN the match screen renders
- THEN both elevens SHALL appear on one pitch with the player character highlighted

### Requirement: Shared usage

The pitch renderer MUST be reused by the onboarding position picker, the match screen, and the club-change position selector. The onboarding picker SHALL stop using its hardcoded layout.

#### Scenario: Onboarding reuses shared renderer

- GIVEN the onboarding position step
- WHEN the user selects a position
- THEN the selection SHALL be rendered with the shared pitch component

### Requirement: Player position highlight

The renderer MUST highlight the player character's position on the pitch in both onboarding and match contexts.

#### Scenario: Highlight present in match

- GIVEN the player's eleven renders during a match
- THEN the player's slot SHALL be visually distinguished