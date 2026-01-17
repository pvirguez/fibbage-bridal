import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

function Host({ roomCode, onBack }) {
  const [socket, setSocket] = useState(null);
  const [phase, setPhase] = useState('lobby');
  const [players, setPlayers] = useState([]);
  const [question, setQuestion] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(15);
  const [timer, setTimer] = useState(0);
  const [liesProgress, setLiesProgress] = useState({ submitted: 0, total: 0 });
  const [votesProgress, setVotesProgress] = useState({ voted: 0, total: 0 });
  const [answers, setAnswers] = useState([]);
  const [results, setResults] = useState(null);
  const [finalScores, setFinalScores] = useState([]);
  const [error, setError] = useState('');
  const socketRef = useRef(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Host connected');
      // Reconnect as host for this room
      newSocket.emit('reconnect_host', { roomCode }, (response) => {
        if (response.success) {
          setPlayers(response.players || []);
        } else {
          setError(response.error || 'Failed to reconnect as host');
        }
      });
    });

    newSocket.on('player_joined', (data) => {
      setPlayers(data.players);
    });

    newSocket.on('player_left', (data) => {
      setPlayers(data.players);
    });

    newSocket.on('game_started', (data) => {
      setPhase(data.phase);
      setQuestion(data.question);
      setQuestionNumber(data.questionNumber);
      setTotalQuestions(data.totalQuestions);
      setLiesProgress({ submitted: 0, total: players.length });
    });

    newSocket.on('lies_progress', (data) => {
      setLiesProgress(data);
    });

    newSocket.on('timer_update', (data) => {
      setTimer(data.remaining);
    });

    newSocket.on('voting_started', (data) => {
      setPhase(data.phase);
      setAnswers(data.answers);
      setVotesProgress({ voted: 0, total: players.length });
    });

    newSocket.on('votes_progress', (data) => {
      setVotesProgress(data);
    });

    newSocket.on('results_ready', (data) => {
      setPhase(data.phase);
      setResults(data);
      setPlayers(data.currentScores);
    });

    newSocket.on('next_question_started', (data) => {
      setPhase(data.phase);
      setQuestion(data.question);
      setQuestionNumber(data.questionNumber);
      setTotalQuestions(data.totalQuestions);
      setLiesProgress({ submitted: 0, total: players.length });
      setVotesProgress({ voted: 0, total: players.length });
      setResults(null);
      setAnswers([]);
    });

    newSocket.on('final_podium', (data) => {
      setPhase(data.phase);
      setFinalScores(data.finalScores);
    });

    newSocket.on('connect_error', () => {
      setError('Connection error');
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleStartGame = () => {
    if (players.length === 0) {
      setError('Need at least 1 player to start');
      return;
    }

    socket.emit('start_game', { roomCode }, (response) => {
      if (!response.success) {
        setError(response.error || 'Error starting game');
      }
    });
  };

  const handleNextQuestion = () => {
    socket.emit('next_question', { roomCode }, (response) => {
      if (!response.success) {
        setError(response.error || 'Error');
      }
    });
  };

  const renderLobby = () => (
    <div className="host-lobby">
      <div className="room-code-display">
        <div className="room-code-label">Room Code</div>
        <div className="room-code-value">{roomCode}</div>
      </div>

      <h2 className="section-title">Players ({players.length})</h2>
      {players.length === 0 ? (
        <p className="waiting-text">Waiting for players to join...</p>
      ) : (
        <div className="players-grid">
          {players.map((player) => (
            <div key={player.id} className="player-card">
              <span className="player-name">{player.nickname}</span>
            </div>
          ))}
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <div className="button-group">
        <button
          className="btn btn-primary btn-large"
          onClick={handleStartGame}
          disabled={players.length === 0}
        >
          Start Game
        </button>
      </div>
    </div>
  );

  const renderSubmitLies = () => (
    <div className="host-game">
      <div className="question-header">
        <div className="question-number">Question {questionNumber}/{totalQuestions}</div>
        <div className="timer-display">{timer}s</div>
      </div>

      <div className="question-display">
        <h2 className="question-text">{question?.text}</h2>
      </div>

      <div className="progress-display">
        <h3>Players Submitting Lies...</h3>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(liesProgress.submitted / liesProgress.total) * 100}%` }}
          />
        </div>
        <p className="progress-text">{liesProgress.submitted}/{liesProgress.total} submitted</p>
      </div>

      <div className="players-scoreboard">
        <h3>Current Scores</h3>
        <div className="scoreboard-list">
          {players.slice(0, 5).map((player, index) => (
            <div key={player.id} className="scoreboard-item">
              <span className="rank">#{index + 1}</span>
              <span className="player-name">{player.nickname}</span>
              <span className="score">{player.score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderVoting = () => (
    <div className="host-game">
      <div className="question-header">
        <div className="question-number">Question {questionNumber}/{totalQuestions}</div>
        <div className="timer-display">{timer}s</div>
      </div>

      <div className="question-display">
        <h2 className="question-text">{question?.text}</h2>
      </div>

      <div className="answers-display">
        <h3>Choose the Truth!</h3>
        <div className="answers-grid">
          {answers.map((answer, index) => (
            <div key={index} className="answer-option">
              <div className="answer-letter">{String.fromCharCode(65 + index)}</div>
              <div className="answer-text">{answer}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="progress-display">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(votesProgress.voted / votesProgress.total) * 100}%` }}
          />
        </div>
        <p className="progress-text">{votesProgress.voted}/{votesProgress.total} voted</p>
      </div>
    </div>
  );

  const renderResults = () => (
    <div className="host-game">
      <div className="question-header">
        <div className="question-number">Question {questionNumber}/{totalQuestions}</div>
      </div>

      <div className="question-display">
        <h2 className="question-text">{question?.text}</h2>
      </div>

      <div className="results-display">
        <div className="correct-answer-banner">
          ✓ Correct Answer: {results?.correctAnswer}
        </div>

        <div className="answers-results">
          {results?.answerResults.map((item, index) => (
            <div
              key={index}
              className={`result-item ${item.isCorrect ? 'correct' : 'incorrect'}`}
            >
              <div className="result-answer">
                <span className="answer-letter">{String.fromCharCode(65 + index)}</span>
                <span className="answer-text">{item.answer}</span>
                {item.author && <span className="answer-author">by {item.author}</span>}
              </div>
              <div className="result-votes">
                {item.votes} vote{item.votes !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>

        <div className="scoreboard-section">
          <h3>Leaderboard</h3>
          <div className="scoreboard-list">
            {players.map((player, index) => (
              <div key={player.id} className="scoreboard-item">
                <span className="rank">#{index + 1}</span>
                <span className="player-name">{player.nickname}</span>
                <span className="score">{player.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="button-group">
        <button
          className="btn btn-primary btn-large"
          onClick={handleNextQuestion}
        >
          {questionNumber >= totalQuestions ? 'Show Final Results' : 'Next Question'}
        </button>
      </div>
    </div>
  );

  const renderFinalPodium = () => {
    const top3 = finalScores.slice(0, 3);

    return (
      <div className="final-podium">
        <h1 className="podium-title">🏆 Final Results 🏆</h1>

        <div className="podium-display">
          {top3.length >= 2 && (
            <div className="podium-place second">
              <div className="place-medal">🥈</div>
              <div className="place-name">{top3[1].nickname}</div>
              <div className="place-score">{top3[1].score}</div>
            </div>
          )}

          {top3.length >= 1 && (
            <div className="podium-place first">
              <div className="place-medal">🥇</div>
              <div className="place-name">{top3[0].nickname}</div>
              <div className="place-score">{top3[0].score}</div>
            </div>
          )}

          {top3.length >= 3 && (
            <div className="podium-place third">
              <div className="place-medal">🥉</div>
              <div className="place-name">{top3[2].nickname}</div>
              <div className="place-score">{top3[2].score}</div>
            </div>
          )}
        </div>

        {finalScores.length > 3 && (
          <div className="remaining-players">
            <h3>Other Players</h3>
            {finalScores.slice(3).map((player, index) => (
              <div key={player.id} className="other-player">
                <span>#{index + 4}</span>
                <span>{player.nickname}</span>
                <span>{player.score}</span>
              </div>
            ))}
          </div>
        )}

        <div className="game-over-message">
          <h2>Thanks for playing!</h2>
          <p>💍 Congratulations Cami & Alex! 💍</p>
        </div>
      </div>
    );
  };

  return (
    <div className="host-container">
      <div className="host-header">
        <h1 className="game-logo">💍 Fibbage - Cami & Alex</h1>
      </div>

      <div className="host-content">
        {phase === 'lobby' && renderLobby()}
        {phase === 'submit_lies' && renderSubmitLies()}
        {phase === 'voting' && renderVoting()}
        {phase === 'results' && renderResults()}
        {phase === 'final_podium' && renderFinalPodium()}
      </div>
    </div>
  );
}

export default Host;
