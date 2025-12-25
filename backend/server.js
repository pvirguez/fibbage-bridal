require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const io = socketIo(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"]
  }
});

app.use(cors({
  origin: FRONTEND_URL,
  methods: ["GET", "POST"]
}));
app.use(express.json());

// Game state
const rooms = new Map();

// Pre-loaded questions (15 questions about the couple)
const QUESTIONS = [
  { id: 1, text: "¿Donde fue el primer date de Cristi y Juanqui?", truth: "Salon tropical" },
  { id: 2, text: "¿Cual es el plan favorito de los novios", truth: "Mar y paseo en lancha" },
  { id: 3, text: "¿Que aprendio Juanqui de Cristy?", truth: "A amar el carnaval" },
  { id: 4, text: "¿Que premio se gano Cristi en el 2006?", truth: "Premio de los bomberos" },
  { id: 5, text: "¿Que es lo que más le da miedo a Juanqui?", truth: "Insectos" },
  { id: 6, text: "¿Que es lo que más le da miedo a Cristy?", truth: "Avisapas" },
  { id: 7, text: "¿Cual es el hobby favorito de chiquita de Cristi?", truth: "Hacer shows de baile" },
  { id: 8, text: "¿Que es lo que mas escuchan los novios en carretera?", truth: "Fonseca y canciones viejas" },
  { id: 9, text: "¿En que es lo que mas difieren los novios?", truth: "La temperatura del aire acondicionado" },
  { id: 10, text: "¿Cual es el superhero favorito de Juanqui?", truth: "Spiderman" },
  { id: 11, text: "¿Cuantas veces le han congido puntos a Juanqui", truth: "3"},
  { id: 12, text: "¿Porque Juli y Alex le hiceron una cancion a cristi cuando pequena?", truth: "Por llorona" },
  { id: 13, text: "¿Cual era la clase fav de Juanqui en el colegio?", truth: "Matematicas" },
  { id: 14, text: "¿A que edad empezo a usar lentes?", truth: "10" },
  { id: 15, text: "¿Como se llamo la comparsa de Cristi?", truth: "Cristi en el festival del reino animal" }
];

// Game phases
const PHASES = {
  LOBBY: 'lobby',
  SUBMIT_LIES: 'submit_lies',
  VOTING: 'voting',
  RESULTS: 'results',
  FINAL_PODIUM: 'final_podium'
};

// Create a new room
function createRoom(roomCode) {
  const room = {
    code: roomCode,
    host: null,
    players: new Map(),
    currentQuestionIndex: 0,
    phase: PHASES.LOBBY,
    currentLies: new Map(),
    currentVotes: new Map(),
    scores: new Map(),
    timer: null,
    hostDisconnectTimer: null
  };
  rooms.set(roomCode, room);
  return room;
}

// Generate random 4-digit room code
function generateRoomCode() {
  let code;
  do {
    code = Math.floor(1000 + Math.random() * 9000).toString();
  } while (rooms.has(code));
  return code;
}

// Shuffle array
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Host creates a room
  socket.on('create_room', (callback) => {
    const roomCode = generateRoomCode();
    const room = createRoom(roomCode);
    room.host = socket.id;

    socket.join(roomCode);
    console.log(`Room ${roomCode} created by host ${socket.id}`);

    callback({ success: true, roomCode });
  });

  // Host reconnects to claim their room
  socket.on('reconnect_host', ({ roomCode }, callback) => {
    const room = rooms.get(roomCode);

    if (!room) {
      callback({ success: false, error: 'Room not found' });
      return;
    }

    // Cancel any pending disconnect timer
    if (room.hostDisconnectTimer) {
      clearTimeout(room.hostDisconnectTimer);
      room.hostDisconnectTimer = null;
    }

    // Update host socket ID and rejoin room
    room.host = socket.id;
    socket.join(roomCode);
    console.log(`Host reconnected to room ${roomCode} with new socket ${socket.id}`);

    callback({ success: true, players: Array.from(room.players.values()) });
  });

  // Player joins a room
  socket.on('join_room', ({ roomCode, nickname }, callback) => {
    const room = rooms.get(roomCode);

    if (!room) {
      callback({ success: false, error: 'Room not found' });
      return;
    }

    if (room.phase !== PHASES.LOBBY) {
      callback({ success: false, error: 'Game already started' });
      return;
    }

    // Check if nickname is already taken
    for (let [, player] of room.players) {
      if (player.nickname === nickname) {
        callback({ success: false, error: 'Nickname already taken' });
        return;
      }
    }

    socket.join(roomCode);
    room.players.set(socket.id, { id: socket.id, nickname, score: 0 });
    room.scores.set(socket.id, 0);

    console.log(`Player ${nickname} joined room ${roomCode}`);

    // Notify all clients in the room
    io.to(roomCode).emit('player_joined', {
      players: Array.from(room.players.values())
    });

    callback({ success: true });
  });

  // Host starts the game
  socket.on('start_game', ({ roomCode }, callback) => {
    const room = rooms.get(roomCode);

    if (!room || room.host !== socket.id) {
      callback({ success: false, error: 'Unauthorized' });
      return;
    }

    if (room.players.size === 0) {
      callback({ success: false, error: 'No players in room' });
      return;
    }

    room.phase = PHASES.SUBMIT_LIES;
    room.currentQuestionIndex = 0;

    const question = QUESTIONS[room.currentQuestionIndex];

    console.log(`Game started in room ${roomCode}`);

    // Notify all clients
    io.to(roomCode).emit('game_started', {
      question: { id: question.id, text: question.text },
      phase: PHASES.SUBMIT_LIES,
      questionNumber: room.currentQuestionIndex + 1,
      totalQuestions: QUESTIONS.length
    });

    // Start 30-second timer for lies
    startTimer(roomCode, 30, () => {
      moveToVoting(roomCode);
    });

    callback({ success: true });
  });

  // Player submits a lie
  socket.on('submit_lie', ({ roomCode, lie }, callback) => {
    const room = rooms.get(roomCode);

    if (!room || room.phase !== PHASES.SUBMIT_LIES) {
      callback({ success: false, error: 'Cannot submit lie now' });
      return;
    }

    if (!room.players.has(socket.id)) {
      callback({ success: false, error: 'Not a player in this room' });
      return;
    }

    room.currentLies.set(socket.id, lie.trim());

    console.log(`Player ${socket.id} submitted lie in room ${roomCode}`);

    // Notify host of submission count
    const submittedCount = room.currentLies.size;
    const totalPlayers = room.players.size;

    io.to(room.host).emit('lies_progress', {
      submitted: submittedCount,
      total: totalPlayers
    });

    callback({ success: true });

    // If all players submitted, move to voting
    if (submittedCount === totalPlayers) {
      clearTimeout(room.timer);
      moveToVoting(roomCode);
    }
  });

  // Player votes
  socket.on('submit_vote', ({ roomCode, answer }, callback) => {
    const room = rooms.get(roomCode);

    if (!room || room.phase !== PHASES.VOTING) {
      callback({ success: false, error: 'Cannot vote now' });
      return;
    }

    if (!room.players.has(socket.id)) {
      callback({ success: false, error: 'Not a player in this room' });
      return;
    }

    room.currentVotes.set(socket.id, answer);

    console.log(`Player ${socket.id} voted in room ${roomCode}`);

    // Notify host of vote count
    const votedCount = room.currentVotes.size;
    const totalPlayers = room.players.size;

    io.to(room.host).emit('votes_progress', {
      voted: votedCount,
      total: totalPlayers
    });

    callback({ success: true });

    // If all players voted, show results
    if (votedCount === totalPlayers) {
      clearTimeout(room.timer);
      showResults(roomCode);
    }
  });

  // Host advances to next question
  socket.on('next_question', ({ roomCode }, callback) => {
    const room = rooms.get(roomCode);

    if (!room || room.host !== socket.id) {
      callback({ success: false, error: 'Unauthorized' });
      return;
    }

    room.currentQuestionIndex++;

    if (room.currentQuestionIndex >= QUESTIONS.length) {
      // Game over, show podium
      showFinalPodium(roomCode);
      callback({ success: true, gameOver: true });
      return;
    }

    // Reset for next question
    room.currentLies.clear();
    room.currentVotes.clear();
    room.phase = PHASES.SUBMIT_LIES;

    const question = QUESTIONS[room.currentQuestionIndex];

    io.to(roomCode).emit('next_question_started', {
      question: { id: question.id, text: question.text },
      phase: PHASES.SUBMIT_LIES,
      questionNumber: room.currentQuestionIndex + 1,
      totalQuestions: QUESTIONS.length
    });

    // Start 30-second timer
    startTimer(roomCode, 30, () => {
      moveToVoting(roomCode);
    });

    callback({ success: true, gameOver: false });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);

    // Remove player from all rooms
    for (let [roomCode, room] of rooms) {
      if (room.host === socket.id) {
        // Host disconnected, give them 5 seconds to reconnect before closing room
        console.log(`Host disconnected from room ${roomCode}, starting grace period...`);
        room.hostDisconnectTimer = setTimeout(() => {
          if (rooms.has(roomCode)) {
            io.to(roomCode).emit('host_disconnected');
            rooms.delete(roomCode);
            console.log(`Room ${roomCode} closed (host did not reconnect)`);
          }
        }, 5000);
      } else if (room.players.has(socket.id)) {
        const player = room.players.get(socket.id);
        room.players.delete(socket.id);
        room.scores.delete(socket.id);
        room.currentLies.delete(socket.id);
        room.currentVotes.delete(socket.id);

        io.to(roomCode).emit('player_left', {
          players: Array.from(room.players.values()),
          nickname: player.nickname
        });

        console.log(`Player ${player.nickname} left room ${roomCode}`);
      }
    }
  });
});

// Timer function
function startTimer(roomCode, seconds, onComplete) {
  const room = rooms.get(roomCode);
  if (!room) return;

  clearTimeout(room.timer);

  let remaining = seconds;

  const countdown = () => {
    io.to(roomCode).emit('timer_update', { remaining });

    if (remaining <= 0) {
      onComplete();
    } else {
      remaining--;
      room.timer = setTimeout(countdown, 1000);
    }
  };

  countdown();
}

// Move to voting phase
function moveToVoting(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;

  room.phase = PHASES.VOTING;

  const question = QUESTIONS[room.currentQuestionIndex];
  const lies = Array.from(room.currentLies.values());
  const allAnswers = [...lies, question.truth];
  const shuffledAnswers = shuffleArray(allAnswers);

  console.log(`Room ${roomCode} moving to voting phase`);

  io.to(roomCode).emit('voting_started', {
    phase: PHASES.VOTING,
    answers: shuffledAnswers
  });

  // Start 20-second timer for voting
  startTimer(roomCode, 20, () => {
    showResults(roomCode);
  });
}

// Show results
function showResults(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;

  room.phase = PHASES.RESULTS;

  const question = QUESTIONS[room.currentQuestionIndex];

  // Calculate scores
  const lieAuthors = new Map();
  for (let [playerId, lie] of room.currentLies) {
    lieAuthors.set(lie, playerId);
  }

  const results = [];
  const votesByAnswer = new Map();

  // Count votes for each answer
  for (let [voterId, answer] of room.currentVotes) {
    if (!votesByAnswer.has(answer)) {
      votesByAnswer.set(answer, []);
    }
    votesByAnswer.get(answer).push(voterId);
  }

  // Process each player's vote and update scores
  for (let [voterId, answer] of room.currentVotes) {
    const voter = room.players.get(voterId);

    // +1000 if voted for truth
    if (answer === question.truth) {
      const currentScore = room.scores.get(voterId) || 0;
      room.scores.set(voterId, currentScore + 1000);

      const player = room.players.get(voterId);
      if (player) {
        player.score = currentScore + 1000;
      }
    }
  }

  // +500 for each vote received on your lie
  for (let [lie, votes] of votesByAnswer) {
    if (lie !== question.truth) {
      const authorId = lieAuthors.get(lie);
      if (authorId) {
        const currentScore = room.scores.get(authorId) || 0;
        const points = votes.length * 500;
        room.scores.set(authorId, currentScore + points);

        const player = room.players.get(authorId);
        if (player) {
          player.score = currentScore + points;
        }
      }
    }
  }

  // Prepare results with vote counts
  const answerResults = [];
  const lies = Array.from(room.currentLies.values());
  const allAnswers = [...lies, question.truth];

  for (let answer of allAnswers) {
    const votes = votesByAnswer.get(answer) || [];
    const isCorrect = answer === question.truth;
    const author = lieAuthors.get(answer);
    const authorName = author ? room.players.get(author)?.nickname : null;

    answerResults.push({
      answer,
      votes: votes.length,
      isCorrect,
      author: authorName
    });
  }

  console.log(`Showing results for room ${roomCode}`);

  io.to(roomCode).emit('results_ready', {
    phase: PHASES.RESULTS,
    correctAnswer: question.truth,
    answerResults,
    currentScores: Array.from(room.players.values()).sort((a, b) => b.score - a.score)
  });
}

// Show final podium
function showFinalPodium(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;

  room.phase = PHASES.FINAL_PODIUM;

  const finalScores = Array.from(room.players.values())
    .sort((a, b) => b.score - a.score);

  console.log(`Showing final podium for room ${roomCode}`);

  io.to(roomCode).emit('final_podium', {
    phase: PHASES.FINAL_PODIUM,
    finalScores
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS enabled for: ${FRONTEND_URL}`);
});
