# Tidepool art for Illustrator

Every drawn asset in the app, exported as it looks in the app today, so it can be redrawn by hand.

## The files

| File | What's in it |
| --- | --- |
| `01-characters-octo-manta.svg` | Octopus and manta: every card character (Ace, number cards, Jack, Queen, King in each suit) and the extra poses (waving, sleepy and so on) |
| `02-characters-fox-owl.svg` | Fox and owl, the same set. These came from your own Fox + Owl file. |
| `03-characters-bee-sloth.svg` | Bee and sloth |
| `04-characters-mushroom-moth.svg` | Toadstool and moth |
| `05-characters-cats.svg` | The four cats |
| `06-card-backs.svg` | All 25 card backs, by deck, with the palette each one goes with |
| `07-game-icons.svg` | The icons on Home, for each deck that draws them differently |
| `08-pieces-ponds-sky-app-icon.svg` | Falling-block friends and shells, Coral Stack blocks, marbles, suit symbols, the Pond Hop ponds (plain water, and Winter, Forest and Honeycomb in light and dark), the cloud, snow crystal and leaf from the skies, and the app icon |

The same drawing is only shown once. Under a piece, "also:" lists the other places it's used.

**Left out on purpose:** effects (glows, ripples, skate marks, sparkles, falling snow), plain shapes (dice, domino tiles, board holes, buttons), the small interface icons (arrows, sun and moon, speaker), and the card layout (corner letters, pips), which is type, not drawing.

## How to work in them

1. Open a file in Illustrator (File > Open, then choose the `.svg` file).
2. Open the Layers panel. Inside **Art**, every piece is its own group with a name like `Hearts_Queen` or `Coral_garden`.
3. Lock or hide **Frames_guides** and **Labels**. The dashed box around each piece is the space the app draws it into.
4. Redraw inside each group, keeping the drawing inside its dashed box at about the same size and position, so it still fits on the cards and screens.
5. **Keep the group names**, and don't move the pieces to other places on the page. That's how I match each one to its spot in the app.

**Saving time:** many pieces are one character with something added (a crown, a bow tie, closed eyes). You can draw each character once, plus each crown and bow tie once, then copy them into the other cells. If you'd rather, redraw only the plain characters, crowns and bow ties and tell me, and I'll build the rest from those, the way the composed Fox + Owl characters were built.

You don't have to redraw everything at once. Anything you leave untouched stays as it is.

## Sending them back

Save with **File > Save As**, format **SVG**, keeping the same file names. In the SVG Options window:

- SVG Profiles: **SVG 1.1** (not SVG Tiny, which can't keep clipping; that's what the "Clipping will be lost on roundtrip to Tiny" message on opening means, and it's safe to click OK)
- Styling: **Presentation Attributes**
- Font: **Convert to outline**
- Images: **Embed**
- Object IDs: **Layer Names**
- Decimal: **2**
- Minify and Responsive: **off**

Then send me the files, and I'll put each piece into the app and check every screen it appears on.

## For a later session

`manifest.json` lists every piece: file, group id, the frame on the page, the scale from app units to the page, and the source file in the code. The files are made by `npm run art:export` (with `npx vite preview --port 4173` running after `npm run build`), which reads the hidden page `#/art` (`src/screens/ArtSheet.tsx`).
