import { useState } from 'react';
import splashParchment from '../assets/marauders-splash-parchment.png';

export default function SplashScreen({ onReveal }) {
  const [revealed, setRevealed] = useState(false);

  function handleReveal() {
    if (!revealed) setRevealed(true);
  }

  return (
    <main className={`splash-screen${revealed ? ' is-revealing' : ''}`}>
      <div className="splash-folio">
        <img
          className="splash-artwork"
          src={splashParchment}
          alt="An antique ink drawing of a many-towered magical castle on parchment"
        />

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
          <span>I solemnly swear</span>
          <small>that I am up to no good</small>
          <i aria-hidden="true">Tap to reveal the map</i>
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
