import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

function Player({ roomCode, nickname, onBack }) {
  const [socket, setSocket] = useState(null);
  const [phase, setPhase] = useState('waiting');
  const [question, setQuestion] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(12);
  const [timer, setTimer] = useState(0);
  const [lie, setLie] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [voted, setVoted] = useState(false);
  const [myScore, setMyScore] = useState(0);
  const [results, setResults] = useState(null);
  const [finalScores, setFinalScores] = useState([]);
  const [myRank, setMyRank] = useState(0);
  const [error, setError] = useState('');
  const socketRef = useRef(null);

  useEffect(() => {
    // Store session info for reconnection after tab background/app switch
    sessionStorage.setItem('fibbage_session', JSON.stringify({ roomCode, nickname }));

    const newSocket = io(SOCKET_URL);
    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Player connected');

      // Try to reconnect first (in case we're returning from tab background)
      newSocket.emit('reconnect_player', { roomCode, nickname }, (response) => {
        if (response.success) {
          console.log('Reconnected to game!', response.gameState);
          // Restore game state
          const gs = response.gameState;
          setPhase(gs.phase);
          setQuestion(gs.question);
          setQuestionNumber(gs.questionNumber);
          setTotalQuestions(gs.totalQuestions);
          setMyScore(gs.score);
          setSubmitted(gs.hasSubmittedLie);
          setVoted(gs.hasVoted);
          if (gs.answers) {
            setAnswers(gs.answers);
          }
          setError('');
        } else if (response.error === 'Session expired' || response.error === 'Room not found') {
          // Not a reconnect scenario, try joining fresh (only works in lobby)
          newSocket.emit('join_room', { roomCode, nickname }, (joinResponse) => {
            if (!joinResponse.success) {
              setError(joinResponse.error || 'Failed to join room');
            }
          });
        } else if (response.error !== 'Already connected') {
          setError(response.error || 'Failed to reconnect');
        }
      });
    });

    newSocket.on('game_started', (data) => {
      setPhase(data.phase);
      setQuestion(data.question);
      setQuestionNumber(data.questionNumber);
      setTotalQuestions(data.totalQuestions);
      setSubmitted(false);
      setLie('');
    });

    newSocket.on('timer_update', (data) => {
      setTimer(data.remaining);
    });

    newSocket.on('voting_started', (data) => {
      setPhase(data.phase);
      setAnswers(data.answers);
      setVoted(false);
      setSelectedAnswer(null);
    });

    newSocket.on('results_ready', (data) => {
      setPhase(data.phase);
      setResults(data);

      // Update my score
      const me = data.currentScores.find(p => p.nickname === nickname);
      if (me) {
        setMyScore(me.score);
      }
    });

    newSocket.on('next_question_started', (data) => {
      setPhase(data.phase);
      setQuestion(data.question);
      setQuestionNumber(data.questionNumber);
      setTotalQuestions(data.totalQuestions);
      setSubmitted(false);
      setLie('');
      setVoted(false);
      setSelectedAnswer(null);
      setResults(null);
      setAnswers([]);
    });

    newSocket.on('final_podium', (data) => {
      setPhase(data.phase);
      setFinalScores(data.finalScores);

      // Find my rank
      const myIndex = data.finalScores.findIndex(p => p.nickname === nickname);
      setMyRank(myIndex + 1);

      const me = data.finalScores[myIndex];
      if (me) {
        setMyScore(me.score);
      }
    });

    newSocket.on('host_disconnected', () => {
      setError('Host disconnected. Game ended.');
      sessionStorage.removeItem('fibbage_session');
      setTimeout(() => {
        onBack();
      }, 3000);
    });

    newSocket.on('connect_error', () => {
      setError('Connection error');
    });

    return () => {
      // Note: Don't clear sessionStorage here - we want it to persist
      // for reconnection if the tab is backgrounded
      newSocket.disconnect();
    };
  }, [roomCode, nickname, onBack]);

  const handleSubmitLie = () => {
    if (!lie.trim()) {
      setError('Please enter a lie');
      return;
    }

    socket.emit('submit_lie', { roomCode, lie: lie.trim() }, (response) => {
      if (response.success) {
        setSubmitted(true);
        setError('');
      } else {
        setError(response.error || 'Error submitting lie');
      }
    });
  };

  const handleVote = (answer) => {
    setSelectedAnswer(answer);

    socket.emit('submit_vote', { roomCode, answer }, (response) => {
      if (response.success) {
        setVoted(true);
        setError('');
      } else {
        setError(response.error || 'Error submitting vote');
      }
    });
  };

  const renderWaiting = () => (
    <div className="player-waiting">
      <div className="waiting-icon">⏳</div>
      <h2>Waiting for game to start...</h2>
      <p className="player-info">You're in as: <strong>{nickname}</strong></p>
      <p className="room-info">Room: {roomCode}</p>
    </div>
  );

  const renderSubmitLies = () => (
    <div className="player-game">
      <div className="player-header">
        <div className="player-info-bar">
          <span className="player-nickname">{nickname}</span>
          <span className="player-score">Score: {myScore}</span>
        </div>
        <div className="question-info">
          <span>Question {questionNumber}/{totalQuestions}</span>
          <span className="timer-badge">{timer}s</span>
        </div>
      </div>

      <div className="question-card">
        <h3 className="question-title">The Question:</h3>
        <p className="question-text">{question?.text}</p>
      </div>

      {!submitted ? (
        <div className="input-section">
          <h3 className="instruction">Write a convincing lie!</h3>
          <textarea
            className="lie-input"
            placeholder="Type your fake answer here..."
            value={lie}
            onChange={(e) => setLie(e.target.value)}
            maxLength={100}
            rows={4}
          />
          <div className="char-count">{lie.length}/100</div>

          {error && <div className="error-message">{error}</div>}

          <button
            className="btn btn-primary btn-large"
            onClick={handleSubmitLie}
            disabled={!lie.trim()}
          >
            Submit Lie
          </button>
        </div>
      ) : (
        <div className="submitted-section">
          <div className="success-icon">✓</div>
          <h3>Lie Submitted!</h3>
          <p className="submitted-text">"{lie}"</p>
          <p className="waiting-text">Waiting for other players...</p>
        </div>
      )}
    </div>
  );

  const renderVoting = () => (
    <div className="player-game">
      <div className="player-header">
        <div className="player-info-bar">
          <span className="player-nickname">{nickname}</span>
          <span className="player-score">Score: {myScore}</span>
        </div>
        <div className="question-info">
          <span>Question {questionNumber}/{totalQuestions}</span>
          <span className="timer-badge">{timer}s</span>
        </div>
      </div>

      <div className="question-card">
        <h3 className="question-title">The Question:</h3>
        <p className="question-text">{question?.text}</p>
      </div>

      {!voted ? (
        <div className="voting-section">
          <h3 className="instruction">Which one is the truth?</h3>
          <div className="answers-list">
            {answers.map((answer, index) => (
              <button
                key={index}
                className={`answer-button ${selectedAnswer === answer ? 'selected' : ''}`}
                onClick={() => handleVote(answer)}
              >
                <span className="answer-letter">{String.fromCharCode(65 + index)}</span>
                <span className="answer-text">{answer}</span>
              </button>
            ))}
          </div>

          {error && <div className="error-message">{error}</div>}
        </div>
      ) : (
        <div className="submitted-section">
          <div className="success-icon">✓</div>
          <h3>Vote Submitted!</h3>
          <p className="submitted-text">You chose: {selectedAnswer}</p>
          <p className="waiting-text">Waiting for results...</p>
        </div>
      )}
    </div>
  );

  const renderResults = () => {
    const correctAnswer = results?.correctAnswer;
    const votedCorrectly = selectedAnswer === correctAnswer;

    return (
      <div className="player-game">
        <div className="player-header">
          <div className="player-info-bar">
            <span className="player-nickname">{nickname}</span>
            <span className="player-score">Score: {myScore}</span>
          </div>
        </div>

        <div className="results-card">
          {votedCorrectly ? (
            <div className="result-banner correct">
              <div className="result-icon">🎉</div>
              <h2>Correct!</h2>
              <p>You found the truth!</p>
              <p className="points-earned">+1000 points</p>
            </div>
          ) : (
            <div className="result-banner incorrect">
              <div className="result-icon">😅</div>
              <h2>Tricked!</h2>
              <p>The truth was: <strong>{correctAnswer}</strong></p>
            </div>
          )}

          {/* Check if anyone voted for my lie */}
          {(() => {
            const myLieResult = results?.answerResults.find(
              r => r.author === nickname && !r.isCorrect
            );
            if (myLieResult && myLieResult.votes > 0) {
              return (
                <div className="lie-success">
                  <p>Your lie got {myLieResult.votes} vote{myLieResult.votes !== 1 ? 's' : ''}!</p>
                  <p className="points-earned">+{myLieResult.votes * 500} points</p>
                </div>
              );
            }
          })()}

          <div className="waiting-text">
            <p>Waiting for next question...</p>
          </div>
        </div>
      </div>
    );
  };

  const renderFinalPodium = () => {
    let rankEmoji = '🎮';
    if (myRank === 1) rankEmoji = '🥇';
    else if (myRank === 2) rankEmoji = '🥈';
    else if (myRank === 3) rankEmoji = '🥉';

    return (
      <div className="player-final">
        <h1 className="final-title">Game Over!</h1>

        <div className="final-rank-card">
          <div className="rank-emoji">{rankEmoji}</div>
          <h2>You placed #{myRank}</h2>
          <p className="final-score">{myScore} points</p>
        </div>

        <div className="final-leaderboard">
          <h3>Final Standings</h3>
          {finalScores.map((player, index) => (
            <div
              key={player.id}
              className={`final-rank-item ${player.nickname === nickname ? 'me' : ''}`}
            >
              <span className="rank">#{index + 1}</span>
              <span className="name">{player.nickname}</span>
              <span className="score">{player.score}</span>
            </div>
          ))}
        </div>

        <div className="game-over-message">
          <h3>Thanks for playing!</h3>
          <p>💍 Congratulations Cami & Alex! 💍</p>
        </div>
      </div>
    );
  };

  return (
    <div className="player-container">
      {error && <div className="error-banner">{error}</div>}

      <div className="player-content">
        {phase === 'waiting' && renderWaiting()}
        {phase === 'submit_lies' && renderSubmitLies()}
        {phase === 'voting' && renderVoting()}
        {phase === 'results' && renderResults()}
        {phase === 'final_podium' && renderFinalPodium()}
      </div>
    </div>
  );
}

export default Player;
