import { OverlayView } from '@react-google-maps/api';

export default function FootstepMarker({ position, name }) {
  return (
    <OverlayView position={position} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
      <div className="footstep-marker">
        <svg viewBox="0 0 220 70" className="name-ribbon">
          <path
            d="M10,35 Q0,20 15,10 L45,18 L175,18 L205,10 Q220,20 210,35 Q220,50 205,60 L175,52 L45,52 L15,60 Q0,50 10,35 Z"
            fill="#e8dcc0" stroke="#6b4c28" strokeWidth="1.5"
          />
          <path d="M10,35 Q-4,45 2,62 Q-6,66 4,58" fill="none" stroke="#6b4c28" strokeWidth="1.2" />
          <text x="110" y="41" textAnchor="middle" className="ribbon-text">{name}</text>
        </svg>
        <svg viewBox="0 0 40 24" className="footstep-pair">
          <ellipse cx="10" cy="8" rx="4" ry="6" fill="#3a2a15" />
          <ellipse cx="8" cy="17" rx="3" ry="4" fill="#3a2a15" />
          <ellipse cx="30" cy="14" rx="4" ry="6" fill="#3a2a15" />
          <ellipse cx="32" cy="4" rx="3" ry="4" fill="#3a2a15" />
        </svg>
      </div>
    </OverlayView>
  );
}