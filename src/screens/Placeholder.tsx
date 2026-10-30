import { hrefFor } from '../app/router';

// Stand-in for screens that later phases build
export function Placeholder({ title }: { title: string }) {
  return (
    <main className="screen">
      <a href={hrefFor({ name: 'home' })}>Back</a>
      <h1 style={{ fontSize: 'var(--fs-title-settings)', marginTop: 'var(--gap-section)' }}>{title}</h1>
      <p style={{ color: 'var(--sub)' }}>Coming in a later phase.</p>
    </main>
  );
}
