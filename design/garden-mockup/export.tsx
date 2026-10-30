import { renderToStaticMarkup as rsm } from 'react-dom/server';
import { SettingsProvider } from '/home/user/tidepool/src/settings/SettingsContext';
(globalThis as any).localStorage ??= { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const renderToStaticMarkup = (el: JSX.Element) => rsm(<SettingsProvider>{el}</SettingsProvider>);

import { CardBack } from '/home/user/tidepool/src/cards/CardBack';
import { FoxOwl } from '/home/user/tidepool/src/art/FoxOwl';
import { Creature, VIEWBOX } from '/home/user/tidepool/src/art/Creature';
const out: Record<string, string> = {};
for (const b of ['tide', 'garden', 'starry', 'aurora', 'knit', 'snowfall'] as const) {
  out[`back-${b}`] = renderToStaticMarkup(<CardBack back={b} width={150} />);
  out[`back-${b}-play`] = renderToStaticMarkup(<CardBack back={b} width={52} />);
}
// inner art only, so the mockup can wrap it in its own <svg viewBox="0 -8 64 68">
const inner = (el: JSX.Element) => renderToStaticMarkup(el).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
out.foxSleepy = inner(<FoxOwl kind="fox" suit="hearts" eyes="sleepy" />);
out.foxHappy = inner(<FoxOwl kind="fox" suit="diamonds" eyes="happy" />);
out.owlSleepySpades = inner(<FoxOwl kind="owl" suit="spades" eyes="sleepy" />);
out.owlSpades = inner(<FoxOwl kind="owl" suit="spades" eyes="open" />);
out.owlClubsSleepy = inner(<FoxOwl kind="owl" suit="clubs" eyes="sleepy" />);
out.octoHappy = renderToStaticMarkup(<svg viewBox={VIEWBOX}><Creature kind="octopus" color="#EE8C9E" eyes="happy" /></svg>).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
out.octoSleepyPeach = renderToStaticMarkup(<svg viewBox={VIEWBOX}><Creature kind="octopus" color="#F6B07A" eyes="sleepy" /></svg>).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
out.octoHappyPeach = renderToStaticMarkup(<svg viewBox={VIEWBOX}><Creature kind="octopus" color="#F6B07A" eyes="happy" /></svg>).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
out.manta = renderToStaticMarkup(<svg viewBox={VIEWBOX}><Creature kind="manta" color="#7A9EB0" eyes="open" /></svg>).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
export default ('const EXISTING = ' + JSON.stringify(out, null, 1) + ';\n');
