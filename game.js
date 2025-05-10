// game.js - Snake Game Completo
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("scoreDisplay");

// Configurazione
const gridSize = 20;
const tileCount = canvas.width / gridSize;
let speed = 150;
let gameInterval;

// Serpente
let snake = [
    {x: 10, y: 10},
    {x: 10, y: 11},
    {x: 10, y: 12}
];
let dx = 0;
let dy = -1; // Parte muovendosi verso l'alto

// Melas
let apple = {
    x: 5,
    y: 5,
    img: new Image()
};
apple.img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="red" d="M50 20c-15 0-25 10-25 25 0 20 25 40 25 40s25-20 25-40c0-15-10-25-25-25z"/><path fill="green" d="M60 15c-5-5-15-5-20 0-2 2 0 5 2 5s13-3 15 0c2-2 3-5 3-5z"/></svg>';

// Immagini
const snakeHeadImg = new Image();
snakeHeadImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill="darkgreen"/><circle cx="7" cy="7" r="2" fill="white"/><circle cx="14" cy="7" r="2" fill="white"/><path d="M7 14 Q10 17 13 14" stroke="white" fill="none" stroke-width="2"/></svg>';

const snakeBodyImg = new Image();
snakeBodyImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="green"/><circle cx="7" cy="7" r="2" fill="white"/></svg>';

// Punteggio
let score = 0;

// Griglia
function drawGrid() {
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i < tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }
}

// Disegna serpente
function drawSnake() {
    // Testa (ruotata in base alla direzione)
    ctx.save();
    ctx.translate(
        snake[0].x * gridSize + gridSize/2,
        snake[0].y * gridSize + gridSize/2
    );
    
    if (dx === 1) ctx.rotate(Math.PI/2);
    else if (dx === -1) ctx.rotate(-Math.PI/2);
    else if (dy === -1) ctx.rotate(0);
    else ctx.rotate(Math.PI);
    
    ctx.drawImage(
        snakeHeadImg,
        -gridSize/2,
        -gridSize/2,
        gridSize,
        gridSize
    );
    ctx.restore();
    
    // Corpo
    for (let i = 1; i < snake.length; i++) {
        ctx.drawImage(
            snakeBodyImg,
            snake[i].x * gridSize,
            snake[i].y * gridSize,
            gridSize,
            gridSize
        );
    }
}

// Genera mela
function generateApple() {
    let overlapping;
    do {
        apple.x = Math.floor(Math.random() * tileCount);
        apple.y = Math.floor(Math.random() * tileCount);
        
        overlapping = false;
        for (let segment of snake) {
            if (apple.x === segment.x && apple.y === segment.y) {
                overlapping = true;
                break;
            }
        }
    } while (overlapping);
}

// Game Over
function gameOver() {
    clearInterval(gameInterval);
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width/2, canvas.height/2 - 20);
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, canvas.width/2, canvas.height/2 + 20);
    ctx.fillText("Click to restart", canvas.width/2, canvas.height/2 + 50);
    
    canvas.addEventListener("click", restartGame, { once: true });
}

// Restart
function restartGame() {
    document.location.reload();
}

// Game Loop
function gameLoop() {
    // Nuova posizione testa
    const head = {
        x: (snake[0].x + dx + tileCount) % tileCount,
        y: (snake[0].y + dy + tileCount) % tileCount
    };
    
    // Controllo collisione (salta i primi 3 segmenti)
    for (let i = 3; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver();
            return;
        }
    }
    
    snake.unshift(head);
    
    // Mangia mela
    if (head.x === apple.x && head.y === apple.y) {
        score += 10;
        scoreDisplay.textContent = "Score: " + score;
        generateApple();
        
        // Aumenta difficoltà ogni 5 mele
        if (score % 50 === 0) {
            speed = Math.max(50, speed - 10);
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, speed);
        }
    } else {
        snake.pop();
    }
    
    // Disegno
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawSnake();
    ctx.drawImage(apple.img, apple.x * gridSize, apple.y * gridSize, gridSize, gridSize);
}

// Controlli
document.addEventListener("keydown", e => {
    switch(e.key) {
        case "ArrowUp": if (dy !== 1) { dx = 0; dy = -1; } break;
        case "ArrowDown": if (dy !== -1) { dx = 0; dy = 1; } break;
        case "ArrowLeft": if (dx !== 1) { dx = -1; dy = 0; } break;
        case "ArrowRight": if (dx !== -1) { dx = 1; dy = 0; } break;
        case " ": if (!gameInterval) startGame(); break; // Barra spaziatrice per iniziare
    }
});

// Avvia gioco
function startGame() {
    score = 0;
    scoreDisplay.textContent = "Score: 0";
    generateApple();
    gameInterval = setInterval(gameLoop, speed);
}

// Inizializzazione
startGame();
