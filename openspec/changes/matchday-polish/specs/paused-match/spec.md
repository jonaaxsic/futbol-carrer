# Paused Match Specification

## Purpose

Prevents losing energy and a match when the app is killed mid-replay. Instead of voiding the game, the replay records a checkpoint phase in SQLite at two points, the dashboard shows a resume banner, and resuming rebuilds the in-progress match from the persisted timeline. Energy is never charged again. An unpursued match auto-resolves 3–0 if the calendar advances past it.

## Requirements

### Requirement: Checkpoint phase persistence

The system MUST persist a match checkpoint via migration 003 adding a nullable `partido.checkpoint_fase` column with values `'primer_tiempo'`, `'entretiempo_o_segundo'`, or `null`. The column SHALL be written at replay start and when crossing halftime, and SHALL be cleared when `finalizarPartido` runs.

#### Scenario: Replay start records first-half checkpoint

- GIVEN a match replay begins
- WHEN the replay reaches its initial state
- THEN `checkpoint_fase` SHALL be `'primer_tiempo'`

#### Scenario: Halftime crossing records second-half checkpoint

- GIVEN a match replay is in the first half
- WHEN the replay crosses into the second half
- THEN `checkpoint_fase` SHALL be `'entretiempo_o_segundo'`

#### Scenario: Completed match clears checkpoint

- GIVEN a match finishes
- WHEN `finalizarPartido` runs
- THEN `checkpoint_fase` SHALL be cleared to `null`

#### Scenario: Existing games unaffected

- GIVEN a save created before migration 003
- WHEN the migration applies
- THEN existing rows SHALL remain valid with `checkpoint_fase = null`, and no data SHALL be lost or rewritten

### Requirement: Repository checkpoint methods

The party match repository MUST provide `guardarCheckpoint(partidoId, fase)` to write the phase and `findPartidoEnCurso(temporadaId)` to return matches that have a persisted timeline and have not been played (`eventos_json IS NOT NULL AND jugo = false`).

#### Scenario: Save and locate in-progress match

- GIVEN a match has a persisted timeline and `jugo = false`
- WHEN `findPartidoEnCurso` is queried for that season
- THEN the match SHALL be returned with its `checkpoint_fase`

### Requirement: Dashboard resume banner

When an in-progress match exists, the dashboard SHALL show a "Partido en pausa vs. {rival}" banner instead of the normal play action. If `checkpoint_fase` is `'primer_tiempo'` or `null`, it SHALL offer a "Reanudar" action; if `'entretiempo_o_segundo'`, a "Comenzar 2º Tiempo" action.

#### Scenario: First-half pause shows resume

- GIVEN an in-progress match with `checkpoint_fase = 'primer_tiempo'`
- WHEN the dashboard loads
- THEN a banner SHALL show the rival and a "Reanudar" action

#### Scenario: Second-half pause shows second-half start

- GIVEN an in-progress match with `checkpoint_fase = 'entretiempo_o_segundo'`
- WHEN the dashboard loads
- THEN the banner SHALL show a "Comenzar 2º Tiempo" action

#### Scenario: No in-progress match hides banner

- GIVEN no match has a persisted timeline with `jugo = false`
- WHEN the dashboard loads
- THEN no resume banner SHALL be shown

### Requirement: Resume rebuilds in-progress match

Both resume actions MUST rebuild the `PartidoEnCurso` (match, season, rival club, current player, `lineaTiempo` parsed from the persisted `eventos_json`) and call the in-progress-match store's `fijar(...)`. The resume point SHALL be set by `checkpoint_fase`: `'primer_tiempo'`/`null` starts the clock at 0; `'entretiempo_o_segundo'` starts at the first-half duration and shows the already-resolved first-half goals.

#### Scenario: Resume from first half

- GIVEN the "Reanudar" action is tapped
- WHEN the replay is rebuilt
- THEN the clock SHALL start at minute 0 with the persisted timeline

#### Scenario: Resume from second half

- GIVEN the "Comenzar 2º Tiempo" action is tapped
- WHEN the replay is rebuilt
- THEN the clock SHALL start at the first-half duration and the first-half summary SHALL be visible

### Requirement: No energy re-charge on resume

Resuming a paused match MUST NOT charge energy again. Energy is charged once by `iniciarPartido`; the checkpoint only avoids a double charge and a stranded match.

#### Scenario: Resume does not spend again

- GIVEN a paused match whose energy was already spent
- WHEN the user resumes and finishes it
- THEN the player's energy SHALL NOT be reduced a second time

### Requirement: Unpursued match auto-resolve 3-0

If the calendar advances past a match that was never resumed, the system MUST auto-resolve that fixture as a 3–0 loss (product decision) so the fixture is not permanently blocked.

#### Scenario: Calendar passes an unplayed fixture

- GIVEN a match was paused and never resumed
- WHEN the calendar advances past that fixture's date
- THEN the match SHALL resolve as a 3–0 loss and the checkpoint SHALL be cleared