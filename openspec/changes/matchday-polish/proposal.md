# Proposal: matchday-polish

## Intent

Five post-`gameplay-overhaul` fixes: (0) stats stale after a match (`continuar()` never `setTemporadaActiva`); (1) shallow 3-direction penalty, no interactive free-kick, legacy `/penalty` plane running in parallel; (2) leaving mid-match voids game but keeps energy cost; (3) monochrome theme, no per-club identity (`accent:'#FFFFFF'`); (4) Android 15/16 tabs/footers crowding gesture bar + harsh hairline.

## Scope

### In Scope (5 slices, stacked-to-main)
1. **Live stats**: `finalizarPartido` returns fresh temporada; `continuar()` adds `setTemporadaActiva`. Career club card = Option A (settled `historial_carrera` + in-flight `temporadaActiva` when `anioFin === null`).
2. **Paused match**: `partido.checkpoint_fase` via migration 003; resume banner ("Reanudar"/"Comenzar 2º Tiempo"); no energy re-charge; unpursued fixtures auto-resolve 3–0.
3. **Interactive situations**: `SituacionInteractiva` (6-zone grid, `gol|atajado|palo|afuera`); interactive free-kick (barrier chance); `ShotTargetGrid`; ≤2 situations/match; retire legacy `/penalty` narrative flow.
4. **Safe area**: tab-bar insets; audit non-`ScreenContainer` screens; soften hairline.
5. **Club identity**: `club-colors.ts` (seed-coherent, seed untouched); dynamic accent (white fallback); procedural SVG crest; semantics fixed.

### Out of Scope
- Real club images/IP; system notifications; `simularPartido` rework beyond FK.

## Capabilities

### New
`live-stats` · `paused-match` · `interactive-situations` (supersedes 3-direction prompt) · `club-identity` · `safe-area`

### Modified
- `matchday-experience`: resume banner + post-match stat sync
- `penalty-minigame`: 6-zone grid replaces 3-direction prompt; legacy flow retired

## Approach

Extend pure resolvers (`resolverPenalConEleccion`, new `resolverTiroLibreConEleccion`), honoring never re-simulate (penalty R2). Checkpoint writes/clears in `match.tsx`; resume rebuilds `PartidoEnCurso` from persisted `eventos_json`. `club-colors`/`club-crest` extend the `national-colors` pattern. One chained PR per slice.

## Affected Areas

| Area | Impact | Change |
|---|---|---|
| `partidoService.ts` | Modified | Fresh temporada; checkpoints; auto-resolve 3–0 |
| `app/match.tsx` | Modified | `setTemporadaActiva`; checkpoints; `ShotTargetGrid`; accent |
| `(main)/index.tsx` | Modified | Resume banner; crest; insets |
| `career.tsx`, `profile.tsx` | Modified | Live stats + refetch |
| `domain/rules/partido.ts` | Modified | `SituacionInteractiva`, FK, ≤2 situations |
| `eventos.ts`, `event.tsx`, `penalty.tsx`, `eventService.ts` | Removed | Legacy penal teardown |
| migration 003 + `partido-repository.ts` | New/Mod | `checkpoint_fase`, `guardarCheckpoint`, `findPartidoEnCurso` |
| `club-colors.ts`, `club-crest.tsx`, `shot-target-grid.tsx` | New | Colors, crest, grid |
| `tokens.ts`, `_layout.tsx`, `screen-container.tsx` | Modified | Accent, hairline, insets |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| `resultadoDesdeLineaTiempo` breaks on generalized `PenalTimeline` | High | Audit `tipo==='penal'` filters; keep shape; determinism tests |
| Dangling `resolverPenal` after teardown | Med | `grep` first; confirm routes |
| Dynamic accent breaks contrast | Med | Review all `accent` reads; semantics fixed |
| Migration/checkpoint corrupts games | Med | Nullable column; fallback null; reversible |
| 400-line budget exceeded (F3/F1) | High | Split slices; per-PR ~400 |

## Rollback Plan

Per-slice revert to `main`. Slice 2: drop migration 003 (nullable additive) + reverse checkpoint writes — no data loss, `eventos_json` intact. Slices 1/3/4/5: code/constants only. Legacy teardown Git-recoverable.

## Dependencies

- `gameplay-overhaul` as base.
- Expo SDK 57 / RN 0.86.2; verify edge-to-edge APIs against v57 docs.

## Success Criteria

- [ ] Post-match stats fresh across profile/career/dashboard; career shows live numbers.
- [ ] Resume banner after mid-match exit; both resume points work; energy not re-charged; unpursued fixture resolves 3–0.
- [ ] 6-zone penalty + interactive FK with barrier; ≤2 situations/match; deterministic timeline.
- [ ] Legacy `/penalty` fully gone; `grep -r penalty src/app` clean.
- [ ] Accent + crest render everywhere; semantics unchanged.
- [ ] No button covered by gesture bar; hairline softened.
- [ ] `npx tsc --noEmit` + `npx expo lint` clean; Expo Go Android 15/16 visual check passes.