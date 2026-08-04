# Tasks: Gameplay Overhaul

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,470 across 5 PRs |
| 400-line budget risk | Medium (PR1/PR4 near ceiling) |
| Chained PRs recommended | Yes |
| Suggested split | PR1 → PR2 → PR3 → PR4 → PR5 (feature branch chain) |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR (base) | Focused test | Runtime harness | Rollback boundary |
|------|------|-------------------|--------------|-----------------|-------------------|
| 1 | Timeline domain + persistence | PR1 (feature/) | `npx tsc --noEmit` | `npx expo lint` | Revert service split + repo method |
| 2 | Formacion VO + FormationPitch + onboarding | PR2 (PR1) | `npx tsc --noEmit` | `npx expo lint` | Revert formacion.ts + pitch atom |
| 3 | /match replayer + penalty + scorecard + banner | PR3 (PR2) | `npx tsc --noEmit` | `npx expo lint` | Revert match.tsx + banner + store |
| 4 | Club transfer: offer + position | PR4 (PR3) | `npx tsc --noEmit` | `npx expo lint` | Revert seasonService split + overlays |
| 5 | Season pacing constants | PR5 (PR4) | `npx tsc --noEmit` | `npx expo lint` | Revert pacing.ts + fixture.ts; old fixtures kept |

## Phase 1 — Slice 1a: Domain + Data (PR 1)

- [x] 1.1 `src/domain/rules/partido.ts`: `TipoEvento`/`EventoTimeline` types; `simularPartido` → minute-ordered `lineaTiempo`+`resultado`; ≤1 interactive penalty.
- [x] 1.2 `src/shared/constants/partido.ts` new: `DURACION_1T=120000`, `DURACION_2T=120000`, `AGREGADO=30000`, `PENAL_TIMEOUT_MS=8000`.
- [x] 1.3 `src/services/partidoService.ts`: split → `iniciarPartido` (energy −3, persist timeline) / `finalizarPartido` (marcarJugado+stats+OVR+suspension via `resultadoDesdeLineaTiempo`); `simularTemporadaCompleta` headless.
- [x] 1.4 Repos: `guardarTimeline(id, json)` → `UPDATE partido SET eventos_json=?`.
- [x] 1.5 Regenerate typedRoutes; tsc clean.

## Phase 2 — Slice 1b-i: Formation + Onboarding (PR 2)

- [ ] 2.1 `src/domain/value-objects/formacion.ts` new: `Formacion`, `SlotFormacion`, 5 `FORMACIONES` (11 slots), `formacionBaseDeClub` hash, `posicionesDeFormacion`, `validarFormacion`.
- [ ] 2.2 `src/presentation/components/organisms/formation-pitch.tsx` new: modes `ver` (rival flip, highlight) + `seleccionar` (touchable slots) + Reanimated marker.
- [ ] 2.3 Replace `PositionPitch` in `src/app/(onboarding)/position.tsx` with `FormationPitch` (4-2-3-1); do NOT touch identity.tsx.

## Phase 3 — Slice 1b-ii: Match + Banner + Dashboard (PR 3)

- [ ] 3.1 `src/state/usePartidoEnCursoStore.ts` + `usePartidoVistaStore.ts` (transient bannerOculto) new.
- [ ] 3.2 Dashboard `jugar()` → `iniciarPartido` + store + `router.push('/match')`; `match-alert-banner.tsx` (persistent, no auto-dismiss) in `src/app/(main)/index.tsx`.
- [ ] 3.3 `src/app/match.tsx`: replayer, `setInterval(100ms)` → shared `relojMs`, phases jugando/descanso/penal/final; events at scheduled minutes; penalty mini-game (direction, 8s timeout → missed); scorecard; Continuar → `finalizarPartido` → `router.replace('/(main)')`; cleanup on blur/unmount.
- [ ] 3.4 Dashboard `useFocusEffect(cargar)` on return; banner only when pending fixture playable.

## Phase 4 — Slice 2: Club Transfer + Position (PR 4)

- [ ] 4.1 `src/domain/rules/temporada.ts`: pure `seleccionarCandidatos` — top 3 with prestigio > current.
- [ ] 4.2 `src/services/seasonService.ts`: split `proponerCierre`/`finalizarCierre` (decision {cambio|quedarse}; on cambio: `setPosicion` + regenerate fixture).
- [ ] 4.3 Repos: `setPosicion(id, pos)` → `UPDATE player SET posicion=?`.
- [ ] 4.4 `src/state/useCierreStore.ts`: `propuesta: PropuestaCierre | null` + pending `decision`.
- [ ] 4.5 `src/app/club-oferta.tsx` + `src/app/elegir-posicion.tsx` new overlays (positions constrained to accepted club's formation via FormationPitch).
- [ ] 4.6 `src/app/season-summary.tsx`: "Nueva oferta" card → /club-oferta; dashboard cerrar → proponerCierre.

## Phase 5 — Slice 3: Season Pacing + Verify (PR 5)

- [ ] 5.1 `src/shared/constants/pacing.ts` new (single source): `MS_REGEN_BARRA=10_800_000`, `PARTIDO=3`, `ENTRENAMIENTO=2`, `DIAS_ENTRE_FIXTURES=2`, `MAX_LIGA=24`.
- [ ] 5.2 `src/domain/rules/energia.ts`: import pacing constants, delete literals.
- [ ] 5.3 `src/domain/rules/fixture.ts`: deterministic 2-day `avanzar()`; double round-robin; truncation `total=2(N-1)≤24`; no migration.
- [ ] 5.4 Verify: `npx tsc --noEmit` + `npx expo lint`; manual Expo Go check.
