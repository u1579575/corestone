const GAME_SECONDS = 30;
const WIN_SCORE = 20;

const OBSTACLE_CHANCE = 0.25; // 25% of spawns are obstacles
const OBSTACLE_PENALTY = 2;   // subtract 2 points

const WIN_MESSAGES = [
  "You did it! Clean water delivered. 🎉",
  "Nice work — you hit the goal! 💧",
  "Big win. You’re on a roll! 🚰",
  "20+ cans collected — mission complete! ✅"
];

const LOSE_MESSAGES = [
  "So close — run it back and try again!",
  "Almost there. You’ve got this.",
  "Good start. Try again and aim for 20!",
  "Not quite — retry and beat your score!"
];

let score = 0;
let timeLeft = GAME_SECONDS;
let gameActive = false;

let spawnIntervalId = null;
let timerIntervalId = null;

// DOM elements
const scoreEl = document.getElementById("current-cans");
const timerEl = document.getElementById("timer");
const messageEl = document.getElementById("achievements");
const startBtn = document.getElementById("start-game");

// Creates the 3x3 game grid where items will appear
function createGrid() {
  const grid = document.querySelector(".game-grid");
  grid.innerHTML = "";
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.className = "grid-cell";
    grid.appendChild(cell);
  }
}

// Ensure the grid is created when the page loads
createGrid();
updateHud();
setMessage("Press Start to begin. Try to collect 20 cans in 30 seconds.");

function burstConfetti() {
  const layer = document.createElement("div");
  layer.className = "confetti-layer";

  const colors = ["#FFC907", "#2E9DF7", "#8BD1CB", "#FF902A"];
  const pieces = 45;

  for (let i = 0; i < pieces; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti";

    piece.style.left = Math.random() * 100 + "vw";
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = (Math.random() * 0.25) + "s";

    const w = 6 + Math.random() * 8;
    const h = 8 + Math.random() * 10;
    piece.style.width = w + "px";
    piece.style.height = h + "px";

    layer.appendChild(piece);
  }

  document.body.appendChild(layer);

  setTimeout(() => layer.remove(), 1600);
}

// Utility
function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function updateHud() {
  scoreEl.textContent = score;
  timerEl.textContent = timeLeft;
}

function setMessage(text, type = "") {
  messageEl.textContent = text;
  messageEl.className = "achievement" + (type ? ` ${type}` : "");
}

function clearBoard() {
  document.querySelectorAll(".grid-cell").forEach((cell) => {
    cell.innerHTML = "";
  });
}

// Spawns a new can in a random grid cell
function spawnWaterCan() {
  if (!gameActive) return;

  const cells = document.querySelectorAll(".grid-cell");
  // clear all cells before spawning a new one
  cells.forEach((cell) => (cell.innerHTML = ""));

  const randomCell = cells[Math.floor(Math.random() * cells.length)];

  const wrapper = document.createElement("div");
  wrapper.className = "water-can-wrapper";

  const can = document.createElement("div");
  can.className = "water-can";
  can.setAttribute("role", "button");
  can.setAttribute("aria-label", "Collect water can");

  can.addEventListener("click", () => {
    if (!gameActive) return;

    score += 1;
    updateHud();

    // Remove the can immediately so it can’t be clicked twice
    randomCell.innerHTML = "";

    // Optional tiny feedback (not required, but helps)
    if (score === 10) setMessage("Halfway there — keep going!");
    if (score === 15) setMessage("Almost at 20!");
  });

  wrapper.appendChild(can);
  randomCell.appendChild(wrapper);
}

function startTimer() {
  clearInterval(timerIntervalId);

  timerIntervalId = setInterval(() => {
    if (!gameActive) return;

    timeLeft -= 1;
    updateHud();

    if (timeLeft <= 0) {
      timeLeft = 0;
      updateHud();
      endGame();
    }
  }, 1000);
}

// Initializes and starts a new game
function startGame() {
  if (gameActive) return;

  // reset state
  score = 0;
  timeLeft = GAME_SECONDS;
  gameActive = true;

  // UI reset
  startBtn.disabled = true;
  startBtn.textContent = "Game Running...";
  setMessage("Go! Click the cans as fast as you can.");
  updateHud();

  // set up board + intervals
  createGrid();
  clearBoard();
  spawnWaterCan();

  clearInterval(spawnIntervalId);
  spawnIntervalId = setInterval(spawnWaterCan, 1000);

  startTimer();
}

function endGame() {
  gameActive = false;

  clearInterval(spawnIntervalId);
  clearInterval(timerIntervalId);
  clearBoard();

  const didWin = score >= WIN_SCORE;
  const endMsg = didWin ? randomFrom(WIN_MESSAGES) : randomFrom(LOSE_MESSAGES);

  setMessage(endMsg, didWin ? "win" : "lose");

  startBtn.disabled = false;
  startBtn.textContent = "Play Again";
}

// Start button handler
startBtn.addEventListener("click", startGame);
