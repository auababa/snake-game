// Inizializzazione variabili
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const p1Score = document.getElementById("p1Score");
const p2Score = document.getElementById("p2Score");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const reviveBtn = document.getElementById("reviveBtn");

// Configurazione
const gridSize = 20;
const tileCountX = Math.floor(canvas.width / gridSize);
const tileCountY = Math.floor(canvas.height / gridSize);
let gameInterval;
let gameActive = false;
let obstacles = [];
let particles = [];
let food = { x: 0, y: 0 };
let reviveApple = null;

// Serpenti
const snake1 = {
    body: [{x: 5, y: 5}, {x: 5, y: 6}, {x: 5, y: 7}],
    color: "#00ffaa",
    direction: {x: 0, y: -1},
    nextDirection: {x: 0, y: -1},
    score: 0,
    alive: true,
    deathPosition: null
};

const snake2 = {
    body: [{x: 15, y: 15}, {x: 15, y: 14}, {x: 15, y: 13}],
    color: "#ff3366",
    direction: {x: 0, y: 1},
    nextDirection: {x: 0, y: 1},
    score: 0,
    alive: true,
    deathPosition: null
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
        (reviveApple && reviveApple.x === pos.x && reviveApple.y === pos.y)
    );
}

function createObstacles() {
    obstacles = [];
    
    // Crea ostacoli orizzontali e verticali
    for (let i = 0; i < 5; i++) {
        // Ostacoli orizzontali
        const lengthH = Math.floor(Math.random() * 5) + 3;
        const startX = Math.floor(Math.random() * (tileCountX - lengthH));
        const y = Math.floor(Math.random() * tileCountY);
        
        for (let j = 0; j < lengthH; j++) {
            obstacles.push({x: startX + j, y: y, color: "#555555"});
        }
        
        // Ostacoli verticali
        const lengthV = Math.floor(Math.random() * 5) + 3;
        const x = Math.floor(Math.random() * tileCountX);
        const startY = Math.floor(Math.random() * (tileCountY - lengthV));
        
        for (let j = 0; j < lengthV; j++) {
            obstacles.push({x: x, y: startY + j, color: "#555555"});
        }
    }
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
    
    ctx.fillStyle = color;
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
    
    if (head.x === food.x && head.y === food.y) {
        snake.score += 10;
        food = generatePosition();
    } 
    else if (reviveApple && head.x === reviveApple.x && head.y === reviveApple.y) {
        reviveSnake(snake === snake1 ? snake2 : snake1);
        reviveApple = null;
    }
    else {
        snake.body.pop();
    }
}

function killSnake(snake) {
    snake.alive = false;
    snake.deathPosition = { x: snake.body[0].x, y: snake.body[0].y };
    
    // Crea mela della resurrezione lontana
    if ((snake === snake1 && snake2.alive) || (snake === snake2 && snake1.alive)) {
        reviveApple = generatePosition(snake.deathPosition, 8);
    }
}

function reviveSnake(snake) {
    if (!snake) return;
    
    // Trova una posizione sicura per rinascere
    const newPos = generateSafeRevivePosition();
    if (!newPos) return;
    
    snake.alive = true;
    snake.body = [
        {x: newPos.x, y: newPos.y},
        {x: newPos.x - snake.direction.x, y: newPos.y - snake.direction.y},
        {x: newPos.x - snake.direction.x*2, y: newPos.y - snake.direction.y*2}
    ];
    snake.deathPosition = null;
}

function generateSafeRevivePosition() {
    let attempts = 0;
    let pos;
    
    do {
        pos = {
            x: Math.floor(Math.random() * (tileCountX - 10)) + 5,
            y: Math.floor(Math.random() * (tileCountY - 10)) + 5
        };
        
        // Verifica che ci sia spazio per 3 segmenti
        const dirs = [
            {x: 0, y: -1}, {x: 1, y: 0}, 
            {x: 0, y: 1}, {x: -1, y: 0}
        ];
        
        for (const dir of dirs) {
            const valid = [0, 1, 2].every(i => {
                const checkPos = {
                    x: pos.x + dir.x * i,
                    y: pos.y + dir.y * i
                };
                return !isPositionOccupied(checkPos);
            });
            
            if (valid) {
                return {
                    x: pos.x,
                    y: pos.y,
                    direction: dir
                };
            }
        }
        
        attempts++;
    } while (attempts < 50);
    
    return null;
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
    
    // Ostacoli
    obstacles.forEach(obs => {
        ctx.fillStyle = obs.color;
        ctx.fillRect(obs.x * gridSize, obs.y * gridSize, gridSize, gridSize);
    });
    
    // Cibo
    drawApple(food.x, food.y, "#ff0000");
    
    // Mela della resurrezione
    if (reviveApple) {
        drawApple(reviveApple.x, reviveApple.y, "#aa00ff");
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
    
    // Aggiorna punteggi
    p1Score.textContent = `Player 1: ${snake1.score}`;
    p2Score.textContent = `Player 2: ${snake2.score}`;
}

// Game loop
function gameLoop() {
    if (snake1.alive) moveSnake(snake1);
    if (snake2.alive) moveSnake(snake2);
    
    checkCollisions();
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
            (snake2.alive && snake2.body.some(s => s.x === head.x && s.y === head.y)) ||
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
            (snake1.alive && snake1.body.some(s => s.x === head.x && s.y === head.y)) ||
            snake2.body.slice(1).some(s => s.x === head.x && s.y === head.y)
        ) {
            killSnake(snake2);
        }
    }
}

function gameOver() {
    if (gameActive) {
        gameActive = false;
        clearInterval(gameInterval);
        
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "30px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        ctx.textAlign = "center";
        
        let winner;
        if (snake1.score > snake2.score) {
            winner = "Player 1 Wins! Congratulations!";
        } else if (snake2.score > snake1.score) {
            winner = "Player 2 Wins! Congratulations!";
        } else {
            winner = "It's a Draw!";
        }
        
        ctx.fillText("Game Over", canvas.width/2, canvas.height/2 - 40);
        ctx.fillText(winner, canvas.width/2, canvas.height/2);
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
    
    // Rivitalizza con tasto 7
    if (e.key === "7") {
        if (!snake1.alive) reviveSnake(snake1);
        if (!snake2.alive) reviveSnake(snake2);
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

function startGame() {
    // Reset serpenti
    snake1.body = [{x: 5, y: 5}, {x: 5, y: 6}, {x: 5, y: 7}];
    snake1.direction = {x: 0, y: -1};
    snake1.nextDirection = {x: 0, y: -1};
    snake1.alive = true;
    snake1.score = 0;
    
    snake2.body = [{x: 15, y: 15}, {x: 15, y: 14}, {x: 15, y: 13}];
    snake2.direction = {x: 0, y: 1};
    snake2.nextDirection = {x: 0, y: 1};
    snake2.alive = true;
    snake2.score = 0;
    
    // Crea ostacoli
    createObstacles();
    
    // Genera cibo
    food = generatePosition();
    reviveApple = null;
    
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
    reviveBtn.addEventListener("click", function() {
        if (!snake1.alive) reviveSnake(snake1);
        if (!snake2.alive) reviveSnake(snake2);
    });
    
    startGame();
});
