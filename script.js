// Difficulty settings
const difficultySettings = {
  easy: {
    timeLimit: 45,
    pointGoal: 30,
    dropInterval: 1200,
    description: "Easy: 45 seconds, reach 30 points to win"
  },
  normal: {
    timeLimit: 30,
    pointGoal: 50,
    dropInterval: 800,
    description: "Normal: 30 seconds, reach 50 points to win"
  },
  hard: {
    timeLimit: 20,
    pointGoal: 80,
    dropInterval: 500,
    description: "Hard: 20 seconds, reach 80 points to win"
  }
};

let currentDifficulty = 'normal';

// Variables to control game state
let gameRunning = false;
let dropMaker;
let score = 0;
let timeLeft = 30;
let pointGoal = 50;
let timerInterval;

// Bucket drag variables
let isDragging = false;
let dragStartX = 0;
let bucket = document.getElementById("bucket");
let gameContainer = document.getElementById("game-container");

// Bucket position
let bucketX = gameContainer.offsetWidth / 2 - 60; // Center the bucket

// Setup difficulty buttons
document.querySelectorAll(".difficulty-btn").forEach(btn => {
  btn.addEventListener("click", changeDifficulty);
});

function changeDifficulty(e) {
  if (gameRunning) return;

  const difficulty = e.target.dataset.difficulty;
  currentDifficulty = difficulty;

  // Update button selection
  document.querySelectorAll(".difficulty-btn").forEach(btn => {
    btn.removeAttribute("data-selected");
  });
  e.target.setAttribute("data-selected", "true");

  // Update difficulty info
  const settings = difficultySettings[difficulty];
  document.getElementById("difficulty-info").textContent = settings.description;
}

// Wait for button click to start the game
document.getElementById("start-btn").addEventListener("click", startGame);

// Bucket drag listeners
bucket.addEventListener("mousedown", startDrag);
document.addEventListener("mousemove", moveBucket);
document.addEventListener("mouseup", stopDrag);

// Touch events for mobile
bucket.addEventListener("touchstart", startDrag);
document.addEventListener("touchmove", moveBucket);
document.addEventListener("touchend", stopDrag);

// Keyboard controls
document.addEventListener("keydown", handleKeyPress);

function startDrag(e) {
  if (!gameRunning) return;
  isDragging = true;
  dragStartX = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;
}

function moveBucket(e) {
  if (!isDragging || !gameRunning) return;

  const currentX = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;
  const gameRect = gameContainer.getBoundingClientRect();
  
  // Calculate bucket position relative to game container
  // Reduced sensitivity for smoother, slower movement
  let newX = bucketX + (currentX - dragStartX) * 0.3;
  
  // Keep bucket within bounds
  newX = Math.max(0, Math.min(newX, gameContainer.offsetWidth - bucket.offsetWidth));
  
  bucketX = newX;
  bucket.style.left = (bucketX + bucket.offsetWidth / 2) + "px";
}

function stopDrag() {
  isDragging = false;
}

function handleKeyPress(e) {
  if (!gameRunning) return;

  const keyStep = 30; // How many pixels to move per arrow key press

  if (e.key === "ArrowLeft") {
    e.preventDefault();
    bucketX = Math.max(0, bucketX - keyStep);
    bucket.style.left = (bucketX + bucket.offsetWidth / 2) + "px";
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    bucketX = Math.min(gameContainer.offsetWidth - bucket.offsetWidth, bucketX + keyStep);
    bucket.style.left = (bucketX + bucket.offsetWidth / 2) + "px";
  }
}

function startGame() {
  if (gameRunning) return;

  gameRunning = true;
  score = 0;
  
  // Apply difficulty settings
  const settings = difficultySettings[currentDifficulty];
  timeLeft = settings.timeLimit;
  pointGoal = settings.pointGoal;

  // Disable difficulty buttons during game
  document.querySelectorAll(".difficulty-btn").forEach(btn => {
    btn.disabled = true;
  });

  // Update UI
  document.getElementById("score").textContent = score;
  document.getElementById("goal").textContent = pointGoal;
  document.getElementById("time").textContent = timeLeft;
  document.getElementById("start-btn").disabled = true;

  // Create new drops at difficulty-specific interval
  dropMaker = setInterval(createDrop, settings.dropInterval);

  // Start countdown timer
  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById("time").textContent = timeLeft;

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function endGame() {
  clearInterval(dropMaker);
  clearInterval(timerInterval);
  gameRunning = false;
  isDragging = false;

  // Remove all remaining drops
  const drops = document.querySelectorAll(".water-drop, .bad-drop");
  drops.forEach(drop => drop.remove());

  // Re-enable difficulty buttons
  document.querySelectorAll(".difficulty-btn").forEach(btn => {
    btn.disabled = false;
  });

  // Create confetti effect
  createConfetti();

  // Check if player won
  const didWin = score >= pointGoal;
  const message = didWin 
    ? `🎉 You Won! Final Score: ${score}/${pointGoal}` 
    : `Game Over! Final Score: ${score}/${pointGoal}`;
  
  showFeedback(message, didWin ? "win" : "game-over");

  document.getElementById("start-btn").disabled = false;
  document.getElementById("time").textContent = difficultySettings[currentDifficulty].timeLimit;
}

function createDrop() {
  if (!gameRunning) return;

  const drop = document.createElement("div");
  
  // 20% chance of being a bad drop
  const isBadDrop = Math.random() < 0.2;
  drop.className = isBadDrop ? "bad-drop" : "water-drop";
  drop.dataset.isBad = isBadDrop;

  // Make drops different sizes
  const initialSize = 60;
  const sizeMultiplier = Math.random() * 0.8 + 0.5;
  const size = initialSize * sizeMultiplier;
  drop.style.width = drop.style.height = `${size}px`;

  // Position randomly across game width
  const gameWidth = gameContainer.offsetWidth;
  const xPosition = Math.random() * (gameWidth - size);
  drop.style.left = xPosition + "px";
  drop.dataset.dropX = xPosition;
  drop.dataset.dropSize = size;

  drop.style.animationDuration = "4s";

  // Add drop to game
  gameContainer.appendChild(drop);

  // Check for collision during fall
  let collisionChecked = false;
  const checkCollision = setInterval(() => {
    if (!gameRunning || collisionChecked || !drop.parentElement) {
      clearInterval(checkCollision);
      return;
    }

    const dropRect = drop.getBoundingClientRect();
    const bucketRect = bucket.getBoundingClientRect();
    const containerRect = gameContainer.getBoundingClientRect();

    // Adjust coordinates relative to container
    const dropLeft = dropRect.left - containerRect.left;
    const dropTop = dropRect.top - containerRect.top;
    const bucketLeft = bucketRect.left - containerRect.left;
    const bucketTop = bucketRect.top - containerRect.top;
    const bucketRight = bucketRect.right - containerRect.left;

    // Only catch drops if they fall from above and land in the bucket opening
    // Check horizontal overlap with bucket
    const horizontalOverlap = 
      dropLeft + size > bucketLeft &&
      dropLeft < bucketRight;

    // Check if drop is falling into the bucket from above (top of bucket)
    const fallingIntoTop = 
      dropTop + size > bucketTop &&
      dropTop < bucketTop + 20; // Small range for the top opening

    if (horizontalOverlap && fallingIntoTop) {
      collisionChecked = true;
      clearInterval(checkCollision);
      catchDrop(drop, isBadDrop);
    }
  }, 50);

  // Remove if reaches bottom without collision
  drop.addEventListener("animationend", () => {
    clearInterval(checkCollision);
    if (drop.parentElement) {
      drop.remove();
    }
  });
}

function catchDrop(drop, isBadDrop) {
  if (isBadDrop) {
    score = Math.max(0, score - 5);
    showFeedback("Bad Drop! -5 Points", "penalty");
  } else {
    score += 10;
    showFeedback("+10 Points!", "success");
  }

  document.getElementById("score").textContent = score;
  drop.remove();
}

function showFeedback(message, type) {
  const feedback = document.createElement("div");
  feedback.className = `feedback ${type}`;
  feedback.textContent = message;

  gameContainer.appendChild(feedback);

  setTimeout(() => {
    feedback.remove();
  }, 2000);
}

function createConfetti() {
  const confettiContainer = document.getElementById("confetti-container");
  const colors = ["#FFC907", "#2E9DF7", "#4FCB53", "#FF902A", "#F5402C", "#F16061", "#8BD1CB", "#159A48"];
  const confettiCount = 50;

  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement("div");
    confetti.className = "confetti";
    
    // Random position across the width
    const left = Math.random() * gameContainer.offsetWidth;
    confetti.style.left = left + "px";
    confetti.style.top = "-10px";
    
    // Random color
    const color = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.backgroundColor = color;
    
    // Random size
    const size = Math.random() * 8 + 6;
    confetti.style.width = size + "px";
    confetti.style.height = size + "px";
    
    // Random animation delay
    confetti.style.animationDelay = Math.random() * 0.5 + "s";
    
    confettiContainer.appendChild(confetti);
  }

  // Clean up confetti after animation
  setTimeout(() => {
    const confettis = confettiContainer.querySelectorAll(".confetti");
    confettis.forEach(c => c.remove());
  }, 3500);
}
