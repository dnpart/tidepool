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
| 8. Polish pass (PLAN.md checklist) | Done |
| 9. Tide Pairs | Done |
| 10. Blackjack rules | Done (`games/blackjack/rules.ts`, `storage.ts`, tests) |
| 11. Blackjack screen | Done (owner checked it on the phone) |
| 12. Winter palette and snow | Done (owner checked it on the phone) |
| 13. Fox + Owl art | Done (owner approved the three composed characters) |
| 14. Fox + Owl cards and the Deck setting | Done (owner checked it on the phone) |
| 15. The deck runs the games | Done (owner checked it on the phone) |
| 16. Card backs follow the palette | Done (owner checked it on the phone) |
| 17. Honeycomb and Forest palettes and skies | Done (owner checked it on the phone) |
| 18. Bee, sloth, toadstool and luna moth art | Done (owner checked it on the phone) |
| 19. The two new decks and the Deck setting | Done, waiting for the owner's check |
| 20. The new decks run the games | Not started |
| 21. Card backs for every palette | Not started |

Phases 17–21 come from the PLAN.md section "Honeycomb and Forest palettes, Bee + Sloth and Mushroom + Moth decks".
The bee, sloth, toadstool and luna moth art and the 14 new card backs come from `design/garden-mockup/art.js` and
`backs.js` (Claude's mockup, approved by the owner); port them exactly.
Phases 12–16 come from the PLAN.md section "Winter palette and the Fox + Owl deck" (16: "Card backs follow the palette"). The fox and owl art comes only
from `design/fox-owl-deck.svg` (the owner's Illustrator file); never redraw it by hand.

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
- Tide Pairs cards always use the compact layout (`<Card compact>`: index plus one big creature), since the
  creature is what you remember; matched cards switch to happy eyes (`<Card eyes>`).
- Tide Pairs board size: picking a size before the first flip redeals at once; mid-game it applies to the next
  game. A pending miss isn't saved, so those two cards come back face down after a restart.
- Playwright `addInitScript` reruns on every reload, so seed settings there only once per test.
- Blackjack rules details not spelled out in the plan: your hand stops automatically at 21; if every hand busts
  the dealer only turns the hole card; only identical ranks split (K and Q don't); a split Ace + 10 is 21, not
  blackjack; a blackjack counts as a win in the tally; if the shoe ever empties mid-round, the cards not on the
  table are reshuffled. Hints follow basic strategy for "dealer stands on soft 17, no doubling".
- The Blackjack screen drives the dealer with `dealerStep` (one card per 500ms), not `playDealer`, so draws can be seen.
- Blackjack screen: the first button says "Deal", then "Next hand". New shoe keeps the tally and needs a second
  tap mid-hand. A loss without a bust and a push are silent; a bust plays the gentle double low note.
  Before the hole card turns, the dealer's label reads "Showing 9" (or "Showing an Ace").
- Winter: `skyFor(palette, mode)` in `theme/tokens.ts` picks the sky; Winter has separate light and dark snow layers
  (different counts and flake styles) that crossfade like clouds and stars. Flakes fall to `100vh + 36px`, so the snow
  covers any phone height. The Winter palette tile's third swatch is the dark accent (#8CC3EC), not `octo`.
- Fox + Owl art: `npm run art` (`scripts/fox-owl-art.mjs`) turns `design/fox-owl-deck.svg` into `src/art/foxOwlArt.ts`,
  keeping every Illustrator path as drawn, with one transform per cell; `FoxOwl.test.ts` fails if the two drift apart.
  `<FoxOwl kind suit eyes hat wave badge bowtie>` mirrors `<Creature>`; `recipeFor` in `art/FoxOwl.tsx` holds the cast
  table (which cell, borrowed Eyes layer or shared eye arcs, ear and owl recolors, bow tie color). Borrowed Eyes layers
  are shifted by the difference between cell origins, so they land where they sat in their own cell.
- The three composed characters are a third row in the SVG (Jack fox, King fox, Queen owl), built from the owner's
  layers: the Queen fox without crown and lashes plus the Jack owl's bow tie (5.6 units lower, under the chin) or the
  King owl's crown (4.5 lower) and mustache (6 lower, mouth removed); the Spades owl plus the Queen fox's crown
  (4.5 higher, behind the tufts like the King's) and lashes (0.8 higher, since owl eyes sit 0.8 above fox eyes).
- Decks: `decks/decks.ts` holds each deck's card colors (`DECKS.sea`, `DECKS.arctic`); `SUIT_STYLE` in `cards/deck.ts`
  is the sea deck plus teams, kept for the sea-only places. `Card` and `CardBack` read the deck from Settings
  (`useDeck()`), or take a `deck` prop. Rank text uses `--rank-<deck>-<suit>`, set by ThemeProvider for both decks and
  both contrast levels (this replaced `--rank-hearts` / `--rank-diamonds` in global.css).
- The deck runs the games: `<DeckCreature sea={...} arctic={...}>` draws whichever matches the chosen deck (with
  `arcticSize` / `arcticStyle` where the mockup differs), and `DECKS[deck].names` supplies the wording ("the fox",
  "the King owl", "snow friends"). Game descriptions in `games/registry.ts` are functions of the deck. The Fox + Owl
  game icons crop the real Hearts fox drawing to its head (`FoxHeadAt`); Speed's second card is the owl from the mockup.
- Speed with Fox + Owl: the Diamonds fox (open eyes when it plays, happy otherwise), the waving fox on the start and end
  cards (happy eyes when you win), and a sleepy Diamonds fox when paused.
- axe's `label-content-name-mismatch` flags face-down Tide Pairs tiles because the turned-away front still holds the
  rank text; it happens with both decks and is a false positive (the tile's label is what screen readers use).
- Card backs follow the palette and deck (`CARD_BACKS` in `decks/decks.ts`, `useCardBack()`); there is no Card back
  setting any more and `cardBack` left the saved settings. `<CardBack>` picks its own back unless given `back`. The four
  new backs (Coral garden, Northern lights, Winter knit, Snowfall) are ported from the approved canvas board with the
  same numbers; the aurora's blur filter id is derived from the card's clip id so every card gets its own.
- Palette ids `honeycomb` and `forest`. Their sky colors are tokens (`comb`, `honey`, `pollen`, `firefly`; null elsewhere), and
  `skyFor` returns `comb`, `leaves` or `fireflies`. Until phase 21 the old decks borrow their Lagoon back in both new palettes,
  so the gallery lists each back once.
- Bee, sloth, toadstool and luna moth: `<Garden kind suit eyes hat wave badge badgeColor bowtie grass>` in `art/Garden.tsx`
  mirrors `<FoxOwl>`. `Garden.test.tsx` runs `design/garden-mockup/art.js` and checks every pose matches it element by element,
  so change the art in both places (or the master first). The lashes' extra `stroke-width="1.3"` was dropped from the master,
  since the browser always used the first (1.6).
- Deck ids `honey` (Bee + Sloth) and `woodland` (Mushroom + Moth). `GARDEN_CAST` / `isGardenDeck` in `decks/decks.ts` pick the
  species per team, and `Card` draws them with `<GardenAt>`. `SuitColors.faceInk` (moth royals only) recolors the face
  card's rank and suits; the contrast test checks it on the tint. Until phase 20 the games still show the octopus with these
  decks (`DeckCreature` and the game icons only know sea and arctic), though the wording already says bee or moth; until
  phase 21 the new decks borrow the Octo + Manta backs.
- Blackjack card ids in saved data are rank numbers plus suit letter ("13d", not "Kd"); a save with a bad id is
  discarded and a fresh shoe starts.

## Game ideas the owner turned down

Golf, Pyramid, TriPeaks, FreeCell, Crazy Eights, Drift (a no-goal toy) and a manta breathing guide were offered
and declined; Spider, War and Go Fish were advised against. Don't re-pitch them unless asked.

## Open decisions from PLAN.md (still at defaults)

Card backs follow the palette and deck (no picker); the Speed opponent is the deck's (octopus or Diamonds fox);
Solitaire moves and time are off by default but available in the game menu.
Decided: the Blackjack dealer is the King manta (theme `manta` color, king crown), or the King owl with Fox + Owl; it bobs instead of waving.
Decided: Jacks wear a bow tie in their suit symbol color (`Creature` `bowtie` prop, set in `Card.tsx` creatureFor).
