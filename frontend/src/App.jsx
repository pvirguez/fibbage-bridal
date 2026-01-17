import { useState, useEffect } from 'react';
import Home from './components/Home';
import Host from './components/Host';
import Player from './components/Player';
import './App.css';

function App() {
  const [view, setView] = useState('home'); // 'home', 'host', 'player'
  const [roomCode, setRoomCode] = useState('');
  const [nickname, setNickname] = useState('');

  // On mount, check if there's a saved session to restore (for page refresh/app reopen)
  useEffect(() => {
    const savedSession = sessionStorage.getItem('fibbage_session');
    if (savedSession) {
      try {
        const { roomCode: savedRoom, nickname: savedNick } = JSON.parse(savedSession);
        if (savedRoom && savedNick) {
          setRoomCode(savedRoom);
          setNickname(savedNick);
          setView('player');
        }
      } catch (e) {
        sessionStorage.removeItem('fibbage_session');
      }
    }
  }, []);

  const navigateToHost = (code) => {
    setRoomCode(code);
    setView('host');
  };

  const navigateToPlayer = (code, nick) => {
    setRoomCode(code);
    setNickname(nick);
    setView('player');
  };

  const navigateToHome = () => {
    sessionStorage.removeItem('fibbage_session');
    setView('home');
    setRoomCode('');
    setNickname('');
  };

  return (
    <div className="app">
      {view === 'home' && (
        <Home
          onNavigateToHost={navigateToHost}
          onNavigateToPlayer={navigateToPlayer}
        />
      )}
      {view === 'host' && (
        <Host
          roomCode={roomCode}
          onBack={navigateToHome}
        />
      )}
      {view === 'player' && (
        <Player
          roomCode={roomCode}
          nickname={nickname}
          onBack={navigateToHome}
        />
      )}
    </div>
  );
}

export default App;
