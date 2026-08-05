# Safe Area Specification

## Purpose

Guards Android 15/16 edge-to-edge rendering so interactive controls (tab bar, footers, overlays) are never covered by the gesture bar, and softens the harsh `#2A2A2A` hairline that appears across the tab bar, footer, and cards. The JS entry of the tab bar auto-applies the bottom inset by default; the real risk lives in NativeTabs/custom tab bars and screens that do not use `ScreenContainer`.

## Requirements

### Requirement: Tab bar respects bottom inset

The tab bar MUST size and pad itself using `useSafeAreaInsets()` so on Android 15/16 edge-to-edge it clears the gesture bar. Because the JS `Tabs` entry already applies the bottom inset by default, the requirement SHALL apply to NativeTabs/custom tab bars and any manually positioned tab affordance.

#### Scenario: Gesture bar does not obscure the tab bar

- GIVEN a device with edge-to-edge rendering and a gesture bar
- WHEN the app renders with a custom/NativeTabs-style tab bar
- THEN the tab bar SHALL be positioned above the bottom inset so no interactive item is covered

### Requirement: Non-ScreenContainer screens audited

Screens that do not use `ScreenContainer` (e.g. the match screen, the root `index`, and overlays with manual positioning) SHALL apply `SafeAreaView` with correct edges or `useSafeAreaInsets()` rather than fixed paddings.

#### Scenario: Match screen respects safe insets

- GIVEN the match screen renders without `ScreenContainer`
- WHEN it lays out interactive controls
- THEN it SHALL offset them by the safe-area insets instead of fixed padding

#### Scenario: Overlays clear the inset

- GIVEN an overlay with manual positioning
- WHEN it renders near the bottom of the screen
- THEN its controls SHALL remain above the bottom safe-area inset

### Requirement: Softened hairline

The border token used for hairlines SHALL be softened from `#2A2A2A` to a subtler value (e.g. `rgba(255,255,255,0.06)`), or the solid `borderTopWidth` on the footer/tab bar SHALL be replaced by a soft shadow (low elevation/shadow opacity).

#### Scenario: Hairline renders subtly

- GIVEN the tab bar, footer, or a card renders its hairline
- WHEN the border token is applied
- THEN it SHALL use the softened value rather than the solid `#2A2A2A`

#### Scenario: Border token change is centralized

- GIVEN a single border token source in the theme
- WHEN the hairline value changes
- THEN all consumers of the token SHALL reflect the change without per-screen edits