// game.js
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const p1ScoreDisplay = document.getElementById("p1Score");
const p2ScoreDisplay = document.getElementById("p2Score");
const startBtn = document.getElementById("startBtn");
const p1ColorPicker = document.getElementById("p1Color");
const p2ColorPicker = document.getElementById("p2Color");
const obstaclesCheckbox = document.getElementById("obstacles");

// Configurazione
const gridSize = 20;
const tileCountX = canvas.width / gridSize;
const tileCountY = canvas.height / gridSize;
let gameInterval;
let gameActive = false;
let obstacles = [];

// Serpenti
const snake1 = {
    body: [{x: 5, y: 10}, {x: 4, y: 10}, {x: 3, y: 10}],
    color: "#00FF00",
    direction: {x: 1, y: 0},
    nextDirection: {x: 1, y: 0},
    score: 0
};

const snake2 = {
    body: [{x: 15, y: 10}, {x: 16, y: 10}, {x: 17, y: 10}],
    color: "#FF0000",
    direction: {x: -1, y: 0},
    nextDirection: {x: -1, y: 0},
    score: 0
};

// Cibo
let food = {
    x: Math.floor(Math.random() * tileCountX),
    y: Math.floor(Math.random() * tileCountY)
};

// Disegna cubo 3D
function drawCube(x, y, color) {
    const size = gridSize - 2;
    const offset = 2;
    
    // Faccia principale
    ctx.fillStyle = color;
    ctx.fillRect(x * gridSize + 1, y * gridSize + 1, size, size);
    
    // Effetto 3D
    ctx.fillStyle = shadeColor(color, -20);
    ctx.beginPath();
    ctx.moveTo(x * gridSize + 1, y * gridSize + 1);
    ctx.lineTo(x * gridSize + offset, y * gridSize + offset);
    ctx.lineTo(x * gridSize + offset, y * gridSize + size - offset);
    ctx.lineTo(x * gridSize + 1, y * gridSize + size);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(x * gridSize + 1, y * gridSize + 1);
    ctx.lineTo(x * gridSize + offset, y * gridSize + offset);
    ctx.lineTo(x * gridSize + size - offset, y * gridSize + offset);
    ctx.lineTo(x * gridSize + size, y * gridSize + 1);
    ctx.fill();
    
    // Highlight
    ctx.fillStyle = shadeColor(color, 30);
    ctx.fillRect(x * gridSize + 3, y * gridSize + 3, 4, 4);
}

// Modifica colore
function shadeColor(color, percent) {
    let R = parseInt(color.substring(1,3), 16);
    let G = parseInt(color.substring(3,5), 16);
    let B = parseInt(color.substring(5,7), 16);

    R = Math.min(255, R + (R * percent / 100));
    G = Math.min(255, G + (G * percent / 100));
    B = Math.min(255, B + (B * percent / 100));

    return `rgb(${R},${G},${B})`;
}

// Genera cibo
function generateFood() {
    let pos;
    do {
        pos = {
            x: Math.floor(Math.random() * tileCountX),
            y: Math.floor(Math.random() * tileCountY)
        };
    } while (
        isPositionOccupied(pos) ||
        (obstaclesCheckbox.checked && obstacles.some(o => o.x === pos.x && o.y === pos.y))
    );
    
    food = pos;
}

// Genera ostacoli
function generateObstacles() {
    obstacles = [];
    if (!obstaclesCheckbox.checked) return;
    
    for (let i = 0; i < 5; i++) {
        let pos;
        do {
            pos = {
                x: Math.floor(Math.random() * tileCountX),
                y: Math.floor(Math.random() * tileCountY)
            };
        } while (isPositionOccupied(pos));
        
        obstacles.push(pos);
    }
}

// Controlla posizione occupata
function isPositionOccupied(pos) {
    return (
        snake1.body.some(segment => segment.x === pos.x && segment.y === pos.y) ||
        snake2.body.some(segment => segment.x === pos.x && segment.y === pos.y) ||
        (food.x === pos.x && food.y === pos.y)
    );
}

// Controlli
document.addEventListener("keydown", e => {
    if (!gameActive) return;
    
    // Player 1 (Freccie)
    switch(e.key) {
        case "ArrowUp": if (snake1.direction.y === 0) snake1.nextDirection = {x: 0, y: -1}; break;
        case "ArrowDown": if (snake1.direction.y === 0) snake1.nextDirection = {x: 0, y: 1}; break;
        case "ArrowLeft": if (snake1.direction.x === 0) snake1.nextDirection = {x: -1, y: 0}; break;
        case "ArrowRight": if (snake1.direction.x === 0) snake1.nextDirection = {x: 1, y: 0}; break;
    }
    
    // Player 2 (AWSD)
    switch(e.key.toLowerCase()) {
        case "w": if (snake2.direction.y === 0) snake2.nextDirection = {x: 0, y: -1}; break;
        case "s": if (snake2.direction.y === 0) snake2.nextDirection = {x: 0, y: 1}; break;
        case "a": if (snake2.direction.x === 0) snake2.nextDirection = {x: -1, y: 0}; break;
        case "d": if (snake2.direction.x === 0) snake2.nextDirection = {x: 1, y: 0}; break;
    }
});

// Game Loop
function gameLoop() {
    // Aggiorna direzioni
    snake1.direction = {...snake1.nextDirection};
    snake2.direction = {...snake2.nextDirection};
    
    // Muovi serpenti
    moveSnake(snake1);
    moveSnake(snake2);
    
    // Controlla collisioni
    checkCollisions();
    
    // Render
    drawGame();
}

function moveSnake(snake) {
    const head = {
        x: (snake.body[0].x + snake.direction.x + tileCountX) % tileCountX,
        y: (snake.body[0].y + snake.direction.y + tileCountY) % tileCountY
    };
    
    snake.body.unshift(head);
    
    // Mangia cibo
    if (head.x === food.x && head.y === food.y) {
        snake.score += 10;
        generateFood();
    } else {
        snake.body.pop();
    }
}

function checkCollisions() {
    const head1 = snake1.body[0];
    const head2 = snake2.body[0];
    
    // Controlla collisione con ostacoli
    if (obstaclesCheckbox.checked && 
        (obstacles.some(o => o.x === head1.x && o.y === head1.y) || 
         obstacles.some(o => o.x === head2.x && o.y === head2.y))) {
        gameOver();
        return;
    }
    
    // Controlla collisione tra serpenti
    if (
        // Serpente 1 collide con se stesso o serpente 2
        snake1.body.slice(1).some(segment => segment.x === head1.x && segment.y === head1.y) ||
        snake2.body.some(segment => segment.x === head1.x && segment.y === head1.y) ||
        // Serpente 2 collide con se stesso o serpente 1
        snake2.body.slice(1).some(segment => segment.x === head2.x && segment.y === head2.y) ||
        snake1.body.some(segment => segment.x === head2.x && segment.y === head2.y)
    ) {
        gameOver();
    }
}

function drawGame() {
    // Sfondo
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Griglia
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 0.5;
    for (let i = 0; i < tileCountX; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize + 0.5, 0);
        ctx.lineTo(i * gridSize + 0.5, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i < tileCountY; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize + 0.5);
        ctx.lineTo(canvas.width, i * gridSize + 0.5);
        ctx.stroke();
    }
    
    // Ostacoli
    obstacles.forEach(obs => {
        drawCube(obs.x, obs.y, "#555");
    });
    
    // Cibo
    drawCube(food.x, food.y, "#FFFF00");
    
    // Serpenti
    snake1.body.forEach((segment, i) => {
        drawCube(segment.x, segment.y, i === 0 ? shadeColor(snake1.color, 20) : snake1.color);
    });
    
    snake2.body.forEach((segment, i) => {
        drawCube(segment.x, segment.y, i === 0 ? shadeColor(snake2.color, 20) : snake2.color);
    });
    
    // Aggiorna punteggi
    p1ScoreDisplay.textContent = `Player 1: ${snake1.score}`;
    p2ScoreDisplay.textContent = `Player 2: ${snake2.score}`;
}

function gameOver() {
    clearInterval(gameInterval);
    gameActive = false;
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    
    let winner;
    if (snake1.score > snake2.score) winner = "Player 1 WINS!";
    else if (snake2.score > snake1.score) winner = "Player 2 WINS!";
    else winner = "DRAW!";
    
    ctx.fillText(`GAME OVER - ${winner}`, canvas.width/2, canvas.height/2 - 30);
    ctx.font = "20px Arial";
    ctx.fillText(`Final Score: ${snake1.score} - ${snake2.score}`, canvas.width/2, canvas.height/2 + 10);
    ctx.fillText("Click START to play again", canvas.width/2, canvas.height/2 + 40);
    
    startBtn.style.display = "block";
}

function startGame() {
    // Resetta serpenti
    snake1.body = [{x: 5, y: 10}, {x: 4, y: 10}, {x: 3, y: 10}];
    snake1.direction = {x: 1, y: 0};
    snake1.nextDirection = {x: 1, y: 0};
    snake1.score = 0;
    snake1.color = p1ColorPicker.value;
    
    snake2.body = [{x: 15, y: 10}, {x: 16, y: 10}, {x: 17, y: 10}];
    snake2.direction = {x: -1, y: 0};
    snake2.nextDirection = {x: -1, y: 0};
    snake2.score = 0;
    snake2.color = p2ColorPicker.value;
    
    // Genera cibo e ostacoli
    generateFood();
    generateObstacles();
    
    // Aggiorna UI
    p1ScoreDisplay.textContent = `Player 1: 0`;
    p2ScoreDisplay.textContent = `Player 2: 0`;
    startBtn.style.display = "none";
    
    // Avvia gioco
    gameActive = true;
    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, 150);
}

// Inizializzazione
startBtn.addEventListener("click", startGame);
drawGame();
