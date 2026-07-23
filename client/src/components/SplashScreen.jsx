import { useState } from 'react';

export default function SplashScreen({ onReveal }) {
  const [revealed, setRevealed] = useState(false);

  function handleClick() {
    setRevealed(true);
    setTimeout(onReveal, 1800);
  }

  return (
    <div className="splash-screen" onClick={handleClick}>
      <p className="splash-scroll">Itinerarium Maraudentium</p>
      <p className="splash-messrs">
        Messrs Moony, Wormtail,<br />Padfoot &amp; Prongs<br />
        <span>are proud to present</span>
      </p>

      <svg className="splash-castle" viewBox="0 0 200 120" aria-hidden="true">
        <g fill="none" stroke="#4a3520" strokeWidth="1.5">
          <rect x="40" y="60" width="120" height="50" />
          <rect x="55" y="35" width="20" height="30" />
          <rect x="125" y="35" width="20" height="30" />
          <rect x="85" y="20" width="30" height="45" />
          <polygon points="55,35 65,20 75,35" />
          <polygon points="125,35 135,20 145,35" />
          <polygon points="85,20 100,5 115,20" />
        </g>
      </svg>

      <div className="splash-title-blot">
        <p className="splash-title">The<br />Marauder's<br />Map</p>
      </div>

      {revealed && <div className="ink-reveal" />}
      {!revealed && <p className="oath-text">I solemnly swear that I am up to no good</p>}
    </div>
  );
}