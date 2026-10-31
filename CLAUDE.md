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
| 31. Fishy screen | Built; waiting for the owner to check it on the phone |

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
the branch `before-multiplayer` on GitHub (a branch, since this environment can't push tags); never push to it.

Work one phase at a time and stop after each so the owner can check it on their phone.

Next up: the owner checks the Fishy screen (phase 31) on the phone; fix what they find. Then phase 32, Fishy on two
phones. All multiplayer decisions are in PLAN.md "Playing together on two phones"; Speed with a friend is planned there but
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
  and die (200–460px). New sounds `splash` (hop) and `boop` (sent home) in `sfx.ts` and the gallery's sound board. A win
  shows Solitaire's Queen and King cheering; a loss the winner, happy.
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
  opponents can change at once. New sound `blub` for "Fishy!". Fishy is third on Home
  (under Speed), and the first tip after the greeting is "New game: Fishy".
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
