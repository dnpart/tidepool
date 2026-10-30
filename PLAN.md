# Tidepool: Build Plan for Claude Code

Oct 30, 2026 · @Bobbie

## Overview

Build Tidepool, a personal, installable phone web app of calming mini games, starting with Solitaire (Klondike) and Speed. It greets its one user as "Night", uses octopus and manta ray characters, and has an ocean-meets-space look with slow drifting clouds (light mode) and expanding stars (dark mode).

This plan is the source of truth. Every color, shape coordinate and setting below matches the approved mockups, so Claude Code should copy values exactly rather than reinterpret them.

How to hand this off:

1. Export this doc as Markdown and save it in the project root as `PLAN.md`.
2. Screenshot each board on the "Current design" page of the mockup canvas (Home light, Home dark, Settings light and dark, Octo + Manta Deck, Sea friends). Save them in `/design` and mention them in your first message.
3. Start Claude Code with: "Read PLAN.md and the images in /design. Build Phase 1 only, then stop so I can check it."
4. Work phase by phase (see Build phases). Check each checkpoint on your phone before moving on.

Claude Code cannot open claude.ai links, which is why the screenshots and exact values in this doc matter.

## Tech stack and setup

Build it as a Progressive Web App (PWA): a website that installs to the phone's home screen, runs full screen and works offline. No App Store, developer account or Mac is needed.

| Piece | Choice | Why |
| --- | --- | --- |
| Framework | React 18 + TypeScript | Components fit screens, cards and characters well |
| Build tool | Vite + `vite-plugin-pwa` | Fast dev server; generates the manifest and offline service worker |
| Styling | CSS Modules + CSS custom properties | Theme switching is just swapping variables on `<html>` |
| State | React context + `useReducer`; game logic as pure TS functions | Simple, testable, no extra libraries |
| Storage | `localStorage` | Saves settings and in-progress games on the device |
| Sound | Web Audio API, synthesized | No audio files to source or license |
| Drag and drop | Pointer Events (no library) | Works for touch and mouse |
| Tests | Vitest | Unit tests for game rules |
| Hosting | GitHub Pages, Netlify or Vercel (free) | Needed so the phone can load and install it |

Project structure:

```
src/
  app/            App shell, router, providers
  theme/          tokens.ts, ThemeProvider, global.css
  settings/       SettingsContext, Settings screen
  art/            Octopus.tsx, Manta.tsx, Creature.tsx, Suit.tsx, Cloud.tsx
  cards/          Card.tsx, CardBack.tsx, deck.ts (types + shuffle)
  sky/            SkyBackground.tsx (stars + clouds)
  sound/          sfx.ts
  screens/        Home.tsx
  games/
    registry.ts   list of games shown on Home
    solitaire/    rules.ts, rules.test.ts, SolitaireScreen.tsx
    speed/        rules.ts, ai.ts, rules.test.ts, SpeedScreen.tsx
```

Routing: hash routes (`#/`, `#/settings`, `#/play/solitaire`, `#/play/speed`) so it works on any static host.

Install on iPhone: open the hosted URL in Safari, tap Share, then Add to Home Screen. Set `display: standalone`, app name "Tidepool", theme color `#173B47`, and a 512 px icon of the happy octopus on Lagoon background.

## Design tokens

All colors come from one token set chosen by three settings: palette (Lagoon or Coral Reef), mode (light or dark) and contrast (standard or high). Apply them as CSS variables on `<html>` so every component reads `var(--ink)` and so on.

| Token | Lagoon light | Lagoon dark | Coral Reef light | Coral Reef dark |
| --- | --- | --- | --- | --- |
| `bg` | #E4F3F0 | #0D1A2B | #FDEEE8 | #1D1326 |
| `surface` | #FFFFFF | #16283D | #FFFFFF | #2B1D36 |
| `ink` (main text) | #173B47 | #E8F5F2 | #45222F | #FCEDE8 |
| `sub` (secondary text) | #4A6670 | #A6C0C6 | #74505B | #D6B9C2 |
| `accent` | #2A7C76 | #5FC4BA | #B5455F | #FF8FA3 |
| `onAccent` (text on accent) | #FFFFFF | #0D1A2B | #FFFFFF | #1D1326 |
| `accentSoft` | #CFEAE5 | #1E3A4E | #F8D6DC | #3A2545 |
| `line` (borders) | #CFE3DF | #24405A | #F1D9D3 | #3F2C4B |
| `octo` (decor octopus) | #EE8C9E | #EE8C9E | #F29A8A | #F29A8A |
| `octo2` | #F6B07A | #F6B07A | #F4A6BE | #F4A6BE |
| `manta` (decor manta) | #7A9EB0 | #8DB0C2 | #8C9CC4 | #A3B0D8 |
| `cloud` | #FFFFFF | (none) | #FFFFFF | (none) |
| `starCore` / `starGlow` | (none) | #FFF4D6 / rgba(255,244,214,.45) | (none) | #FFE9CC / rgba(255,233,204,.45) |

Derived tokens: `dash` = accent at 47% alpha (dashed "more games" row). Default borders are 1px solid `line`.

High contrast overrides: in light mode `ink` becomes #0B1F27 (Lagoon) or #2A101A (Coral Reef); in dark mode `ink` becomes #FFFFFF. Then set `sub` and `line` equal to `ink`, make all card and button borders 2px, and make the dashed row use `ink`.

Text size setting multiplies every font size: S 0.9, M 1.0, L 1.15, XL 1.3. Base sizes (px): eyebrow label 12, small 14, body 15, list title 19, section heading 20, screen title 32 (Home) or 30 (Settings).

Fonts (Google Fonts, self-hosted for offline):

- Display: Fredoka 600, fallback `'Arial Rounded MT Bold', system-ui, sans-serif`. Used for titles, game names, card ranks and buttons.
- Body: Nunito 500 and 700, fallback `'Segoe UI', system-ui, sans-serif`.

Shape and spacing: screen padding 20px sides, 28px top. Card and list radius 22px; hero card 28px; icon tiles 60×60 at 18px radius; buttons 14px radius. Gaps 12px in lists, 20px between sections. Every tap target is at least 44×44px.

Card suit colors never change with palette, so games always read the same:

| Suit | Team | Symbol color | Creature color | Face card tint | Face frame |
| --- | --- | --- | --- | --- | --- |
| Hearts | Octopus (red) | #D23F5B | #EE8C9E | #FDE6EB | #F2A9B7 |
| Diamonds | Octopus (red) | #C8501F | #F6B07A | #FFEBDC | #F7BE96 |
| Spades | Manta (black) | #1E3557 | #7A9EB0 | #E3ECF9 | #A9C1E6 |
| Clubs | Manta (black) | #1D4F4A | #6FAFA3 | #DFF2EC | #9ED3C6 |

Card face background is #FFFDF8 with a 1.5px #DDD5C4 border.

## Characters

Build one `<Creature>` component that draws either an octopus or a manta from inline SVG, with props for color, eyes, hat and pose. Everything shares the viewBox `0 -8 64 68`, so hats and faces line up across both species.

Props: `kind` ("octopus" | "manta"), `color` (body hex), `eyes` ("happy" | "open" | "sleepy"; default happy for octopus, open for manta), `hat` ("king" | "queen" | none), `wave` (octopus only), `badge` (a suit symbol path drawn on the forehead or belly), `jewel` (hex for crown jewel and badge), `size` (px).

Color rules: `shade` = body color with each RGB channel multiplied by 0.88 (octopus) or 0.84 (manta). Suction cups are #F2D27A. Eyes, smile and mustache are #1B2533. Line strokes are 1.6 wide with round caps.

Octopus body. Draw in this order: suction cups, back tentacles, head, head shading, front tentacles.

```svg
<!-- Suction cups: 3 per tentacle, peeking under the tentacle edge -->
<g fill="#F2D27A">
  <circle cx="14.1" cy="45.3" r="2.1"/><circle cx="9.1" cy="46" r="2.3"/><circle cx="4.6" cy="45.5" r="2.5"/>
  <!-- right back tentacle (hide when waving) -->
  <circle cx="49.9" cy="45.3" r="2.1"/><circle cx="54.9" cy="46" r="2.3"/><circle cx="59.4" cy="45.5" r="2.5"/>
  <!-- raised waving tentacle (show only when waving) -->
  <circle cx="56" cy="30.5" r="2.1"/><circle cx="60.3" cy="22.7" r="2.3"/><circle cx="61.2" cy="18.2" r="2.4"/>
  <!-- front tentacles -->
  <circle cx="26.5" cy="48.5" r="2.1"/><circle cx="21.7" cy="52.7" r="2.3"/><circle cx="16" cy="55.2" r="2.6"/>
  <circle cx="37.5" cy="48.5" r="2.1"/><circle cx="42.3" cy="52.7" r="2.3"/><circle cx="48" cy="55.2" r="2.6"/>
</g>
<!-- Tentacles: stroke-width 8.5, round caps, no fill -->
<path stroke="SHADE" d="M22 37 Q13 44 5 41.5"/>          <!-- back left -->
<path stroke="SHADE" d="M42 37 Q51 44 59 41.5"/>         <!-- back right (hide when waving) -->
<path stroke="SHADE" d="M44 33 Q55 30 57 18"/>           <!-- waving (show only when waving) -->
<path fill="BODY"  d="M32 4 C44 4 52 12 52 24 C52 32 48 38 42 41 L22 41 C16 38 12 32 12 24 C12 12 20 4 32 4 Z"/>
<path fill="SHADE" d="M24 6 C16 10 12 17 12 24 C12 32 16 38 22 41 L27 41 C21 36 18 29 18 22 C18 15 20 10 24 6 Z"/>
<path stroke="BODY"  d="M27 39 Q23 49 15 51"/>           <!-- front left -->
<path stroke="BODY"  d="M37 39 Q41 49 49 51"/>           <!-- front right -->
```

Manta body:

```svg
<path stroke="SHADE" stroke-width="2.2" fill="none" d="M32 40 Q36 46 31 50 Q26 54 31 59"/>   <!-- wavy tail -->
<circle cx="26" cy="16" r="3.4" fill="BODY"/><circle cx="38" cy="16" r="3.4" fill="BODY"/> <!-- eye bumps -->
<path fill="BODY" d="M32 14 C36 14 40 16 43 20 C48 16 55 12 61 12 C60 20 55 30 46 36 C42 39 37 41 32 41 C27 41 22 39 18 36 C9 30 4 20 3 12 C9 12 16 16 21 20 C24 16 28 14 32 14 Z"/>
<path fill="SHADE" d="M43 20 C48 16 55 12 61 12 C60 20 55 30 46 36 C42 39 37 41 32 41 C38 36 42 28 43 20 Z"/>  <!-- right wing shade -->
<path stroke="SHADE" stroke-width="1.4" fill="none" d="M27 32 Q32 34 37 32 M28 35.5 Q32 37.5 36 35.5"/> <!-- gills -->
```

Face (drawn in base coordinates, then wrapped in `translate(0, -5)` for the octopus or `translate(0, -12)` for the manta):

```svg
<!-- Octopus cheeks: soft white ovals -->
<ellipse cx="21" cy="33" rx="4.6" ry="3.3" fill="#FFF" opacity=".8"/><ellipse cx="43" cy="33" rx="4.6" ry="3.3" fill="#FFF" opacity=".8"/>
<!-- Manta cheeks: small pink -->
<ellipse cx="22.5" cy="33" rx="2.6" ry="1.6" fill="#FF6F86" opacity=".45"/><ellipse cx="41.5" cy="33" rx="2.6" ry="1.6" fill="#FF6F86" opacity=".45"/>
<!-- eyes="open": dots with highlights -->
<circle cx="26" cy="28" r="2.9"/><circle cx="38" cy="28" r="2.9"/>
<circle cx="27" cy="27" r="1" fill="#FFF"/><circle cx="39" cy="27" r="1" fill="#FFF"/>
<!-- eyes="happy": upturned arcs -->
<path d="M23 29 Q26 25.5 29 29 M35 29 Q38 25.5 41 29"/>
<!-- eyes="sleepy": downturned arcs -->
<path d="M23.5 28 Q26 30.5 28.5 28 M35.5 28 Q38 30.5 40.5 28"/>
<!-- smile (everyone except the king) -->
<path d="M29.5 33 Q32 35.5 34.5 33"/>
<!-- queen lashes -->
<path d="M23.4 25.4 L22 23.8 M40.6 25.4 L42 23.8"/>
<!-- king mustache (replaces smile), filled #1B2533 -->
<path d="M32 33 Q29.5 31 26.5 33.5 Q29 35.2 32 33.6 Q35 35.2 37.5 33.5 Q34.5 31 32 33 Z"/>
```

Hats (base coordinates, wrapped in `translate(0, -9)` for the octopus or `translate(0, -2)` for the manta). Fill #F6C752, stroke #D49A22 at 1px:

```svg
<!-- King: gold crown with one jewel -->
<path d="M21 15 L22.5 4 L27.5 10 L32 2 L36.5 10 L41.5 4 L43 15 Z"/>
<circle cx="32" cy="11" r="1.8" fill="JEWEL"/>
<!-- Queen: rounded crown with three white pearls and a jewel -->
<path d="M23 14.5 Q23.5 9 27.5 9.5 Q29 5 32 4.5 Q35 5 36.5 9.5 Q40.5 9 41 14.5 Z"/>
<circle cx="27.5" cy="9.5" r="1.7" fill="#FFF"/><circle cx="32" cy="4.5" r="1.7" fill="#FFF"/><circle cx="36.5" cy="9.5" r="1.7" fill="#FFF"/>
<circle cx="32" cy="11" r="1.5" fill="JEWEL"/>
```

Badge (Aces and suit buddies): the suit path (24×24 box) filled with the suit color, at `translate(28.4 8.5) scale(0.3)` on an octopus forehead or `translate(29 24.5) scale(0.25)` on a manta belly.

Cast:

| Character | Species | Eyes | Extras | Used on |
| --- | --- | --- | --- | --- |
| Happy | Octopus | Happy | None | App icon, menus, Home peeker |
| Waving | Octopus | Open | Raised right tentacle | Home greeting card, Speed opponent |
| Sleepy | Octopus | Sleepy | None | Pause or rest screens, Night tide card back |
| Manta | Manta | Open | None | Home glider |
| Sleepy manta | Manta | Sleepy | None | Home, bottom center |
| Queen | Octopus or manta by suit | Open | Queen crown, lashes | Queen cards |
| King | Octopus or manta by suit | Open | King crown, mustache | King cards |
| Jack | Octopus or manta by suit | Open | No hat | Jack cards |

## Card deck

One standard 52-card deck (no jokers). Red suits are octopuses and black suits are mantas, so the two Solitaire teams differ by shape as well as color. Draw cards as SVG or HTML/CSS components that scale with a single `width` prop, keeping a 5:7 ratio.

Suit symbols (24×24 box), filled with the suit symbol color:

```
Heart:   M12 21 C5 15 2 11.5 2 8 C2 5 4.5 3 7 3 C9 3 11 4.3 12 6 C13 4.3 15 3 17 3 C19.5 3 22 5 22 8 C22 11.5 19 15 12 21 Z
Diamond: M12 2 L20 12 L12 22 L4 12 Z
Spade:   M12 2 C16 7 21 10 21 14 C21 17 19 18.5 16.8 18.5 C15 18.5 13.6 17.6 13 16.5 C13.3 18.8 14.2 20.5 15.5 22 L8.5 22 C9.8 20.5 10.7 18.8 11 16.5 C10.4 17.6 9 18.5 7.2 18.5 C5 18.5 3 17 3 14 C3 10 8 7 12 2 Z
Club:    M7.8 7 a4.2 4.2 0 1 0 8.4 0 a4.2 4.2 0 1 0 -8.4 0 Z M2.8 13.5 a4.2 4.2 0 1 0 8.4 0 a4.2 4.2 0 1 0 -8.4 0 Z M12.8 13.5 a4.2 4.2 0 1 0 8.4 0 a4.2 4.2 0 1 0 -8.4 0 Z M12 10 L9.2 22 L14.8 22 Z M9 12 L12 16.5 L15 12 Z
```

Card layouts, given as proportions of a 140×196 reference card:

| Card type | Background | Center art | Notes |
| --- | --- | --- | --- |
| Ace | #FFFDF8 | Large suit symbol (116px) in the creature color at 30% opacity, with the suit creature (84px) in front wearing the suit badge | Happy eyes |
| 2 to 10 | #FFFDF8 | Standard pip layout in the suit color, pips in the bottom half rotated 180°; the suit creature (56px) peeks up from the bottom edge, about 40% hidden | Keep the creature small so 9s and 10s stay readable |
| Jack, Queen, King | Suit tint | Inner frame inset 24px top and bottom, 36px left and right, 1.5px suit-frame color, 10px radius; creature (62px) centered with a small suit symbol (18px) under it | The creature must sit inside the frame with clear space; no lines should touch or run tangent to the art |

Corner index on every face-up card: rank in Fredoka 600 (22px at reference size) above a 15px suit symbol, top-left at 8px/9px, repeated bottom-right rotated 180°.

At Solitaire size (about 50×70px on most phones) the rank and suit must sit side by side in the top strip (rank 13px, suit 10px), because overlapping Solitaire columns only show about 24px of each card. Hide pips below 80px width and show only the index plus a small centered creature.

Card backs (user picks one in Settings; default Starry sea):

- Starry sea: #13213A, 8px padding, inner 1.5px border in rgba(255,241,194,.45) at 9px radius. Inside, a 3×4 grid alternating tiny octopuses (#EE8C9E) and mantas (#7A9EB0), with two cells replaced by 4-point sparkles in #FFF1C2.
- Night tide: #123B45 with the same inner border, a few soft star dots, and one large sleepy octopus centered.

Card corners have a 14px radius at reference size (8px at play size) and a soft 0 3px 0 shadow at 12% ink.

## Screens

There are four screens: Home, Settings, Solitaire and Speed. All sit on the animated sky background and respect the phone's safe areas (notch and home bar).

### Home

Top to bottom:

1. Header row: an eyebrow label "TIDEPOOL" (12px, 2px letter spacing, `sub`) above "Hi, Night" (32px Fredoka). The name comes from Settings. On the right, a 44×44 settings button (`surface`, 14px radius) with a sliders icon.
2. Greeting card: `accentSoft`, 28px radius. The waving octopus (100px) on the left; "What sounds nice right now?" (20px Fredoka) and "No timers unless you want them." (14px, `sub`) on the right. A small manta (50px) glides in the top-right corner, tilted -10°.
3. Section row: "Your games" (20px Fredoka) with a game count on the right.
4. Game list: one row per game from `games/registry.ts`. Each row is a full-width link, `surface`, 22px radius, at least 84px tall, with a 60×60 icon tile (`accentSoft`), the game name (19px Fredoka), a one-line description (14px, `sub`) and a chevron. Solitaire: "Klondike, at your own pace", icon of three fanned cards with an octopus face. Speed: "A quick race against the octopus", icon of two cards with speed lines, the second card in `manta`. Rows scroll if the list gets long.
5. A dashed row ("More games will live here") with a plus icon, 2px dashed `dash` border.
6. Decoration fixed to the bottom edge, partly cut off: a happy octopus (`octo2`, 66px), a sleepy manta (`manta`, 88px), and a happy octopus (`octo`, 66px), spaced evenly.

Adding a game later should only require a new folder in `games/` and one entry in the registry: `{ id, title, description, icon, component }`.

### Settings

Opened from the Home settings button; a 44×44 back button returns Home. Every change applies instantly and saves to `localStorage`.

| Section | Control | Options and default |
| --- | --- | --- |
| You | Text field "What should I call you?" | Default "Night" |
| Look | Palette: two large tiles with four color swatches each; the selected one gets a 3px `accent` ring | Lagoon (default), Coral Reef |
| Look | Appearance: segmented control with sun and moon icons | Light (default), Dark |
| Look | Card back: two small card previews | Starry sea (default), Night tide |
| Reading | Text size: four "A" buttons in increasing sizes, with a live preview line "Hi, Night. Ready for a game?" | S, M (default), L, XL |
| Reading | High contrast switch | Off |
| Reading | Reduce motion switch, hint "Pauses the sky, calms card moves" | Off |
| Sound | Sound effects switch, hint "Taps, card flips, little bloops. No music." | On |
| Sound | Volume slider with speaker icons and a percent label; dimmed and disabled when sound is off | 0 to 100, step 5, default 60 |
| Sound | "Play a test bloop" button | Plays the tap sound at the current volume |

Switches are real buttons with `role="switch"` and `aria-checked`, 52×32 track, 24px knob. On: track `accent`, knob `onAccent`. Off: track `sub`, knob `surface`.

The card back picker was not in the mockup; it is a small addition so the two backs designed for the deck can both be used. Drop it if you prefer one fixed back.

Settings shape in storage (key `tidepool.settings`):

```ts
{ name: string; palette: 'lagoon' | 'coral'; mode: 'light' | 'dark';
  textSize: 'S' | 'M' | 'L' | 'XL'; highContrast: boolean; reduceMotion: boolean;
  cardBack: 'starry' | 'tide'; sfx: boolean; volume: number }
```

## Background motion

One `<SkyBackground>` component sits behind every screen: drifting clouds in light mode, expanding stars in dark mode. It must stay subtle, use only CSS transforms and opacity (GPU friendly), and never block taps (`pointer-events: none`).

Dark mode stars (40 of them):

- Each star is a soft dot: a circle with `radial-gradient(circle, starCore 0%, starGlow 45%, transparent 72%)`, size 4 to 12px.
- Start positions are scattered around the screen center: random angle, distance 10px to 45% of the shorter screen side (stretched 1.5× vertically on tall screens).
- Each star travels outward along its own angle, about 520px horizontally or 676px vertically, so it leaves the screen. The motion uses `ease-in`, so stars speed up slightly as they move out, like space expanding.
- Keyframes: start at scale 0.4 and opacity 0, fade in by 15%, stay visible until 80%, end at scale 1.5 and opacity 0.
- Each star has a peak brightness between 0.35 and 1.0 (set on a wrapper so the animation's fade is multiplied by it), a duration of 50 to 100s, and a negative delay so the sky is already full when the screen opens.
- Use a seeded random generator so the layout is stable between renders. Implementation can be CSS keyframes per direction (12 directions, every 30°) or a single keyframe that reads `--dx` and `--dy` custom properties.

Light mode clouds (5 of them):

- Cloud shape (viewBox 0 0 80 44), filled with `cloud`: circles at (24,27) r12, (40,19) r15, (57,26) r11, plus a rounded rect at x12 y26, 58×13, radius 6.5.
- Widths 90 to 160px (height = 0.55 × width), opacity 0.5 to 0.85, spread down the screen in five bands.
- Each drifts left to right from 200px off the left edge to off the right edge, linear, 110 to 190s per pass, with negative delays so they start mid-screen.

Reduce motion: when the setting is on, or the phone's `prefers-reduced-motion` is set, pause all sky animations in place (`animation-play-state: paused`) so the sky still shows but does not move. Also pause the sky when the app is hidden (`visibilitychange`) to save battery.

Switching light and dark crossfades between the two skies over 400ms (instant when reduce motion is on).

## Sound effects

Sound effects only, no music. Generate every sound with the Web Audio API in `sound/sfx.ts`, so there are no audio files. All sounds are short (under 0.4s), soft and rounded: sine or triangle waves with quick fade-ins and fade-outs, never harsh square waves.

Volume: master gain = volume / 100 × 0.3. The "Sound effects" switch mutes everything. Create the `AudioContext` on the first tap (browsers block audio before a user gesture), and note that iPhone silent mode may also mute web audio.

| Event | Sound |
| --- | --- |
| Tap a button or list row | Bloop: sine sweeping 420 → 900 Hz over 0.12s, fade out by 0.25s |
| Flip or draw a card | Soft tick: filtered noise burst, 0.05s |
| Card lands in a valid spot | Low pluck: triangle at about 330 Hz, 0.15s |
| Invalid move (card returns) | Gentle double low note, quieter than the others |
| Card goes to a foundation | Rising two-note chime |
| Win | Four-note rising arpeggio plus a sparkle shimmer |
| Speed: you play faster than the octopus | Quick bright bloop |
| Speed: stalemate flip | Whoosh: noise swept through a filter, 0.3s |

Keep a `play(name)` function that checks the settings, so games never touch audio directly.

## Game 1: Solitaire (Klondike)

Standard Klondike, tuned to be calm: unlimited undo, no timer or score unless turned on, and the game in progress is saved automatically.

Rules (`games/solitaire/rules.ts`, pure functions, fully unit-tested):

- Deal 7 tableau columns with 1 to 7 cards, top card face up; the other 24 cards form the stock.
- Tableau builds down in alternating team (octopus on manta, manta on octopus). Only a King can go in an empty column. Any face-up run can move together.
- Foundations (4) build up by suit from Ace to King.
- Draw 1 card from stock to waste by default; Draw 3 is an option. Unlimited passes through the stock.
- A face-down card flips automatically when uncovered.
- Win when all 52 cards are on the foundations.

Layout on the phone:

- Top bar: back button, "Solitaire", and a menu button (New game, Draw 1 or 3, Show moves and time).
- Row 1: stock and waste on the left, four foundations on the right (empty foundation slots show a faint suit outline).
- Row 2: seven tableau columns. Card width = (screen width − 16px − 6 × 5px) / 7, about 50px on most phones. Face-down cards overlap by 10px; face-up cards by 24px, compressing if a column would run off screen.
- Bottom bar: Undo (large, thumb-friendly) and Hint.
- Background: the sky, with a faint table panel (`surface` at 40% in light mode; #0D1A2B in dark mode).

Interaction:

- Drag a card or run with Pointer Events; it follows the finger and snaps to the nearest valid pile on release, or slides back with the invalid sound.
- Tap a card to auto-move it to the best legal spot (foundation first, then tableau). Double-tap does the same for foundations only.
- Tap the stock to draw; tap the empty stock to recycle the waste.
- Hint briefly lifts and glows a playable card.
- When every card is face up and the stock is empty, offer an "Auto finish" button.
- Animations: 180ms card slides, 220ms flips. With reduce motion, cards move instantly with a short fade.

Win screen: cards cascade to the foundations, then a card shows the king and queen (octopus and manta) cheering, "You did it, Night", and New game / Home buttons.

Save the full game state to `localStorage` (`tidepool.solitaire`) after every move, and restore it when the game opens.

## Game 2: Speed

Speed is a real-time race against a computer opponent, the waving octopus. It defaults to a gentle pace, because the app is for calming down, not stress.

Rules (`games/speed/rules.ts`, pure and unit-tested):

- Shuffle one deck. Each player gets a 20-card pile: 5 go to their hand, 15 stay as their draw pile.
- Two side piles of 6 cards sit face down between the players. Flip the top of each to start the two center piles.
- Either player can play a card onto either center pile if it is one rank above or below the top card. Ranks wrap, so King and Ace connect. Suits and teams don't matter.
- After playing, a hand refills to 5 from that player's draw pile automatically.
- When neither player can move, after a 1.5s pause both side piles flip a new card onto the center piles (whoosh sound).
- If the side piles run out, shuffle the center piles except their top cards into new side piles.
- The first player to empty both hand and draw pile wins.

Opponent AI (`games/speed/ai.ts`): on each tick it plays a random legal card after a delay. Pace setting in the game menu: Gentle 2.2s (default), Normal 1.4s, Quick 0.9s, each with ±30% randomness. The octopus never plays two cards within 400ms.

Layout (portrait):

- Top: the octopus avatar (56px, happy eyes; switches to open eyes when it plays a card), its 5 hand cards face down in a small fan, and its draw pile count.
- Middle: the two center piles (about 80px wide), with the side piles as small stacks beside them.
- Bottom: your 5 hand cards large (about 64px wide, slightly fanned) and your draw pile count. The bottom bar has Pause and the menu.

Interaction: drag a hand card onto a center pile, or tap it to play on the first legal pile. Legal center piles glow softly while a card is held. A card that cannot be played gives a little shake and the invalid sound. Pause stops the opponent and dims the table.

End screen: "You won, Night" with the octopus clapping, or "The octopus won this one" with it waving, and Play again / Home buttons. No score history unless added later.

## Game 3: Tide Pairs

A memory game: flip two face-down cards at a time and find the matching pairs. No timer, no score and no losing unless turned on. Made for winding down.

Rules (`games/pairs/rules.ts`, pure and unit-tested):

- A pair is two cards of the same rank on the same team: 7 of hearts with 7 of diamonds (both octopus), or Queen of spades with Queen of clubs (both manta). Choose which ranks and teams to use at random from the deck, so every board looks different.
- Board sizes: 12 cards (6 pairs), 16 cards (8 pairs, default) or 20 cards (10 pairs). Shuffle and lay them out face down.
- Tap a face-down card to flip it. After the second flip:
  - Match: both cards stay face up.
  - No match: both flip back after 1s, or as soon as you tap a third card.
- You can never have more than two unmatched cards face up.
- Win when every pair is found. Count moves (one move = two flips) for the optional stats.

Layout on the phone:

- Top bar: back button, "Tide Pairs", and a menu button (New game, Board size 12 / 16 / 20, Show moves and time).
- A centered grid of 4 columns (3, 4 or 5 rows). Card width = (screen width − 40px − 3 × 10px) / 4, capped so the grid fits the screen height without scrolling. Face-down cards use the card back chosen in Settings.
- No bottom bar. The menu has everything.
- Background: the sky with the same faint table panel as Solitaire.

Interaction and feel:

- Each tap flips a card (220ms flip, soft tick). A match plays the rising two-note chime, and the two cards do a small happy hop; their creatures switch to happy eyes. A miss makes no buzz or "wrong" sound; the cards just flip back quietly. Nothing should feel like a penalty.
- With reduce motion, cards swap faces with a short fade and nothing hops.
- Each card is a button. Face down it announces "Face-down card, row 2, column 3"; face up it announces the card name ("7 of hearts").

Win screen: all the creatures from the found pairs peek up from the bottom, with a sleepy-happy octopus in the middle, "All pairs found, Night", and New game / Home buttons. Win sound.

Save the game in progress to `localStorage` (`tidepool.pairs`), including which cards are found and the board size, and restore it when the game opens.

Home entry: "Tide Pairs", "Find the matching sea friends", icon of two face-up cards side by side with the same octopus face.

## Game 4: Blackjack

Classic Blackjack against a dealer, with no money. You play hands for fun, and an optional tally keeps track of how it's going.

Rules (`games/blackjack/rules.ts`, pure and unit-tested):

- One 52-card deck as the shoe. Reshuffle when fewer than 15 cards remain before a hand starts (whoosh sound, short "Shuffling…" note).
- Card values: 2–10 at face value, Jack, Queen and King count 10, an Ace counts 11 or 1, whichever is better without going over 21. A hand with an Ace still counting 11 is "soft" (for example, "Soft 17").
- Deal: you get two cards face up; the dealer gets one face up and one face down (the hole card).
- Blackjack (an Ace plus a 10-value card in the first two cards) wins straight away unless the dealer also has one, which is a push (a tie). If the dealer's up card is an Ace or 10-value card, the dealer peeks; a dealer blackjack ends the hand at once.
- Your turn: Hit (take a card) or Stand (stop). Over 21 is a bust and loses straight away.
- Split: if your first two cards have the same rank, you can split them into two hands that are played one after the other. One split per round, and split Aces get one card each.
- Dealer's turn: flip the hole card, then draw until the total is 17 or more. The dealer stands on soft 17.
- Results per hand: win, lose or push.

Layout on the phone:

- Top bar: back button, "Blackjack", and a menu button (New shoe, Show tally, Show hints).
- Top: the dealer, the King manta (56px, gold crown and mustache), with its hand in a slightly overlapping row and its total once the hole card is turned (until then, only the up card's value).
- Middle: the shoe as a small stack of card backs with a count, and a one-line result after each hand ("You win!", "Push", "The King manta wins this one", "Blackjack!").
- Bottom: your hand(s) at about 72px wide, overlapping, with the total above each ("Soft 17", "21", "Bust"). With a split, the hand being played is highlighted and the other is dimmed.
- Bottom bar: big thumb-friendly Hit and Stand buttons, plus Split when it's allowed. After the hand, they're replaced by one "Next hand" button.
- Background: the sky with the same faint table panel.

Interaction and feel:

- Cards slide from the shoe to each hand (180ms) and the hole card flips over (220ms). The dealer draws one card every 500ms so you can follow along (faster with reduce motion).
- Sounds: soft tick for each card, rising chime for a win, gentle double low note for a bust, the four-note win arpeggio for a blackjack. A push makes no sound.
- Hints (off by default): when on, the button you'd want under basic strategy gets a soft glow. It's a quiet tip, not a correction.
- Tally (off by default): "Wins 5 · Losses 3 · Pushes 1" under the title, with a reset in the menu.
- The King manta's face matches the hand: open eyes while dealing, happy (with a little bob) when you win, sleepy when you lose.

Save the shoe, the hand in progress and the tally to `localStorage` (`tidepool.blackjack`), and restore them when the game opens.

Home entry: "Blackjack", "Get to 21 while the King manta deals", icon of an Ace and a King fanned, with "21" in a small accent-colored circle.

## Build phases

Build in seven phases, then a polish pass and two more games (phases 8–11). Ask Claude Code to stop after each one so you can check it on your phone before it continues.

1. **Foundation.** Vite + React + TypeScript project, PWA plugin, hash router, theme tokens as CSS variables, fonts, settings context with `localStorage`. Deploy to a free host and install on the phone. Checkpoint: a blank "Hi, Night" screen opens from your home screen, full screen, and works in airplane mode.
2. **Art.** `Creature`, suit symbols, `Card` (all 52 faces at reference and play sizes), both card backs, cloud. Add a hidden `#/gallery` page showing every character and card. Checkpoint: the gallery matches the mockup screenshots.
3. **Home, Settings and sky.** Home layout, game registry, Settings with every control working, and the animated sky. Checkpoint: change palette, mode, text size and contrast and see Home update instantly; stars in dark mode, clouds in light mode, everything still with Reduce motion on.
4. **Sound.** `sfx.ts` with every sound and the test bloop. Checkpoint: volume and the on/off switch work; sounds feel soft.
5. **Solitaire rules.** `rules.ts` with unit tests for dealing, legal moves, flipping, foundations, stock recycling, undo and winning. Checkpoint: all tests pass.
6. **Solitaire screen.** Table layout, drag and tap moves, animations, hint, auto finish, win screen, autosave. Checkpoint: play a full game on your phone; close and reopen the app mid-game and continue.
7. **Speed.** Rules with tests, opponent AI with pace setting, table layout, pause, end screens. Checkpoint: play on each pace; a stalemate flips new center cards correctly.

After phase 7, do one polish pass using the checklist below (phase 8), then add the two later games:

8. **Polish pass.** Work through the checklist below. Checkpoint: every item checked on the phone.
9. **Tide Pairs.** Rules with tests (dealing pairs, flipping, matching, flip-back, winning, board sizes), the grid screen, win screen and autosave. Checkpoint: finish a game at each board size; close and reopen the app mid-game and continue.
10. **Blackjack rules.** `rules.ts` with tests for hand values (soft and hard), blackjack, dealer peek, dealer drawing to 17 and standing on soft 17, busts, pushes, splitting (including split Aces), and reshuffling the shoe. Checkpoint: all tests pass.
11. **Blackjack screen.** Table layout, dealing animations, Hit / Stand / Split, the dealer's turn, results, hints, tally and autosave. Checkpoint: play 20 hands on the phone, including a split and a blackjack.

## Polish checklist and open decisions

Accessibility and polish:

- [x] Every tap target is at least 44×44px, including cards in hand and stock. (Exception by design: overlapped Solitaire cards show a 24px strip, from the 24px overlap above; the whole card is the target once uncovered.)
- [x] Text meets 4.5:1 contrast in all four palette and mode combinations, and 7:1 with high contrast on. (Needed: red rank text darkened to #BF3953 / #B84A1D, or #8B2A3C / #883615 with high contrast; high-contrast light accents darkened to #21615C / #94394E. Guarded by tests in `theme/tokens.test.ts`.)
- [x] XL text size never overflows rows; long text wraps instead.
- [x] Buttons, switches and the slider are real controls with labels; icon-only buttons have `aria-label`. (axe-core finds no issues on any screen.)
- [x] Cards announce rank and suit to screen readers (for example "7 of hearts").
- [x] Reduce motion stops the sky and shortens card animations; the phone's own setting is respected.
- [x] Red and black teams are distinguishable by shape alone (check in grayscale).
- [x] Layout respects the notch and home bar (`env(safe-area-inset-*)`). (In code; confirm on the phone.)
- [x] App works fully offline after the first load.
- [x] Sound never plays when the switch is off or volume is 0.

Open decisions (defaults are set; change them before or during the build):

- [ ] Jacks have no accessory. A small bow tie or forehead star would set them apart from number cards at a glance.
- [ ] Card back picker in Settings, or one fixed back.
- [ ] Speed opponent: the octopus (current), or a manta for variety.
- [ ] Solitaire scoring and timer: off by default; keep as an option or drop entirely.
- [ ] Tide Pairs default board size: 16 cards (current), or start smaller at 12.
- [x] Blackjack dealer: the King manta (chosen by the owner).
- [ ] Blackjack pretend betting with shells (a starting pile of 100, bets of 5–25, blackjack pays 3 to 2, plus Double down): off for now; add later if a plain tally feels too flat.
