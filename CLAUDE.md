# Tidepool: notes for Claude

`PLAN.md` is the source of truth for design and behavior. Mockup screenshots are in `design/`.
This file records progress and decisions made during the build so a new session can pick up cleanly.

## Status

| Phase | State |
| --- | --- |
| 1. Foundation (Vite, PWA, theme, settings, deploy) | Done |
| 2. Art (creatures, cards, backs, `#/gallery`) | Done |
| 3. Home, Settings, sky | Done |
| 4. Sound | Done |
| 5. Solitaire rules | Done |
| 6. Solitaire screen | Done |
| 7. Speed | Done |
| 8. Polish pass (PLAN.md checklist) | Done, waiting for the owner's on-phone check |
| 9. Tide Pairs | Not started; do this next (planned in PLAN.md "Game 3") |
| 10–11. Blackjack rules, then screen | Not started (planned in PLAN.md "Game 4") |

Work one phase at a time and stop after each so the owner can check it on their phone.

## Owner and device

- One user, called "Night" in the app. Uses an Android phone (Nothing Phone) with Chrome, not an iPhone,
  and works entirely from the phone, so give step-by-step instructions and keep jargon out.
- Live app: https://dnpart.github.io/tidepool/ (installed from Chrome). After a deploy, the app updates
  when it is closed and reopened (sometimes twice).

## Workflow

- Commit straight to `main`; every push runs `.github/workflows/deploy.yml` (test, build, deploy to Pages).
- Before pushing: `npm test` and `npm run build` (the build also type-checks).
- Speed in Playwright: `page.clock.install()` lets time flow in real time unless you also `pauseAt`, so the
  octopus can change a pile mid-drag; a frozen clock also freezes CSS animations in screenshots.
- Check UI changes in Playwright (preinstalled in cloud sessions) at phone size, e.g. `npx vite preview --port 4173`
  then screenshot `http://localhost:4173/tidepool/#/...`. Tests that seed `localStorage` must navigate away
  from a game screen first, or the open game saves over the seeded data when it unmounts.
- The `#/gallery` page shows every character, card and back, plus a sound board.
- Accessibility audit: `npm i --no-save axe-core`, inject `node_modules/axe-core/axe.min.js` with Playwright and run
  `axe.run` on each screen, with default settings and with Coral Reef dark + XL + high contrast.

## Decisions that differ from or add to PLAN.md

- Face-card creatures are 58px (plan says 62) so manta wingtips keep clear of the frame, matching the mockup.
- Card backs below 80px wide drop the 3×4 creature grid (it turns to mush) and show border plus sparkle
  (Starry sea) or the sleepy octopus (Night tide).
- Foundation slots are fixed per suit in the order hearts, diamonds, spades, clubs, so empty slots can show
  a faint suit outline.
- Solitaire: a single tap already tries foundations first, so there is no separate double-tap action.
  Tapping a foundation card does nothing (drag to bring one back down) to avoid accidental pulls.
- Auto finish always draws one card at a time, even on Draw 3, so it cannot loop forever.
- Whoosh and card-flip gains were raised so all sounds have similar loudness; every sound is under 0.4s.
- A global click handler (`sound/useTapSounds.ts`) bloops on buttons, links, switches and radios.
  Elements with `data-silent` play their own sound instead.
- A dark-mode card shadow uses black instead of the pale ink color.
- Speed opens with a "Ready for a race?" card and Start button, so the octopus doesn't start before you look.
  It also pauses itself when the menu is open or the app goes to the background.
- Speed's "you were faster" sound plays when your card takes the pile the octopus had planned to play on;
  otherwise your plays use the land sound. The octopus's plays make a soft flip tick.
- Speed deadlock (not in the plan): if a stalemate has nothing to recycle, each draw pile gives its top card to
  a center pile; if that is impossible too, whoever has fewer cards left wins, and you win a tie.
- Speed games are not saved mid-race (they are real time); only the pace is saved, in `tidepool.speed`.
- Speed uses the same dark table color as Solitaire (#0D1A2B) in every dark palette.
- Contrast fixes from the polish pass: red rank text uses `--rank-hearts` / `--rank-diamonds` (darker than the
  symbol colors, darker still with high contrast), and high contrast in light mode darkens the accent.
  `theme/tokens.test.ts` checks every combination; keep it passing when touching colors.
- `data-reduce-motion` on `<html>` reflects the setting or the phone's preference. The theme-color meta follows `bg`.
- Speed's table is `inert` while dimmed (paused or menu open). Game screens use `<main>` as their root.

## Game ideas the owner turned down

Golf, Pyramid, TriPeaks, FreeCell, Crazy Eights, Drift (a no-goal toy) and a manta breathing guide were offered
and declined; Spider, War and Go Fish were advised against. Don't re-pitch them unless asked.

## Open decisions from PLAN.md (still at defaults)

Jacks have no accessory; card back picker is in Settings; Speed opponent is the octopus;
Solitaire moves and time are off by default but available in the game menu.
