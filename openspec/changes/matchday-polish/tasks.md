# Tasks: Matchday Polish

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,480 across 7 PRs (PR1 ~180, PR2 ~350, PR3a ~150 / PR3b ~250 / PR3c ~80, PR4 ~120, PR5 ~350) |
| 400-line budget risk | Medium (PR2/PR3b/PR5 near ceiling) |
| Chained PRs recommended | Yes |
| Suggested split | PR1 → PR2 → PR3a→PR3b→PR3c → PR4 → PR5 (stacked to main) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR (base) | Focused test | Runtime harness | Rollback boundary |
|------|------|------------------|--------------|-----------------|-------------------|
| 1 (Slice 0) | Live stats refresh | PR1 (main) | `npx tsc --noEmit` | `npx expo lint` | Revert partidoService return + `setTemporadaActiva` + career.ts/reuseFocusEffect |
| 2 (Slice 1) | Paused match + checkpoints | PR2 (PR1) | `npx tsc --noEmit` | `npx expo lint` | Drop migration 003 + reverse checkpoint writes; `eventos_json` intact |
| 3a (Slice 2) | `SituacionInteractiva` domain | PR3a (PR2) | `npx tsc --noEmit` | `npx expo lint` | Revert partido.ts generalization |
| 3b (Slice 2) | `ShotTargetGrid` + match.tsx + audit | PR3b (PR3a) | `npx tsc --noEmit` | `npx expo lint` | Revert grid component + match.tsx situation flow |
| 3c (Slice 2) | Legacy /penalty teardown | PR3c (PR3b) | `npx tsc --noEmit` | `npx expo lint` | Git-recover deleted routes/service fns |
| 4 (Slice 3) | Safe area + hairline | PR4 (PR3c) | `npx tsc --noEmit` | `npx expo lint` | Revert tokens hairline + insets audit |
| 5 (Slice 4) | Club identity (accent + crest) | PR5 (PR4) | `npx tsc --noEmit` | `npx expo lint` | Revert club-colors/useAccentColors/club-crest + mounts |

## Phase 1 — Slice 0: Live Stats (PR 1)

- [x] 1.1 `src/services/partidoService.ts`: `finalizarPartido` re-reads fresh season via `temporadaRepository.findActiva` and returns it in `ResultadoPartidoJugado.temporadaActualizada`.
- [x] 1.2 `src/app/match.tsx` `continuar()`: add `setTemporadaActiva(temporadaActualizada)` beside the existing `setPlayer`.
- [x] 1.3 `src/domain/rules/career.ts` (name it `career.ts`, not `carrer.ts`): pure `lineaCarreraConActiva(etapas, activa)` summing settled `historial_carrera` + in-flight `temporadaActiva` when `anioFin === null` (no double-count on closed seasons).
- [x] 1.4 `src/app/career.tsx`, `src/app/profile.tsx`, dashboard `(main)/index.tsx`: reload data via `useFocusEffect` so returning from `/match` shows fresh stats.
- [x] 1.5 `cerrar()`: simplify/remove the point-in-time DB re-read (Bug C workaround) now that `temporadaActiva` is current in the store; leave legacy flow working while migrating.
- [x] 1.6 Verify PR1: `npx tsc --noEmit` + `npx expo lint` clean.

## Phase 2 — Slice 1: Paused Match (PR 2)

- [x] 2.1 `src/data/db/migrations/003-checkpoint.ts` new: `ALTER TABLE partido ADD COLUMN checkpoint_fase TEXT` (nullable, additive, reversible DROP); register in `MIGRACIONES`, `VERSION_ACTUAL`→3 via array length.
- [x] 2.2 `src/data/.../partido-repository.ts`: `guardarCheckpoint(id,fase)`, `limpiarCheckpoint(id)`, `findPartidoEnCurso(temporadaId)` (`jugo=0 AND eventos_json IS NOT NULL LIMIT 1`), `findVencidosConCheckpoint(temporadaId)` (`checkpoint_fase NOT NULL AND jugo=0 AND fecha_ts < ?`); `filaToPartido` maps optional `checkpointFase`.
- [x] 2.3 `src/services/partidoService.ts` `reanudarPartido(player, temporada, partido, clubRival, fase)`: rebuild `PartidoEnCurso` parsing persisted `eventos_json` → `lineaTiempo`; NO sim, NO energy re-charge.
- [x] 2.4 `src/app/match.tsx`: replay-start → `guardarCheckpoint(id,'primer_tiempo')`; halftime cross (`t>=DURACION_1T`) → `guardarCheckpoint(id,'entretiempo_o_segundo')`; `finalizarPartido` → `limpiarCheckpoint`; resume init clock `0` or `DURACION_1T`, `descansoHechoRef=true` on 2T resume.
- [x] 2.5 `calendarService.resolverPendientesVencidos(temporadaId)`: lazy, idempotent, marks abandoned (`checkpoint_fase NOT NULL`) fixtures `marcarJugado(...,'0-3')` + `limpiarCheckpoint`; invoke from dashboard `cargar()`.
- [x] 2.6 Dashboard banner: `paused-match-banner.tsx` + `(main)/index.tsx` show "Partido en pausa vs {rival}" with "Reanudar" (`primer_tiempo`/null) or "Comenzar 2º Tiempo" (`entretiempo`); hide when `findPartidoEnCurso` returns none.
- [x] 2.7 Verify PR2: `npx tsc --noEmit` + `npx expo lint` clean.

## Phase 3 — Slice 2: Interactive Situations (PR 3a → 3b → 3c)

### 3a — Domain (PR 3a)

- [x] 3a.1 `src/domain/rules/partido.ts`: generalize `PenalTimeline` → `SituacionInteractiva`; `ZonaDisparo` 6 zones; `ResultadoSituacion` docs 5-value union (`'gol'|'atajado'|'palo'|'afuera'|'rebote'`) vs the spec's literal 4-value enum — `rebote` required by the barrier; `EventoTimeline.penal?` → `situacion?` (optional, older events parse gracefully).
- [x] 3a.2 `partido.ts`: `TipoEvento` += `'tiro-libre-interactivo'`; precompute `ladoDefensor` zone per situation.
- [x] 3a.3 `partido.ts`: pure `resolverPenalConEleccion(linea,minuto,zona)` + `resolverTiroLibreConEleccion` (low/center + barrera → `rebote`, else zone-vs-gk); never re-simulate; `resolverInaccion` default for timeout (miss).
- [x] 3a.4 `simularPartido`: bound ≤2 interactive situations (1 pénal + 1 TL) at unique minutes, never same minute.
- [x] 3a.5 `partido.ts`: adopt `career.ts`-style pure helper naming consistency (file standardized `career.ts`, no `carrer.ts`).

### 3b — UI + Audit (PR 3b)

- [x] 3b.1 `src/presentation/components/.../shot-target-grid.tsx` new: `react-native-svg` goal with six tappable zones, theme colors.
- [x] 3b.2 `src/app/match.tsx`: pause replay at interactive situation; render grid; OPPONENT penalty presents 6-zone **SAVE** prompt (penalty-minigame "Pause and prompt"); apply chosen zone; feedback 0.6–0.8s (ball→zone, keeper→precomputed side, result color/icon); timeout → `resolverInaccion`; resume at next minute.
- [x] 3b.3 Audit `resultadoDesdeLineaTiempo`, `contarGoles`, `golesDe` in `partido.ts` + `match.tsx` `tipo==='penal'` filters → include `situacion` events; keep scorecard/determinism safe.
- [x] 3b.4 Verify PR3b: `npx tsc --noEmit` + `npx expo lint` clean.

### 3c — Legacy Teardown (PR 3c, grep-first)

- [x] 3c.1 Grep-first: `grep -r penalty src/app`, `grep resolverPenal|patearPenal`; confirm no live routes before deleting.
- [x] 3c.2 Remove `navegarA:'penalty'` in `eventos.ts`, the `/penalty` push in `event.tsx`; delete `src/app/penalty.tsx`.
- [x] 3c.3 Drop `penal-decision` event + `eventService.resolverPenal`/`patearPenal`.
- [x] 3c.4 Regenerate typedRoutes; confirm `grep -r penalty src/app` clean.
- [x] 3c.5 Verify PR3c: `npx tsc --noEmit` + `npx expo lint` clean.

## Phase 4 — Slice 3: Safe Area + Hairline (PR 4)

- [x] 4.1 `tokens.ts`: hairline `border '#2A2A2A'` → `'rgba(255,255,255,0.06)'` (central source); `screen-container` footer `borderTopColor`, `(main)/_layout.tsx` tab `borderTopColor`, card `borderColor` follow; keep `borderStrong`.
- [x] 4.2 Audit non-`ScreenContainer` screens (`match.tsx`, root `index.tsx`, overlays: 6-zone grid, resume banner, scorecard) → `SafeAreaView` edges / `useSafeAreaInsets()` with `paddingBottom: insets.bottom`, no fixed padding.
- [x] 4.3 Tab bar: JS `Tabs` auto-applies bottom inset — verify no custom/NativeTabs positioning issue; explicit insets only where a manual borrow exists.
- [x] 4.4 Verify PR4: `npx tsc --noEmit` + `npx expo lint` clean.

## Phase 5 — Slice 4: Club Identity (PR 5)

- [ ] 5.1 `src/domain/rules/club-colors.ts` new: `CLUB_COLORS` (primario/secundario per seed club key), `coloresDeClub(club)`; DO NOT touch `seed-clubes.ts`.
- [ ] 5.2 `src/presentation/theme/use-accent.ts` `useAccentColors()`: dynamic accent from player club primario → `{ accent, onAccent }` via luminance `colorTextoDe`; white fallback; onboarding pre-club stays white; applied to prominent interactive surfaces only.
- [ ] 5.3 `club-crest.tsx` new: procedural SVG shield + initials + primary/secondary colors from `escudoKey`.
- [ ] 5.4 Mount `ClubCrest` on dashboard `(main)/index.tsx`, calendar, `club-oferta.tsx`, and match scorecard.
- [ ] 5.5 Semantic colors (success/danger/warning) fixed + contrast review against dynamic accent.
- [ ] 5.6 Verify PR5: `npx tsc --noEmit` + `npx expo lint` clean.

## Phase 6 — Verify / Close

- [ ] 6.1 `npx tsc --noEmit` clean.
- [ ] 6.2 `npx expo lint` clean.
- [ ] 6.3 Expo Go Android 15/16 visual check: gesture-bar clearance, resume banner, 6-zone grid, crest, accent contrast.
- [ ] 6.4 `grep -r penalty src/app` clean after teardown.