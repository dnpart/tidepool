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
| 36. Coral Stack screen | Built, then Versus swapped for Levels at the owner's request; waiting for the owner to check it |
| 37. Tide Swap rules | Done (`games/tideswap/rules.ts`, `ai.ts`, `storage.ts`, tests) |
| 38. Tide Swap screen | Built, then reworked at the owner's requests (hold to hurry, drag to swap, Next boxes, whole-column swaps, Solo pearl levels); waiting for the owner to check it |

Phases 25–28 come from the PLAN.md sections "Game 5: Dominoes" and "Game 6: Pond Hop" (mockups `design/dominoes.png`,
`design/pond-hop.png`). Pond Hop is our own game in the Aggravation family, not a copy of Aggravation: keep its own board,
name and lily pad hops.
Phases 22–24 come from the PLAN.md section "Cats deck"; the cats and their backs come from `design/garden-mockup/cats.js`.
Phases 17–21 come from the PLAN.md section "Honeycomb and Forest palettes, Bee + Sloth and Mushroom + Moth decks".
The bee, sloth, toadstool and luna moth art and the 14 new card backs come from `design/garden-mockup/art.js` and
`backs.js` (Claude's mockup, approved by the owner); port them exactly.
Phases 12–16 come from the PLAN.md section "Winter palette and the Fox + Owl deck" (16: "Card backs follow the palette"). The fox and owl art comes only
from `design/fox-owl-deck.svg` (the owner's Illustrator file); never redraw it by hand.

Phase 29 onward comes from the PLAN.md section "Playing together on two phones". The version from before that work is
commit `a977a86` in `main`'s history (it was also the branch `before-multiplayer`). Push to `main` and nowhere else.
As of Nov 2, GitHub still lists `before-multiplayer` and `claude/phone-app-setup-l9gxns` (old copies; never push to them).
A cloud session may be told to work on its own `ccr-…` branch and its stop hook may complain about "unpushed commits"
there: the owner wants everything on `main` (as decided in that session), so commit and push to `main` and ignore the
hook; the owner asked that the side copy be deleted (the environment blocked Claude from doing it).

Work one phase at a time and stop after each so the owner can check it on their phone.

The Winter, Forest and Honeycomb ponds for Pond Hop (below, under Decisions) are built. Nov 4: the owner asked why the
pond isn't the whole circle; mockups in `design/pond-palettes/full-ponds.html` (built by `full-ponds.mjs` from its
template, published as an artifact): the pond fills radius 150, the middle becomes an island the home lanes run onto,
corners stay on the panel, the owner's four lily pads stay the hop spots; look A puts every hole on a stepping stone,
look B does each pond its own way (stones, ice-fishing holes, small lily pads, wax comb cells). The owner leaned to
full ponds, B with stones in the forest, but wasn't sold: a hop can't ripple over an island, and stones round the ring
crowd. Round two, `design/pond-palettes/shore-ponds.html` (`shore-ponds.mjs`, also an artifact): the pond fills radius
113, the track runs on a shore ring (sand, snow, grass with reeds, wax comb with a cell per hole), the home lanes are
piers out over the water (boards, snowy boardwalks, logs, comb strips) ending in open water, the pond reaches into
coves at the four lily pads, and the middle is open water for the hops (mid-hop boards show the marks). The owner
disliked the coves and asked to drop the shore. Round three, `design/pond-palettes/koi-ponds.html` (`koi-ponds.mjs`,
needs the preview server; also an artifact): water to radius 126, one rock per track hole forming the pond's edge
(sandy, snow-capped, mossy, wax comb cells in honey, river stones for koi), piers kept (koi: pale boards between red
rails, since pink home spots vanished on red), lily pads afloat in the gaps; plus a koi pond (three koi) and a
proposed Koi palette made with the Cats deck in mind (`KOI` in the script: stone and moss greens, vermilion accent
#B8432C / #F08C6C; cherry petals by day, lanterns by night; real app screens with its colors swapped in; a Cats card
back sketch). A new palette also needs a back per deck, a sky and a pond, and the contrast test. Waiting for the owner.

Art export (Nov 2): the owner wants no AI art in a public release and will redraw it by hand. `design/art-export/` holds
eight SVGs for Illustrator (characters per deck, card backs, game icons, pieces/ponds/sky/app icon), each piece a named
group in a dashed frame, plus `README.md` (instructions for the owner) and `manifest.json` (frame, scale and source
file per piece). Made by `npm run art:export` from the hidden page `#/art` (`src/screens/ArtSheet.tsx`, lazy-loaded),
which the script opens once per deck; colors are resolved to hex with opacity (Illustrator reads rgba as black),
nested svgs become clipped groups, repeats are merged ("also:"). The owner redrew file 01 (Octo + Manta, all 24 cells)
and file 08 (pieces, sky; see Decisions), both in the app; files 02 to 07 are still to come. Bring each back the same way (keep
paths as drawn, one transform per cell), add the file to `OWNER_FILES` in `export-art.mjs` so the export never writes
over it, and check every screen it's on.

Next up: phase 39, Fishy on two phones (PLAN.md "Playing together on two phones"), once the owner has played Tide
Swap (phase 38). The owner hasn't reported on Bubble Pals Versus (phase 34) or the Coral Stack changes yet either; fix
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
  (recolored per leaf). `FriendDefs` is gone. Not imported: the suit symbols (unchanged) and the ponds: the owner
  touched up the track's lily pads and asked for mockups of ponds that fill the whole circle before anything changes
  (`design/pond-palettes/full-ponds.html`). The ponds in file 08 came back with black holes and corners (Illustrator
  dropped their fill-opacity); don't import them as they are.
- Bubble Pals' junk is pebbles, not clams (Nov 4, the owner's call: in Tide Swap clams are the reward, so the same word
  meant opposite things). Renamed all the way through Bubble Pals (cell `'pebble'`, `pebbles` in events, "3 pebbles
  coming", rules text) and its PLAN.md section; the `clam` Friend kind is gone. Tide Swap keeps its clams and pebbles.
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
- Pond Hop's die sits in the bottom bar, left of Roll and Menu (moved there Nov 2: the owner had to scroll down to reach
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
  (under Speed), and the first tip after the greeting is "New game: Fishy".
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
  drag, like a button (the owner's request; lift and drag again for another; 10px sideways starts a drag). Holding a finger
  still on the columns (or Space / Down arrow) hurries the drop down at 50ms a slot until let go, starting after 160ms
  so a drag isn't hurried (the owner's idea: hold, not tap); `useTankLoop`'s `restartKey` restarts the timer when it changes.
  A row of Next boxes sits over the lanes (`NextRow`, `preview`): what the next drop brings into each lane, a dashed
  empty box where nothing comes (the owner asked for it). Pebbles aren't previewed there; they have their own row. Solo shows Score and "Pearls 2 of 4" above the columns and the level in the tag; Versus has the shared side column
  (racer, `MiniBoard` at 20px a slot with its pebbles-coming count, wins) and "N pebbles coming" over your columns. The
  racer thinks 1100 / 650 / 350ms when a drop comes and taps every 450 / 300 / 170ms. Sounds: `land` (`thunk` for a
  pebble), `pop` for twins (higher for two pairs, lower for pebbles), `foundation` for a clam, `invalid` for a melt,
  `flip` for a swap, `whoosh` when pebbles are sent. Clam shell halves are `Friend` kinds `shellBottom` / `shellTop`.
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
