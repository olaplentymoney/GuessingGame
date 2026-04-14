const { v4: uuidv4 } = require("uuid");

const sessions = {};

function createSession(masterName) {
  const sessionId = uuidv4();

  sessions[sessionId] = {
    id: sessionId,
    master: masterName,
    players: [{ name: masterName, score: 0 }],
    gameStarted: false,
    question: null,
    answer: null,
    attempts: {},
    timer: null,
  };

  return sessions[sessionId];
}

function joinSession(sessionId, playerName) {
  const session = sessions[sessionId];

  if (!session) throw new Error("Session not found");
  if (session.gameStarted) throw new Error("Game already started");
  if (session.players.some((p) => p.name === playerName)) {
    throw new Error("Player already exists");
  }

  session.players.push({ name: playerName, score: 0 });
  return session;
}

function startGame(sessionId, question, answer, io) {
  const session = sessions[sessionId];

  if (session.players.length < 3) throw new Error("Minimum 3 players required");

  session.gameStarted = true;
  session.question = question;
  session.answer = answer.toLowerCase();

  session.players.forEach((p) => {
    session.attempts[p.name] = 3;
  });

  // Timer (60s)
  session.timer = setTimeout(() => {
    io.to(sessionId).emit("gameEnded", {
      winner: null,
      answer: session.answer,
    });

    io.to(sessionId).emit("playersUpdate", session.players);

    resetSession(sessionId);
  }, 60000);
}

function submitAnswer(sessionId, playerName, guess, io) {
  const session = sessions[sessionId];

  if (!session.gameStarted) throw new Error("Game not started");

  if (playerName === session.master) {
    throw new Error("Game master cannot guess");
  }

  if (!session.attempts[playerName]) {
    throw new Error("Player not part of active game");
  }

  if (session.attempts[playerName] <= 0) throw new Error("No attempts left");
  session.attempts[playerName]--;

  if (guess.toLowerCase() === session.answer) {
    clearTimeout(session.timer);

    const player = session.players.find((p) => p.name === playerName);
    player.score += 10;

    io.to(sessionId).emit("gameEnded", {
      winner: playerName,
      answer: session.answer,
    });

    io.to(sessionId).emit("playersUpdate", session.players);

    setTimeout(() => {
      resetSession(sessionId);
    }, 1000);
  } else {
    return {
      correct: false,
      attemptsLeft: session.attempts[playerName],
    };
  }
}

function resetSession(sessionId) {
  const session = sessions[sessionId];

  session.gameStarted = false;
  session.question = null;
  session.answer = null;
  session.attempts = {};

  // rotate master
  const first = session.players.shift();
  session.players.push(first);
  session.master = session.players[0].name;
}

module.exports = {
  createSession,
  joinSession,
  startGame,
  submitAnswer,
  sessions,
};
