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
| 19. The two new decks and the Deck setting | Done (owner checked it on the phone) |
| 20. The new decks run the games | Done (owner checked it on the phone) |
| 21. Card backs for every palette | Done (owner checked it on the phone) |
| 22. Cat art | Done (owner checked it on the phone) |
| 23. The Cats deck runs everything | Done (owner checked it on the phone) |
| 24. Cat card backs | Done (owner checked it on the phone) |
| 25. Dominoes rules | Done (`games/dominoes/rules.ts`, `storage.ts`, tests) |
| 26. Dominoes screen | Done (owner checked it on the phone) |
| 27. Pond Hop rules | Done (`games/pondhop/rules.ts`, `storage.ts`, tests) |
| 28. Pond Hop screen | Done (owner checked it on the phone) |
| 29. Two phones: connection test (`#/together`) | Done (works between two phones in Chrome; fails in Brave) |
| 30. Fishy rules | Done (`games/fishy/rules.ts`, `storage.ts`, tests) |
| 31. Fishy screen | Built; the owner checked it, testers' feedback pending (calls may be too sharp) |
| 32. Bubble Pals rules | Done (`games/bubblepals/rules.ts`, `ai.ts`, `storage.ts`, tests) |
| 33. Bubble Pals screen, Solo | Done (owner: "It plays really well") |
| 34. Bubble Pals Versus | Built; waiting for the owner to check it on the phone |
| 35. Coral Stack rules | Done (`games/coralstack/rules.ts`, `storage.ts`, tests) |
| 36. Coral Stack screen | Built, then Versus swapped for Levels at the owner's request, then shapes and colors that unlock by level (Nov 7); waiting for the owner to check it |
| 37. Tide Swap rules | Done (`games/tideswap/rules.ts`, `ai.ts`, `storage.ts`, tests) |
| 38. Tide Swap screen | Built, then reworked at the owner's requests (flick down to drop, drag to swap, Next boxes, whole-column swaps, Solo pearl levels); waiting for the owner to check it |
| 39. Fishy on two phones | Next after checkers and chess |
| 40. Checkers rules | Done (`games/checkers/rules.ts`, `ai.ts`, `storage.ts`, tests) |
| 41. Checkers screen | Built; waiting for the owner to check it on the phone |

Phases 25–28 come from the PLAN.md sections "Game 5: Dominoes" and "Game 6: Pond Hop" (mockups `design/dominoes.png`,
`design/pond-hop.png`). Pond Hop is our own game in the Aggravation family, not a copy of Aggravation: keep its own board,
name and lily pad hops.
Phases 22–24 come from the PLAN.md section "Cats deck"; the cats and their backs come from `design/garden-mockup/cats.js`.
Phases 17–21 come from the PLAN.md section "Honeycomb and Forest palettes, Bee + Sloth and Mushroom + Moth decks".
The bee, sloth, toadstool and luna moth art and the 14 new card backs come from `design/garden-mockup/art.js` and
`backs.js` (Claude's mockup, approved by the owner); port them exactly.
Phases 12–16 come from the PLAN.md section "Winter palette and the Fox + Owl deck" (16: "Card backs follow the palette"). The fox and owl art comes only
from the owner's drawings: since Nov 5 their redrawn `design/art-export/02-characters-fox-owl.svg` (see Decisions);
`design/fox-owl-deck.svg` was the first version. Never redraw it by hand.

Phase 29 onward comes from the PLAN.md section "Playing together on two phones". The version from before that work is
commit `a977a86` in `main`'s history (it was also the branch `before-multiplayer`). Push to `main` and nowhere else.
As of Nov 2, GitHub still lists `before-multiplayer` and `claude/phone-app-setup-l9gxns` (old copies; never push to them).
A cloud session may be told to work on its own `ccr-…` branch and its stop hook may complain about "unpushed commits"
there: the owner wants everything on `main` (as decided in that session), so commit and push to `main` and ignore the
hook; the owner asked that the side copy be deleted (the environment blocked Claude from doing it).

Work one phase at a time and stop after each so the owner can check it on their phone.

Pond Hop's ponds and the Koi Garden palette (Nov 4, below under Decisions) are built after three rounds of mockups
(`design/pond-palettes/`: `full-ponds`, `shore-ponds`, `koi-ponds`; the owner chose round three); waiting for the owner
to check them on the phone, and for their redraw of `design/art-export/09-pond-hop-ponds.svg`.

Art export (Nov 2): the owner wants no AI art in a public release and will redraw it by hand. `design/art-export/` holds
eight SVGs for Illustrator (characters per deck, card backs, game icons, pieces/ponds/sky/app icon), each piece a named
group in a dashed frame, plus `README.md` (instructions for the owner) and `manifest.json` (frame, scale and source
file per piece). Made by `npm run art:export` from the hidden page `#/art` (`src/screens/ArtSheet.tsx`, lazy-loaded),
which the script opens once per deck; colors are resolved to hex with opacity (Illustrator reads rgba as black),
nested svgs become clipped groups, repeats are merged ("also:"). The owner redrew file 01 (Octo + Manta, all 24 cells),
file 02 (Fox + Owl, all 28 cells, Nov 5) and file 08 (pieces, sky; see Decisions), all in the app; files 03 to 07 are still to come, plus file 09, the new
ponds (made after the redesign; the ponds in file 08 are out of date), and file 10, Koi Garden's art (its five backs,
the three koi, the petal and the lantern, all from `art/KoiGarden.tsx` and `cards/KoiBacks.tsx`). Since Nov 4, `npm run art:export -- --only <file>`
writes one file and keeps every other file's manifest entries as they were, and the owner's files (`OWNER_FILES`)
always keep theirs, since the imports map the owner's drawings by those frames: re-exporting all files would shift
the frames of files the owner may be redrawing (e.g. Koi Garden added backs to 06 and a pond to 08's layout). Bring each back the same way (keep
paths as drawn, one transform per cell), add the file to `OWNER_FILES` in `export-art.mjs` so the export never writes
over it, and check every screen it's on.

Next up: checkers, then chess (PLAN.md "Games 8 and 9: Checkers and Chess", phases 40–43; the owner asked on Nov 5).
The owner picked the pieces from the mockup `design/chess-checkers/pieces.html` (built by `node
design/chess-checkers/build.mjs`, published as an artifact): Tokens with their King's crown for checkers. For chess they
then asked for a set per deck, the characters as little statues: `art/ChessStatue.tsx` (each character's own drawing
turned to one tone per side by lightness, `stoneColor`, with an outline copy behind; headgear placed over each
species' measured crown spot, `CROWN`), mockup `design/chess-statues/statues.html`, and file 11 of the art export
(`11-chess-pieces.svg`, section "Chess pieces" in ArtSheet) for the owner to redraw; add it to `OWNER_FILES` and import
it like files 01 and 02 when it comes back. Then phase 39, Fishy on two phones, and after it checkers and
chess on two phones (the owner wants that too). The owner hasn't reported on Bubble Pals Versus (phase 34) or the Coral Stack changes yet either; fix
what they find when they do. The owner asked for three falling-block games (Bubble Pals, Coral
Stack, Tide Swap; PLAN.md "Falling-block games", phases 32–38) before Fishy on two phones, which is now phase 39.
Testers' feedback on Fishy (phase 31), especially whether fibs get caught too often, is still to come; fix what they find. All multiplayer decisions are in PLAN.md "Playing together on two phones"; Speed with a friend is planned there but
postponed, and Beggar-My-Neighbour was dropped (no decisions).

The "More games will live here" row left Home with phase 28, as the owner asked (`PlusIcon` went with it; the `dash`
token stays, still tested).

## Owner and device

- The owner goes by "Night" in the app; testers use it too, and see "Hi, friend" until they set a name (see "Testers" below). The owner uses an Android phone (Nothing Phone) with Chrome, not an iPhone,
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
- Solitaire and Dominoes never place a card or tile by themselves (the owner asked for this after phase 28): you drag it,
  or tap it to pick it up and then tap where it goes. Solitaire's `tapOnCard` / `tapOnPile` in `rules.ts` decide what a
  tap does (pick up, move, put down, pick up another card instead, or a shake); empty piles become buttons while cards
  are picked up, and any change to the game puts picked-up cards down. Tapping a foundation card with nothing picked up
  still does nothing (drag to bring one back down). `autoMoveTarget` is only used by the hint now.
- Solitaire's `.table` has `isolation: isolate`: cards use z-indexes up to 2000+ (dragging), and without it they drew over
  the game menu (a tester hit this). Any new table with z-indexed cards needs the same.
- Auto finish always draws one card at a time, even on Draw 3, so it cannot loop forever.
- Whoosh and card-flip gains were raised so all sounds have similar loudness; every sound is under 0.4s.
- A global click handler (`sound/useTapSounds.ts`) bloops on buttons, links, switches and radios.
  Elements with `data-silent` play their own sound instead.
  It also wakes the AudioContext on every pointerdown, pointerup, touchend and keydown (not just the first), and
  `unlockAudio` resumes any state but 'running' (iPhones use 'interrupted' after a call or the background) and replaces a
  closed context. Added after a tester said sounds didn't work (Nov 2): all 14 played fine in Chrome, so the cause was
  likely on their phone. An iPhone on silent mutes web audio entirely; we leave that as is (forcing playback would
  stop the person's music).
- A dark-mode card shadow uses black instead of the pale ink color.
- Speed opens with a "Ready for a race?" card and Start button, so the octopus doesn't start before you look.
  It also pauses itself when the menu is open or the app goes to the background.
- Speed's "you were faster" sound plays when your card takes the pile the octopus had planned to play on;
  otherwise your plays use the land sound. The octopus's plays make a soft flip tick.
- Speed deadlock (not in the plan): if a stalemate has nothing to recycle, each draw pile gives its top card to
  a center pile; if that is impossible too, whoever has fewer cards left wins, and you win a tie.
- Speed games are not saved mid-race (they are real time); only the pace is saved, in `tidepool.speed`.
- Card tables (Solitaire, Speed, Tide Pairs, Blackjack, Dominoes) use the palette's `bg` in dark mode (Lagoon's is
  #0D1A2B). They used to be that navy in every palette; the owner noticed Solitaire didn't follow the palette (Nov 2).
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
- Octopus and manta (Nov 2): drawn from the owner's redrawn `design/art-export/01-characters-octo-manta.svg`, imported
  by `npm run art:octo` (`scripts/octo-manta-art.mjs`, uses Playwright's Chromium for shape boxes) into
  `src/art/octoMantaArt.ts`: every path as drawn, one transform per cell (frame 256 × 272 at 4 units per viewBox unit),
  each shape tagged `body`, `eyes` (eyes, highlights, lashes, brows), `cheeks` (white, suit-shaped) or `crown` (the gold
  crown and what's inside it), plus the Hearts→Diamonds and Spades→Clubs body recolors. `recipeFor` in `Creature.tsx`
  picks the cell (Ace / number / Jack / Queen / King by suit, Waving, Sleepy, Sleepy_manta), the suit from the nearest
  body color (`color` no longer tints freely: #F4A6BE draws Hearts pink, the dark theme's manta draws Spades), borrows
  other eyes from the cell that has them, the suit's cheeks when a pose is recolored, and the Queen or King crown for the
  waving octopus. Card characters use their own cell untouched (tested). `badge`, `badgeColor`, `jewel` and the bow
  tie's color are kept as props but the art decides (the owner's Aces have no badge). `creatureBounds` replaced the
  fixed octopus/manta numbers in `contentBounds`. The PLAN.md "Characters" shapes are gone. The owner's Aces have no
  suit badge on purpose (Nov 2). The game icons still use the old octopus until the owner redraws file 07.
- Illustrator's Save As SVG writes some smooth points with the "s" shorthand even when the two handles differ in
  length, so browsers draw those curves wrong (a sharp point on the Hearts King's tentacle tip; kinks in the happy eyes,
  hooks on the manta's stripes and wingtips), though Illustrator shows them right. `scripts/repair-smooth-curves.mjs`
  runs inside `art:octo` (and should in every future import): for each "s" curve it finds the same shape in another
  cell (the owner copies bodies between cells) and takes that copy's written-out handle when it points the same way but
  differs in length. ~240 handles repaired in file 01; shapes drawn only once can't be repaired this way (none looked
  wrong). Use it for files 02–08 too.
- App icon (Nov 2, the owner asked): `npm run art:icon` (`scripts/app-icon.mjs`, Node's strip-types) draws the owner's
  happy Hearts octopus (number cards cell) on Lagoon's light background into `public/icon.svg` and the three PNGs
  (512 is also the maskable one; the octopus stays inside the middle 80%).
- Game and sky pieces (Nov 4): the owner's file 08 is imported by `npm run art:pieces` (`scripts/pieces-art.mjs`) into
  `src/art/piecesArt.ts` (every shape as drawn, one transform per piece from the manifest's frame, viewBox and scale,
  gradients kept) and drawn with `<ArtPiece id recolor>` (`art/Piece.tsx`), which gives each drawing its own gradient
  ids. In use: the nine `Friend` kinds (the owner's friends now have little faces, by their choice), Coral Stack's
  `Block`, Pond Hop's `Marble`, the sky's `Cloud` (the owner's gradient; it no longer takes a color), `Crystal`
  (recolored from #8fb2d0 to the theme's crystal color; its strokeWidth prop does nothing now) and the falling leaf
  (recolored per leaf). `FriendDefs` is gone. The owner joined the clubs into one shape (so outlines like Solitaire's empty
  foundation don't cross inside); it lost its group id and sits loose in `Game_pieces_Suit_symbols`, and was missed at
  first ("unchanged"), then copied into `SUIT_PATHS.clubs` by hand on Nov 5 (scaled from its frame into 24 × 24).
  The other three suits really are unchanged. Not imported: the ponds: the owner
  touched up the track's lily pads and asked for mockups of ponds that fill the whole circle before anything changes
  (`design/pond-palettes/full-ponds.html`). The ponds in file 08 came back with black holes and corners (Illustrator
  dropped their fill-opacity); don't import them as they are.
- Pond Hop's ponds (Nov 4, round three of the mockups): `Pond.tsx` draws the water to radius 126 (`POND`), one rock per
  track hole as its edge (`Stone`, shaped by a steady hash of the hole: sandy, snow-capped, mossy, river stones; wax
  comb cells round the honey), a pier per home lane from radius 50 to 118 (boards, snowy boardwalk, log, comb strip,
  or for koi pale boards between red rails), the owner's four lily pads (`lilyPads` piece, from their file 08 ponds) and
  the water's own marks (ripples, leaves, koi, cracks and glints, honey shine). `POND_LOOK` in `board.ts` replaced
  `ICE`/`FOREST`/`HONEY`. The middle is open water; the old center lily pad, the snow and the comb ring are gone. Hop
  marks: ripples now on Lagoon's water and the koi pond too (three rings spread across the whole hop), skate mark on
  ice, honey trail. Koi hops splash. Home spots on the piers are drawn at 0.85 opacity so they show on wood.
- Koi Garden palette (`koi`, Nov 4, made with the Cats deck in mind but works with every deck): stone and moss greens,
  accent #B8432C light / #F39A7C dark (brightened from the mockup's #F08C6C to pass 7:1 in high contrast dark), high
  contrast ink #0D201E, accent #8E3220. Sky `petals` by day (16 cherry petals, `makePetals`, falling like leaves) and
  `lanterns` by night (7 paper lanterns drifting up and glowing, `makeLanterns`), tokens `petal` and `lantern` (null
  elsewhere). Card backs in `cards/KoiBacks.tsx` (`KOI_BACKS`, outside PALETTE_BACKS so the backs.js master test doesn't
  apply): one koi pond scene with each deck's friend on a rock (octopus, fox, sloth, toadstool; the calico for Cats,
  named "Koi watch"; the others "Koi garden"). Its pond is `koi`. Home's first tip announces it with the three falling-block games. The koi, petal and lantern
  are shared drawings in `art/KoiGarden.tsx` (`KoiFish` kinds kohaku, orange, shiro; `Petal`; `Lantern`, an svg now,
  not a CSS shape, so it can be exported and redrawn); 11 lanterns, since most sit behind the cards.
- The koi swim in Pond Hop's koi pond (Nov 5, the owner asked). `games/pondhop/koiSwim.ts` steps them (`restingKoi`, the
  still picture's spots, then `swim`): each wanders on its own slow turns and speed (about 10–17 units a second, at most
  1.3 radians a second of turning), steers back past radius 72, never goes past 98 (`SWIM_MAX`, clear of the rocks), and
  edges away from a koi within 34. `KoiSchool` in `Pond.tsx` runs it at about 30 frames a second, writing transforms
  straight to the svg (not through React); they pass under the bridges and lily pads. The tail sways about its root
  (-15, 0): `KoiFish` takes `tailRef` and then puts the tail in its own group (the card backs and art sheet don't, so
  they're unchanged). `Board`'s `swim` prop is `!reduced`; with Reduce motion the koi rest. When the owner redraws the
  koi (file 10), the tail must stay its own shape, rooted at the body's back end, so it can keep swaying.
- Bubble Pals' junk is pebbles, not clams (Nov 4, the owner's call: in Tide Swap clams are the reward, so the same word
  meant opposite things). Renamed all the way through Bubble Pals (cell `'pebble'`, `pebbles` in events, "3 pebbles
  coming", rules text) and its PLAN.md section; the `clam` Friend kind is gone. Tide Swap keeps its clams and pebbles.
- Fox + Owl art (Nov 5): the owner redrew file 02, all 28 cells, imported by `npm run art:fox` (`scripts/fox-owl-art.mjs`,
  like `art:octo`: Playwright's Chromium for boxes, `repair-smooth-curves` first, 71 handles repaired) into
  `src/art/foxOwlArt.ts`: every shape as drawn, one transform per cell (the manifest's frame, 4 units per viewBox unit),
  each tagged `eyes` (the dark shapes to one side of the character's middle in the eye band, plus anything inside one:
  irises, highlights, lashes, closed or happy lines) or `body`. The owner pasted the new "Diamonds fox, open eyes" outside
  its group, over the old drawing still in the group; the import uses a loose top-level drawing for the cell it sits
  in. The new look: the Hearts fox is pale, the Diamonds fox blue-gray, Spades owls lavender, Clubs owls pale green;
  number cards have open eyes, Aces happy ones, and no badges (the art decides, like the octopus). `recipeFor` in
  `FoxOwl.tsx` picks the cell (`<Suit>_Ace/number_cards/Jack/Queen/King`, `Diamonds_fox_open_eyes` for a Diamonds fox
  asked for open eyes, `Waving_fox` for any waving fox (pale, even where it used to be the Diamonds fox, like Home and Speed's start and end cards: the owner's choice, Nov 5), `Sleepy_fox` for the Hearts fox, `Cheering_Queen_fox` for the
  happy Hearts Queen, `Sleepy_owl` (Clubs) / `Sleepy_owl_spades`, `Happy_King_owl` / `Sleepy_King_owl` for Spades) and
  otherwise borrows eyes (happy from the suit's Ace, sleepy from the sleepy cell, open from the number cards), moved
  across to line up with the eyes they replace. `badge`, `badgeColor` and the bow tie color are kept as props but do
  nothing. `foxOwlBounds` replaced the fixed fox and owl numbers in `contentBounds`. The old script and its tests
  (composed characters, recolors, shared eye arcs) are in git history before this change.
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
  `skyFor` returns `comb`, `leaves` or `fireflies`.
- Bee, sloth, toadstool and luna moth: `<Garden kind suit eyes hat wave badge badgeColor bowtie grass>` in `art/Garden.tsx`
  mirrors `<FoxOwl>`. `Garden.test.tsx` runs `design/garden-mockup/art.js` and checks every pose matches it element by element,
  so change the art in both places (or the master first). The lashes' extra `stroke-width="1.3"` was dropped from the master,
  since the browser always used the first (1.6).
- Deck ids `honey` (Bee + Sloth) and `woodland` (Mushroom + Moth). `GARDEN_CAST` / `isGardenDeck` in `decks/decks.ts` pick the
  species per team, and `Card` draws them with `<GardenAt>`. `SuitColors.faceInk` (moth royals only) recolors the face
  card's rank and suits; the contrast test checks it on the tint.
- `<DeckCreature>` takes a third prop, `garden`, naming a part rather than a species (`gardenProps` in `DeckCreature.tsx`):
  `team: 'red'` (sloth or toadstool, hearts unless a suit is given), `'racer'` (Speed's opponent and Home's sleeper: Spades bee
  or Clubs moth), `'dealer'` (Blackjack, Solitaire's King: Clubs bee or Spades moth), or `'black'` with a card's own suit.
  Like Fox + Owl, Speed's pause shows the sleepy opponent (bee or moth) since its text names it; the other pause screens and
  the Tide Pairs win use the sleepy sloth or toadstool. Icons: `GardenHeadAt` crops the sloth's head or the whole toadstool.
- Cats are a fifth `GardenKind` (`<Garden kind="cat" suit>`), drawn in `art/Cat.tsx`: the calico and the black cat sit up
  (skinny), the orange tabby and the Siamese lie as loaves (fat) (`isLoafCat`); default eyes follow the pose. The owner
  chose this over teams-by-shape, so the Cats teams differ only by color. Crowns, bow ties, badges and
  the light side are shared in `art/gardenParts.tsx`. `Garden.test.tsx` also runs `cats.js` and checks all four cats.
  The black cat's Jack bow tie is the spades tint (#DCDDF0), drawn by `Cat` whatever color it's given.
- Deck id `cats` is a garden deck with `red: 'cat', black: 'cat'`. `GARDEN_CAST` also names the `greeter` (Home's waving
  character: Diamonds sloth or toadstool, orange cat) and `cheer` (Solitaire's Queen: Hearts sloth or toadstool, calico); use
  `team: 'greeter' | 'cheer'` in `<DeckCreature garden>`. `contentBounds` takes the suit, since loaf cats sit 5 units lower.
- The cats' five backs (Fishbowl, Yarn ball, Snow day, Sunbeam, Night prowl) are in `PaletteBacks.tsx` too, checked against
  `CAT_BACKS` in `cats.js`; 25 backs in all.
- The 14 backs from phase 21 live in `cards/PaletteBacks.tsx` (`PALETTE_BACKS` for names and colors, `<PaletteBack>` to draw);
  `CardBack` draws the frame for all 20. `PaletteBacks.test.tsx` runs `design/garden-mockup/backs.js` with the app's own
  octopus, manta, fox and owl and checks every back at both sizes. The first board export nested the octopus and manta in
  their own svg, which drew them 8 viewBox units low; the master now places them there on purpose (the approved look) and
  the export is fixed (re-rendering the board is pixel-identical to `card-backs-all-palettes.png`).
- Dominoes rules: seats are numbers (0 you, 1 first opponent, 2 second) and the rules never ask who is a computer, so a
  person could take a seat later (the owner is interested in two phones playing over the same Wi-Fi with a QR handshake;
  not planned yet). The first play of a round must be the opening tile, by whoever holds it (any double beats a non-double,
  then more pips, then the higher number). Drawing is one tile per `draw`; `takeTurn` plays a whole opponent turn and
  `last` records what it drew and played for the status line. A round is blocked as soon as the boneyard is empty and no
  seat can play. The tally is always three numbers (seats 0–2), so switching opponents keeps it. Opponents' end choice
  goes right when both ends keep the same number of their tiles playable.
- Dominoes screen: `DECKS[deck].names.second` names the second opponent (manta, owl, sloth, toadstool, orange cat);
  `Character` in `DominoesScreen.tsx` draws seat 1 (Speed's opponent), seat 2 (manta, Spades owl, garden `greeter`) or
  seat 0's waving greeter for your win. `layout.ts` lays the snake out with the two end targets inline at its start and
  end (not above the first tile as in the mockup), tiles from 36px down to 16px. Your tiles are dragged onto an end (a drop
  within 30px of a glowing end counts; the first tile goes on a dashed "Start here" spot), or tapped and then the end
  tapped; a drop elsewhere on the table shakes the tile back to your hand. One tap on Draw draws until a tile
  fits; when the boneyard is empty and nothing fits the button becomes Pass. Opponents think 700ms, then their move stays
  in the status line for 900ms; they wait while the menu or Rules is open. Changing opponents before the first tile
  redeals at once, otherwise it applies to the next round. Face-down tiles use the card back's `bg` (`BACKS`, now exported).
- Dominoes All Fives (Nov 5, the owner asked; PLAN.md "All Fives"): `mode` ('draw' | 'fives') and `scores` in the state,
  `last.scored`, `result.bonus` / `result.gameOver`. `endsTotal` / `fivesScore` / `scoreOf`; `nextRound(prev, opponents,
  mode)` carries the scores on unless the game was won or the mode or player count changed. Reaching `FIVES_TARGET` (100)
  ends the game at once; going out or a blocked win scores the others' pips to the nearest 5 (`nearestFive`). In All Fives
  the tally counts games won. No spinner (the layout has two ends). The menu's mode switch works like Opponents (at once
  before the first tile, else next round; saved as `nm`). Computer games last a median of 3 rounds with one opponent, 4 with two.
- Dominoes spinner (Nov 5, the owner asked, tried the mockup and approved it; in the app the same day): in All Fives an
  opening double is the spinner (`spinner` index on the line, arms `up` / `down` stored outward, `End` gains 'up' and
  'down', `openList` lists the open ends). Its top and bottom open once both its sides have a tile; `endsTotal` counts
  every open end (a bare side counts the double twice). `layoutCross` in `layout.ts` lays it out: the spinner standing,
  arms straight until the table edge, then turning clockwise, every zoom (`ZOOMS`) and spinner spot tried and the
  cheapest kept (0.18 a corner, 1 / zoom - 1, a little for straying from the middle). The owner suggested zooming out
  only once it gets bigger. Mockup: `design/dominoes-spinner/spinner.html` (built from `mockup.tsx` by `node
  design/dominoes-spinner/build.mjs`, published as an artifact). The screen draws it in a `.zoom` layer scaled from its
  top-left (a point on the table is the layout's x, y times `scale`, which `endAt` uses for drops); the arms' ends are
  named "top" and "bottom" in words. Only an opening double spins (a later first double doesn't).
- Pond Hop rules: seats as in Dominoes, coming out at `STARTS` [30, 10, 0] (the plan's seating; the mockup had blue and gold
  swapped). A marble's progress is -1 in its corner, 0–39 on the track (0 is its start) and 40–43 in its lane; `holeOf`
  turns it into a track hole. You always roll first. Passing a marble (yours or anyone's) is allowed; only landing matters,
  in the lane too. A hop is one move: it sends home a marble on the pad it lands on and one on the far pad. A 6 rolls again
  even with no move. `roll(state, value)` then `legalMoves` / `move` / `pass`; `takeTurn(state, value)` does an opponent's
  whole roll. Opponent ties: most marbles sent home then furthest along; otherwise the marble furthest behind. Simulated
  games run about 58 of your rolls with one opponent and 74 with two.
- Pond Hop screen: `board.ts` holds the mockup's geometry (360 board, track radius 128, corners and lanes by start), and
  `Board.tsx` draws it with the marbles sliding by CSS transform (a hop slides straight across the pond). Seat characters and
  names come from `games/seats.tsx` (`SeatCharacter`, `seatWho`, `seatLabel`), shared with Dominoes. Your roll: no move
  passes after 1.2s, one move plays itself, more than one shows glowing marbles and holes as `role="button"` targets; a marble
  with two moves (stay on a lily pad or hop) is selected first. Opponents tumble, think 550ms, move, and their move stays in
  the status line for 1s; they wait while the menu or Rules is open. The board takes the room left above the status line
  (150–460px), centered with it in that space. New sounds `splash` (hop) and `boop` (sent home) in `sfx.ts` and the gallery's sound board. A win
  shows Solitaire's Queen and King cheering; a loss the winner, happy.
- Pond Hop's bottom bar is just the die (Nov 4, the owner's call: tapping the die already rolled, and the game menu is
  the button at the top), 68px and centered, with a soft accent ring breathing round it on your turn (still with
  Reduce motion, the ring just stays). The status line says "Your turn: tap the die". Before that the die sat left of
  Roll and Menu (moved there Nov 2: the owner had to scroll down to reach
  Roll and Menu; it couldn't be reproduced in Chrome at any size, so the die's row was removed to free about 85px and the
  board area now clips rather than ever pushing the bar off screen). The die is the color of whoever's turn it is
  (`DIE_COLORS`: the marble colors with white pips, a darker gold so the pips show), the winner's once the game is over;
  tapping it still rolls. The "Tap a glowing spot" hint went with the row; the status line already lists the choices.
- Pond Hop after the owner played it: the rules stay as they are (two dice, more marbles, a pond shortcut and moving by hand
  were offered and turned down: "I just needed to play it more"). It takes up to three opponents so all four corners can
  be filled: seat 3 starts at 20 (bottom right), plays purple marbles (#7A5BC4, not green, which melts into the lily pads)
  and is the deck's King from Blackjack (`names.dealer`, king crown; `SeatCharacter` seat 3). The tally holds four numbers.
  Opponent cards show only the character on a tint of its marble color and its four home dots; the name and color are
  visually hidden for screen readers, and the status line still names who did what.
- Two phones (`src/together/`): `code.ts` packs a WebRTC description into a QR code ("TP1O…" offer, "TP1A…" answer;
  deflate-raw plus URL-safe base64, about 600 characters, QR version 16–17). `link.ts` has `host` / `finishHost` / `join`,
  with no STUN or TURN servers and no trickle (it waits up to 4s for every local address). Its `Channel` keeps messages
  that arrive before the page listens. The page asks for the camera before making a code, since Chrome only lists a
  phone's real local address (rather than an mDNS name) once camera access is granted. `Scanner` uses `BarcodeDetector`
  where it exists (Chrome on Android) and `jsqr` otherwise. It also takes a code from a `tidepool-code` window event,
  which is how Playwright connects two pages without a camera (launch Chromium with `--use-fake-ui-for-media-stream`
  and `--use-fake-device-for-media-stream`). `TogetherScreen` is lazy-loaded so the QR libraries stay out of the main
  bundle. They're still precached for offline use.
- Brave (Android) can't make the two-phone link: its default WebRTC policy hides local addresses. Chrome works. The
  owner plans an APK later; use Capacitor, which bundles the built app so it runs offline from the first launch, rather
  than a Trusted Web Activity, which would show a URL bar because a project Pages site has no root `.well-known`. Build
  it in GitHub Actions so the owner can download it on the phone. Check camera permission and the link inside the
  WebView. Only iPhones would keep using the web link.
- Pond Hop ponds follow the palette, not the deck (`pondFor`: Winter `ice`, Forest `leaves`, Honeycomb `honey`, Lagoon
  and Coral Reef plain `water`). The owner chose look A each time (Nov 2): Winter's from
  `design/winter-pond/frozen-pond.html`, Forest's and Honeycomb's from `design/pond-palettes/ponds.html`. `ICE`, `FOREST`
  and `HONEY` in `board.ts` hold the colors for light and dark; `Board` takes `pond` and `mode`.
  Ice: cracks, glints, frosty edge, snow banked on the rim, the middle lily pad frozen in under a snow clump, snow on the
  track's lily pads. Leaves: deep green water, ripples, four autumn leaves, three reed tufts with cattails, and in dark
  mode three fireflies glowing over it. Honey: a honey pool with a shine and bubbles in a ring of 16 comb cells, and three
  comb cells in the middle instead of the lily pad. The hop lines take each pond's color.
  A hop sets `hop` (from where the marble set off to where it landed) and `HopMark` marks it: a skate mark on ice (two thin
  lines drawn with the marble, then fading), three ripple rings where the path is over Forest's water (`overPond`), each
  starting as the marble passes it, and a honey trail that draws with the marble and slowly fades (sinking back in).
  With Reduce motion they just fade. Hop sounds (`HOP_SOUND` in the screen): `splash` in water, `swish` on ice, `skip`
  (three plips) in Forest, `gloop` in Honeycomb; all are on the gallery's sound board. The owner chose the honey pool
  "with gloop" without mentioning the trail; it was part of look A's hop, so it's in.
- Blackjack card ids in saved data are rank numbers plus suit letter ("13d", not "Kd"); a save with a bad id is
  discarded and a fresh shoe starts.
- Testers: the owner shares the live app, and the repo is public. The default name is "friend" (`DEFAULT_NAME`; the saved
  default is now `''`). Saved settings carry `v: 2`; a saved "Night" without `v` was the old default and is cleared once.
  `app/contact.ts` holds `FEEDBACK_EMAIL` (tidepool.five456@passinbox.com, the only email the app or repo should show),
  `KOFI_URL`, `SOURCE_URL` and `APP_VERSION` (from package.json). Keep other personal emails and addresses out of code and docs.
- Home's top box is `screens/Tips.tsx`: the old greeting is slide 1, then eight tips (`tipsFor`; the install tip is left out
  once installed). Slides share one grid cell so the box never changes height, and crossfade. It moves on every
  `TIP_SECONDS` (8) until touched, focused or hovered, never with Reduce motion; dots are decorative, the arrows navigate.
  "Hide tips" sets `showTips: false` (the box becomes the plain greeting); Settings' "Tips on Home" switch brings it back.
- Settings ends with a "Tidepool" section: Send feedback and About Tidepool (`LinkRow`), and Tips on Home. `#/feedback` is a
  form that opens the email app (`feedbackMailto`: kind, optional game, message, optional phone and app details shown in
  full before sending); the owner chose this over a hosted form so the app still sends nothing anywhere. `#/about` has the
  owner's story, "My view on AI" (adapted from the owner's Storybones app, first person), privacy, and a Ko-fi tip box.
  Both take `/home` (`#/about/home`) when opened from a tip, so Back returns Home instead of to Settings.

- Fishy rules: `play(state, ids)` puts cards down claimed as `due`; then `asking` goes round the other seats from the
  player's left, each `call` or `letGo`; the first call settles it (`last` records who picked up how many). A last card
  wins only once it stands. Two players get 17 cards each and `aside` holds the other 18 (all 52 made games far too long).
  Opponents decide from `viewFor(state, seat)` only (own hand, own cards in the pile, counts, the claim), and a test swaps
  the other hands to prove nothing else leaks. `PERSONALITIES` by seat: 1 bold, 2 careful, 3 steady. Call chances other
  than impossible claims are per table, shared out over the seats asked. Computer-only games: median about 22 plays with
  two players, 42 with three, 39 with four. `computerMove` acts for whichever seat is up; the screen decides who's a computer.

- Fishy screen: opponents' turns run from one effect (`computerMove` after 900ms to play, 650ms to answer; halved with
  reduce motion), paused while the menu, Rules or a call's reveal is showing. Every change goes through `apply`, which
  pops the speech bubble (`say`, 1.8s) and plays the sound for `last`. A call shows the turned cards (`reveal`), the
  verdict bubbles and eyes (happy / sleepy) after 650ms, then the whoosh at 2s; the pile count and claim stay shown
  until then. Your bubble sits at the bottom of the table. Your hand is a sideways-scrolling fan of 62px cards (30px
  overlap) with an accent bar under the rank due; a fifth lifted card shakes. `plays` in the state says whether the
  opponents can change at once. New sound `blub` for "Fishy!". When a computer's call was a sure thing (`provenFib` in
  `rules.ts`: the claim plus the cards of that rank it holds or put down make more than four), it says "I had three 7s!"
  at the verdict instead of "Ha! Caught you", and the status line names it too. The owner felt every fib got guessed;
  a simulation showed with two opponents about 80% of fibs are caught, nearly all of them sure things (the next player
  hoards the rank you're due, since it's due to them 13 plays later). Wait for testers before making the calls easier. Fishy is third on Home
  (under Speed). The first tip after the greeting is "What's new" (Dominoes' All Fives, the three falling-block games and Koi
  Garden; Nov 5, it replaced "New game: Fishy"), with a Try Koi Garden button that opens Settings. It must not make
  the box taller at 360px wide (241px tall).
- Falling-block games: the owner saw three mockups (`design/block-games/mockups.html`, also published as an artifact) and
  chose to build all three. Pieces have no faces (the owner found them distracting). Bubble Pals rules: a `Tank` is one
  player's side; `fall` on the screen's timer, `resolve` once per chain link so each can be shown, `exchange` passes clams
  between two tanks. Both Versus tanks share a seed, so they get the same pairs. Pearls don't shift the pair sequence. The
  opponent (`ai.ts`) scores every reachable placement with `simulate` and probes chain potential by dropping one more pair
  of each kind in each column (Steady and Quick); about 5ms a choice. Computer-vs-computer games with no clock are too
  noisy to test which pace wins, so the test checks that Quick sends more clams than Gentle; speed decides real games.
- Falling-block screens share `games/falling/`: `Friend` (the faceless pieces, with `FriendDefs` for the pearl
  gradient in each svg), `Controls` (Left / Turn / Right / Drop, `data-silent`, Left and Right repeat while held, a
  keyboard click still works), `useTankGestures` (drag a column per 0.8 cell, tap to turn, flick down to drop),
  `Overlay` and `Falling.module.css` (the tank and side column are centered together in the space left). Arrow keys
  work too (up turns, down or space drops). The Bubble Pals screen keeps time in one effect that restarts only when play
  starts or stops or the phase changes, so sliding and turning never reset the fall timer. Links resolve 520ms apart;
  `fallDistances` works out how far each friend dropped (order in a column is kept) for the drop animation, which waits
  220ms for the pop. The tank shows 12 units of the hidden row so a new pair's top friend peeks in. Sounds: `land` on
  landing, `flip` on a turn, the new `pop` (`play('pop', pitch)`; pitch steps up a whole tone per link), `foundation`
  for a pearl, `win` for a new best, otherwise `boop`. Solo isn't saved mid-game; the best score is (`tidepool.bubblepals`).
- Bubble Pals Versus: Solo or Versus and the pace are chosen on the Start card or in the menu and saved (`mode`, `pace`);
  switching mode starts over at the Start card. Both tanks run on `useTankLoop`; the opponent effect picks a placement
  when its piece comes out, thinks (900 / 550 / 300ms by pace) and presses every 280 / 180 / 110ms, then drops.
  `passClams` runs whenever either tank settles. Versus speed counts playing seconds only. The side column (108px) holds
  the racer's card (happy on its chains, sleepy when it loses), its 15px-a-cell tank with its own clams-coming count, and
  the wins. A pearl's own pop sends no bonus clams (random play found pearls sending 20 at once). New sound `thunk` for
  clams dropping into your tank; `whoosh` when clams are sent either way.
- Shared by the falling-block games: `games/falling/speed.ts` (`Pace`, `soloFallMs`, `versusFallMs`; Bubble Pals' rules
  re-export them) and `games/falling/storage.ts` (`SavedFalling`, `storageFor(key)`: mode, best, tally, pace, showTally;
  used by Bubble Pals, and by Tide Swap if it keeps Versus).
- Coral Stack has Continuous and Levels, no Versus: after phase 36 the owner swapped Versus for Levels (Nov 2). The
  Versus version (sandbars sent between tanks, a computer opponent in `ai.ts` with three paces) is commit bf4defe, if
  it's ever wanted again. Coral Stack is therefore not a two-phone game; Tide Swap keeps Versus (the owner, Nov 2).
  The endless mode is labelled "Continuous" in Coral Stack only (its mode id is still `solo`; Bubble Pals keeps Solo).
  Decided with the owner: a level is won when the tank is empty, sand and coral (first built as "the last sand washes
  away"; the owner changed it after playing); a short card ("Level 3 cleared!", Next level) comes between levels; a full
  tank goes back to level 1. Levels shows no points. A two-move-lookahead bot with no clock empties every level, but the
  coral after the sand takes a median of about 30 pieces and 1 in 10 levels takes 80 to 120 (the sand itself goes in
  under 10): if the owner finds levels drag, that last stretch is why.
- Coral Stack rules (not spelled out in the plan): two hidden rows above the 15 you see (`HIDDEN`); a new piece's pivot
  starts in column 3 on the top row you see, at turn 0 (straight lies flat; bent is a corner pointing up and right); 40%
  of pieces are straight. Turning tries in place, then one column left, one right, one row up. Pieces land whole; only a
  wave makes blocks sink, and then every column packs down (`sink`). Five or more rows in one wave score 1,000 plus 500 a
  row; the chain doubling stops at ×32, as in Bubble Pals. The hidden rows are not cleared (unlike Bubble Pals): the
  game ends when the next piece doesn't fit. `Wave.washed` is the board after the rows go and before the sand sinks, for
  the screen; `Wave.sand` counts the sand that went.
- Coral Stack shapes and colors (Nov 7; a tester asked for the T, the owner asked for shapes and colors that unlock):
  `SHAPES` straight, bent, branch (the T), square, long, hook; `CORALS` a–f. `UNLOCKS` gives levels 2–8 one each, shape
  and color in turn (branch, lavender `d`, square, blue `e`, long, yellow `f`, hook), and `unlocked(level)` lists what's
  open; both modes use `level(tank)`. Weights per mode (`SHAPE_WEIGHT`): Continuous straight 4, bent 6, branch 5,
  square 3, long 3, hook 4; Levels 4, 6 and 1 for each four-block shape. With Continuous's weights in Levels, a greedy
  bot needed about four times as many pieces to empty level 2 (median 132 instead of 30) and missed 8 in 20 within 300
  pieces; with the Levels weights it clears nearly all (medians 45–86 pieces at levels 2–10, against 30–62 before).
  Level 1 deals exactly the pieces it did before. The tank now holds `next` (decided when the piece before it came out),
  so the preview never changes when a wave raises the level. Square never turns; the kicks gained two columns either
  way for the long piece. The new colors are the owner's coral A recolored in `Block.tsx` (`RECOLOR`: body, shade × 0.9,
  soft dot); `DRAWN_CORALS` keeps the art sheet to the owner's three. Continuous shouts "New shape!" / "New coral!" on
  the level-up that brings one; the Levels card says "New: the branch shape!" with a picture (`PiecePicture`).
- Coral Stack Levels: `newTank({ seed, stage })` starts on `sandStack(seed, stage)`: column heights 1 to `sandRows(stage)`
  (3, plus one every 2 levels, at most 9), one column always that tall, a hole now and then (15%) inside a column but
  never its top or bottom block, and any full row gets a gap. `resolve` ends a level with phase `'cleared'` (event
  `cleared`) once the tank is empty (`blocksLeft`). Speed `levelsFallMs`: 800ms, ×0.92 a level (gentler than Solo's 0.9,
  since the sand grows too), never under 150. Saved (`tidepool.coralstack`, its own format now): mode `solo` / `levels`,
  the best Solo score, and `bestLevel`, the highest level reached (set when Next level starts it). A save from the
  Versus days opens on Solo and keeps its best score.
- Shared falling-block screen parts (phase 36), in `games/falling/`: `TankSvg` (generic tank drawing: `shape`
  {cols, rows, hidden}, a `draw` function per cell, the piece, ghost, drop animation, and `children` for each game's own
  effects; a negative drop rises, for sandbars), `useTankLoop` (takes the game's `fall` and `resolve`), `fallDistances`
  and `riseDistances`, `Incoming` ("3 clams coming", given `words` and an `icon`), `RacerFace` / `GreeterFace`,
  `ModePicker`, `usePlayKeys` / `usePauseWhenHidden`, `PACE_NAMES`. Bubble Pals' `Tank.tsx` is now `PalsTank` on top of
  `TankSvg`. Solo no longer says "N clams for the octopus" or whooshes when a chain would have sent some (a bug in both).
- Coral Stack screen: built like Bubble Pals (same top bar, menu, cards and controls; no opponent). Blocks fill
  their cell (`Block.tsx`, the mockup's `block`, colors × 0.9 for the shade). A wave shows a pale band with a blue wave
  line sweeping across (`CoralTank` children) while the row's blocks slip away; the sand sinks 260ms later. Shouts:
  "Wave!", "Two rows!", "Chain ×2!", "All clear!"; the status line says "The sand is gone! Now wash away the coral".
  New sound `wave` (a soft wash with a plip that steps up a whole tone per link); `foundation` when the tank empties,
  `win` with the level card. Side column: Next, then Rows, Score, Best (Continuous) or Level, Left (all blocks), Best
  level (Levels); the Next card keeps its height for either shape.
  Each level's sand rises in from the bottom when it starts (`riseDistances`). Start in Levels always begins at level 1
  (the menu says "Start over from level 1"); the end card says "Your best yet!" when the run beat the saved best level.
- Tide Swap rules (decided in phase 37; the plan left these open): stacks are arrays per column, bottom first, and
  falling things have a slot `y` (0 the floor; a drop starts at `SPAWN_Y` = 8, just above the tank). Each beat (`fall`)
  everything falling moves down a slot, and whatever already rests on its stack lands: so a thing sits on top for one
  beat before it lands, which leaves a moment to swap it away. A swap trades two whole columns: each stack, and anything
  falling that has come down inside its column (below the top of the stack it would meet coming the other way) moves
  with it; anything higher stays in its lane over the stack swapped in. (First built as "lifted onto the stack swapped
  in"; the owner asked for the whole column to move.) Everything in a drop falls at the same height, so a swap never
  puts two falling things in one lane (a test swaps at random to check). The opponent scores orders by tapping through
  `swap` for the same reason. On the board a moved friend slides sideways in 150ms, like its stack. A drop is 1 friend (40%) or 2 (60%) in
  different columns; each is a clam shell half 16% of the time in Versus (half bottoms, half tops), and in Solo 12.5%
  tops and 4% bottoms (`SHELLS`; Solo levels bring their own bottoms). The next drop comes once the
  whole drop has landed (`resolve`). A friend on its twin, or a pebble on a pebble, both leave; a bottom half on a
  bottom half just stacks. A top half closes down to the nearest bottom half below it (everything between leaves,
  pebbles too), or melts if there's none. The game ends when something would stack onto a full column (8); a match, a
  clam or a melt there is fine. Points: 20 a match (pebbles 0), a clam 50 + 40 per friend inside. Pebbles: a clam sends max(1, friends inside), two friend matches
  in one drop send 1, at most 8 a drop; they cancel waiting pebbles first; waiting pebbles join your next drop in the
  columns it leaves free (the rest keep waiting). Speeds per slot (a drop takes 9 beats to reach an empty floor): Solo
  520ms ×0.94 a level (at least 120); Versus 560 / 420 / 300ms by pace, ×0.9 every 45 seconds (at least 110).
- Tide Swap Solo is a run of levels (decided with the owner, who wanted a way to win, not just survive): a level
  starts with `pearlsFor(stage)` bottom shells (4 on level 1, one in each column; one more each level up to 12, each
  extra one over a random friend on top of the shortest column, `startStacks`) and is won once that many pearls are made
  (any clam counts; `pearls` in the tank), checked in `resolve` after the drop lands (phase `'cleared'`). A bottom shell
  only leaves by being closed, so a level is always winnable. A short card ("Level 3 cleared!", Next level) leads to
  the next, a little faster (×0.94 a level), keeping the run's score. An overflow ends the run; Play again starts at
  level 1. Saved: `bestLevel` alongside the shared falling fields (`tideswap/storage.ts`). With no clock a strong
  computer finishes level 1 in about 20 drops and level 12 in about 60, and a careless one nearly as often, so speed
  is what makes later levels hard. Ideas considered first: clearing the whole field (rarely possible: each drop adds
  friends) and clearing ringed starting friends; the owner chose the pearls.
- Tide Swap opponent (`ai.ts`): scores all 24 orders of the four stacks for the drop that's falling (matches, clams and
  friends inside, melts, covering a friend, height, the number of different friends on top, and a cost per tap), then
  taps the neighbor swaps that get there (`swapsFor`, a bubble sort). Gentle cares little about clams, avoids taps and
  picks among the top six 65% of the time. With no clock, Quick lasts 1,000 drops in most games and Gentle about 200 to
  600; per drop they send about the same (most pebbles come from two matches in a drop), so tap speed on the screen is
  what should separate the paces. Storage uses the shared falling format (`tidepool.tideswap`).
- Tide Swap screen: the board (`Board.tsx`) is HTML, not svg: four column backgrounds, each stack in its own layer
  keyed by an identity (`ids`, permuted on every swap event) so a swapped stack slides (150ms), falling friends gliding a
  slot per beat (a linear transition as long as the beat), and leaving effects per landing (`effectFor`: twins hop up
  and fade, a clam's contents slide to its middle and a pearl shines there, a melting top squashes). Slots and columns
  size separately (`fitGeometry`: neither more than a third bigger than the other), so Versus columns are taller than
  wide. Pieces carry `data-item` (and falling ones `data-col` / `data-y`) so a Playwright bot can read the board and play
  with `chooseSwaps`. No Controls row: three round swap buttons centered under the gaps (`data-silent`, `flip` sound),
  keys 1 to 3. Dragging a column sideways swaps it with its neighbor once the finger passes half a column: one swap per
  drag, like a button (the owner's request; lift and drag again for another; 10px sideways starts a drag, but not when
  the finger is going mostly down). A flick down on the columns (or Space / Down arrow) drops, like Bubble Pals and Coral
  Stack (same `FLICK_PX` and `isDownward` from `useTankGestures`): the drop glides down at 50ms a slot and lands, and the
  next drop falls at the usual speed; `useTankLoop`'s `restartKey` restarts the timer. (It was hold to hurry until Nov 7;
  the owner asked for one drop gesture across the games.)
  A row of Next boxes sits over the lanes (`NextRow`, `preview`): what the next drop brings into each lane, a dashed
  empty box where nothing comes (the owner asked for it). Pebbles aren't previewed there; they have their own row. Solo shows Score and "Pearls 2 of 4" above the columns and the level in the tag; Versus has the shared side column
  (racer, `MiniBoard` at 20px a slot with its pebbles-coming count, wins) and "N pebbles coming" over your columns. The
  racer thinks 1100 / 650 / 350ms when a drop comes and taps every 450 / 300 / 170ms. Sounds: `land` (`thunk` for a
  pebble), `pop` for twins (higher for two pairs, lower for pebbles), `foundation` for a clam, `invalid` for a melt,
  `flip` for a swap, `whoosh` when pebbles are sent. Clam shell halves are `Friend` kinds `shellBottom` / `shellTop`.
- Checkers rules (phase 40, Nov 5): American checkers, seat 0 you at the bottom (moving up), seat 1 at the top; the rules
  never ask who is a computer (a friend passing the phone, or later a friend's phone, can take seat 1). The board is 64
  squares row by row from the top (`rowOf`, `colOf`, dark squares where row + col is odd). A `Move` is a whole run:
  `from`, every landing in `path`, and `captures`; men jump forward only, a piece can't be jumped twice in one run, taken
  pieces leave when the run ends, and a man crowned mid-run stops. `mustJump` (default on, the menu's switch) limits the
  moves to jumps when any is open; a started run always goes on. No move for the side to play loses (`stuck`); 40 moves
  each with no capture and no man moving is a draw (`QUIET_LIMIT` 80, `quiet`). The starter alternates (`nextGame`). The
  tally is wins for seat 0, seat 1 and draws. For the screen: `movablePieces`, `nextLandings(state, from, steps)` and
  `movesThrough` build a move a tap at a time. The computer (`ai.ts`): alpha-beta over the rules' moves with captures
  searched to the end; easy looks 2 ahead and picks at random among moves within a man of the best (12% a random move),
  medium 4 ahead (a quarter of the time the second best if within 30), hard 8 ahead (6 when more than 9 moves). Hard
  takes about 0.1s a move on average here, 0.4s at worst; it beat easy in every test game. Saved as `tidepool.checkers`
  (board as 64 letters, `.`, `m`, `k`, `M`, `K`), with the level, opponent ('computer' | 'friend') and showTally.
- Checkers screen (phase 41, Nov 6): `CheckersScreen.tsx`, `Board.tsx` (an svg, 40 units a square; light / dark squares
  from the palette, the dark ones brightened in dark mode so the ink pieces show; the last move's two squares marked
  gold), `Piece.tsx` (`PieceArt`: the mockup's token, cream #FFFBF2 for you, ink #24323B for the top, with the owner's
  `KingCrown` on kings). Pieces get ids on the screen (`assignIds`, moved by `commit`) so they slide square to square: a
  `Motion` steps through the run a hop at a time (230ms a hop, none with Reduce motion), each jumped piece fading as it's
  passed, a crown appearing once the piece lands. Tap a ringed piece, then a dot; a run with only one way left finishes
  by itself, a branching run waits on its last landing (jumped pieces faded) for the next dot. Tapping a piece that
  can't move shakes it. The cards show you (a cream piece, since the octopus is both greeter and opponent with Octo +
  Manta) and the top: the deck's Speed opponent, or with A friend (pass the phone, board not turned) the deck's other
  character labeled "Friend (ink)". Menu: Play against (the opponent / A friend), How hard (Easy, Medium, Hard), Jumps
  are required (at once before the first move, otherwise next game), New game, Show tally (You · opponent · Draws),
  Rules. The computer thinks 650ms (halved with Reduce motion) and waits for the menu and Rules; its jumps go in the
  status line. Sounds: `flip` on picking up, `land` a hop, `pop` a jump (pitch rising along a run), `foundation` on
  crowning, `win` for a win, `invalid` for a shake, `whoosh` for a new game. Home: last on the list, "Jump your way past
  the octopus", `CheckersIcon` (two tokens, the front one crowned).
- Fishy with hands of five (five cards showing, the rest face down) was built and then undone at the owner's request
  (commit c68ecf1 has it, if it's ever wanted again). The rules are back to seeing your whole hand, with 18 cards set
  aside in two-player games.

## Game ideas the owner turned down

Golf, Pyramid, TriPeaks, FreeCell, Crazy Eights, Drift (a no-goal toy) and a manta breathing guide were offered
and declined; Spider, War and Go Fish were advised against. Don't re-pitch them unless asked.

## Open decisions from PLAN.md (still at defaults)

Card backs follow the palette and deck (no picker); the Speed opponent is the deck's (octopus or Diamonds fox);
Solitaire moves and time are off by default but available in the game menu.
Decided: the Blackjack dealer is the King manta (theme `manta` color, king crown), or the King owl with Fox + Owl; it bobs instead of waving.
Decided: Jacks wear a bow tie in their suit symbol color (`Creature` `bowtie` prop, set in `Card.tsx` creatureFor).
