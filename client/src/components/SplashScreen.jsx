import { useState } from 'react';
import SplashArtwork from './SplashArtwork';

export default function SplashScreen({ onReveal }) {
  const [revealed, setRevealed] = useState(false);

  function handleReveal() {
    if (!revealed) setRevealed(true);
  }

  return (
    <main className={`splash-screen${revealed ? ' is-revealing' : ''}`}>
      <div className="splash-folio">
        <SplashArtwork />

        <div className="splash-paper-grain" aria-hidden="true" />

        <header className="splash-heading">
          <p className="splash-scroll">
            <span>Itinerarium</span>
            <span>Maraudentium</span>
          </p>
          <p className="splash-messrs">
            <span className="splash-presenters">Messrs</span>
            Moony, Wormtail,<br />Padfoot &amp; Prongs
            <span className="splash-present">are proud to present</span>
          </p>
        </header>

        <div className="splash-title-blot" aria-label="The Marauder's Map">
          <span className="splash-title-the">The</span>
          <span className="splash-title-main">Marauder's</span>
          <span className="splash-title-map">Map</span>
        </div>

        <button className="splash-oath" type="button" onClick={handleReveal} disabled={revealed}>
          <svg className="splash-oath-quill" viewBox="0 0 70 70" aria-hidden="true">
            <path d="M59 7C38 9 21 21 15 42c8-8 16-13 27-16-10 6-19 14-26 24l-7 13 4 1 7-12c7-4 15-7 21-13 10-9 17-20 18-32Z" />
            <path d="M15 48c12-4 22-11 30-21" />
          </svg>
          <span>I solemnly swear</span>
          <small>that I am up to no good</small>
          <i aria-hidden="true">Touch the parchment to reveal</i>
        </button>
      </div>

      {revealed && (
        <div className="ink-reveal" aria-hidden="true" onAnimationEnd={onReveal}>
          <span />
        </div>
      )}
    </main>
  );
}
