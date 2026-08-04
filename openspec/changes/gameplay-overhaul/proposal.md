# Proposal: gameplay-overhaul

## Intent

Deliver the PRD career experience: a real tactical pitch with adaptive formations, a deterministic 0–90 match replay (~4.5 min) with events and scorer+minute results, an interactive penalty mini-game, an in-app match alert, user-chosen club transfers with position change, and medium-slow season pacing for retention. Today the match is an instant inline simulation, positions are immutable, transfers are automatic, and seasons span a few real days — each gap is documented in exploration `sdd/gameplay-overhaul/explore`.

## Scope

### In Scope (3 delivery slices)
1. **Matchday + Formation + Alert**: `Formacion` VO + reusable `FormationPitch` (replaces onboarding `PositionPitch`; reused in match + club picker); deterministic 0–90 replay overlay (outside `(main)`, no tabs) emitting fouls/YC/RC/injury/penalty/goal events; scorecard (winner, scorers+minutes); interactive penalty mini-game (sequence pauses, pick direction/save side); dashboard "Jugar" pushes to match; post-match returns to dashboard; in-app match-day banner (no system notifications).
2. **Club change + Position**: season-close offer screen with 2–3 candidate clubs and user choice; choose new position (new `PlayerRepository.setPosicion`).
3. **Season pacing**: energy regen 1 bar/3–4h, match −3, train −2, fixture spacing 2–3 days (numbers user-approved).

### Out of Scope
- External UI libraries (RNUI/gluestack/NEO UI — rejected). Reanimated + gesture-handler only.
- System notifications; formations beyond the 5 base ones; EAS/dev builds; anything requiring a native lib outside SDK-57 Expo Go set.
- Uncommitted user work (`src/app/(onboarding)/identity.tsx`, `src/data/db/seed-clubes.ts`, `src/shared/constants/game.ts`).

## Capabilities

### New Capabilities
- `matchday-experience`: 0–90 replay, events, scorecard, post-match nav, alert banner.
- `penalty-minigame`: interactive shot direction / save side on paused sequence.
- `formations`: Formacion model + reusable FormationPitch (onboarding, match, club picker).
- `club-transfer`: offer screen, club choice, position selection.
- `season-pacing`: energy/fixture economy rebalance.

### Modified Capabilities
None — `openspec/specs/` is empty; these are the repo's first specs.

## Approach

Extend pure `simularPartido` to emit a minute-ordered event timeline (single source of truth; deterministic; testable seams). Match screen is a pure replayer: Reanimated shared-value clock (no per-tick `setState`), emits events at scheduled minutes, pauses for the penalty mini-game. New `/match` overlay follows the existing overlay pattern. `FormationPitch` derives from the `Formacion` VO; club offer reuses the season-summary overlay chain.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `src/domain/rules/partido.ts` | Modified | Timeline-generating `simularPartido` |
| `src/domain/value-objects/formacion.ts` | New | Formation model + slot layout |
| `src/presentation/components/.../FormationPitch.tsx` | New | Reusable pitch atom |
| `src/app/(main)/index.tsx` | Modified | Push-to-match + alert banner |
| `src/app/(main)/match.tsx` | New | Match overlay |
| `src/services/seasonService.ts` | Modified | Club offer + position flow |
| `src/domain/rules/energia.ts`, `fixture.ts` | Modified | Pacing constants |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Exceeds 400-line review budget | High | 3 chained PR slices (sketch above) |
| First Reanimated use; render-loop bugs | Med | Shared values, single clock, cleanup on unmount |
| Match timers vs app backgrounding | Med | Stop timers on blur/unmount |
| typedRoutes on new `/match` route | Low | Regenerate route types |
| Pacing feels wrong / breaks old saves | Med | Centralized constants; user-approved values; fixture spacing affects new fixtures only |
| Expo Go incompatibility | Low | Keep SDK-57 pins; no new native libs |

## Rollback Plan

Per-slice revert. Slice 1: restore dashboard inline simulate path. Slices 2–3: flow/constants only — no schema migration (`player.posicion` stays TEXT). No data migration required.

## Dependencies

- Reanimated 4.5.1 + gesture-handler ~3.1.0 (installed, Expo Go compatible, New Architecture OK).

## Success Criteria

- [ ] Match replay plays 0–90 with events; scorecard shows winner + scorer/minute; returns to dashboard.
- [ ] Both elevens render on a real pitch; onboarding picker uses shared FormationPitch.
- [ ] Club change offers choice + position; position persists.
- [ ] Pacing matches approved numbers; season ≈ 3–5 real weeks.
- [ ] `npx tsc --noEmit` + `expo lint` clean on Android 15/16 Expo Go and web.
