const GAME_SECONDS = 30;
const WIN_SCORE = 20;

const OBSTACLE_CHANCE = 0.25; // 25% of spawns are obstacles
const OBSTACLE_PENALTY = 2;   // subtract 2 points

// Difficulty presets (affect time, pace, win score, obstacle chance)
const DIFFICULTY_CONFIGS = {
  easy:   { label: "Easy",   time: 35, winScore: 15, spawnMs: 1100, obstacleChance: 0.15 },
  normal: { label: "Normal", time: 30, winScore: 20, spawnMs: 1000, obstacleChance: 0.25 },
  hard:   { label: "Hard",   time: 25, winScore: 25, spawnMs: 850,  obstacleChance: 0.35 }
};

let activeDifficultyKey = "easy";

const WIN_MESSAGES = [
  "You did it! Clean water delivered.",
  "Nice work — you hit the goal!",
  "Big win. You’re on a roll!",
  "20+ cans collected — mission complete!"
];

const LOSE_MESSAGES = [
  "So close — run it back and try again!",
  "Almost there. You’ve got this.",
  "Good start. Try again and aim for 20!",
  "Not quite — retry and beat your score!"
];

// Milestones (arrays + conditionals)
const MILESTONES = [
  { score: 5,  messages: ["Nice start!", "5 collected — keep going!", "Good momentum!"] },
  { score: 10, messages: ["10! Halfway there.", "Halfway — don’t stop now!", "You’re cruising."] },
  { score: 15, messages: ["15! Almost there!", "So close — push for the goal!", "Final stretch!"] },
  { score: 20, messages: ["20! You hit the target score!", "Goal reached — finish strong!", "Great work!"] }
];

let shownMilestones = new Set();

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

document.querySelectorAll('input[name="difficulty"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    if (gameActive) return;
    applyDifficulty(getSelectedDifficultyKey());
  });
});

applyDifficulty(getSelectedDifficultyKey());

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

function getSelectedDifficultyKey() {
  const selected = document.querySelector('input[name="difficulty"]:checked');
  return selected ? selected.value : "easy";
}

function applyDifficulty(key) {
  activeDifficultyKey = key;
  const cfg = DIFFICULTY_CONFIGS[key];

  // Update time display before game starts
  timeLeft = cfg.time;
  updateHud();

  setMessage(`Selected: ${cfg.label}. Goal: ${cfg.winScore} cans in ${cfg.time}s.`, "");
}

function checkMilestones() {
  for (const m of MILESTONES) {
    if (score >= m.score && !shownMilestones.has(m.score)) {
      shownMilestones.add(m.score);
      setMessage(randomFrom(m.messages), "");
    }
  }
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
  cells.forEach(cell => (cell.innerHTML = ""));

  const randomCell = cells[Math.floor(Math.random() * cells.length)];

  const wrapper = document.createElement("div");
  wrapper.className = "water-can-wrapper";

  const spawnObstacle = Math.random() < DIFFICULTY_CONFIGS[activeDifficultyKey].obstacleChance;

  if (spawnObstacle) {
    const pollution = document.createElement("div");
    pollution.className = "pollution";
    pollution.textContent = "☣";

    pollution.addEventListener("click", () => {
      if (!gameActive) return;
      
      score = Math.max(0, score - OBSTACLE_PENALTY);
      updateHud();

      wrapper.classList.add("shake");
      setTimeout(() => wrapper.classList.remove("shake"), 250);

      setMessage(`Pollution! -${OBSTACLE_PENALTY} points.`, "lose");
      randomCell.innerHTML = "";
    });

    wrapper.appendChild(pollution);
  } else {
    const can = document.createElement("div");
    can.className = "water-can";

    can.addEventListener("click", () => {
      if (!gameActive) return;

      score += 1;
      updateHud();
      checkMilestones();
      randomCell.innerHTML = "";
    });

    wrapper.appendChild(can);
  }

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
  const cfg = DIFFICULTY_CONFIGS[getSelectedDifficultyKey()];
activeDifficultyKey = getSelectedDifficultyKey();
timeLeft = cfg.time;
shownMilestones = new Set();
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
  
//difficulty won't be changed
document.querySelectorAll('input[name="difficulty"]').forEach(r => r.disabled = true);
  
  clearInterval(spawnIntervalId);
  spawnIntervalId = setInterval(spawnWaterCan, cfg.spawnMs);

  startTimer();
}

function endGame() {
  gameActive = false;

  clearInterval(spawnIntervalId);
  clearInterval(timerIntervalId);
  clearBoard();

  const cfg = DIFFICULTY_CONFIGS[activeDifficultyKey];
const didWin = score >= cfg.winScore;
  if (didWin) burstConfetti();
  
  const endMsg = didWin ? randomFrom(WIN_MESSAGES) : randomFrom(LOSE_MESSAGES);

  setMessage(endMsg, didWin ? "win" : "lose");

  startBtn.disabled = false;
  startBtn.textContent = "Play Again";

  document.querySelectorAll('input[name="difficulty"]').forEach(r => r.disabled = false);
  
}

// Start button handler
startBtn.addEventListener("click", startGame);
