# Penalty Mini-Game Specification

## Purpose

Provides an interactive penalty moment inside the 0–90 match replay: the sequence pauses at a scheduled penalty, the user chooses a shot direction and (for the opponent's penalty) a save side, and the outcome is resolved deterministically and logged into the timeline without corrupting the match result.

## Requirements

### Requirement: Pause and prompt

The system MUST pause the match replay at each scheduled penalty event and present an interactive choice of shot direction, and for an opponent penalty, a save side.

#### Scenario: Player takes the penalty

- GIVEN the timeline contains a penalty awarded to the player's team at minute 55
- WHEN the replay clock reaches minute 55
- THEN the sequence SHALL pause and prompt the user to pick a shot direction

#### Scenario: Opponent takes the penalty

- GIVEN a penalty is awarded to the opponent
- WHEN the replay reaches that minute
- THEN the sequence SHALL prompt the user to pick a save side

### Requirement: Outcome resolution

The system MUST resolve the penalty as a goal only when the shot direction beats the keeper's side; otherwise it SHALL resolve as saved or missed. The resolved outcome MUST be appended to the timeline and MUST NOT re-simulate the match.

#### Scenario: Goal on successful choice

- GIVEN the user picks a direction different from the keeper's side
- WHEN the resolution runs
- THEN the goal SHALL be added and the scorecard records scorer and minute

### Requirement: Saved or missed continuation

When a penalty is saved or missed, the sequence MUST continue at the following minute: no goal is added, no score change occurs, and the failed attempt SHALL be recorded as an event in the timeline.

#### Scenario: Saved penalty resumes play

- GIVEN the user's shot is saved or missed
- WHEN the resolution completes
- THEN no goal is added AND the replay resumes at the next minute

### Requirement: Inaction default

The system MUST resolve the penalty with a default outcome if the user provides no choice within a bounded time, to avoid a soft-lock during the replay.

#### Scenario: No input provided

- GIVEN the user does not choose within the allowed window
- WHEN the timeout elapses
- THEN the penalty SHALL resolve as missed and the replay SHALL continue

### Requirement: Single penalty step

The interactive penalty step SHALL occur at most once per match.

#### Scenario: Only one interactive penalty

- GIVEN a match whose simulation yields any number of penalty triggers
- WHEN the replay completes
- THEN at most one interactive penalty prompt SHALL have been shown