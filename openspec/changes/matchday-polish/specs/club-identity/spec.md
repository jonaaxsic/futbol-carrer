# Club Identity Specification

## Purpose

Gives each fictional club a distinct visual identity within the dark theme: a per-club color palette behind the current player's accent, a procedural SVG crest activated from `Club.escudoKey`, and fixed semantic colors that keep the success/danger/warning palette stable and legible. `seed-clubes.ts` (uncommitted user work) is untouched.

## Requirements

### Requirement: Club color palette

The system MUST provide `club-colors.ts` defining `primario` and `secundario` colors for each fictional club, coherent with `seed-clubes.ts` club names/keys. `seed-clubes.ts` SHALL NOT be modified.

#### Scenario: Each club resolves two colors

- GIVEN a fictional club defined in the seed
- WHEN its identity colors are requested
- THEN `primario` and `secundario` SHALL be returned from the palette

#### Scenario: Palette and seed stay coherent

- GIVEN the palette references a club key
- WHEN the key is validated against the unmodified seed
- THEN it SHALL match an existing club and the seed SHALL remain unchanged

### Requirement: Dynamic accent

The theme accent SHALL derive from the current player's club primary color, falling back to white when there is no club. Only components that already read `colors.accent` from `theme/index` SHALL use the dynamic value; hardcoded accents SHALL NOT be introduced per screen.

#### Scenario: Accent matches the player's club

- GIVEN a player is assigned to a club
- WHEN the theme resolves the accent
- THEN the accent SHALL be that club's primary color

#### Scenario: No club falls back to white

- GIVEN a player has no club
- WHEN the accent is resolved
- THEN it SHALL default to white

### Requirement: Procedural SVG crest

The system MUST activate `Club.escudoKey` via a `club-crest` component that renders a procedural SVG shield with the club's initials and primary/secondary colors. The crest SHALL be used in the dashboard, calendar, club offer, and match scorecard.

#### Scenario: Crest renders from club key

- GIVEN a club with an `escudoKey`
- WHEN the crest component renders
- THEN it SHALL draw a shield with the club's initials and its primary/secondary colors

#### Scenario: Crest shown on club surfaces

- GIVEN the dashboard, calendar, club offer, or scorecard displays a club
- WHEN those surfaces render
- THEN each SHALL show the club's crest

### Requirement: Fixed semantic colors with contrast

The success, danger, and warning colors SHALL remain fixed (not dynamic) and SHALL pass a contrast review against the dynamic accent so accent changes do not reduce legibility.

#### Scenario: Semantic colors unchanged

- GIVEN a dynamic club accent is active
- WHEN success, danger, or warning is used
- THEN its color SHALL be the fixed semantic value, independent of the accent

#### Scenario: Contrast preserved under dynamic accent

- GIVEN a club accent that differs from white
- WHEN text or icons use semantic colors on surfaces driven by the accent
- THEN the combined rendering SHALL maintain sufficient contrast for readability