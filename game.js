// game.js - Versione Aggiornata
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const p1ScoreDisplay = document.getElementById("p1Score");
const p2ScoreDisplay = document.getElementById("p2Score");
const startBtn = document.getElementById("startBtn");

// Configurazione
const gridSize = 20;
const tileCountX = canvas.width / gridSize;
const tileCountY = canvas.height / gridSize;
let gameInterval;
let gameActive = false;
let waitingForRestart = false;

// Serpenti
const snake1 = {
    body: [{x: 5, y: 10}, {x: 4, y: 10}, {x: 3, y: 10}],
    color: "#00FF00",
    direction: {x: 1, y: 0},
    nextDirection: {x: 1, y: 0},
    score: 0,
    alive: true
};

const snake2 = {
    body: [{x: 15, y: 10}, {x: 16, y: 10}, {x: 17, y: 10}],
    color: "#FF0000",
    direction: {x: -1, y: 0},
    nextDirection: {x: -1, y: 0},
    score: 0,
    alive: true
};

// Ostacoli e cibo
let obstacles = [];
let food = generatePosition();

// Genera posizione libera
function generatePosition() {
    let pos;
    do {
        pos = {
            x: Math.floor(Math.random() * tileCountX),
            y: Math.floor(Math.random() * tileCountY)
        };
    } while (isPositionOccupied(pos));
    return pos;
}

// Controlla posizione occupata
function isPositionOccupied(pos) {
    return (
        snake1.body.some(s => s.x === pos.x && s.y === pos.y) ||
        snake2.body.some(s => s.x === pos.x && s.y === pos.y) ||
        obstacles.some(o => o.x === pos.x && o.y === pos.y)
    );
}

// Disegna cubo 3D
function drawCube(x, y, color) {
    const size = gridSize - 2;
    ctx.fillStyle = color;
    ctx.fillRect(x * gridSize + 1, y * gridSize + 1, size, size);
    
    // Effetto 3D
    ctx.fillStyle = shadeColor(color, -20);
    ctx.beginPath();
    ctx.moveTo(x * gridSize + 1, y * gridSize + 1);
    ctx.lineTo(x * gridSize + 3, y * gridSize + 3);
    ctx.lineTo(x * gridSize + 3, y * gridSize + size - 3);
    ctx.lineTo(x * gridSize + 1, y * gridSize + size);
    ctx.fill();
}

// Modifica colore
function shadeColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return `#${(
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1)}`;
}

// Controlli
document.addEventListener("keydown", e => {
    if (waitingForRestart && e.key === " ") {
        startGame();
        return;
    }
    
    if (!gameActive) return;
    
    // Player 1 (Freccie)
    switch(e.key) {
        case "ArrowUp": if (snake1.alive && snake1.direction.y === 0) snake1.nextDirection = {x: 0, y: -1}; break;
        case "ArrowDown": if (snake1.alive && snake1.direction.y === 0) snake1.nextDirection = {x: 0, y: 1}; break;
        case "ArrowLeft": if (snake1.alive && snake1.direction.x === 0) snake1.nextDirection = {x: -1, y: 0}; break;
        case "ArrowRight": if (snake1.alive && snake1.direction.x === 0) snake1.nextDirection = {x: 1, y: 0}; break;
    }
    
    // Player 2 (AWSD)
    switch(e.key.toLowerCase()) {
        case "w": if (snake2.alive && snake2.direction.y === 0) snake2.nextDirection = {x: 0, y: -1}; break;
        case "s": if (snake2.alive && snake2.direction.y === 0) snake2.nextDirection = {x: 0, y: 1}; break;
        case "a": if (snake2.alive && snake2.direction.x === 0) snake2.nextDirection = {x: -1, y: 0}; break;
        case "d": if (snake2.alive && snake2.direction.x === 0) snake2.nextDirection = {x: 1, y: 0}; break;
    }
});

// Game Loop
function gameLoop() {
    // Muovi solo i serpenti vivi
    if (snake1.alive) moveSnake(snake1);
    if (snake2.alive) moveSnake(snake2);
    
    // Controlla collisioni
    checkCollisions();
    
    // Render
    drawGame();
    
    // Controlla fine gioco
    if ((!snake1.alive && !snake2.alive) || (waitingForRestart && !gameActive)) {
        gameOver();
    }
}

function moveSnake(snake) {
    const head = {
        x: (snake.body[0].x + snake.direction.x + tileCountX) % tileCountX,
        y: (snake.body[0].y + snake.direction.y + tileCountY) % tileCountY
    };
    
    snake.body.unshift(head);
    snake.direction = {...snake.nextDirection};
    
    if (head.x === food.x && head.y === food.y) {
        snake.score += 10;
        food = generatePosition();
    } else {
        snake.body.pop();
    }
}

function checkCollisions() {
    // Controlla collisioni per snake1
    if (snake1.alive) {
        const head = snake1.body[0];
        
        // Collisione con ostacoli o serpente2
        if (
            obstacles.some(o => o.x === head.x && o.y === head.y) ||
            (snake2.alive && snake2.body.some(s => s.x === head.x && s.y === head.y)) ||
            snake1.body.slice(1).some(s => s.x === head.x && s.y === head.y)
        ) {
            killSnake(snake1);
        }
    }
    
    // Controlla collisioni per snake2
    if (snake2.alive) {
        const head = snake2.body[0];
        
        // Collisione con ostacoli o serpente1
        if (
            obstacles.some(o => o.x === head.x && o.y === head.y) ||
            (snake1.alive && snake1.body.some(s => s.x === head.x && s.y === head.y)) ||
            snake2.body.slice(1).some(s => s.x === head.x && s.y === head.y)
        ) {
            killSnake(snake2);
        }
    }
}

function killSnake(snake) {
    snake.alive = false;
    // Aggiungi il corpo come ostacoli
    snake.body.forEach(segment => {
        obstacles.push({x: segment.x, y: segment.y, color: shadeColor(snake.color, -40)});
    });
    snake.body = [];
}

function drawGame() {
    // Sfondo
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Griglia
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 0.5;
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
    
    // Ostacoli
    obstacles.forEach(obs => {
        drawCube(obs.x, obs.y, obs.color || "#555");
    });
    
    // Cibo
    drawCube(food.x, food.y, "#FFFF00");
    
    // Serpenti vivi
    if (snake1.alive) {
        snake1.body.forEach((seg, i) => {
            drawCube(seg.x, seg.y, i === 0 ? shadeColor(snake1.color, 20) : snake1.color);
        });
    }
    
    if (snake2.alive) {
        snake2.body.forEach((seg, i) => {
            drawCube(seg.x, seg.y, i === 0 ? shadeColor(snake2.color, 20) : snake2.color);
        });
    }
    
    // Punteggi
    p1ScoreDisplay.textContent = `Player 1: ${snake1.score}`;
    p2ScoreDisplay.textContent = `Player 2: ${snake2.score}`;
}

function gameOver() {
    if (!waitingForRestart) {
        clearInterval(gameInterval);
        gameActive = false;
        waitingForRestart = true;
        
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "30px Arial";
        ctx.textAlign = "center";
        
        let message;
        if (!snake1.alive && !snake2.alive) {
            message = "DOUBLE KO!";
        } else if (snake1.alive) {
            message = "Player 1 WINS!";
        } else {
            message = "Player 2 WINS!";
        }
        
        ctx.fillText(`${message}`, canvas.width/2, canvas.height/2 - 30);
        ctx.font = "20px Arial";
        ctx.fillText(`Scores: ${snake1.score} - ${snake2.score}`, canvas.width/2, canvas.height/2 + 10);
        ctx.fillText("Press SPACE to restart", canvas.width/2, canvas.height/2 + 40);
    }
}

function startGame() {
    // Resetta serpenti
    snake1.body = [{x: 5, y: 10}, {x: 4, y: 10}, {x: 3, y: 10}];
    snake1.direction = {x: 1, y: 0};
    snake1.nextDirection = {x: 1, y: 0};
    snake1.alive = true;
    
    snake2.body = [{x: 15, y: 10}, {x: 16, y: 10}, {x: 17, y: 10}];
    snake2.direction = {x: -1, y: 0};
    snake2.nextDirection = {x: -1, y: 0};
    snake2.alive = true;
    
    // Resetta ostacoli e cibo
    obstacles = [];
    food = generatePosition();
    
    // Avvia gioco
    gameActive = true;
    waitingForRestart = false;
    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, 150);
}

// Inizializzazione
startBtn.addEventListener("click", startGame);
startGame();
