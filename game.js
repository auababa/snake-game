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
let obstacles = [];
let particles = [];
let food = { x: 0, y: 0, type: 'red' }; // 'red' or 'yellow'
let powerApple = null;
let powerAppleTimer = 0;
let powerAppleActive = false;
let powerAppleSpawnTime = 0;
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
function shadeColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
    return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
}

function generatePosition(awayFrom = null, minDistance = 0) {
    let pos, attempts = 0;
    do {
        pos = {
            x: Math.floor(Math.random() * tileCountX),
            y: Math.floor(Math.random() * tileCountY)
        };
        
        if (awayFrom) {
            const dx = Math.abs(pos.x - awayFrom.x);
            const dy = Math.abs(pos.y - awayFrom.y);
            const distance = Math.sqrt(dx*dx + dy*dy);
            if (distance < minDistance) continue;
        }
        
        attempts++;
        if (attempts > 100) return null;
    } while (isPositionOccupied(pos));
    
    return pos;
}

function isPositionOccupied(pos) {
    return (
        snake1.body.some(s => s.x === pos.x && s.y === pos.y) ||
        snake2.body.some(s => s.x === pos.x && s.y === pos.y) ||
        obstacles.some(o => o.x === pos.x && o.y === pos.y) ||
        (food.x === pos.x && food.y === pos.y) ||
        (powerApple && powerApple.x === pos.x && powerApple.y === pos.y)
    );
}

function createObstacles() {
    obstacles = [];
    
    // Crea alberi come ostacoli
    for (let i = 0; i < 15; i++) {
        const pos = generatePosition();
        if (pos) {
            obstacles.push({
                x: pos.x,
                y: pos.y,
                color: "#2e8b57",
                trunkColor: "#8B4513"
            });
        }
    }
}

function drawTree(x, y) {
    const size = gridSize;
    const centerX = x * gridSize + gridSize/2;
    const centerY = y * gridSize + gridSize/2;
    
    // Tronco
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(centerX - size*0.1, centerY - size*0.2, size*0.2, size*0.5);
    
    // Chioma
    ctx.fillStyle = "#2e8b57";
    ctx.beginPath();
    ctx.arc(centerX, centerY - size*0.3, size*0.3, 0, Math.PI*2);
    ctx.fill();
}

function drawApple(x, y, color) {
    const size = gridSize * 0.7;
    const centerX = x * gridSize + gridSize/2;
    const centerY = y * gridSize + gridSize/2;
    
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    
    // Corpo mela
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(centerX, centerY, size/2, 0, Math.PI*2);
    ctx.fill();
    
    // Picciolo
    ctx.strokeStyle = "#8B4513";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX + size*0.3, centerY - size*0.3);
    ctx.lineTo(centerX + size*0.1, centerY - size*0.5);
    ctx.stroke();
    
    ctx.restore();
}

function drawSnakeSegment(x, y, color, isHead = false) {
    const size = gridSize;
    const padding = 2;
    const innerSize = size - padding * 2;
    
    ctx.shadowColor = color;
    ctx.shadowBlur = isHead ? 15 : 8;
    
    // Se il serpente è in modalità arcobaleno
    if (isHead && (snake1.body[0].x === x && snake1.body[0].y === y && snake1 === rainbowSnake) ||
        (snake2.body[0].x === x && snake2.body[0].y === y && snake2 === rainbowSnake)) {
        const hue = (Date.now() / 50) % 360;
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
    } else {
        ctx.fillStyle = color;
    }
    
    ctx.beginPath();
    ctx.roundRect(
        x * size + padding, 
        y * size + padding, 
        innerSize, 
        innerSize, 
        [4, 4, 4, 4]
    );
    ctx.fill();
    
    if (isHead) {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(
            x * size + size * 0.7, 
            y * size + size * 0.3, 
            size * 0.1, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
    }
    
    ctx.shadowBlur = 0;
}

// Logica del gioco
function moveSnake(snake) {
    const head = {
        x: (snake.body[0].x + snake.direction.x + tileCountX) % tileCountX,
        y: (snake.body[0].y + snake.direction.y + tileCountY) % tileCountY
    };
    
    snake.body.unshift(head);
    snake.direction = {...snake.nextDirection};
    
    // Controlla se mangia una mela rossa o gialla
    if (head.x === food.x && head.y === food.y) {
        if (food.type === 'red') {
            snake.score += 10;
        } else if (food.type === 'yellow') {
            snake.score += 25;
        }
        
        // Genera una nuova mela (alterna tra rossa e gialla)
        food = {
            ...generatePosition(),
            type: Math.random() > 0.7 ? 'yellow' : 'red'
        };
    } 
    // Controlla se mangia la mela viola
    else if (powerApple && head.x === powerApple.x && head.y === powerApple.y) {
        rainbowSnake = snake;
        rainbowEndTime = Date.now() + 15000; // 15 secondi di potere
        powerApple = null;
        powerAppleActive = false;
        snake.score += 50;
    }
    else {
        snake.body.pop();
    }
    
    // Controlla se un giocatore ha vinto
    if (snake.score >= 300) {
        gameOver(snake);
    }
}

function killSnake(snake) {
    snake.alive = false;
    
    // Se il serpente è stato ucciso da un serpente arcobaleno, aggiungi punti
    if (rainbowSnake && rainbowSnake !== snake) {
        rainbowSnake.score += 100;
    }
}

function spawnPowerApple() {
    if (!powerAppleActive && Date.now() - powerAppleSpawnTime > 120000) { // 2 minuti
        powerApple = generatePosition();
        powerAppleActive = true;
        powerAppleTimer = Date.now() + 30000; // 30 secondi di disponibilità
    }
}

function checkPowerAppleExpiry() {
    if (powerAppleActive && Date.now() > powerAppleTimer) {
        powerApple = null;
        powerAppleActive = false;
        powerAppleSpawnTime = Date.now();
    }
}

function checkRainbowPower() {
    if (rainbowSnake && Date.now() > rainbowEndTime) {
        rainbowSnake = null;
    }
}

// Render
function render() {
    // Sfondo
    ctx.fillStyle = "#0f3460";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Griglia
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
    
    // Ostacoli (alberi)
    obstacles.forEach(obs => {
        drawTree(obs.x, obs.y);
    });
    
    // Cibo
    drawApple(food.x, food.y, food.type === 'yellow' ? "#ffff00" : "#ff0000");
    
    // Mela viola
    if (powerApple) {
        drawApple(powerApple.x, powerApple.y, "#aa00ff");
    }
    
    // Serpenti
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
    
    // Aggiorna punteggi e nomi
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
    spawnPowerApple();
    checkPowerAppleExpiry();
    checkRainbowPower();
    render();
    
    if (!snake1.alive && !snake2.alive) {
        gameOver();
    }
}

function checkCollisions() {
    // Controlla collisioni per snake1
    if (snake1.alive) {
        const head = snake1.body[0];
        if (
            obstacles.some(o => o.x === head.x && o.y === head.y) ||
            (snake2.alive && snake2.body.some(s => s.x === head.x && s.y === head.y && 
                (rainbowSnake !== snake2 || snake2.body[0].x === head.x && snake2.body[0].y === head.y))) ||
            snake1.body.slice(1).some(s => s.x === head.x && s.y === head.y)
        ) {
            killSnake(snake1);
        }
    }
    
    // Controlla collisioni per snake2
    if (snake2.alive) {
        const head = snake2.body[0];
        if (
            obstacles.some(o => o.x === head.x && o.y === head.y) ||
            (snake1.alive && snake1.body.some(s => s.x === head.x && s.y === head.y && 
                (rainbowSnake !== snake1 || snake1.body[0].x === head.x && snake1.body[0].y === head.y))) ||
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
            message = `${winner.name} Wins with ${winner.score} points!`;
        } else if (snake1.score > snake2.score) {
            message = `${snake1.name} Wins with ${snake1.score} points!`;
        } else if (snake2.score > snake1.score) {
            message = `${snake2.name} Wins with ${snake2.score} points!`;
        } else {
            message = "It's a Draw!";
        }
        
        ctx.fillText("Game Over", canvas.width/2, canvas.height/2 - 40);
        ctx.fillText(message, canvas.width/2, canvas.height/2);
        ctx.font = "20px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        ctx.fillText("Press Start to play again", canvas.width/2, canvas.height/2 + 40);
    }
}

// Controlli
document.addEventListener("keydown", e => {
    if (!gameActive && e.key === " ") {
        startGame();
        return;
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
    
    // Genera cibo
    food = {
        ...generatePosition(),
        type: Math.random() > 0.7 ? 'yellow' : 'red'
    };
    
    // Reset mele speciali
    powerApple = null;
    powerAppleActive = false;
    powerAppleSpawnTime = Date.now();
    rainbowSnake = null;
    
    // Avvia gioco
    gameActive = true;
    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, 150);
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
