import { useState } from 'react';
import { io } from 'socket.io-client';
import heroImage from '../assets/IMG_5922.jpg';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

function Home({ onNavigateToHost, onNavigateToPlayer }) {
  const [isHost, setIsHost] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = () => {
    setLoading(true);
    setError('');

    const socket = io(SOCKET_URL);

    socket.on('connect', () => {
      socket.emit('create_room', (response) => {
        if (response.success) {
          socket.disconnect();
          onNavigateToHost(response.roomCode);
        } else {
          setError('Error creating room');
          setLoading(false);
          socket.disconnect();
        }
      });
    });

    socket.on('connect_error', () => {
      setError('Cannot connect to server');
      setLoading(false);
      socket.disconnect();
    });
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();

    if (!roomCode.trim() || !nickname.trim()) {
      setError('Please enter room code and nickname');
      return;
    }

    setLoading(true);
    setError('');

    const socket = io(SOCKET_URL);

    socket.on('connect', () => {
      socket.emit('join_room', { roomCode: roomCode.trim(), nickname: nickname.trim() }, (response) => {
        if (response.success) {
          socket.disconnect();
          onNavigateToPlayer(roomCode.trim(), nickname.trim());
        } else {
          setError(response.error || 'Error joining room');
          setLoading(false);
          socket.disconnect();
        }
      });
    });

    socket.on('connect_error', () => {
      setError('Cannot connect to server');
      setLoading(false);
      socket.disconnect();
    });
  };

  if (isHost === null) {
    return (
      <div className="home-container">
        <div className="home-card">
          <img
            src={heroImage}
            alt="Cami & Alex"
            className="hero-image"
          />
          <h1 className="game-title">Los Cochitos</h1>
          <h2 className="game-subtitle">💍 Bridal Shower</h2>
          <p className="game-description">Cami & Alex</p>

          <div className="button-group">
            <button
              className="btn btn-primary btn-large"
              onClick={() => setIsHost(true)}
            >
              🖥️ Host Game (TV)
            </button>
            <button
              className="btn btn-secondary btn-large"
              onClick={() => setIsHost(false)}
            >
              📱 Join Game (Player)
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isHost) {
    return (
      <div className="home-container">
        <div className="home-card">
          <h1 className="game-title">💍 Create Game</h1>
          <p className="instruction-text">Click below to create a new room</p>

          {error && <div className="error-message">{error}</div>}

          <div className="button-group">
            <button
              className="btn btn-primary btn-large"
              onClick={handleCreateRoom}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Room'}
            </button>
            <button
              className="btn btn-link"
              onClick={() => setIsHost(null)}
              disabled={loading}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="home-card">
        <h1 className="game-title">💍 Join Game</h1>

        <form onSubmit={handleJoinRoom} className="join-form">
          <div className="form-group">
            <label>Room Code</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter 4-digit code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              maxLength={4}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Your Nickname</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter your name"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="button-group">
            <button
              type="submit"
              className="btn btn-primary btn-large"
              disabled={loading}
            >
              {loading ? 'Joining...' : 'Join Room'}
            </button>
            <button
              type="button"
              className="btn btn-link"
              onClick={() => setIsHost(null)}
              disabled={loading}
            >
              Back
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Home;
