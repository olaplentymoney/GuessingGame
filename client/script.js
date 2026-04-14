const socket = io("http://localhost:3000");

let sessionId;
let playerName;
let isMaster = false;

function createSession() {
  playerName = document.getElementById("name").value;

  if (!playerName) {
    return alert("Enter your name");
  }

  socket.emit("createSession", { name: playerName }, (res) => {
    if (res.error) return alert(res.error);

    sessionId = res.sessionId;

    alert("Session ID: " + sessionId);
  });
}

function joinSession() {
  playerName = document.getElementById("name").value;
  sessionId = document.getElementById("sessionId").value;

  socket.emit("joinSession", { sessionId, name: playerName }, (res) => {
    if (res.error) return alert(res.error);
  });
}

function renderControls() {
  if (!isMaster) return;

  document.getElementById("controls").innerHTML = `
    <h4>You are the Game Master</h4>
    <input id="question" placeholder="Enter question" />
    <input id="answer" placeholder="Enter answer" />
    <button onclick="startGame()">Start Game</button>
  `;
}

function startGame() {
  const question = document.getElementById("question").value;
  const answer = document.getElementById("answer").value;

  if (!question || !answer) {
    return alert("Provide both question and answer");
  }

  socket.emit("startGame", { sessionId, question, answer }, (res) => {
    if (res.error) return alert(res.error);
  });
}

socket.on("playersUpdate", (players) => {
  const list = players.map((p) => `${p.name} (${p.score})`).join("<br>");

  document.getElementById("game").innerHTML = `
    <h4>Players:</h4>
    ${list}
  `;

  // first player is master
  isMaster = players[0].name === playerName;

  renderControls();
});

socket.on("gameStarted", ({ question }) => {
  document.getElementById("controls").innerHTML = "";

  document.getElementById("game").innerHTML = `
    <h3>${question}</h3>
    <input id="guess" placeholder="Your guess"/>
    <button onclick="submitGuess()">Submit</button>
  `;
});

socket.on("newMaster", ({ master }) => {
  alert(`New Game Master is ${master}`);
});

function submitGuess() {
  const guess = document.getElementById("guess").value;

  socket.emit("submitAnswer", { sessionId, name: playerName, guess }, (res) => {
    if (res.error) return alert(res.error);

    if (res.correct === false) {
      alert(`Wrong guess. Attempts left: ${res.attemptsLeft}`);
    }
  });
}

socket.on("gameEnded", ({ winner, answer }) => {
  const message = winner
    ? `<p class="winner">${winner} won! Answer: ${answer}</p>`
    : `<p class="system">No winner. Answer was: ${answer}</p>`;

  document.getElementById("game").innerHTML += message;
});
