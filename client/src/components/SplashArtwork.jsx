import splashParchment from '../assets/marauders-splash-parchment.png';

function Footprint({ x, y, rotation = 0, delay = 0 }) {
  return (
    <g
      className="map-footprint"
      style={{ '--footstep-delay': `${delay}s` }}
      transform={`translate(${x} ${y}) rotate(${rotation})`}
    >
      <path d="M-8-22c-7 3-9 14-6 22 2 6 8 7 12 1 5-8 3-20-2-23-1-1-3-1-4 0Z" />
      <ellipse cx="-7" cy="8" rx="8" ry="12" transform="rotate(-8 -7 8)" />
      <path d="M11 8c-7 3-9 14-6 22 2 6 8 7 12 1 5-8 3-20-2-23-1-1-3-1-4 0Z" />
      <ellipse cx="12" cy="38" rx="8" ry="12" transform="rotate(-8 12 38)" />
    </g>
  );
}

export default function SplashArtwork() {
  return (
    <svg
      className="splash-map-art"
      viewBox="0 0 1600 1000"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="parchmentField" cx="50%" cy="43%" r="78%">
          <stop offset="0" stopColor="#ead8ad" />
          <stop offset="0.52" stopColor="#d7bc87" />
          <stop offset="0.83" stopColor="#bb925b" />
          <stop offset="1" stopColor="#74502d" />
        </radialGradient>

        <linearGradient id="leftAge" x1="0" x2="1">
          <stop stopColor="#5b351a" stopOpacity=".52" />
          <stop offset=".13" stopColor="#9a6c3b" stopOpacity=".12" />
          <stop offset=".56" stopColor="#ead8ad" stopOpacity="0" />
          <stop offset="1" stopColor="#efdcb1" stopOpacity=".17" />
        </linearGradient>

        <linearGradient id="rightAge" x1="1" x2="0">
          <stop stopColor="#5b351a" stopOpacity=".52" />
          <stop offset=".13" stopColor="#9a6c3b" stopOpacity=".12" />
          <stop offset=".56" stopColor="#ead8ad" stopOpacity="0" />
          <stop offset="1" stopColor="#efdcb1" stopOpacity=".17" />
        </linearGradient>

        <linearGradient id="centerFade" x1="0" x2="1">
          <stop stopColor="black" />
          <stop offset=".1" stopColor="white" />
          <stop offset=".9" stopColor="white" />
          <stop offset="1" stopColor="black" />
        </linearGradient>

        <radialGradient id="edgeShade" cx="50%" cy="48%" r="71%">
          <stop offset=".55" stopColor="#2d1609" stopOpacity="0" />
          <stop offset=".84" stopColor="#2d1609" stopOpacity=".12" />
          <stop offset="1" stopColor="#1f0f08" stopOpacity=".56" />
        </radialGradient>

        <pattern id="mapGrid" width="92" height="92" patternUnits="userSpaceOnUse">
          <path d="M92 0H0V92" fill="none" stroke="#4a2e1c" strokeOpacity=".065" strokeWidth="1" />
          <circle cx="0" cy="0" r="2.5" fill="#3c2416" fillOpacity=".1" />
        </pattern>

        <filter id="mapSoftener" x="-12%" y="-12%" width="124%" height="124%">
          <feGaussianBlur stdDeviation="12" />
          <feColorMatrix type="saturate" values=".62" />
        </filter>

        <filter id="inkBleed" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency=".025" numOctaves="2" seed="8" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.4" />
        </filter>

        <filter id="paperFibres" x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence type="fractalNoise" baseFrequency=".48" numOctaves="3" seed="19" />
          <feColorMatrix values="0 0 0 0 0.25 0 0 0 0 0.15 0 0 0 0 0.07 0 0 0 .22 0" />
        </filter>

        <mask id="portraitFade">
          <rect x="360" y="-40" width="880" height="1080" fill="url(#centerFade)" />
        </mask>
      </defs>

      <rect width="1600" height="1000" fill="url(#parchmentField)" />

      <image
        className="splash-map-ghost"
        href={splashParchment}
        x="-35"
        y="-35"
        width="1670"
        height="1070"
        preserveAspectRatio="xMidYMid slice"
        opacity=".46"
        filter="url(#mapSoftener)"
      />

      <rect width="800" height="1000" fill="url(#leftAge)" />
      <rect x="800" width="800" height="1000" fill="url(#rightAge)" />
      <rect width="1600" height="1000" fill="url(#mapGrid)" />

      <g className="map-folds" fill="none" stroke="#604121">
        <path d="M244 0c-13 177 11 316-3 488s17 336-2 512" />
        <path d="M526 0c14 164-8 352 4 501s-9 326 2 499" />
        <path d="M800 0c-12 173 9 337-2 497s12 330 1 503" />
        <path d="M1074 0c12 165-9 339 3 502s-10 329 3 498" />
        <path d="M1356 0c-13 168 10 332-4 502s16 322 2 498" />
        <path d="M0 505c221-12 408 10 617-2s421 12 608-2 251 8 375 1" />
      </g>

      <image
        className="splash-map-portrait"
        href={splashParchment}
        x="385"
        y="-19"
        width="830"
        height="1038"
        preserveAspectRatio="xMidYMid meet"
        opacity=".94"
        mask="url(#portraitFade)"
      />

      <g className="map-ink map-ink--fine" fill="none" stroke="#362417" strokeLinecap="round" strokeLinejoin="round">
        <path className="map-route map-route--left" d="M68 850C172 795 110 691 206 630s-14-133 73-209S241 244 360 181" />
        <path className="map-route map-route--right" d="M1515 136c-121 51-49 137-145 202s12 144-89 220 28 148-103 248" />

        <g className="map-flourish map-flourish--left" transform="translate(74 83)">
          <path d="M0 102C16 44 58 26 108 50c35 17 53-1 48-28-5-24-37-25-47-5" />
          <path d="M21 101c18-39 48-48 77-30 28 18 56 4 68-21" />
          <path d="M49 66C22 48 21 19 45 4M75 64c-5-28 14-51 39-58M95 78c18-8 37 0 46 17" />
          <path d="M13 86c5-16-4-29-19-34M39 42C21 32 12 16 16-1" />
          <path d="M50 68c-13 4-21 15-20 28M115 52c14 6 22 18 20 32" />
        </g>

        <g className="map-flourish map-flourish--right" transform="translate(1526 83) scale(-1 1)">
          <path d="M0 102C16 44 58 26 108 50c35 17 53-1 48-28-5-24-37-25-47-5" />
          <path d="M21 101c18-39 48-48 77-30 28 18 56 4 68-21" />
          <path d="M49 66C22 48 21 19 45 4M75 64c-5-28 14-51 39-58M95 78c18-8 37 0 46 17" />
          <path d="M13 86c5-16-4-29-19-34M39 42C21 32 12 16 16-1" />
          <path d="M50 68c-13 4-21 15-20 28M115 52c14 6 22 18 20 32" />
        </g>

        <g className="map-compass" transform="translate(1370 188)">
          <circle r="78" />
          <circle r="57" />
          <circle r="11" />
          <path d="M0-95V95M-95 0H95M-66-66 66 66M66-66-66 66" />
          <path className="map-compass-needle" d="m0-68 12 57-12-6-12 6Zm0 136-12-57 12 6 12-6Z" />
          <path d="M0-78 5-91 0-104l-5 13ZM78 0l13 5 13-5-13-5Z" />
          <text x="0" y="-112" textAnchor="middle">N</text>
          <text x="113" y="6" textAnchor="middle">E</text>
          <text x="0" y="122" textAnchor="middle">S</text>
          <text x="-113" y="6" textAnchor="middle">W</text>
        </g>

        <g className="map-moon" transform="translate(230 242)">
          <circle r="54" />
          <path d="M21-45C-10-34-20-3-8 23 2 45 24 51 42 42 25 64-10 67-32 43-57 15-52-28-23-50-8-61 9-62 21-58" />
          <path d="M0-76v-25M0 76v25M-76 0h-25M76 0h25M-54-54l-16-16M54-54l16-16M-54 54l-16 16M54 54l16 16" />
        </g>

        <g className="map-castle-key" transform="translate(164 686)">
          <path d="M-49 48h98M-39 45V5l15-15V45M-15 45v-67L0-42l15 20v67M24 45V-5L39 7v38" />
          <path d="M-7 45V17c0-13 14-13 14 0v28M-29 14h10M19 12h10M-5-15h10" />
          <circle cx="0" cy="-53" r="3" />
        </g>

        <g className="map-stars">
          <path d="M1161 122h42M1182 101v42M1148 109l11 11M1205 144l11 11M1205 109l-11 11M1159 144l-11 11" />
          <path d="M349 329h30M364 314v30M112 454h34M129 437v34M1468 668h38M1487 649v38" />
          <circle cx="1107" cy="169" r="3" />
          <circle cx="1236" cy="211" r="2.5" />
          <circle cx="307" cy="394" r="2.5" />
          <circle cx="1430" cy="601" r="2.5" />
        </g>
      </g>

      <g className="map-marginalia" fill="#40291a">
        <text x="150" y="611" textAnchor="middle">THE OLD PASSAGE</text>
        <text x="1435" y="523" textAnchor="middle">WHOMPS &amp; WILLOWS</text>
        <text x="182" y="774" textAnchor="middle">CASTLE GROUNDS</text>
        <text x="1390" y="889" textAnchor="middle">THE FORBIDDEN FOREST</text>
        <text x="800" y="940" textAnchor="middle">HOGWARTS SCHOOL OF WITCHCRAFT &amp; WIZARDRY</text>
      </g>

      <g className="map-footsteps" fill="#641c1a" filter="url(#inkBleed)">
        <Footprint x={92} y={904} rotation={31} delay={0} />
        <Footprint x={142} y={814} rotation={20} delay={0.18} />
        <Footprint x={164} y={718} rotation={-9} delay={0.36} />
        <Footprint x={226} y={621} rotation={33} delay={0.54} />
        <Footprint x={278} y={512} rotation={-8} delay={0.72} />
        <Footprint x={1505} y={157} rotation={208} delay={0.1} />
        <Footprint x={1445} y={247} rotation={196} delay={0.28} />
        <Footprint x={1400} y={350} rotation={220} delay={0.46} />
        <Footprint x={1331} y={452} rotation={186} delay={0.64} />
        <Footprint x={1290} y={566} rotation={212} delay={0.82} />
      </g>

      <rect className="map-paper-fibres" width="1600" height="1000" filter="url(#paperFibres)" opacity=".36" />
      <rect width="1600" height="1000" fill="url(#edgeShade)" />
      <rect className="map-border" x="18" y="18" width="1564" height="964" rx="3" fill="none" stroke="#3e2617" strokeWidth="2" />
      <rect className="map-border map-border--inner" x="29" y="29" width="1542" height="942" rx="2" fill="none" stroke="#51331e" />
    </svg>
  );
}
