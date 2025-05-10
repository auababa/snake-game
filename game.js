// game.js - Versione Sicura e Funzionante
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("scoreDisplay");

// Configurazione
const gridSize = 20;
const tileCount = canvas.width / gridSize;
let speed = 150;
let gameInterval;
let gameStarted = false;

// Serpente (inizia con 3 segmenti verticali)
let snake = [
    {x: 10, y: 12},
    {x: 10, y: 11},
    {x: 10, y: 10}
];
let dx = 0;
let dy = -1; // Direzione iniziale: su

// Mela
const appleImg = new Image();
appleImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="red"/><path fill="brown" d="M10 2 Q12 0 14 2"/></svg>';

// Immagini serpente (SVG inline per evitare CSP)
const headImg = new Image();
headImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill="darkgreen"/><circle cx="7" cy="7" r="2" fill="white"/><circle cx="13" cy="7" r="2" fill="white"/><path d="M6 13 Q10 15 14 13" stroke="white" fill="none" stroke-width="1.5"/></svg>';

const bodyImg = new Image();
bodyImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="green"/><circle cx="7" cy="8" r="1.5" fill="white" opacity="0.6"/></svg>';

// Punteggio
let score = 0;

// Disegna griglia
function drawGrid() {
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 0.5;
    for (let i = 0; i < tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize + 0.5, 0);
        ctx.lineTo(i * gridSize + 0.5, canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize + 0.5);
        ctx.lineTo(canvas.width, i * gridSize + 0.5);
        ctx.stroke();
    }
}

// Genera mela
function generateApple() {
    let pos;
    do {
        pos = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
    } while (snake.some(segment => segment.x === pos.x && segment.y === pos.y));
    
    apple = pos;
}

// Disegna serpente
function drawSnake() {
    // Corpo
    snake.forEach((segment, i) => {
        ctx.drawImage(
            i === 0 ? headImg : bodyImg,
            segment.x * gridSize,
            segment.y * gridSize,
            gridSize,
            gridSize
        );
    });
}

// Game Over
function gameOver() {
    clearInterval(gameInterval);
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`Game Over! Score: ${score}`, canvas.width/2, canvas.height/2 - 20);
    ctx.font = "16px Arial";
    ctx.fillText("Press SPACE to restart", canvas.width/2, canvas.height/2 + 20);
    gameStarted = false;
}

// Logica di gioco
function gameLoop() {
    const head = {
        x: (snake[0].x + dx + tileCount) % tileCount,
        y: (snake[0].y + dy + tileCount) % tileCount
    };

    // Controlla collisione con corpo (escludi testa)
    if (snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver();
        return;
    }

    snake.unshift(head);

    // Mangia mela
    if (head.x === apple.x && head.y === apple.y) {
        score += 10;
        scoreDisplay.textContent = `Score: ${score}`;
        generateApple();
        
        // Aumenta difficoltà
        if (score % 50 === 0) {
            speed = Math.max(70, speed - 10);
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, speed);
        }
    } else {
        snake.pop();
    }

    // Render
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    ctx.drawImage(appleImg, apple.x * gridSize, apple.y * gridSize, gridSize, gridSize);
    drawSnake();
}

// Controlli
document.addEventListener("keydown", e => {
    if (!gameStarted && e.key === " ") {
        startGame();
        return;
    }

    switch(e.key) {
        case "ArrowUp": if (dy !== 1) { dx = 0; dy = -1; } break;
        case "ArrowDown": if (dy !== -1) { dx = 0; dy = 1; } break;
        case "ArrowLeft": if (dx !== 1) { dx = -1; dy = 0; } break;
        case "ArrowRight": if (dx !== -1) { dx = 1; dy = 0; } break;
    }
});

// Avvia gioco
function startGame() {
    snake = [
        {x: 10, y: 12},
        {x: 10, y: 11},
        {x: 10, y: 10}
    ];
    dx = 0;
    dy = -1;
    score = 0;
    speed = 150;
    scoreDisplay.textContent = "Score: 0";
    generateApple();
    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, speed);
    gameStarted = true;
}

// Inizializzazione
drawGrid();
ctx.fillStyle = "white";
ctx.font = "24px Arial";
ctx.textAlign = "center";
ctx.fillText("Press SPACE to start", canvas.width/2, canvas.height/2);
generateApple();
