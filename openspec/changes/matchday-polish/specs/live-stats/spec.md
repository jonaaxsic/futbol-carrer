# Live Stats Specification

## Purpose

Closes the stale-stats gap introduced by the `/match` flow: after a match finishes, the in-memory Zustand store (`temporadaActiva`) is never refreshed, so profile, career, and dashboard show outdated goals/matches/assists until the season is closed. Live stats propagate the fresh season as soon as `finalizarPartido` returns and keep the career club card in sync during an in-flight season.

## Requirements

### Requirement: Finalize returns fresh season

`finalizarPartido` MUST return the updated `temporada` for the completed match. The returned value SHALL be read fresh (e.g. via `temporadaRepository.findActiva`) rather than assumed from the caller's store, so any screen that continues after a match receives current numbers.

#### Scenario: Finalize yields updated season

- GIVEN a match has been played and season stats were accumulated
- WHEN `finalizarPartido` completes
- THEN it SHALL return the season whose `temporadaActiva` stats include the just-played goals, matches, and assists

### Requirement: Resume updates active season

The `continuar()` flow after a match MUST call `setTemporadaActiva(...)` with the fresh season returned by `finalizarPartido`, in the same place it already calls `setPlayer(...)`.

#### Scenario: Continue refreshes the store

- GIVEN a match finished and produced updated stats
- WHEN the user proceeds via `continuar()`
- THEN `usePartidoEnCursoStore` `temporadaActiva` SHALL be the fresh season and the player's store SHALL be updated

### Requirement: Live career club card (Option A)

For the career club card, when the player has an active season (`anioFin === null`), the card MUST show live in-flight numbers computed by combining the settled `historial_carrera` with the current `temporadaActiva` stats, rather than only reading the career table that freezes until season close.

#### Scenario: Active season shows live career line

- GIVEN the player is mid-season (`anioFin === null`) with settled career stats plus this season's goals
- WHEN the career screen renders the club card
- THEN the card SHALL display the sum of `historial_carrera` and `temporadaActiva` numbers

#### Scenario: Closed season keeps settled totals

- GIVEN the season is closed (`anioFin` is set)
- WHEN the career screen renders the club card
- THEN it SHALL show the already-settled career totals without double-counting

### Requirement: Focus refetch

Profile, career, and dashboard SHALL refresh their data when the `/match` screen loses focus, so returning from a match requires no app restart. This SHALL be implemented with `useFocusEffect` triggering a reload on focus.

#### Scenario: Return from match refreshes screens

- GIVEN the user finishes a match and is returned to the app
- WHEN profile, career, or dashboard regain focus
- THEN they SHALL reload current data and display the fresh stats

### Requirement: Closed-frame workaround simplified

Once `finalizarPartido` returns the fresh season and `continuar()` calls `setTemporadaActiva`, the point-in-time `cerrar()` workaround that re-read the season from the database MAY be simplified or removed, provided `temporadaActiva` is already current when it runs.

#### Scenario: Workaround becomes redundant

- GIVEN the live-stats fix is in place
- WHEN the store already holds the fresh season at `cerrar()`
- THEN the earlier manual database re-read SHALL no longer be required to render correct stats