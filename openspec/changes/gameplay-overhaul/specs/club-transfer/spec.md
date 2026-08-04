# Club Transfer Specification

## Purpose

Replaces the automatic single-best-club transfer at season close with a user-facing offer: the user evaluates candidate clubs, accepts or stays, and on acceptance chooses a new position constrained to the accepted club's base formation. The chosen position persists.

## Requirements

### Requirement: Offer candidate clubs

When a better-club offer exists at season close, the system MUST present a choice of 2–3 candidate clubs instead of transferring automatically. It MUST NOT change clubs without the user's decision.

#### Scenario: Candidate list shown

- GIVEN an offer to move to a better club exists
- WHEN the season closes
- THEN the user SHALL see 2–3 candidate clubs and choose accept or stay

#### Scenario: Stay keeps club

- GIVEN the user declines all candidates
- WHEN the decision is confirmed
- THEN the current club SHALL be kept and the season SHALL continue

### Requirement: Position selection on accept

When the user accepts a new club, the system MUST require the user to choose a new position. The choice SHALL be constrained to the positions present in the accepted club's base formation.

#### Scenario: Choice constrained to formation

- GIVEN the user accepts a club whose base formation contains positions P1..Pk
- WHEN the position step renders
- THEN only P1..Pk SHALL be selectable

#### Scenario: Selection required before continuing

- GIVEN the user accepted a new club
- WHEN the flow proceeds without choosing a position
- THEN the flow SHALL block until a valid position is selected

### Requirement: Position persistence

The system MUST persist the chosen position to the player record.

#### Scenario: Position survives restart

- GIVEN the user chose a new position after a transfer
- WHEN the app reloads from storage
- THEN the stored position SHALL be the newly chosen one

### Requirement: Transfer finalization

On acceptance, the system MUST record the club change and season history and regenerate the fixture for the new club.

#### Scenario: Transfer recorded and fixture refreshed

- GIVEN the user accepted a new club and chose a position
- WHEN the transfer finalizes
- THEN the player's club SHALL update, season history recorded, and a new fixture generated

### Requirement: Position change only on club change

The position SHALL be changeable only through the club-change flow, not freely from the profile.

#### Scenario: No free profile change

- GIVEN the user is on the profile screen outside a transfer
- WHEN the user attempts to change position
- THEN no position change SHALL be offered