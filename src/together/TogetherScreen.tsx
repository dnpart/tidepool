// A hidden test page (#/together) for playing on two phones: connect them by swapping QR codes, then send a bloop
// back and forth. It proves the link works on the owner's Wi-Fi and hotspot before any game uses it.
import { useEffect, useRef, useState } from 'react';
import { BackButton } from '../screens/BackButton';
import { useSettings } from '../settings/SettingsContext';
import { displayName } from '../settings/settings';
import { play } from '../sound/sfx';
import { kindOf } from './code';
import { finishHost, host, join, type Channel, type Link } from './link';
import { QrCode } from './QrCode';
import { Scanner } from './Scanner';
import styles from './Together.module.css';

type Step =
  | { name: 'start' }
  | { name: 'making' }
  | { name: 'hostShow'; code: string }
  | { name: 'hostScan' }
  | { name: 'joinScan' }
  | { name: 'joinShow'; code: string }
  | { name: 'connecting' }
  | { name: 'connected' }
  | { name: 'failed'; why: string };

type Message = { t: 'hello'; name: string } | { t: 'bloop' } | { t: 'ping'; at: number } | { t: 'pong'; at: number };

/** How long the first phone waits after scanning the answer before saying it couldn't connect. */
const CONNECT_MS = 20000;

/**
 * Asks for the camera once before making a code. Chrome only lists a phone's real local address (rather than a
 * private stand-in name the other phone may not be able to look up) once the page may use the camera.
 */
async function warmCamera(): Promise<void> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    stream.getTracks().forEach((t) => t.stop());
  } catch {
    // Without the camera the code still works on most networks; scanning will ask again
  }
}

export function TogetherScreen() {
  const { settings } = useSettings();
  const name = displayName(settings);
  const [step, setStep] = useState<Step>({ name: 'start' });
  const [note, setNote] = useState<string | null>(null);
  const [friend, setFriend] = useState<string | null>(null);
  const [bloops, setBloops] = useState({ sent: 0, got: 0 });
  const [ping, setPing] = useState<number | null>(null);
  const linkRef = useRef<Link | null>(null);
  const channelRef = useRef<Channel | null>(null);
  /** The first phone's own code, to show again if it scans the wrong thing. */
  const hostCodeRef = useRef('');

  const send = (m: Message) => {
    channelRef.current?.send(JSON.stringify(m));
  };

  const close = () => {
    channelRef.current?.close();
    linkRef.current?.pc.close();
    channelRef.current = null;
    linkRef.current = null;
  };
  useEffect(() => close, []);

  /** Once the phones can talk: say hello, answer pings, and bloop when the other phone bloops. */
  const whenOpen = (link: Link) => {
    linkRef.current = link;
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) setStep({ name: 'failed', why: 'timeout' });
    }, CONNECT_MS);
    link.pc.addEventListener('connectionstatechange', () => {
      const s = link.pc.connectionState;
      if (s === 'failed' || s === 'closed' || (s === 'disconnected' && settled)) {
        setStep((cur) => (cur.name === 'connected' ? { name: 'failed', why: 'left' } : cur.name === 'start' ? cur : { name: 'failed', why: 'failed' }));
      }
    });
    link.open
      .then((channel) => {
        settled = true;
        clearTimeout(timer);
        channelRef.current = channel;
        channel.listen((text) => {
          let m: Message;
          try {
            m = JSON.parse(text);
          } catch {
            return;
          }
          if (m.t === 'hello') setFriend(m.name);
          if (m.t === 'bloop') {
            play('tap');
            setBloops((b) => ({ ...b, got: b.got + 1 }));
          }
          if (m.t === 'ping') send({ t: 'pong', at: m.at });
          if (m.t === 'pong') setPing(Math.round(performance.now() - m.at));
        });
        play('foundation');
        setStep({ name: 'connected' });
        send({ t: 'hello', name });
      })
      .catch(() => setStep({ name: 'failed', why: 'failed' }));
  };

  const startOver = () => {
    close();
    setNote(null);
    setFriend(null);
    setPing(null);
    setBloops({ sent: 0, got: 0 });
    setStep({ name: 'start' });
  };

  const onHost = async () => {
    setStep({ name: 'making' });
    await warmCamera();
    const { link, code } = await host();
    linkRef.current = link;
    hostCodeRef.current = code;
    setStep({ name: 'hostShow', code });
  };

  const onHostScanned = async (code: string) => {
    const link = linkRef.current;
    if (!link) return;
    if (kindOf(code) === 'offer') {
      setNote('That phone is starting too. On the other phone, tap Start over, then Join.');
      return setStep({ name: 'hostShow', code: hostCodeRef.current });
    }
    if (!(await finishHost(link, code))) {
      setNote('That isn’t a Tidepool code. Scan the code on the other phone’s screen.');
      return setStep({ name: 'hostScan' });
    }
    setNote(null);
    setStep({ name: 'connecting' });
    whenOpen(link);
  };

  const onJoinScanned = async (code: string) => {
    if (kindOf(code) === 'answer') {
      setNote('That code is for the first phone. Scan the code on the phone that tapped Start.');
      return setStep({ name: 'start' });
    }
    setStep({ name: 'making' });
    const made = await join(code);
    if (!made) {
      setNote('That isn’t a Tidepool code. Scan the code on the other phone’s screen.');
      return setStep({ name: 'start' });
    }
    setNote(null);
    setStep({ name: 'joinShow', code: made.code });
    whenOpen(made.link);
  };

  return (
    <main className={styles.screen}>
      <header className={styles.topBar}>
        <BackButton />
        <h1 className={styles.title}>Play together</h1>
      </header>

      <section className={`panel ${styles.card}`}>
        {step.name === 'start' && (
          <>
            <h2 className={styles.heading}>Connect two phones</h2>
            <ol className={styles.steps}>
              <li>Put both phones on the same Wi-Fi, or turn on one phone&rsquo;s hotspot and join it with the other. No internet needed.</li>
              <li>On one phone, tap <b>Start</b>. On the other, tap <b>Join</b>.</li>
              <li>Each phone scans the other&rsquo;s code, one after the other.</li>
            </ol>
            {note && <p className={styles.note} role="status">{note}</p>}
            <div className={styles.buttons}>
              <button type="button" className={styles.primary} onClick={onHost}>Start</button>
              <button type="button" className={styles.secondary} onClick={() => { setNote(null); setStep({ name: 'joinScan' }); }}>Join</button>
            </div>
          </>
        )}

        {step.name === 'making' && <p className={styles.waiting} role="status">Getting a code ready…</p>}

        {step.name === 'hostShow' && (
          <>
            <h2 className={styles.heading}>1. Let the other phone scan this</h2>
            <p className={styles.sub}>On the other phone, tap Join and point it at this code.</p>
            <div className={styles.qr}><QrCode text={step.code} size={320} label="Code for the other phone to scan" /></div>
            {note && <p className={styles.note} role="status">{note}</p>}
            <p className={styles.sub}>When the other phone shows a code, tap below.</p>
            <div className={styles.buttons}>
              <button type="button" className={styles.primary} onClick={() => setStep({ name: 'hostScan' })}>Scan their code</button>
            </div>
          </>
        )}

        {step.name === 'hostScan' && (
          <>
            <h2 className={styles.heading}>2. Scan the other phone&rsquo;s code</h2>
            <Scanner onCode={onHostScanned} />
            {note && <p className={styles.note} role="status">{note}</p>}
            <div className={styles.buttons}>
              <button type="button" className={styles.secondary} onClick={() => setStep({ name: 'hostShow', code: hostCodeRef.current })}>
                Show my code again
              </button>
            </div>
          </>
        )}

        {step.name === 'joinScan' && (
          <>
            <h2 className={styles.heading}>1. Scan the first phone&rsquo;s code</h2>
            <Scanner onCode={onJoinScanned} />
          </>
        )}

        {step.name === 'joinShow' && (
          <>
            <h2 className={styles.heading}>2. Now let the first phone scan this</h2>
            <div className={styles.qr}><QrCode text={step.code} size={320} label="Code for the first phone to scan" /></div>
            <p className={styles.waiting} role="status">Waiting for the first phone…</p>
          </>
        )}

        {step.name === 'connecting' && <p className={styles.waiting} role="status">Connecting…</p>}

        {step.name === 'connected' && (
          <>
            <h2 className={styles.heading}>Connected{friend ? ` to ${friend}` : ''}!</h2>
            <p className={styles.sub}>The phones are talking straight to each other. Tap Bloop and the other phone bloops.</p>
            <div className={styles.buttons}>
              <button
                type="button"
                className={styles.primary}
                data-silent
                onClick={() => {
                  send({ t: 'bloop' });
                  setBloops((b) => ({ ...b, sent: b.sent + 1 }));
                }}
              >
                Bloop
              </button>
              <button type="button" className={styles.secondary} onClick={() => send({ t: 'ping', at: performance.now() })}>Check speed</button>
            </div>
            <p className={styles.sub} role="status">
              Sent {bloops.sent} · Heard {bloops.got}
              {ping !== null && ` · ${ping} ms there and back`}
            </p>
            <div className={styles.buttons}>
              <button type="button" className={styles.secondary} onClick={startOver}>Disconnect</button>
            </div>
          </>
        )}

        {step.name === 'failed' && (
          <>
            <h2 className={styles.heading}>{step.why === 'left' ? 'The other phone left' : 'The phones couldn’t connect'}</h2>
            {step.why !== 'left' && (
              <p className={styles.sub}>
                Check that both phones are on the same Wi-Fi. Some Wi-Fi (guest, hotel and caf&eacute; networks) keeps phones
                apart; a phone&rsquo;s hotspot usually works instead.
              </p>
            )}
            <div className={styles.buttons}>
              <button type="button" className={styles.primary} onClick={startOver}>Start over</button>
            </div>
          </>
        )}
      </section>

      {step.name !== 'start' && step.name !== 'connected' && step.name !== 'failed' && (
        <button type="button" className={styles.link} onClick={startOver}>Start over</button>
      )}
    </main>
  );
}
