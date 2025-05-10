// game.js
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("scoreDisplay");

// Dimensioni
const gridSize = 20;
const tileCount = canvas.width / gridSize;

// Serpente
let snake = [
    {x: 10, y: 10}
];
let dx = 0;
let dy = 0;

// Mela
let apple = {
    x: Math.floor(Math.random() * tileCount),
    y: Math.floor(Math.random() * tileCount),
    img: new Image()
};
apple.img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="red" d="M50 20c-15 0-25 10-25 25 0 20 25 40 25 40s25-20 25-40c0-15-10-25-25-25z"/><path fill="green" d="M60 15c-5-5-15-5-20 0-2 2 0 5 2 5s13-3 15 0c2-2 3-5 3-5z"/></svg>';

// Punteggio
let score = 0;
let snakeBodyImg = new Image();
snakeBodyImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="green"/><circle cx="7" cy="7" r="2" fill="white"/></svg>';

let snakeHeadImg = new Image();
snakeHeadImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill="darkgreen"/><circle cx="7" cy="7" r="2" fill="white"/><circle cx="14" cy="7" r="2" fill="white"/><path d="M7 14 Q10 17 13 14" stroke="white" fill="none" stroke-width="2"/></svg>';

// Griglia
function drawGrid() {
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i < tileCount; i++) {
        // Linee verticali
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
        
        // Linee orizzontali
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }
}

// Disegna serpente
function drawSnake() {
    // Testa
    ctx.drawImage(
        snakeHeadImg,
        snake[0].x * gridSize,
        snake[0].y * gridSize,
        gridSize,
        gridSize
    );
    
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

// Game loop
function gameLoop() {
    // Movimento
    const head = {
        x: (snake[0].x + dx + tileCount) % tileCount,
        y: (snake[0].y + dy + tileCount) % tileCount
    };
    
    // Controllo collisione con corpo
    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            // Game over
            alert("Game Over! Score: " + score);
            document.location.reload();
        }
    }
    
    snake.unshift(head);
    
    // Mangiare mela
    if (head.x === apple.x && head.y === apple.y) {
        score++;
        scoreDisplay.textContent = "Score: " + score;
        apple.x = Math.floor(Math.random() * tileCount);
        apple.y = Math.floor(Math.random() * tileCount);
    } else {
        snake.pop();
    }
    
    // Disegno
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawSnake();
    ctx.drawImage(
        apple.img,
        apple.x * gridSize,
        apple.y * gridSize,
        gridSize,
        gridSize
    );
}

// Controlli
document.addEventListener("keydown", e => {
    switch(e.key) {
        case "ArrowUp": if (dy !== 1) { dx = 0; dy = -1; } break;
        case "ArrowDown": if (dy !== -1) { dx = 0; dy = 1; } break;
        case "ArrowLeft": if (dx !== 1) { dx = -1; dy = 0; } break;
        case "ArrowRight": if (dx !== -1) { dx = 1; dy = 0; } break;
    }
});

// Avvia gioco
setInterval(gameLoop, 150);
