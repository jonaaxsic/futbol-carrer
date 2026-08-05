# Delta for Matchday Experience

## ADDED Requirements

### Requirement: Resume banner for paused match

When a match is in progress (`findPartidoEnCurso` returns a match), the dashboard SHALL show a "Partido en pausa vs. {rival}" banner instead of the standard playable-fixture action. The banner action SHALL be "Reanudar" when `checkpoint_fase` is `'primer_tiempo'` or `null`, and "Comenzar 2º Tiempo" when it is `'entretiempo_o_segundo'`.

#### Scenario: First-half pause shows resume banner

- GIVEN an in-progress match with `checkpoint_fase = 'primer_tiempo'`
- WHEN the dashboard renders
- THEN a paused-match banner with a "Reanudar" action SHALL be visible

#### Scenario: Second-half pause shows second-half action

- GIVEN an in-progress match with `checkpoint_fase = 'entretiempo_o_segundo'`
- WHEN the dashboard renders
- THEN the banner SHALL show a "Comenzar 2º Tiempo" action

#### Scenario: No paused match shows playable banner

- GIVEN a playable fixture and no in-progress match
- WHEN the dashboard renders
- THEN the standard playable-fixture banner SHALL be shown instead

### Requirement: Post-match live stat sync

After a match finishes, the dashboard and related screens SHALL reflect fresh season stats. `finalizarPartido` SHALL return the updated season, `continuar()` SHALL call `setTemporadaActiva(...)` alongside `setPlayer(...)`, and career/profile/dashboard SHALL refetch on focus via `useFocusEffect`.

#### Scenario: Returned season is fresh after a match

- GIVEN the user completes a match
- WHEN `continuar()` runs
- THEN `temporadaActiva` in the store SHALL be the updated season including the just-played stats

#### Scenario: Screens refresh on focus return

- GIVEN the user returns from `/match` to profile, career, or dashboard
- WHEN those screens regain focus
- THEN each SHALL reload and display the fresh stats without an app restart

## MODIFIED Requirements

### Requirement: Post-match return to dashboard

The system MUST return the user to the dashboard after the result screen; it MUST NOT land on the menu or new-career screens. The dashboard the user returns to SHALL display fresh stats from the just-completed match.

(Previously: the dashboard was reached after a result, with no guarantee that live season stats were refreshed in the store.)

#### Scenario: Return after result

- GIVEN the user completed a match
- WHEN the result is confirmed
- THEN the user lands on the dashboard with the match recorded and fresh season stats reflected