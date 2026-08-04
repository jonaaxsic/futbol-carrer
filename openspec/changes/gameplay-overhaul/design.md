# Design: gameplay-overhaul

## Technical Approach

Deterministic replay architecture: extend the pure `simularPartido` rule to emit a full minute-ordered event timeline (single source of truth); persist that timeline in the existing `partido.eventos_json` at match start; the new `/match` overlay is a pure *replayer* driven by one JS interval + a Reanimated shared-value clock (no per-tick setState). Formations are a domain VO + one reusable `FormationPitch` atom shared by onboarding, match, and the club-change picker. Club transfer splits `cerrarTemporada` into propose/decide/finalize with a user-facing offer + position step. Pacing is constants-only in new centralized files (no migration, `game.ts` untouchable). Maps to proposal approach; satisfies all 5 delta specs.

## Architecture Decisions

| # | Decision | Choice | Alternatives | Rationale |
|---|----------|--------|--------------|-----------|
| D1 | Timeline persistence | Compute ONCE at match start, persist full timeline in `partido.eventos_json`; replay from it; never regenerate | Regenerate from persisted seed | Interactive penalty mutates the timeline at runtime and must survive backgrounding; no seed plumbing; existing column reused; deterministic by construction (spec R2 stable-across-passes = persisted once) |
| D2 | Match persistence split | `iniciarPartido` (energy + timeline persist) → replay → `finalizarPartido` (marcarJugado + stats + OVR + suspension, takes resolved result) | Keep single `jugarPartido` | Replay needs the fixture still `jugo=0`; result derived from resolved timeline via `resultadoDesdeLineaTiempo` (no re-sim, spec penalty R2) |
| D3 | Match clock | One JS `setInterval(100ms)` writing a Reanimated shared value `relojMs`; React state updated only on event crossings + 1 Hz minute; pause via RN `AppState` (background) + `useFocusEffect`/unmount cleanup | rAF; per-tick setState | Expo-Go-safe (no new native dep); ~90 setStates/match, none per-tick (explore risk: render-loop) |
| D4 | Club formation storage | Pure derivation `formacionBaseDeClub(clubId)` — stable integer hash over 5 formations; NULL-safe default `4-3-3` | New `club.formacion` column + migration 003; seed field | Seed file is untouchable uncommitted work; deterministic per-rival selector (spec R2/R3) with zero migration; fallback satisfies unknown-club scenario |
| D5 | Onboarding pitch | Reuse `FormationPitch` in `seleccionar` mode with formation **4-2-3-1** (contains all 9 positions) | Default 4-3-3 (drops MCO) | Preserves today's selectable set — no product regression — while replacing hardcoded `PositionPitch` (spec formations R4) |
| D6 | Transfer flow | Split `cerrarTemporada` → `proponerCierre` / `finalizarCierre`; new overlays `/club-oferta` + `/elegir-posicion`; new `PlayerRepository.setPosicion` | Keep auto-assign + later profile change | Spec club-transfer R1/R2/R5: choice required, position constrained to accepted club's formation, only via club change |
| D7 | Calendar truncation (>12 clubs) | `total = 2(N-1)`; if `> 24`: one full round (N-1) + return round = top `24-(N-1)` rivals by prestigio desc (tie: id asc) | Play 2 rounds vs subset; fixed 22 | Deterministic (spec R3), capped ~24 for 16-20-club seeds; ≤24 keeps full RR for 10-12 (18-22 matches) |
| D8 | Constants location | New `src/shared/constants/pacing.ts` (economy+calendar) + `partido.ts` (replay timing) | Edit `game.ts` | `game.ts` is untouchable uncommitted work; single-source requirement (spec R6) without touching it |
| D9 | Styling system (user decision 2026-08-03) | Keep RN `StyleSheet.create` for all new components + introduce centralized design tokens in new `src/theme/` (colors, spacing, radii, typography) consumed by StyleSheet | Tailwind/NativeWind v5 (preview) + react-native-css (nightly) for new components; full migration | User rejected Tailwind: native deps are unstable preview/nightly builds that risk Expo Go on Android 15/16; StyleSheet avoids a dual styling system; tokens give Tailwind-like consistency without runtime deps. Existing 25+ style files stay untouched with StyleSheet |

## Data Flow

```
Dashboard jugar() ─► iniciarPartido (energía -3, simularPartido→lineaTiempo, guardarTimeline)
      │  setPartidoEnCurso(store) ─► router.push('/match')
      ▼
/match replay: relojMs (SV) ─► eventos visibles ─► penal? ⤆ prompt (timeout 8s→fallado)
      │  resuelto → timeline actualizada → guardarTimeline (resume)
      ▼ 90' → resultadoDesdeLineaTiempo ─► finalizarPartido (BD) ─► router.replace('/(main)')
      ▼
Dashboard (useFocusEffect→cargar()) · Banner si pendientes[0] jugable
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/domain/value-objects/formacion.ts` | Create | Formacion, SlotFormacion (Posicion + x,y ∈ [0,1]), 5 FORMACIONES (11 slots c/u), formacionPorNombre, formacionBaseDeClub (hash), posicionesDeFormacion, validarFormacion, POSICION_FALLBACK (MCO→MC) |
| `src/domain/rules/partido.ts` | Modify | Timeline types (EventoTimeline: gol/falta/amarilla/roja/lesion/penal, minuto, equipo, jugador, ladoArquero?, interactivo?); simularPartido returns lineaTiempo + resultado; ≤1 penal interactivo; goles repartidos jugador/compañero/rival |
| `src/shared/constants/partido.ts` | Create | Replay timing: DURACION_1T=120000, 2T=120000, AGREGADO=30000, PENAL_TIMEOUT_MS=8000, minutoAOffsetMs(m) |
| `src/shared/constants/pacing.ts` | Create | MS_REGEN_BARRA=10_800_000, ENERGIA_MAX/10, PARTIDO/3, ENTRENAMIENTO/2, DIAS_ENTRE_FIXTURES=2, MS_DIA, MAX_LIGA=24 |
| `src/domain/rules/energia.ts` | Modify | Import constants from pacing.ts (delete local literals) |
| `src/domain/rules/fixture.ts` | Modify | Deterministic 2-day `avanzar()` (no rnd); double round-robin + D7 truncation; import pacing constants |
| `src/domain/rules/temporada.ts` | Modify | Add `seleccionarCandidatos(clubes, prestigioActual): Club[]` (top 3 mejor, pure); keep hayOfertaMejorClub |
| `src/domain/interfaces/repositories.ts` | Modify | `PartidoRepository.guardarTimeline(id, json)`; `PlayerRepository.setPosicion(id, posicion)` |
| `src/data/repositories/partido-repository.ts` | Modify | guardarTimeline impl (`UPDATE partido SET eventos_json=?`) |
| `src/data/repositories/player-repository.ts` | Modify | setPosicion impl (`UPDATE player SET posicion=?`) |
| `src/services/partidoService.ts` | Modify | Split: iniciarPartido / finalizarPartido (extract from jugarPartido); resultadoDesdeLineaTiempo helper; simularTemporadaCompleta → simularPartido+finalizarPartido (headless, sin energía) |
| `src/services/seasonService.ts` | Modify | proponerCierre (trophies/convocatoria/candidatos/retiro/decisión) + finalizarCierre (persistencia actual, toma decisión {cambio\|quedarse}, llama setPosicion, regenera fixture) |
| `src/state/usePartidoEnCursoStore.ts` | Create | Sesión transitoria: partido, temporada, clubRival, jugador, lineaTiempo resuelta (useShallow) |
| `src/state/usePartidoVistaStore.ts` | Create | Banner: `bannerOculto` (manual dismiss, transitorio — reaparece al re-montar la app) |
| `src/state/useCierreStore.ts` | Modify | Añadir `propuesta: PropuestaCierre \| null` + `decision` pendiente |
| `src/presentation/components/organisms/formation-pitch.tsx` | Create | Atom reusable: modos `ver` (2 onces, rival flip y→1−y, jugador destacado) / `seleccionar` (slots tocables, highlight); Reanimated marcador |
| `src/presentation/components/molecules/match-alert-banner.tsx` | Create | Banner persistente (Reanimated entrada, sin auto-dismiss), CTA Jugar |
| `src/app/match.tsx` | Create | Overlay (fuera de (main), sin tabs): replayer + fases jugando/descanso/penal/final + scorecard (goles+minuto ambos equipos) + Continuar→finalizar+replace('/(main)') |
| `src/app/club-oferta.tsx` | Create | Overlay: 2-3 candidatos + Quedarme; accept→/elegir-posicion |
| `src/app/elegir-posicion.tsx` | Create | Overlay: FormationPitch seleccionar con formación del club aceptado (bloquea hasta elegir) |
| `src/app/(main)/index.tsx` | Modify | jugar()→iniciarPartido+store+push('/match'); cerrar()→proponerCierre y oferta; banner; useFocusEffect(cargar) |
| `src/app/(onboarding)/position.tsx` | Modify | PositionPitch local eliminada → FormationPitch (4-2-3-1) |
| `src/app/season-summary.tsx` | Modify | Card "Nueva oferta" → interactiva → /club-oferta; estado pendiente |
| `.expo/types/router.d.ts` | Regenerate | `npx expo customize tsconfig.json` tras crear /match (sin dev server; verificado en docs SDK 57) |

## Interfaces / Contracts

```ts
// formacion.ts
export type NombreFormacion = '4-3-3' | '4-4-2' | '4-2-3-1' | '5-3-2' | '3-5-2';
export interface SlotFormacion { posicion: Posicion; x: number; y: number } // y: 0=propio arco, 1=rival
export interface Formacion { nombre: NombreFormacion; slots: readonly SlotFormacion[] } // 11
export function formacionBaseDeClub(clubId: number): Formacion // FORMACIONES[hash(clubId) % 5]
export function posicionesDeFormacion(f: Formacion): Posicion[]

// partido.ts
export type TipoEvento = 'gol' | 'falta' | 'amarilla' | 'roja' | 'lesion' | 'penal';
export interface EventoTimeline {
  tipo: TipoEvento; minuto: number; equipo: 'nosotros' | 'rival';
  jugador: 'jugador' | null; descripcion: string;
  penal?: { interactivo: boolean; ladoArquero?: 'izquierda'|'centro'|'derecha';
            resultado?: 'gol'|'atajado'|'fallado' };
}
export interface ResultadoSimulacion { /* + */ lineaTiempo: EventoTimeline[] } // ordenada por minuto

// formation-pitch.tsx
type Props = { formacion: Formacion; rival?: Formacion | null; posicionJugador?: Posicion;
               seleccion?: Posicion | null; onSeleccionar?: (p: Posicion) => void } // 'seleccionar' si onSeleccionar

// seasonService.ts
export type DecisionCierre = { tipo: 'quedarse' } | { tipo: 'cambio'; clubId: number; posicion: Posicion };
export function proponerCierre(...): Promise<PropuestaCierre> // { trofeos, convocado, candidatos: Club[2-3], retiro, decision }
export function finalizarCierre(player, temporada, clubActual, pais, decision: DecisionCierre): Promise<ResultadoCierreTemporada>
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit (pure) | simularPartido timeline: orden por minuto, goles con scorer+minuto, ≤1 penal interactivo, keeper-side precomputada, misma entrada→misma salida (RNG inyectado) | seam `random?` + assertions manuales/futuro runner |
| Unit (pure) | formacionBaseDeClub estable, validarFormacion (11 slots, esPosicion), posicionesDeFormacion | directo |
| Unit (pure) | generarFixture: gaps exactos 2 días, determinismo, truncación >12 (N=16→24, N=20→24), doble RR ≤12 | directo |
| Unit (pure) | resultadoDesdeLineaTiempo; seleccionarCandidatos (3, prestigio>actual) | directo |
| Integration | finalizarPartido persiste resultado/stats/suspensión sin re-sim; setPosicion sobrevive reinicio | service + repo |
| E2E/manual | replay 0-90 + penal (gol/atajado/timeout) + scorecard + retorno a dashboard (nunca menu); banner; oferta→posición→fixture | Expo Go Android 15/16 (verificación final, sin runner) |

Verification gate: `npx tsc --noEmit` + `expo lint` (strict_tdd false).

## Threat Matrix

N/A — no routing/shell/subprocess/VCS-PR/executable-classification/process-integration boundary. (In-app expo-router navigation is UI, not a shell boundary; no new CLI surface beyond typedRoutes regeneration.)

## Migration / Rollout

No schema migration: `partido.eventos_json`, `player.posicion`, `club` untouched. Pacing constants affect only newly generated fixtures (spec R5). Rollback per slice: Slice 1 → restore inline simulate path; Slices 2-3 → flow/constants only. `simularTemporadaCompleta` (Copero) keeps working headless via simularPartido+finalizarPartido.

## 3-Slice Delivery Mapping (chained PRs)

Guard: `Decision needed before apply: Yes` · `Chained PRs recommended: Yes` · `400-line budget risk: High`

| Slice | PR | Units (files) | Est. Δ lines |
|-------|----|---------------|--------------|
| **1a** Dominio+datos | chained | formacion.ts, partido.ts, constants/partido.ts, repos (guardarTimeline), partidoService split, typedRoutes regen | ~400 |
| **1b** Matchday UI | chained | formation-pitch.tsx, match.tsx, usePartidoEnCursoStore, dashboard jugar→push + banner (banner + usePartidoVistaStore), onboarding position.tsx | ~550 → partido en 2 PRs: 1b-i pitch+onboarding (~200), 1b-ii match.tsx+banner+dashboard (~350) |
| **2** Club transfer | chained (base 1) | temporada.ts candidatos, seasonService split, setPosicion, club-oferta.tsx, elegir-posicion.tsx, useCierreStore, season-summary, dashboard cerrar | ~400 |
| **3** Pacing | chained (base 2) | pacing.ts, energia.ts, fixture.ts | ~120 |

Mitigation for 400-line exposure: Slice 1 split into 3 small chained PRs (dominio / pitch+onboarding / match+banner), each ≤ ~400 authored lines; Slices 2-3 small. Each PR has autonomous start/finish, verification (tsc+lint), and per-slice rollback.

## Open Questions

- [ ] Season length estimate at approved constants ≈ 6-7 real weeks (24 liga + copa/continental × 2 días), not 5-6 — calendar decision is user-approved (spec authoritative); flag for tuning (e.g. reducir continental a 1 partido) if 5-6 es hard target.
- [ ] MCO en carrera inicial: resuelto vía 4-2-3-1 (todas las posiciones); confirmar que al jugar con club 4-3-3 el jugador MCO cae al fallback MC en el once visual.
- [ ] `tieneOferta` para retiro: usar `candidatos.length>0` aunque el usuario decline (mismo comportamiento que hoy).
