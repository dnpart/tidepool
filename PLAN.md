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
5. (Removed once Dominoes and Pond Hop were in, at the owner's request: a dashed "More games will live here" row.)
6. Decoration fixed to the bottom edge, partly cut off: a happy octopus (`octo2`, 66px), a sleepy manta (`manta`, 88px), and a happy octopus (`octo`, 66px), spaced evenly.

Adding a game later should only require a new folder in `games/` and one entry in the registry: `{ id, title, description, icon, component }`.

### Settings

Opened from the Home settings button; a 44×44 back button returns Home. Every change applies instantly and saves to `localStorage`.

| Section | Control | Options and default |
| --- | --- | --- |
| You | Text field "What should I call you?" | Default "Night" |
| Look | Palette: two large tiles with four color swatches each; the selected one gets a 3px `accent` ring | Lagoon (default), Coral Reef |
| Look | Appearance: segmented control with sun and moon icons | Light (default), Dark |
| Look | Card back: two small card previews (removed in phase 16: the back now follows the palette and deck) | Starry sea (default), Night tide |
| Reading | Text size: four "A" buttons in increasing sizes, with a live preview line "Hi, Night. Ready for a game?" | S, M (default), L, XL |
| Reading | High contrast switch | Off |
| Reading | Reduce motion switch, hint "Pauses the sky, calms card moves" | Off |
| Sound | Sound effects switch, hint "Taps, card flips, little bloops. No music." | On |
| Sound | Volume slider with speaker icons and a percent label; dimmed and disabled when sound is off | 0 to 100, step 5, default 60 |
| Sound | "Play a test bloop" button | Plays the tap sound at the current volume |

Switches are real buttons with `role="switch"` and `aria-checked`, 52×32 track, 24px knob. On: track `accent`, knob `onAccent`. Off: track `sub`, knob `surface`.

The card back picker was not in the mockup; it was a small addition so the two backs designed for the deck could both be used. Phase 16 replaced it: see "Card backs follow the palette".

Settings shape in storage (key `tidepool.settings`):

```ts
{ name: string; palette: 'lagoon' | 'coral'; mode: 'light' | 'dark';
  textSize: 'S' | 'M' | 'L' | 'XL'; highContrast: boolean; reduceMotion: boolean;
  cardBack: 'starry' | 'tide'; sfx: boolean; volume: number }
// Phase 16 removed cardBack (the back follows the palette and deck) and added deck: 'sea' | 'arctic'
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

Card backs for Fox + Owl: see "Card backs follow the palette" below (phase 16). Until then, both back layouts were used with foxes and owls in place of the sea creatures.

### Storage

```ts
{ ...; palette: 'lagoon' | 'coral' | 'winter'; deck: 'sea' | 'arctic' }
```

Unknown values fall back to the defaults, as now. Saved games keep working when the deck changes; only the drawings change.

### Card backs follow the palette

Approved by the owner on Oct 30, 2026 (`design/card-backs-by-palette.png`). Each deck has one card back per palette, picked automatically, so the Card back choice in Settings goes away (and `cardBack` leaves the saved settings; an old saved value is simply ignored). Light and dark mode use the same back.

| Deck | Lagoon | Coral Reef | Winter |
| --- | --- | --- | --- |
| Octo + Manta | Night tide (as now) | Coral garden (new) | Starry sea (as now) |
| Fox + Owl | Northern lights | Winter knit | Snowfall |

All four new backs use the same frame rules as Starry sea and Night tide: 140×196 reference card, 14 radius, inner border inset 8 (1.5px, 9 radius); at play size (under 80px wide) 8px radius, 4px inset, 5px inner radius. Coordinates below are on the 140×196 card. "Crystal" is the six-armed crystal from the Winter sky (24×24 box). Every fox comes from the master art: the fox head is the happy Hearts fox cropped to `viewBox="6 -4 52 44"` (as in the game icons), centered on the given point; the sleepy fox is the Sleepy cell.

**Snowfall** (Fox + Owl, Winter). Background #1F4775; ice #DCEBFA; inner border rgba(220,235,250,.55).
- Full: crystals 17 wide, stroke 1.8 (in the 24 box), centered at (34,30) (70,30) (106,30) (52,52) (88,52) (52,144) (88,144) (34,166) (70,166) (106,166). Dots r1.6, ice at 70%, at (22,98) (118,98) (22,52) (118,52) (22,144) (118,144) (34,76) (106,76) (34,120) (106,120). Medallion: circle (70,98) r31 #F5F8FC, ring r35 in ice, 1.2 wide, 60%; fox head 48 wide centered on (70,97).
- Play size: circle (70,98) r40 #F5F8FC, fox head 64 wide on (70,97), crystals 22 wide (stroke 2.4) at (70,36) and (70,160).

**Northern lights** (Fox + Owl, Lagoon). Background #0F2438; inner border rgba(220,235,250,.45).
- Aurora ribbons, blurred together (Gaussian blur 3 at full size, 4.5 at play size): `M0 40 C40 14 84 50 140 18 L140 34 C84 70 42 30 0 58 Z` #8CC3EC at 50%; `M0 64 C38 34 74 80 140 42 L140 66 C74 104 40 58 0 88 Z` #6FE0C1 at 55%; `M0 94 C44 68 90 100 140 72 L140 82 C90 114 46 80 0 106 Z` #B7A6F2 at 45% (full size only).
- Stars (full size only), #FFF4D6 at 80%: (24,22) r1.3, (112,16) r1.3, (58,30) r1.1, (122,96) r1.2, (18,112) r1.2, (96,120) r1.1.
- Hills: `M0 146 C34 126 82 128 140 144 L140 196 L0 196 Z` #9FB9D4, then `M0 166 C44 150 96 150 140 168 L140 196 L0 196 Z` #D9E6F3 (blue enough that the card's edge holds on the light table).
- The sleepy fox, 62 wide (78 at play size), centered, its feet on y 168: top = 168 − 70.7 × size / 64.

**Winter knit** (Fox + Owl, Coral Reef). Background #9E2341; yarn #F6EFE4; inner border rgba(246,239,228,.55).
- Eight-point star at (70,98), radius 34 (46 at play size): eight diamonds, each from the center to a point at radius r, with side corners at 0.42 r, 22.5° either side; points at 0°, 45°, … starting straight up. Filled with yarn, outlined in the background color (0.05 r wide, round joins), with a small background-colored square (half-width 0.13 r) turned 45° in the middle.
- Full size only: zigzag rows at y 32 and y 171 (polyline through x = 12, 21, … 129, alternating y and y − 7; the top row starts low, the bottom row starts high), stroke 3 in yarn; diamond dots 3.2 square turned 45° at y 44 and y 152, x = 18, 28, … 118; little V stitches (`M x−3 y−2 L x y+2 L x+3 y−2`, 1.6 wide, 55%) at (24,66) (116,66) (24,98) (116,98) (24,130) (116,130); four dots r2 at 40 from the center on the diagonals.

**Coral garden** (Octo + Manta, Coral Reef). Background #8A2E4A; inner border rgba(255,226,214,.5); bubbles are rings in #FFE2D6, 1.3 wide, 85%.
- A coral grows up from (x, base) with height h and stroke w (round caps): trunk to base − h; a branch from base − 0.45h curving out 9 and up to (x − 11, base − 0.85h), then on to (x − 14, base − h); a branch from base − 0.7h curving out 8 to (x + 10, base − 1.02h); and a tip from the top to (x + 2, base − 1.12h). Each of the three tips gets a round knob r = 0.85w. A flipped coral mirrors the sideways offsets.
- Full: corals (26,196) h40 w5.5 #F29A8A; (48,196) h26 w4.5 #FFC2B0 flipped; (96,196) h30 w4.5 #FFC2B0; (116,196) h42 w5.5 #F29A8A flipped. Mounds #FFC2B0: (70,192) r9, (62,194) r6, (79,195) r6. Bubbles (24,40) r4, (30,28) r2.5, (20,58) r2, (114,46) r3.5, (108,32) r2.2, (118,64) r2, (70,22) r2.5. The happy octopus in #F4A6BE (Coral Reef `octo2`), 78 wide, centered on (70,94) (top = 94 − 39 × size / 64).
- Play size: corals (30,200) h34 w10 #F29A8A and (110,200) h30 w10 #FFC2B0 flipped; bubbles 1.6× (rings 2.1 wide) at (30,46) r9.6 and (112,70) r8; the octopus 84 wide on (70,94).

Night tide and Starry sea stay as they are for the Octo + Manta deck. The Fox + Owl versions of them (foxes and owls in the grid, the sleepy fox on Night tide) are no longer used.

## Honeycomb and Forest palettes, Bee + Sloth and Mushroom + Moth decks

Approved by the owner on Oct 30, 2026. This adds two palettes (Honeycomb and Forest), each with its own sky, two decks (Bee + Sloth and Mushroom + Moth) and a card back for every deck in every palette. Nothing about the existing palettes, decks or backs changes. As before, palette and deck are separate settings: any palette works with any deck.

Source files in `/design`:

- `honeycomb-forest.png`: Home in both new palettes (light and dark), their colors, and Settings with five palettes and four decks.
- `bee-sloth-deck.png`, `mushroom-moth-deck.png`: each deck's suit buddies, characters, card faces, who runs the games, play size and its own card back. The Mushroom + Moth sheet shows the final royal cards (deep night tints, fixed after the first review).
- `card-backs-all-palettes.png`: all 20 card backs, 14 of them new.
- `garden-mockup/`: the mockup source. **`art.js` is the master art for the bee, sloth, toadstool and luna moth**, and `backs.js` for the 14 new card backs: port every shape, coordinate and color exactly. (In the mockup the decks are called `honey` and `wood`; in the app they are `honey` and `woodland`.) To re-render a sheet, open the HTML file with Playwright and `shot.cjs`; `backs.html` also needs `existing.js`, made by `export.tsx` and `run-export.mjs` (copy `export.tsx` into `src/` while it runs, then delete it).

### Honeycomb and Forest palettes

| Token | Honeycomb light | Honeycomb dark | Forest light | Forest dark |
| --- | --- | --- | --- | --- |
| `bg` | #F4EEE4 | #1C1611 | #E8EFE3 | #0E1912 |
| `surface` | #FFFDF9 | #2A2119 | #FFFFFF | #17261C |
| `ink` | #3A2A1C | #F4EADB | #1E3324 | #E4EFE4 |
| `sub` | #6B5644 | #C7B39B | #4C6352 | #A6BCA9 |
| `accent` | #8A5A2E | #E2B271 | #3D6B48 | #8FCB9B |
| `onAccent` | #FFFFFF | #1C1611 | #FFFFFF | #0E1912 |
| `accentSoft` | #EADFCD | #3A2D20 | #D3E2CF | #20362A |
| `line` | #E3D6C2 | #463626 | #CCDAC8 | #2A4233 |
| `octo` / `octo2` / `manta` (Octo + Manta decor) | #EE8C9E / #F6B07A / #7A9EB0 | #EE8C9E / #F6B07A / #8DB0C2 | #EE8C9E / #F6B07A / #7A9EB0 | #EE8C9E / #F6B07A / #8DB0C2 |
| `comb` (honeycomb cell outline) | #DCC7A6 | #4A3A28 | (none) | (none) |
| `honey` (filled cells) | #F2B33D | #F2B33D | (none) | (none) |
| `pollen` | #E2A93A | #F6C35A | (none) | (none) |
| `starCore` / `starGlow` | (none) | (none) | (none) | #FFF4D6 / rgba(255,244,214,.45) |
| `firefly` | (none) | (none) | (none) | #EEF7A8 |
| `cloud`, `snow`, `crystal` | (none) | (none) | (none) | (none) |

High contrast: light `ink` #22170D (Honeycomb) and #0F1F14 (Forest), light `accent` #6B4422 and #2F5538; dark `ink` #FFFFFF. Then the usual rules (`sub` and `line` equal `ink`, 2px borders). Measured: main text 11.9:1 / 15:1 (Honeycomb light / dark) and 11.5:1 / 15.2:1 (Forest); white on the high-contrast light accents 8.5:1. Add both palettes to `theme/tokens.test.ts`.

Settings palette tiles (the grid wraps to three rows): Honeycomb shows #F4EEE4, #8A5A2E, #F2B33D, #3A2A1C with "Drifting pollen by day, honey glow by night"; Forest shows #E8EFE3, #3D6B48, #C9A464, #1E3324 with "Falling leaves by day, fireflies by night".

### Skies

Same rules as every sky: behind everything, `pointer-events: none`, paused by Reduce motion and when the app is hidden, and a 400ms crossfade between light and dark. Positions use seeded random, like the stars and snow.

**Honeycomb** (both modes):

- Three honeycomb clusters, pointy-top hexagons, outline `comb` 1.6px, a few cells filled with `honey` (35% in light, 22% in dark, where filled cells also get `drop-shadow(0 0 6px rgba(242,179,61,.5))` and slowly brighten and dim between 70% and 100% over 6s). Cluster 1: five cells of radius 13 just left of the Settings button, around the title (top 30px, right 92px). Cluster 2: four cells of radius 15 on the right edge about 40% down, half off the screen. Cluster 3: five cells of radius 17 on the left edge about 72% down, half off the screen. They don't move.
- Pollen: light 22 specks (seed 11), dark 26 (seed 23), round, 2.4 to 6px, color `pollen`, peak opacity 0.45 to 0.95. Each rises slowly from just below the screen to just above it in 26 to 48s (negative delays, so the sky starts full) while swaying ±12px every 4 to 7s. In dark mode each speck glows (`box-shadow: 0 0 6px rgba(246,195,90,.8)`).

**Forest**:

- Light, falling leaves: 14 leaves (seed 11), 12 to 20px tall, colors #9DBB86, #C9A464, #C7835A, #8FB07C, #D8B56E in turn, each with a midrib in its color × 0.78. Leaf path in a 10×15 box centered on 0: `M0 -7 C5 -4 5 4 0 8 C-5 4 -5 -4 0 -7 Z`, midrib `M0 -6 L0 7`. They fall like snow but slower (14 to 24s), swaying ±16px every 3 to 5s and tipping from -25° to 25° as they sway; opacity 0.8.
- Dark, fireflies: 18 fireflies (seed 23) placed anywhere below the top 15% of the screen, a 3 to 5px dot in `firefly` with `box-shadow: 0 0 8px 3px rgba(233,245,154,.55)`. Each wanders around its spot (up to ±30px, 8 to 14s, alternating) and blinks from 15% to 100% and back every 3 to 6s. Above them, 14 faint stars (seed 31) in the top 40%, 1.4 to 3px, `starCore`, opacity 0.35 to 0.75, standing still.

`skyFor(palette, mode)`: Honeycomb gives `comb` in both modes; Forest gives `leaves` by day and `fireflies` by night.

### Bee + Sloth and Mushroom + Moth decks

`deck` gains `'honey'` and `'woodland'`. The Deck section in Settings lists four decks, each preview showing its two happy characters (the Hearts sloth and the Spades bee; the Hearts toadstool and the Clubs moth). Lines: "Bumblebees and sloths", "Toadstools and luna moths".

| Where | Bee + Sloth | Mushroom + Moth |
| --- | --- | --- |
| Red team (hearts, diamonds) | Sloths: rosy fur (Hearts), golden fur (Diamonds) | Toadstools: red cap (Hearts), amber cap (Diamonds) |
| Black team (spades, clubs) | Bumblebees: slate stripes (Spades), pine stripes (Clubs) | Luna moths: moonlit blue (Spades), luna green (Clubs) |
| Home greeting | Waving Diamonds sloth, small Spades bee top right | Waving Diamonds toadstool, small Clubs moth top right |
| Home bottom edge | Happy Diamonds sloth, sleepy Spades bee, happy Hearts sloth | Happy Diamonds toadstool, sleepy Clubs moth, happy Hearts toadstool |
| Speed opponent | The bee (open eyes when it plays, happy otherwise, waving for "won this one") | The moth (same) |
| Blackjack dealer | The King bee (Clubs) | The King moth (Spades) |
| Solitaire win | Queen sloth and King bee, happy eyes | Queen toadstool and King moth, happy eyes |
| Pause screens, Tide Pairs win | Sleepy sloth | Sleepy toadstool |
| Wording | "the bee", "the King bee", "honey friends" | "the moth", "the King moth", "forest friends" |

Characters: a `<Garden kind suit eyes hat wave badge bowtie>` component (or one per species) that draws from the ported `art.js`, in the shared `0 -8 64 68` viewBox, with happy, open and sleepy eyes, the waving pose, the queen's crown and lashes, the king's crown and mustache, the Jack's bow tie in the suit symbol color, and the suit badge (sloth and toadstool on the forehead or stem, bee on the forehead, moth on the belly). Toadstools stand in two tufts of grass, except on card backs. Show every character in `#/gallery`.

Card colors (layout, sizes and pips as in the other decks):

| Deck, suit | Symbol | Rank text | High contrast rank | Ace big symbol | Face card tint | Face frame | Face card ink |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Bee + Sloth, Hearts | #B5364A | #A32F42 | #7F2533 | #EE9A8E at 30% | #F6D7CF | #D98A80 | (rank, symbol) |
| Bee + Sloth, Diamonds | #B24E16 | #9E4512 | #78340E | #F2B277 at 30% | #F8DFC0 | #DB9A5C | (rank, symbol) |
| Bee + Sloth, Spades | #2B3A55 | #2B3A55 | #28354E | #B9C6DC solid | #B9C6DC | #5F7397 | (rank, symbol) |
| Bee + Sloth, Clubs | #264A3E | #264A3E | #203E34 | #B5D2BE solid | #B5D2BE | #5A8A70 | (rank, symbol) |
| Mushroom + Moth, Hearts | #B03044 | #A02A3D | #802231 | #EE939B at 30% | #F6D6D3 | #D9848A | (rank, symbol) |
| Mushroom + Moth, Diamonds | #B04D18 | #9C4413 | #77340E | #F0AE78 at 30% | #F7DEC3 | #D99862 | (rank, symbol) |
| Mushroom + Moth, Spades | #2E3664 | #2E3664 | #2E3664 | #3A4687 solid | #3A4687 | #A3AEDF | #FFFDF5 |
| Mushroom + Moth, Clubs | #1F4A33 | #1F4A33 | #1F4A33 | #2F5E3F solid | #2F5E3F | #8FC79B | #FFFDF5 |

Card faces: Bee + Sloth #FFFBF2 with a 1.5px #E2D2B6 border; Mushroom + Moth #FCFBF5 with #D3D6C3. The moth's royal cards are deep night colors so the pale moths stand out (moth on its tint about 5:1); on them the corner rank, the corner suit and the suit under the moth use the face card ink #FFFDF5 (8.6:1 on spades, 7.4:1 on clubs, so it already passes high contrast). `SuitColors` gets an optional `faceInk`; the contrast test checks rank on the face and on the tint, or `faceInk` on the tint where set. Known and accepted, as with the owls: the peeking moth on number cards is pale on a pale face.

### Card backs for every palette

Every deck has one back per palette, picked automatically as now. The six existing backs don't change.

| Deck | Lagoon | Coral Reef | Winter | Honeycomb | Forest |
| --- | --- | --- | --- | --- | --- |
| Octo + Manta | Night tide | Coral garden | Starry sea | Sandy shallows | Kelp forest |
| Fox + Owl | Northern lights | Winter knit | Snowfall | Cozy den | Pine night |
| Bee + Sloth | Lazy lagoon | Bee garden | Snug hive | Honeycomb | Canopy |
| Mushroom + Moth | Lily pond | Fairy ring | Frosted toadstools | Lamplight | Moonlit glade |

The 14 new backs, all with the usual frame rules (140×196, 14 radius, inner border inset 8, and the play-size version under 80px wide). Exact shapes and numbers are in `garden-mockup/backs.js`:

- **Sandy shallows**: warm sand brown with faint ripple lines, starfish and shells, and the happy octopus in peach.
- **Kelp forest**: deep sea green with swaying kelp and a few bubbles, and the manta gliding through.
- **Cozy den**: walnut brown with autumn leaves, and the sleepy fox curled in a round den.
- **Pine night**: dark pine green with a moon, stars and pine trees, and the Spades owl on a branch.
- **Lazy lagoon**: dark teal at night with a branch over the water, and the sleepy sloth dozing on it.
- **Bee garden**: raspberry with pink and peach flowers and dotted flight paths, and a happy bee.
- **Snug hive**: Winter blue with crystals and snowy ground, a straw hive with a snow cap, and a sleepy bee in its door.
- **Honeycomb**: brown with golden cells, a few filled with honey, and a sleepy bee in a hexagon medallion.
- **Canopy**: forest green with hanging vines, and the sleepy sloth hanging from one.
- **Lily pond**: night teal with lily pads, ripples and two flowers, and a sleepy moonlit-blue moth.
- **Fairy ring**: raspberry with a ring of little toadstools around a happy red toadstool.
- **Frosted toadstools**: Winter blue with crystals, snowy ground and two sleepy toadstools with snow on their caps.
- **Lamplight**: dark brown with a glowing lantern and a luna moth drawn to it.
- **Moonlit glade**: deep green with a crescent moon, a sleepy luna moth and two dozing toadstools.

Until phase 21, the Octo + Manta and Fox + Owl decks use their Lagoon back in Honeycomb and Forest.

### Storage

```ts
{ ...; palette: 'lagoon' | 'coral' | 'winter' | 'honeycomb' | 'forest'; deck: 'sea' | 'arctic' | 'honey' | 'woodland' }
```

Unknown values fall back to the defaults, as now.

## Cats deck

Approved by the owner on Oct 31, 2026 (`design/cats-deck.png`). A fifth deck where every card is a cat; no new palette (the cats suit all five). Source: `design/garden-mockup/cats.js` is **the master art** for the cats and their five card backs (it builds on `art.js` and `backs.js` there; `catdeck.html` renders the sheet). Port every shape, coordinate and color exactly.

| Suit | Cat | Pose | Notes |
| --- | --- | --- | --- |
| Hearts | Orange tabby | Loaf, fat | Forehead and side stripes (forehead stripes hide under a badge) |
| Diamonds | Calico | Sitting up, skinny | Orange and black patches, a soft #E3CCB3 outline so it shows on white cards |
| Spades | Black cat | Sitting up, skinny | Golden eyes |
| Clubs | Siamese | Loaf, fat | Blue eyes, dark brown ears, face, paws and tail |

Two skinny cats sit up and two fat cats lie as loaves, as the owner asked; so unlike the other decks, each team has one of each shape and the teams differ by color (and the corner suits) rather than by shape. Every cat has happy, open (big eyes with two sparkles) and sleepy eyes, the waving pose (a raised paw with one pink pad and three toe beans, like the waving fox), the Queen's pearl crown and lashes, the King's crown and mustache, the Jack's bow tie and the suit badge. Royal cards stay by suit: every suit has its own Queen and King. The black cat's Jack wears its bow tie in #DCDDF0 (the spades tint), since the suit color vanishes on black fur.

`deck: 'cats'`, name "Cats", line "Orange, calico, black and Siamese cats". Wording: "the black cat", "the King Siamese", "kitty friends".

| Where | Cats |
| --- | --- |
| Home greeting | Waving orange cat, small black cat top right |
| Home bottom edge | Happy calico, sleepy black cat, happy orange cat |
| Speed opponent | The black cat (open eyes when it plays, happy otherwise, waving for "won this one") |
| Blackjack dealer | The King Siamese |
| Solitaire win | Queen calico and King Siamese, happy eyes |
| Pause screens, Tide Pairs win | Sleepy orange cat (Speed's pause: the sleepy black cat) |

Card colors (face #FFFCF7, border #E3D7C8):

| Suit | Symbol | Rank text | High contrast rank | Ace big symbol | Face card tint | Face frame | Face card ink |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Hearts | #B5364A | #A32F42 | #822635 | #F2A04E at 30% | #F9D9DC | #E18A97 | (rank, symbol) |
| Diamonds | #B24E16 | #9E4512 | #7B360E | #F2A35E at 30% | #FBE1C6 | #DE9E62 | (rank, symbol) |
| Spades | #2B3350 | #2B3350 | #2B3350 | #DCDDF0 solid | #DCDDF0 | #7F84B5 | (rank, symbol) |
| Clubs | #24493F | #24493F | #24493F | #2D5743 solid | #2D5743 | #9CC4AE | #FFFDF5 |

Like the moths, the Siamese royals are deep green with cream letters (8.1:1) so the pale Siamese stands out.

Card backs, one per palette:

| Lagoon | Coral Reef | Winter | Honeycomb | Forest |
| --- | --- | --- | --- | --- |
| Fishbowl: a black cat watching a goldfish | Yarn ball: an orange cat batting at yarn | Snow day: a Siamese napping under a snowy window | Sunbeam: a calico dozing in a patch of sun | Night prowl: a black cat on a log under the moon |

## Game 5: Dominoes

Approved by the owner on Oct 31, 2026 (`design/dominoes.png`; source `design/garden-mockup/dominoes.html` and `games.js`). Draw dominoes, the only kind the owner knows, against one or two of the deck's characters (two to start).

Opponents, for both new games: the first is the deck's Speed opponent (the octopus, the Diamonds fox, the Spades bee, the Clubs moth, the black cat) and the second is the other team's character (the manta, the Spades owl, the Diamonds sloth, the Diamonds toadstool, the orange cat). With one opponent, only the first plays.

Rules (`games/dominoes/rules.ts`, pure and unit-tested):

- A double-six set: 28 tiles, every pair of numbers 0 to 6 once. Shuffle; with two opponents everyone draws 5, with one, 7. The rest are the boneyard.
- The player holding the highest double plays it first (if nobody has a double, the highest tile by pips). Then turns go around: you, the first opponent, the second.
- On a turn, play one tile whose number matches one of the two open ends of the line. A double sits crosswise. Only tiles that fit can be played.
- If nothing fits, draw from the boneyard until a tile fits, then play it. If the boneyard runs out first, pass.
- The round ends when someone plays their last tile (they win), or when nobody can play and the boneyard is empty (blocked): then the lowest total of pips in hand wins; still tied, the player with fewer tiles; still tied, the round is shared and counts for nobody.
- Opponents play the fitting tile with the most pips (doubles first among equals), on the end that keeps the most of their own numbers playable.

Screen (`games/dominoes/DominoesScreen.tsx`):

- Top bar: back button, "Dominoes", menu (Opponents: one or two, New round, Show tally, Rules).
- Under it, one card per opponent: their character (46px circle, happy; open eyes while it's their turn, and their card gets the accent ring), their name and how many tiles they hold as little face-down tiles.
- A status line: "Your turn: tap a glowing tile, then the end to play it on", "The black cat is thinking…", "The orange cat drew 2 and played", "No tile fits. Tap Draw".
- The table panel holds the line of play. It runs along the top, turns down at the right edge and comes back along the bottom (a snake), shrinking a little when it gets long. The two open ends show dashed targets with their number. The boneyard sits in the corner with its count.
- Your hand along the bottom, standing tiles 36px wide. Tiles that fit lift 8px with an accent outline; the rest fade to 50%. Tap one, then the end; if it fits only one end, it goes there at once.
- Bottom bar: Draw (only lit when nothing fits) and Menu.
- Tiles are ivory (#FFFDF8, #D9CFBE edge) with a different pip color per number: 1 #D23F5B, 2 #E8812F, 3 #C99A12, 4 #2E9A6E, 5 #3B78C4, 6 #7A5BC4. Face-down tiles use the color of the deck's card back for the palette.
- Opponents move after a short pause (700ms, faster with reduce motion) so you can see where their tile goes. Sounds: a soft click when a tile lands, the card flip for a draw, the win chime when you go out first.
- End of round: a card with the winner ("You went out first, Night!" with the deck's waving greeter, or "The black cat went out first" with that character), everyone's pips left, the tally (rounds won, hidden by default like Blackjack's) and "Next round".
- Save the round and the tally in `localStorage` (`tidepool.dominoes`).

Home entry: "Dominoes", "Match the ends and play out your tiles", icon of two tiles end to end.

## Game 6: Pond Hop

Approved by the owner on Oct 31, 2026 (`design/pond-hop.png`; source `design/garden-mockup/pond-hop.html` and `games.js`). Our own marble race in the family of Aggravation, Ludo and Sorry, with its own board and its own twist (the lily pads), against one or two of the deck's characters (two to start; see the opponents under Dominoes).

Rules (`games/pondhop/rules.ts`, pure and unit-tested):

- A round board: a track of 40 holes going clockwise round a pond, numbered 0 to 39 from the top. Starts are at 0, 10, 20 and 30, each fed by the corner just before it. You start at 30 (bottom-left corner); the first opponent sits across from you at 10, and the second at 0.
- Everyone has four marbles in their corner. On your turn, roll one die.
- A 1 or a 6 brings a marble out onto your start (if your own marble isn't already there). A 6 also gives another roll, whatever you did with it.
- Otherwise move one marble that many holes clockwise. A marble's trip is 39 holes, from its start to the hole just before it, then into its own home lane of four holes toward the pond. Moves into the lane need an exact roll: no overshooting.
- You can't land on your own marble. Landing exactly on another player's marble sends it back to its corner (on the track or on their start, never inside a home lane).
- Lily pads at 5, 15, 25 and 35. A marble that lands exactly on one may hop straight across the pond to the opposite pad (5 and 25, 15 and 35): 20 holes forward. It can't hop past its own lane entry or onto its own marble; a hop onto another marble sends that one home.
- If no move is possible, the turn passes. The first to get all four marbles into their lane wins.
- Opponents choose, in order: a move that sends someone home, bringing a marble out, a hop, a move into their lane, otherwise the marble furthest behind.

Screen (`games/pondhop/PondHopScreen.tsx`):

- Top bar: back button, "Pond Hop", menu (Opponents: one, two or three, New game, Show tally, Rules). Opponent cards show just the character on a tint of its marble color and how many marbles are home (no names; added after the owner played it). A third opponent fills the fourth corner: the deck's King from Blackjack, with purple marbles (#7A5BC4), starting at 20.
- The board, a 360px square scaled to the screen: a rounded panel in `surface`, the pond in the middle (#B9E1E3 with ripples and a lily flower), 40 track holes, four lily pads with dashed lines across the pond, a corner and a home lane per player in their marble color (an empty seat is faint). "You" over your corner.
- Marbles: you coral (#E0607E), the first opponent blue (#3B78C4), the second gold (#E8A317); each has a lighter highlight and a white glint.
- Under the board: the status line ("You rolled a 6! Bring a marble out, or move one 6. Then roll again.") and the die. Tap Roll (or the die): it tumbles for 400ms. If only one move is possible it happens by itself; otherwise the marbles that can move and the holes they'd reach glow, and you tap either.
- Opponents roll and move with a short pause so you can follow. Sounds: a soft clack when a marble lands, a little splash for a hop, a gentle "boop" when a marble is sent home, the win arpeggio for a win.
- Win: your deck's characters cheer, as for a Solitaire win; a lost game shows the winner happy and "The bee got all four home first". A tally of games won (hidden by default) and autosave in `localStorage` (`tidepool.pondhop`).

Home entry: "Pond Hop", "Race your marbles round the pond", icon of three marbles round a little pond.

## Game 7: Fishy

Chosen by the owner on Oct 31, 2026, as the first game to play together; built against the computer first. Fishy is our
name for the bluffing card game also called Cheat, I Doubt It or BS. Everyone tries to get rid of their cards, and you can
lie about what you put down. When you think someone is lying, you call "Fishy!". (The owner first picked Beggar-My-Neighbour,
then dropped it: it has no decisions, so it isn't fun against the computer.)

Opponents: one, two or three (two to start), as in Pond Hop: the deck's Speed opponent, the other team's character, then
the deck's King. Each has its own habits, so you can learn them: the first bluffs boldly and calls rarely, the second
bluffs rarely and calls often, the King is in between.

Rules (`games/fishy/rules.ts`, pure and unit-tested; seats are numbers as in Dominoes, 0 is you):

- Deal all 52 cards round the table as evenly as possible, starting with you (with three players: 18, 17, 17). With two
  players, each gets 17 and the other 18 are set aside face down for the whole game (added in phase 30: dealing all 52 to
  two players made computer games run a median of 135 plays, with some past 1,800; this brings it to about 22, and nobody
  can be sure where every card is).
- The pile must go up in order: Aces, then 2s, 3s and so on to Kings, then Aces again. The first play of a game is Aces.
- On your turn, put 1 to 4 cards face down on the pile and claim them as the rank that's due: "Two 7s". The number is
  always true (everyone sees how many cards go down); the rank can be a lie. You can't pass.
- Then each other player in turn order, starting with the next seat, gets one chance to call "Fishy!" or let it go. The
  first one to call is the caller, and nobody after them is asked.
- A call turns the cards over. If any of them isn't the claimed rank, the player who played them picks up the whole pile.
  If they were all honest, the caller picks up the whole pile. Either way the pile starts over empty, the next seat after
  the player plays next, and the rank due moves on as usual.
- You win by getting rid of your last card, as long as that play isn't caught as a lie. If it is, you pick up the pile and
  play on. The first player out wins the game.
- You start the first game; after that, the starting seat moves round one each game.
- Opponents only know what a player at the table would: their own hand, the cards they put in the pile, and cards turned
  over by calls. They never see anyone else's hand (tested).
- Opponents playing: if they hold the rank that's due, play all of those cards (up to 4), and a bold opponent sometimes
  slips one extra card in. If they don't, bluff with 1 card (sometimes 2), choosing the cards they'll need furthest in the
  future.
- Opponents calling: always call a claim that can't be true (the claim plus the cards of that rank they know of comes to
  more than 4); usually call when the claim would let a player go out; otherwise call more readily for bigger claims and
  small piles (being wrong costs less), scaled by personality. Apart from impossible claims, these chances are for the
  whole table and shared out between the seats asked, so more players don't mean more calls.

Screen (`games/fishy/FishyScreen.tsx`):

- Top bar: back button, "Fishy", menu (Opponents: one, two or three, New game, Show tally, Rules).
- The opponents sit along the top as cards, as in Pond Hop: the character in a circle, with a small fan of face-down cards
  and how many they hold. Open eyes while it's their turn, happy when they win a call or the game, sleepy (sheepish) when
  they're caught.
- **Speech bubbles:** whatever a player says pops up in a word bubble from their character: their claim ("Three Queens!"),
  "Fishy!", "Okay…" when they let it go, "Ha! Caught you" or "All true!" after a call. Your own bubble rises from above
  your hand. Bubbles fade after a moment, sooner with reduce motion.
- The middle of the table: the pile (a face-down stack with its count) and the rank that's due, shown big ("Now: 7s").
  A status line under it: "Your turn: pick the cards to put down", "The octopus is thinking…", "The octopus was fibbing.
  It picks up 12 cards".
- Your hand along the bottom, sorted in rank order, as a fan that scrolls sideways when it doesn't fit. Cards of the rank
  that's due have a small accent bar under them. Tap a card to lift it, tap again to put it back; up to 4 (a fifth tap
  shakes).
- One button plays them, and it says what you're claiming: "Play two 7s" (dimmed until a card is lifted). There's no
  separate choice of number: the claim is always the number of cards lifted.
- After someone else plays, if it's your chance to call, the button area shows **"Fishy!"** and **"Let it go"**. The
  game waits for you; there's no timer.
- A call: the played cards flip face up over the pile for about 1.5 seconds, the bubbles say who was right, and the pile
  slides to whoever picks it up.
- Opponents take a short pause before playing or calling (as in Dominoes; faster with reduce motion) and wait while the
  menu or Rules is open.
- Sounds: the card flip when cards go down, a new soft "blub" for "Fishy!", the gentle "boop" for a caught bluff, the
  whoosh when the pile is picked up, the win chime when you go out. Add "blub" to the gallery's sound board.
- Win: "You got rid of every card, Night!" with the deck's waving greeter; a loss shows the winner happy ("The manta
  played its last card"). Tally of games won (hidden by default), autosave in `localStorage` (`tidepool.fishy`), including
  a call that's waiting for your answer.

Home entry: "Fishy", "Bluff your cards away, or call a fib", icon of two face-down cards with a small speech bubble.

Playing together (after the computer version; see "Playing together on two phones"): the host deals and referees. Each
guest's phone is sent only its own hand plus everyone's card counts, so a guest can't peek. Each person gets their own
"Fishy!" / "Let it go" turn in seat order, exactly as against the computer, so nobody has to be fastest. Empty seats are
computer players. Two people first, then up to four.

## Playing together on two phones

Asked for by the owner after all six games were done (the version before this work is saved on GitHub as the branch
`before-multiplayer`). The app stays fully offline: two phones on the same Wi-Fi, or one phone's hotspot, connect
straight to each other with WebRTC. There is no server. They swap two QR codes to set up the link: the first phone
(Start) shows a code, the second (Join) scans it and shows its own code, and the first scans that.

- Phase 29, connection test (done): a hidden page, `#/together` (like `#/gallery`), with Start and Join, the two QR
  codes, the camera scanner, and once connected a Bloop button that bloops on the other phone, plus a speed check. It
  works between two phones in Chrome. It does not work in Brave, whose default WebRTC policy hides local addresses.
  The hotspot case has not been tried yet; try it before the first game ships. Keep the page as a diagnostic.

### Decisions (Oct 31, 2026)

These apply to every game played together.

- **No server, ever.** A small server would let everyone join by scanning one code, or play from different places,
  but the owner turned it down: Tidepool stays offline, "sends nothing anywhere" (as the About page says), and needs no
  server running around the clock. Everyone plays on the same Wi-Fi or the same phone's hotspot.
- **Each game has its own "Play with a friend"** in its in-game menu. No shared lobby on Home.
- **The host is the referee.** The phone that taps Start a game holds the real game state and checks every move with
  the game's own `rules.ts`; the other phones send what they want to do and show what the host sends back. This is why
  the rules already take seats as numbers and never ask who is a computer.
- **More than two players.** A WebRTC link joins exactly two phones, so a bigger game is a star: the host links to
  each guest separately (one QR swap, two scans, per guest) and passes every move to everyone. Guests never link to
  each other. Four players means six scans; the screen walks through it one guest at a time ("Pip joined. Scan the
  next friend."). `link.ts` can already hold several links at once. Hotspots allow 5 to 10 devices, so four is fine.
- **Empty seats stay computer players**, so two friends can play a four-seat game against two computers.
- **Disconnecting pauses the game** on every phone, saying who was lost. Reconnect means scanning both codes again,
  and the game continues exactly where it stopped (the host kept it). Or Leave.
- **Pausing** (the Pause button, the menu, or leaving the app) pauses every phone and says who paused. Whoever paused
  resumes it.
- **Each phone keeps its own palette and deck.** The cards are the same cards, drawn in each phone's own deck. Where
  a computer opponent's character would be, show the friend's name and their deck's character.
- **Names.** Everyone without a name is "friend", so the first time someone plays together without a name, ask "What
  should your friend see you as?" and save it in Settings.
- **The host's phone must stay open.** If it locks or leaves the app, everyone pauses until it comes back.
- **Brave and the APK.** Everyone needs Chrome until there is an APK (Capacitor, built in GitHub Actions; see
  CLAUDE.md). An APK needs "install unknown apps" allowed on the phone, so the Chrome link stays the easy way in for
  testers.
- **When a game can be played together, update Home's tip** "Playing together is coming".
- **Testing:** two Playwright pages in one Chromium (fake camera flags, codes passed with the `tidepool-code` event),
  then the owner on two phones.

### Which games, and in what order

- **First: Fishy** (see "Game 7: Fishy"), two people. Turn-based, one small message per turn, and every player gets
  their own turn to call, so it is the most natural first test.
- **Pond Hop:** up to four people, using the star above.
- **Dominoes:** up to three people.
- **Speed, later.** It is the most fun to play with someone but the hardest to network, because it is a real race: both
  players can play on the same pile at the same moment. The design, kept for when it is built:
  - Menu, Play with a friend, then Start a game / Join a game; both tap Ready and both phones count down 3-2-1.
  - The host decides close calls: whichever card reaches it first wins, and the slower card slides back to its hand
    with a shake. On home Wi-Fi a move arrives in a few hundredths of a second; on a weak hotspot the guest may lose some
    close calls.
  - The octopus's pace setting is hidden. A pause or a reconnect ends with a fresh 3-2-1. A rematch starts when both
    tap Play again.
  - The rules' `Who` is `'you' | 'octo'`; the guest's screen shows the host's state with the two sides swapped.

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

Then card backs (see "Card backs follow the palette"):

16. **Card backs follow the palette.** The four new backs (Snowfall, Northern lights, Winter knit, Coral garden), the deck and palette picking the back, the Card back choice removed from Settings, and the gallery showing all six. Checkpoint: switch through the three palettes with each deck on the phone and see the matching back in every game.

Then the Honeycomb and Forest palettes and the two new decks (see "Honeycomb and Forest palettes, Bee + Sloth and Mushroom + Moth decks"):

17. **Honeycomb and Forest palettes and skies.** Tokens (with high contrast and tests), the two palette tiles, and the skies: honeycomb cells and pollen, falling leaves, fireflies. Checkpoint: Home in both palettes, light and dark, looks like `honeycomb-forest.png`; the skies move and stop with Reduce motion; the other palettes are unchanged.
18. **Bee, sloth, toadstool and luna moth art.** Port `art.js` into components with every pose and extra, and add them to `#/gallery`. Checkpoint: the gallery characters match `bee-sloth-deck.png` and `mushroom-moth-deck.png`.
19. **The two decks and the Deck setting.** Deck entries with card colors (including the moth's face card ink), all 52 faces at reference and play size, four decks in Settings. Checkpoint: the gallery shows both full decks, and switching decks in Settings changes them at once.
20. **The new decks run the games.** Home greeting, bottom edge, icons and wording; Speed opponent; Blackjack dealer; Solitaire win; Tide Pairs; pause screens. Checkpoint: play each game with each new deck on the phone.
21. **Card backs for every palette.** The 14 new backs and the full deck × palette table, all 20 in the gallery. Checkpoint: switch through all five palettes with each deck and see the matching back in every game.

Then the Cats deck (see "Cats deck"):

22. **Cat art.** Port `cats.js` (the four cats with every pose and extra) and add them to `#/gallery`, with a test against the master. Checkpoint: the gallery cats match `cats-deck.png`.
23. **The Cats deck runs everything.** Deck entry with card colors, all 52 faces, the Deck setting, and every character and word in Home and the games from the table above. Checkpoint: play each game with the Cats deck on the phone.
24. **Cat card backs.** The five backs and their place in the deck × palette table, with a test against the master. Checkpoint: switch through all five palettes with the Cats deck and see the matching back.

Then the two new games (see "Game 5: Dominoes" and "Game 6: Pond Hop"):

25. **Dominoes rules.** `rules.ts` with tests for the set, dealing for one and two opponents, who starts, legal plays on both ends, doubles, drawing until a tile fits, passing, going out, blocked rounds and ties, and the opponents' choices. Checkpoint: all tests pass.
26. **Dominoes screen.** Opponent cards, the line of play, your hand, Draw, the opponents' turns, end of round, tally, menu, autosave, Home entry. Checkpoint: play a few rounds on the phone with one and with two opponents.
27. **Pond Hop rules.** `rules.ts` with tests for bringing marbles out on 1 or 6, the extra roll on 6, moving, sending marbles home, lily pad hops, home lanes and exact rolls, passing, winning, and the opponents' choices. Checkpoint: all tests pass.
28. **Pond Hop screen.** The board, marbles, die, choosing moves, the opponents' turns, win and loss, tally, menu, autosave, Home entry. Checkpoint: play a full game on the phone with one and with two opponents.

Then playing together (see "Playing together on two phones"):

29. **Connection test.** The hidden `#/together` page. Checkpoint: two phones connect in Chrome and bloop each other. (Done.)

Then Fishy (see "Game 7: Fishy"), against the computer first:

30. **Fishy rules.** `rules.ts` with tests for dealing to two, three and four players, the rank order and wrapping, playing 1 to 4 cards, calls in seat order, a caught lie and an honest play, winning (and not winning when the last play is caught), the starting seat moving round, and the opponents' choices, including that they never use cards they couldn't know. Checkpoint: all tests pass.
31. **Fishy screen.** Opponent seats with speech bubbles, the pile and the rank due, your fan of cards, the Play button, Fishy! / Let it go, the call reveal, the opponents' turns, win and loss, tally, menu, rules, sounds, autosave, Home entry. Checkpoint: play a few games on the phone with one, two and three opponents.
32. **Fishy together.** Play with a friend in Fishy's menu: two phones, the host referees, names, pausing and disconnecting as decided above, and Home's "Playing together is coming" tip updated. Checkpoint: the owner and a friend play a full game on two phones in Chrome, including a dropped connection.

After that: the host linking to several guests (up to four people), Pond Hop together, Dominoes together, Speed together,
and the APK, in an order chosen with the owner.

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
- [x] Card back picker in Settings, or one fixed back: neither; the back follows the palette and deck (phase 16, chosen by the owner).
- [ ] Speed opponent: the octopus (current), or a manta for variety.
- [ ] Solitaire scoring and timer: off by default; keep as an option or drop entirely.
- [ ] Tide Pairs default board size: 16 cards (current), or start smaller at 12.
- [x] Blackjack dealer: the King manta (chosen by the owner).
- [x] Winter palette with snow day and night; each palette brings its own sky (approved by the owner).
- [x] Fox + Owl deck as a second deck, switched in Settings, and the deck picks who runs the games (approved by the owner).
- [x] Fox + Owl card backs: winter backs designed and approved: Northern lights, Winter knit and Snowfall (phase 16).
- [x] Jack fox, King fox and Queen owl: composed from existing parts in phase 13 (approved by the owner).
- [x] Honeycomb and Forest palettes, Bee + Sloth and Mushroom + Moth decks, and a card back for every deck in every palette (approved by the owner, phases 17–21).
- [x] Cats deck: orange tabby, calico, black cat and Siamese, with five card backs and no new palette (approved by the owner, phases 22–24).
- [x] Two new games: Dominoes (draw) and Pond Hop (our own marble race, 1 or 6 to come out), each against one or two of the deck's characters (approved by the owner, phases 25–28).
- [ ] Blackjack pretend betting with shells (a starting pile of 100, bets of 5–25, blackjack pays 3 to 2, plus Double down): off for now; add later if a plain tally feels too flat.
