import { useState } from 'react';
import SplashScreen from './components/SplashScreen';
import LoginForm from './components/LoginForm';
import MapContainer from './components/MapContainer';
import './styles/fonts.css';
import './styles/parchment.css';
import './styles/splash.css';

export default function App() {
  const [oathSworn, setOathSworn] = useState(false);
  const [auth, setAuth] = useState(null); // { token, sessionId, displayName }

  if (!oathSworn) {
    return <SplashScreen onReveal={() => setOathSworn(true)} />;
  }
  if (!auth) {
    return <LoginForm onAuthenticated={setAuth} />;
  }
  return <MapContainer token={auth.token} sessionId={auth.sessionId} selfName={auth.displayName} />;
}