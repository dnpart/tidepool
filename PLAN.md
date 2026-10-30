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

Props: `kind` ("octopus" | "manta"), `color` (body hex), `eyes` ("happy" | "open" | "sleepy"; default happy for octopus, open for manta), `hat` ("king" | "queen" | none), `wave` (octopus only), `badge` (a suit symbol path drawn on the forehead or belly), `jewel` (hex for crown jewel and badge), `bowtie` (hex; a small bow tie under the smile, centered at (32, 38.6) on the octopus and (32, 27.2) on the manta, with a knot shaded ×0.75), `size` (px).

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
| Jack | Octopus or manta by suit | Open | Bow tie in the suit symbol color | Jack cards |

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

## Winter palette and the Fox + Owl deck

Approved by the owner on Oct 30, 2026. This adds a third palette (Winter), lets each palette bring its own sky, and adds a second deck (Fox + Owl) that can be switched in Settings. The deck also picks who runs the games. Nothing about the Octo + Manta deck or the Lagoon and Coral Reef palettes changes.

Source files in `/design`:

- `winter-home-light.png`, `winter-home-dark.png`: Home in Winter with the Fox + Owl deck.
- `settings-winter-deck.png`: Settings with the Winter palette tile and the Deck picker.
- `fox-owl-deck.png`: the whole deck (suit buddies, characters, card faces, who runs the games, play size).
- `fox-owl-deck.svg`: **the master art**, drawn by the owner in Illustrator. Every fox and owl shape comes from this file, exactly as drawn. Never redraw them by hand.

### Winter palette

Palette and deck are separate settings: any palette works with either deck.

| Token | Winter light | Winter dark |
| --- | --- | --- |
| `bg` | #E8F1F8 | #0B1521 |
| `surface` | #FFFFFF | #142333 |
| `ink` | #16324A | #E6F0F8 |
| `sub` | #46607A | #A7BACB |
| `accent` | #2C6590 | #8CC3EC |
| `onAccent` | #FFFFFF | #0B1521 |
| `accentSoft` | #D5E5F2 | #1C3348 |
| `line` | #CFDEEA | #26405A |
| `octo` / `octo2` / `manta` (Octo + Manta decor) | #EE8C9E / #F6B07A / #7A9EB0 | #EE8C9E / #F6B07A / #8DB0C2 |
| `snow` (flake color) | #FFFFFF | #F4F9FF |
| `crystal` (big snowflake stroke) | #8FB2D0 | #DCEBFA |
| `cloud`, `starCore`, `starGlow` | (none) | (none) |

High contrast: light `ink` #0A1C2C and `accent` #1F4C70; dark `ink` #FFFFFF. Then the usual rules (`sub` and `line` equal `ink`, 2px borders). Measured: light ink on bg 15.1:1, white on the light accent 9.0:1. Add Winter to `theme/tokens.test.ts`.

The Settings palette tile for Winter shows #E8F1F8, #2C6590, #8CC3EC, #16324A. That third swatch is the dark-mode accent, not `octo`, so `swatches()` in `SettingsScreen.tsx` needs a Winter override. With three palettes, the two-column grid wraps Winter onto a second row (see the screenshot). Each tile also shows its sky under the name: "Clouds by day, stars by night" for Lagoon and Coral Reef, and "Snowfall, day and night" for Winter.

### Sky per palette

Lagoon and Coral Reef keep clouds by day and stars by night, exactly as now. Winter snows in both modes; it has no clouds and no stars. Reduce motion, pausing when the app is hidden, `pointer-events: none` and the 400ms light/dark crossfade all apply to snow too.

Snowflakes (light: 44 flakes, seed 11; dark: 48 flakes, seed 23; seeded random, as with the stars):

- Each flake is a round dot. Light: color `snow`, `box-shadow: 0 0 0 1px rgba(70,110,150,.16), 0 1px 3px rgba(70,110,150,.25)` so white flakes show on the pale sky. Dark: color `snow`, `box-shadow: 0 0 6px rgba(205,228,250,.65)`.
- Size 3 to 7.5px in light and 2.5 to 7px in dark. Peak opacity 0.65 to 1 in light and 0.55 to 1 in dark.
- Fall: start 24px above the screen at a random `left` (0 to 100%), and fall linearly until just past the bottom edge. Each flake takes 9 to 17s, with a negative delay so the sky is already full.
- Sway: an inner wrapper moves from -9px to +9px and back (`ease-in-out`, `alternate`), every 2.6 to 5s.

Big snowflakes (3 of them, now and then):

- Six-armed crystal, drawn in a 24×24 box, stroke `crystal`, width 1.6, round caps. Arms: `M12 1.5 V22.5 M2.9 6.75 L21.1 17.25 M2.9 17.25 L21.1 6.75`. Branch tips: `M9.5 3.8 L12 6 L14.5 3.8 M9.5 20.2 L12 18 L14.5 20.2 M3.6 10 L6.8 10.5 L5.8 7.4 M18.2 16.6 L17.2 13.5 L20.4 14 M3.6 14 L6.8 13.5 L5.8 16.6 M18.2 7.4 L17.2 10.5 L20.4 10`. In dark mode, add `drop-shadow(0 0 4px rgba(205,228,250,.7))`.
- Keyframes per cycle: at 0% it sits 40px above the screen, rotated 0°, opacity 0. By 5% it is fully visible. At 46% it reaches the bottom, rotated 150°. From 47% to 100% it stays hidden below the screen. So each crystal falls for about half its cycle, then rests out of sight.
- Light: left 16%, 58%, 80%; sizes 20, 16, 22px; cycles 27s, 34s, 41s; delays -3s, -16s, -31s. Dark: left 22%, 64%, 86%; same sizes; cycles 29s, 36s, 43s; delays -8s, -22s, -2s.

### Decks

New setting `deck: 'sea' | 'arctic'` (default `'sea'`, so existing installs don't change). Settings gets a "Deck" section after Appearance, before the card back picker (see `settings-winter-deck.png`):

- Two full-width option buttons (radio behavior, like the palette tiles), min 92px tall, 22px radius, selected one gets the 3px `accent` ring.
- Each has a 104×60 preview tile (`accentSoft`, 16px radius, clipped) showing the deck's two characters at 48px, bottom-aligned: the happy octopus and the manta, or the happy Hearts fox and the Spades owl.
- Name and one line: "Octo + Manta", "Octopuses and manta rays"; "Fox + Owl", "Arctic foxes and snowy owls".
- Under the two buttons: "Your deck also picks your company: who races you in Speed, who deals Blackjack, and who says hello on Home." (14px, `sub`).

The deck decides every character in the app and some wording:

| Where | Octo + Manta (now) | Fox + Owl |
| --- | --- | --- |
| Home greeting card | Waving octopus (100px), small manta top right | Waving fox (100px), small Spades owl (46px, open eyes) top right, tilted -10° |
| Home bottom edge | Happy octopus, sleepy manta, happy octopus | Happy Diamonds fox (66px), sleepy Spades owl (80px, 6px higher), happy Hearts fox (66px) |
| Home descriptions | "A quick race against the octopus", "Find the matching sea friends", "Get to 21 while the King manta deals" | "A quick race against the fox", "Find the matching snow friends", "Get to 21 while the King owl deals" |
| Home game icons | Octopus faces, manta card | Fox faces, owl card (see `winter-home-light.png`; redraw the little faces from the master fox head) |
| Speed opponent | The waving octopus | The Diamonds fox (open eyes when it plays, happy otherwise, the waving fox for "won this one") |
| Speed and Blackjack text | "The octopus won this one", "The King manta wins this one" | "The fox won this one", "The King owl wins this one" |
| Blackjack dealer | King manta | King owl: open eyes while dealing, happy with a bob when you win, sleepy when you lose |
| Solitaire win | King and queen cheering | Queen fox and King owl, both with happy eyes |
| Pause screens, Tide Pairs win | Sleepy octopus | Sleepy fox |
| Cards, card backs, Tide Pairs cards | Octopuses and mantas | Foxes and owls (below) |

Keep every deck-dependent piece in one place (for example `src/decks/`, with a `sea` and an `arctic` entry), so a later deck is one new entry.

### Fox + Owl art

All characters share the `0 -8 64 68` viewBox like the octopus and manta, so card layouts and sizes don't change.

`design/fox-owl-deck.svg` has ten cells, five per row, each a top-level layer: foxes in row 0 (Hearts, Diamonds, Waving, Sleepy, Queen) and owls in row 1 (Spades, Clubs, Sleepy owl, Jack, King). Each cell is the character at 6×. For column `c` and row `r`, the cell's origin is `ox = 64 + 448c`, `oy = 168 + 528r`. Map any point back into the viewBox with `x = (X - ox) / 6`, `y = (Y - oy) / 6`, which is `transform="matrix(1/6 0 0 1/6 -ox/6 -oy/6)"` on the cell's group. The waving fox's five orange toe beans are loose circles at the end of the file; they belong to the Waving cell.

Write a script (`scripts/fox-owl-art.mjs`) that reads the SVG and generates `src/art/foxOwlArt.ts`: one entry per cell, with its layers in file order, styles from the `<style>` classes inlined as attributes, text labels dropped. Don't rebuild characters from shared parts: the owner tweaked heads, bodies and faces cell by cell, so each cell is its own drawing. Commit the generated file. If the owner edits the SVG again, rerun the script.

Cast and where each one comes from:

| Character | Source | Changes |
| --- | --- | --- |
| Hearts fox (happy) | Hearts cell | None |
| Diamonds fox (happy) | Diamonds cell | None |
| Diamonds fox (open eyes) | Diamonds cell | Swap its Eyes layer for the Waving cell's Eyes layer |
| Waving fox | Waving cell (Diamonds ears) | None |
| Sleepy fox | Sleepy cell (Hearts ears) | None |
| Queen fox, Hearts | Queen cell | None |
| Queen fox, Diamonds | Queen cell | Inner ears #F6B07A |
| Cheering Queen fox | Queen cell | Swap its Eyes layer for the Hearts cell's Eyes layer |
| Spades owl, Clubs owl | Spades, Clubs cells | None |
| Sleepy owl | Sleepy owl cell (Clubs) | For Spades: #3F7A73 → #5873A6, #2F625C → #3E5A92 |
| Jack owl | Jack cell (Clubs) | For Spades: same recolor as above |
| King owl | King cell (Spades; crown behind the tufts) | For Clubs: #5873A6 → #3F7A73, #3E5A92 → #2F625C |
| Happy or sleepy King owl | King cell | Replace the Eyes layer with the shared happy or sleepy eye arcs |
| Suit buddy owls (Aces, Settings, Gallery) | Spades or Clubs cell | Drop Chest speckles and Wing marks so the belly badge sits clear; happy eye arcs |

Shared eye arcs (stroke #3E4A5A, width 1.6, round caps): happy `M23.2 22 Q26 18.8 28.8 22 M35.2 22 Q38 18.8 40.8 22`, sleepy `M23.6 21 Q26 23.4 28.4 21 M35.6 21 Q38 23.4 40.4 21`. Badges sit at `translate(28.4 11) scale(0.3)` on a fox's forehead and `translate(29 37) scale(0.25)` on an owl's belly.

**Missing art: draw these first and get the owner's OK before building cards.** The deck needs a Jack, Queen and King for every suit, but three of them haven't been drawn:

- Jack fox (Hearts, Diamonds): a fox with the Jack owl's bow tie under the chin, in the suit symbol color.
- King fox (Hearts, Diamonds): a fox with the King owl's crown between the ears and the King owl's mustache in place of the mouth.
- Queen owl (Spades, Clubs): an owl with the Queen fox's pearl crown behind the tufts (like the King's) and the Queen fox's lashes.

Compose them from the existing layers. Add them to `fox-owl-deck.svg` as new cells (a third row, same 448 × 528 grid) and show them in `#/gallery`. Then stop so the owner can check them, and adjust them in Illustrator if needed.

### Fox + Owl card colors

Winter colors with more contrast than the sea deck, so the white owls and blue-gray foxes stand out from their cards. Red and black teams still differ by shape (fox or owl) as well as color.

| Suit | Team | Symbol | Rank text | High contrast rank | Ace big symbol | Face card tint | Face frame |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Hearts | Fox (red) | #B5294A | #9E2341 | #7E1A33 | #EE8C9E at 30% | #F7D3DC | #E07C93 |
| Diamonds | Fox (red) | #B8461A | #9C3A12 | #7A2C0B | #F6B07A at 30% | #FADBC2 | #E39A5E |
| Spades | Owl (black) | #1E3557 | #1E3557 | #0E1C36 | #9DB6E2 solid | #9DB6E2 | #4E6BA3 |
| Clubs | Owl (black) | #1D4F4A | #1D4F4A | #0A2420 | #94C8B6 solid | #94C8B6 | #3F7A73 |

Card face #FBFCFE with a 1.5px #C9D6E4 border (snow white with an icy edge, instead of cream). Suit buddy circles use the face card tint. Measured: owl on its face card tint 1.6 to 1.75:1 (it was 1.0:1 on the sea deck tints); ranks at least 4.9:1 on their tint and 7.3:1 with high contrast. Add these to a contrast test like `theme/tokens.test.ts`. Layout, sizes and pip positions are the same as the sea deck. Known and accepted: on number cards, the peeking owl is white on a near-white face.

Card backs for Fox + Owl have no mockup yet (see Open decisions). Default: keep both back layouts with the same names, and swap the creatures: tiny Hearts foxes and Spades owls in the Starry sea grid, and the sleepy fox on Night tide.

### Storage

```ts
{ ...; palette: 'lagoon' | 'coral' | 'winter'; deck: 'sea' | 'arctic' }
```

Unknown values fall back to the defaults, as now. Saved games keep working when the deck changes; only the drawings change.

## Build phases

Build in seven phases, then a polish pass and two more games (phases 8–11), then Winter and the Fox + Owl deck (phases 12–15). Ask Claude Code to stop after each one so you can check it on your phone before it continues.

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

Then Winter and the Fox + Owl deck (see "Winter palette and the Fox + Owl deck"):

12. **Winter palette and snow.** Winter tokens (with high contrast and tests), the Winter palette tile, and the sky picked by palette: snowflakes and big crystals for Winter. Checkpoint: Winter light and dark look like `winter-home-light.png` and `winter-home-dark.png`; snow falls in both modes and stops with Reduce motion; Lagoon and Coral Reef still have clouds and stars.
13. **Fox + Owl art.** The art script and generated `foxOwlArt.ts`, a Fox + Owl section in `#/gallery` with every character from the cast table, then the three missing characters (Jack fox, King fox, Queen owl) composed and added to the master SVG. Checkpoint: the gallery characters match `fox-owl-deck.png`, and the owner approves the three new ones.
14. **Fox + Owl cards and the Deck setting.** The `deck` setting and Settings section, deck-dependent card colors, all 52 faces at reference and play sizes, and the Fox + Owl card backs. Checkpoint: the gallery shows the full deck matching `fox-owl-deck.png`, and switching decks in Settings changes it at once.
15. **The deck runs the games.** Home greeting, bottom edge, icons and descriptions; Speed opponent; Blackjack dealer; Solitaire win; Tide Pairs cards and win; pause screens; all wording from the deck table. Checkpoint: play each game with each deck on the phone, and switch decks mid-game without losing the game.

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

- [x] Jacks wear a small bow tie in their suit color (chosen by the owner), so they stand apart from number cards at a glance.
- [ ] Card back picker in Settings, or one fixed back.
- [ ] Speed opponent: the octopus (current), or a manta for variety.
- [ ] Solitaire scoring and timer: off by default; keep as an option or drop entirely.
- [ ] Tide Pairs default board size: 16 cards (current), or start smaller at 12.
- [x] Blackjack dealer: the King manta (chosen by the owner).
- [x] Winter palette with snow day and night; each palette brings its own sky (approved by the owner).
- [x] Fox + Owl deck as a second deck, switched in Settings, and the deck picks who runs the games (approved by the owner).
- [ ] Fox + Owl card backs: reuse the two back layouts with foxes and owls (default), or design winter backs first.
- [ ] Jack fox, King fox and Queen owl: composed from existing parts in phase 13, waiting for the owner's OK.
- [ ] Blackjack pretend betting with shells (a starting pile of 100, bets of 5–25, blackjack pays 3 to 2, plus Double down): off for now; add later if a plain tally feels too flat.
