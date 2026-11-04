// Draws one of the owner's game or sky pieces (src/art/piecesArt.ts, from design/art-export/08-…svg) in the box the
// app uses for it, for use inside another SVG. Each drawing gets its own copy of the gradients it uses, so a piece in a
// hidden or removed svg never takes another's gradient with it.
import { useId } from 'react';
import { PIECE_GRADIENTS, PIECES, type PieceId } from './piecesArt';

/** Draws piece `id`; `recolor` swaps fill and stroke colors (lower-case hex), e.g. for the falling leaves' colors. */
export function ArtPiece({ id, recolor }: { id: PieceId; recolor?: Record<string, string> }) {
  const uid = useId().replace(/:/g, '');
  const piece = PIECES[id];
  const used = new Set<string>();
  const paint = (v: string | undefined) => {
    if (!v) return v;
    const ref = /^url\(#(.+)\)$/.exec(v);
    if (ref) {
      used.add(ref[1]);
      return `url(#${ref[1]}-${uid})`;
    }
    return recolor?.[v] ?? v;
  };
  const shapes = piece.nodes.map((n, i) => {
    const Tag = n.tag;
    const props = { ...n.attrs, fill: paint(n.attrs.fill), stroke: paint(n.attrs.stroke) };
    return <Tag key={i} {...props} />;
  });
  return (
    <g transform={piece.transform}>
      {used.size > 0 && (
        <defs>
          {[...used].map((gid) => {
            const g = PIECE_GRADIENTS[gid];
            const Tag = g.tag;
            return (
              <Tag key={gid} id={`${gid}-${uid}`} {...g.attrs}>
                {g.stops.map((s, i) => (
                  <stop key={i} offset={s.offset} stopColor={s.color} stopOpacity={s.opacity === '1' ? undefined : s.opacity} />
                ))}
              </Tag>
            );
          })}
        </defs>
      )}
      {shapes}
    </g>
  );
}
