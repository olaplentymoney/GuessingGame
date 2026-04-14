const {
  createSession,
  joinSession,
  startGame,
  submitAnswer,
  sessions,
} = require("./gameManager");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected");

    socket.on("createSession", ({ name }, callback) => {
      try {
        socket.playerName = name;
        const session = createSession(name);
        socket.join(session.id);

        io.to(session.id).emit("playersUpdate", session.players);

        callback({ sessionId: session.id });
      } catch (err) {
        callback({ error: err.message });
      }
    });

    socket.on("joinSession", ({ sessionId, name }, callback) => {
      try {
        socket.playerName = name;
        const session = joinSession(sessionId, name);
        socket.join(sessionId);

        io.to(sessionId).emit("playersUpdate", session.players);

        callback({ success: true });
      } catch (err) {
        callback({ error: err.message });
      }
    });

    socket.on("startGame", ({ sessionId, question, answer }, callback) => {
      try {
        startGame(sessionId, question, answer, io);

        io.to(sessionId).emit("gameStarted", {
          question,
        });

        callback({ success: true });
      } catch (err) {
        callback({ error: err.message });
      }
    });

    socket.on("submitAnswer", ({ sessionId, name, guess }, callback) => {
      try {
        const result = submitAnswer(sessionId, name, guess, io);
        callback(result || { success: true });
      } catch (err) {
        callback({ error: err.message });
      }
    });

    socket.on("disconnecting", () => {
      const rooms = [...socket.rooms];

      rooms.forEach((room) => {
        if (sessions[room]) {
          const session = sessions[room];

          session.players = session.players.filter(
            (p) => p.name !== socket.playerName,
          );

          if (session.players.length === 0) {
            delete sessions[room];
          }
        }
      });
    });
  });
};
