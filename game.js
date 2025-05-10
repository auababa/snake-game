// Inizializzazione variabili
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const p1Score = document.getElementById("p1Score");
const p2Score = document.getElementById("p2Score");
const p1NameInput = document.getElementById("p1NameInput");
const p2NameInput = document.getElementById("p2NameInput");
const p1NameDisplay = document.getElementById("p1NameDisplay");
const p2NameDisplay = document.getElementById("p2NameDisplay");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");

// Configurazione
const gridSize = 20;
const tileCountX = Math.floor(canvas.width / gridSize);
const tileCountY = Math.floor(canvas.height / gridSize);
let gameInterval;
let gameActive = false;
let gameSpeed = 150; // Velocità iniziale (più alto = più lento)
let minSpeed = 50;   // Velocità minima (massima velocità)
let speedIncreaseInterval = 5000; // Aumenta la velocità ogni 5 secondi
let lastSpeedIncrease = 0;
let obstacles = [];
let food = { x: 0, y: 0, type: 'red' };
let powerAppleActive = false;
let powerAppleTimer = 0;
let rainbowSnake = null;
let rainbowEndTime = 0;

// Serpenti
const snake1 = {
    body: [{x: 5, y: 5}, {x: 5, y: 6}, {x: 5, y: 7}],
    color: "#00ffaa",
    originalColor: "#00ffaa",
    direction: {x: 0, y: -1},
    nextDirection: {x: 0, y: -1},
    score: 0,
    alive: true,
    name: "Player 1"
};

const snake2 = {
    body: [{x: 15, y: 15}, {x: 15, y: 14}, {x: 15, y: 13}],
    color: "#ff3366",
    originalColor: "#ff3366",
    direction: {x: 0, y: 1},
    nextDirection: {x: 0, y: 1},
    score: 0,
    alive: true,
    name: "Player 2"
};

// Funzioni di supporto
function generatePosition() {
    let pos;
    let attempts = 0;
    do {
        pos = {
            x: Math.floor(Math.random() * tileCountX),
            y: Math.floor(Math.random() * tileCountY)
        };
        attempts++;
        if (attempts > 100) {
            // Se non trova una posizione libera dopo 100 tentativi, forza una posizione
            for (let y = 0; y < tileCountY; y++) {
                for (let x = 0; x < tileCountX; x++) {
                    if (!isPositionOccupied({x, y})) {
                        return {x, y};
                    }
                }
            }
            return {x: 1, y: 1}; // Ultima risorsa
        }
    } while (isPositionOccupied(pos));
    return pos;
}

function isPositionOccupied(pos) {
    return (
        snake1.body.some(s => s.x === pos.x && s.y === pos.y) ||
        snake2.body.some(s => s.x === pos.x && s.y === pos.y) ||
        obstacles.some(o => o.x === pos.x && o.y === pos.y) ||
        (food.x === pos.x && food.y === pos.y)
    );
}

function createObstacles() {
    obstacles = [];
    for (let i = 0; i < 10; i++) {
        const pos = generatePosition();
        obstacles.push({
            x: pos.x,
            y: pos.y,
            color: "#555555"
        });
    }
}

function drawApple(x, y, color) {
    const size = gridSize * 0.7;
    const centerX = x * gridSize + gridSize/2;
    const centerY = y * gridSize + gridSize/2;
    
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(centerX, centerY, size/2, 0, Math.PI*2);
    ctx.fill();
    
    ctx.restore();
}

function drawSnakeSegment(x, y, color, isHead = false) {
    const size = gridSize;
    const padding = 2;
    const innerSize = size - padding * 2;
    
    ctx.shadowColor = color;
    ctx.shadowBlur = isHead ? 15 : 8;
    
    if (isHead && ((snake1.body[0].x === x && snake1.body[0].y === y && snake1 === rainbowSnake) ||
                   (snake2.body[0].x === x && snake2.body[0].y === y && snake2 === rainbowSnake))) {
        const hue = (Date.now() / 50) % 360;
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
    } else {
        ctx.fillStyle = color;
    }
    
    ctx.fillRect(x * size + padding, y * size + padding, innerSize, innerSize);
    
    if (isHead) {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(x * size + size * 0.7, y * size + size * 0.3, size * 0.1, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Logica del gioco
function moveSnake(snake) {
    const head = {
        x: (snake.body[0].x + snake.direction.x + tileCountX) % tileCountX,
        y: (snake.body[0].y + snake.direction.y + tileCountY) % tileCountY
    };
    
    snake.body.unshift(head);
    snake.direction = {...snake.nextDirection};
    
    if (head.x === food.x && head.y === food.y) {
        if (food.type === 'red') {
            snake.score += 10;
        } else if (food.type === 'yellow') {
            snake.score += 25;
            const opponent = snake === snake1 ? snake2 : snake1;
            opponent.score = Math.max(0, opponent.score - 15);
        } else if (food.type === 'purple') {
            rainbowSnake = snake;
            rainbowEndTime = Date.now() + 15000;
            snake.score += 30;
        }
        
        // Genera nuovo cibo PRIMA di rimuovere l'ultimo segmento
        const rand = Math.random();
        food = {
            ...generatePosition(),
            type: rand < 0.7 ? 'red' : (rand < 0.9 ? 'yellow' : 'purple')
        };
    } else {
        snake.body.pop();
    }
    
    if (snake.score >= 300) {
        gameOver(snake);
    }
}

function increaseGameSpeed() {
    const now = Date.now();
    if (now - lastSpeedIncrease > speedIncreaseInterval) {
        if (gameSpeed > minSpeed) {
            gameSpeed = Math.max(minSpeed, gameSpeed - 10); // Riduci l'intervallo (aumenta velocità)
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, gameSpeed);
        }
        lastSpeedIncrease = now;
    }
}

function killSnake(snake) {
    snake.alive = false;
    if (rainbowSnake && rainbowSnake !== snake) {
        rainbowSnake.score += 100;
    }
}

function checkRainbowPower() {
    if (rainbowSnake && Date.now() > rainbowEndTime) {
        rainbowSnake = null;
    }
}

function reviveSnake1() {
    if (!snake1.alive) {
        const newPos = generatePosition();
        if (newPos) {
            snake1.body = [
                {x: newPos.x, y: newPos.y},
                {x: newPos.x, y: newPos.y + 1},
                {x: newPos.x, y: newPos.y + 2}
            ];
            snake1.direction = {x: 0, y: -1};
            snake1.nextDirection = {x: 0, y: -1};
            snake1.alive = true;
        }
    }
}

function reviveSnake2() {
    if (!snake2.alive) {
        const newPos = generatePosition();
        if (newPos) {
            snake2.body = [
                {x: newPos.x, y: newPos.y},
                {x: newPos.x, y: newPos.y - 1},
                {x: newPos.x, y: newPos.y - 2}
            ];
            snake2.direction = {x: 0, y: 1};
            snake2.nextDirection = {x: 0, y: 1};
            snake2.alive = true;
        }
    }
}

// Render
function render() {
    ctx.fillStyle = "#0f3460";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    for (let i = 0; i < tileCountX; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i < tileCountY; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }
    
    obstacles.forEach(obs => {
        ctx.fillStyle = obs.color;
        ctx.fillRect(obs.x * gridSize, obs.y * gridSize, gridSize, gridSize);
    });
    
    const foodColor = food.type === 'red' ? '#ff0000' : 
                     food.type === 'yellow' ? '#ffff00' : '#aa00ff';
    drawApple(food.x, food.y, foodColor);
    
    if (snake1.alive) {
        snake1.body.forEach((seg, i) => {
            drawSnakeSegment(seg.x, seg.y, snake1.color, i === 0);
        });
    }
    
    if (snake2.alive) {
        snake2.body.forEach((seg, i) => {
            drawSnakeSegment(seg.x, seg.y, snake2.color, i === 0);
        });
    }
    
    p1Score.textContent = `${snake1.name}: ${snake1.score}`;
    p2Score.textContent = `${snake2.name}: ${snake2.score}`;
    p1NameDisplay.textContent = snake1.name;
    p2NameDisplay.textContent = snake2.name;
}

// Game loop
function gameLoop() {
    if (snake1.alive) moveSnake(snake1);
    if (snake2.alive) moveSnake(snake2);
    
    checkCollisions();
    checkRainbowPower();
    increaseGameSpeed();
    render();
    
    if (!snake1.alive && !snake2.alive) {
        gameOver();
    }
}

function checkCollisions() {
    if (snake1.alive) {
        const head = snake1.body[0];
        if (
            obstacles.some(o => o.x === head.x && o.y === head.y) ||
            (snake2.alive && snake2.body.some(s => s.x === head.x && s.y === head.y)) ||
            snake1.body.slice(1).some(s => s.x === head.x && s.y === head.y)
        ) {
            killSnake(snake1);
        }
    }
    
    if (snake2.alive) {
        const head = snake2.body[0];
        if (
            obstacles.some(o => o.x === head.x && o.y === head.y) ||
            (snake1.alive && snake1.body.some(s => s.x === head.x && s.y === head.y)) ||
            snake2.body.slice(1).some(s => s.x === head.x && s.y === head.y)
        ) {
            killSnake(snake2);
        }
    }
}

function gameOver(winner = null) {
    if (gameActive) {
        gameActive = false;
        clearInterval(gameInterval);
        
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "30px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        ctx.textAlign = "center";
        
        let message;
        if (winner) {
            message = `${winner.name} Wins! ${winner.score} points`;
        } else if (snake1.score > snake2.score) {
            message = `${snake1.name} Wins! ${snake1.score} points`;
        } else if (snake2.score > snake1.score) {
            message = `${snake2.name} Wins! ${snake2.score} points`;
        } else {
            message = "It's a Draw!";
        }
        
        ctx.fillText("Game Over", canvas.width/2, canvas.height/2 - 40);
        ctx.fillText(message, canvas.width/2, canvas.height/2);
    }
}

// Controlli
document.addEventListener("keydown", e => {
    if (!gameActive && e.key === " ") {
        startGame();
        return;
    }
    
    // Tasti per rigenerazione
    if (e.key === "1") {
        reviveSnake1();
    }
    if (e.key === "2") {
        reviveSnake2();
    }
    
    // Player 1 (Freccie)
    if (snake1.alive) {
        switch(e.key) {
            case "ArrowUp": if (snake1.direction.y === 0) snake1.nextDirection = {x: 0, y: -1}; break;
            case "ArrowDown": if (snake1.direction.y === 0) snake1.nextDirection = {x: 0, y: 1}; break;
            case "ArrowLeft": if (snake1.direction.x === 0) snake1.nextDirection = {x: -1, y: 0}; break;
            case "ArrowRight": if (snake1.direction.x === 0) snake1.nextDirection = {x: 1, y: 0}; break;
        }
    }
    
    // Player 2 (AWSD)
    if (snake2.alive) {
        switch(e.key.toLowerCase()) {
            case "w": if (snake2.direction.y === 0) snake2.nextDirection = {x: 0, y: -1}; break;
            case "s": if (snake2.direction.y === 0) snake2.nextDirection = {x: 0, y: 1}; break;
            case "a": if (snake2.direction.x === 0) snake2.nextDirection = {x: -1, y: 0}; break;
            case "d": if (snake2.direction.x === 0) snake2.nextDirection = {x: 1, y: 0}; break;
        }
    }
});

// Gestione nomi giocatori
p1NameInput.addEventListener("change", function() {
    snake1.name = this.value || "Player 1";
});

p2NameInput.addEventListener("change", function() {
    snake2.name = this.value || "Player 2";
});

function startGame() {
    // Reset serpenti
    snake1.body = [{x: 5, y: 5}, {x: 5, y: 6}, {x: 5, y: 7}];
    snake1.direction = {x: 0, y: -1};
    snake1.nextDirection = {x: 0, y: -1};
    snake1.alive = true;
    snake1.score = 0;
    snake1.color = snake1.originalColor;
    snake1.name = p1NameInput.value || "Player 1";
    
    snake2.body = [{x: 15, y: 15}, {x: 15, y: 14}, {x: 15, y: 13}];
    snake2.direction = {x: 0, y: 1};
    snake2.nextDirection = {x: 0, y: 1};
    snake2.alive = true;
    snake2.score = 0;
    snake2.color = snake2.originalColor;
    snake2.name = p2NameInput.value || "Player 2";
    
    // Crea ostacoli
    createObstacles();
    
    // Genera cibo iniziale
    food = {
        ...generatePosition(),
        type: 'red'
    };
    
    // Reset potere arcobaleno
    rainbowSnake = null;
    
    // Reset velocità
    gameSpeed = 150;
    lastSpeedIncrease = Date.now();
    
    // Avvia gioco
    gameActive = true;
    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, gameSpeed);
}

function resetGame() {
    startGame();
}

// Inizializzazione
document.addEventListener("DOMContentLoaded", function() {
    startBtn.addEventListener("click", startGame);
    resetBtn.addEventListener("click", resetGame);
    
    startGame();
});
