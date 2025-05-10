// Inizializzazione variabili globali
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const p1Score = document.getElementById("p1Score");
const p2Score = document.getElementById("p2Score");
const startBtn = document.getElementById("startBtn");
const p1ColorPicker = document.getElementById("p1Color");
const p2ColorPicker = document.getElementById("p2Color");
const obstaclesToggle = document.getElementById("obstaclesToggle");

// Configurazione del gioco
const gridSize = 20;
const tileCountX = canvas.width / gridSize;
const tileCountY = canvas.height / gridSize;
let gameInterval;
let gameActive = false;
let obstacles = [];
let particles = [];
let food = { x: 0, y: 0 };
let reviveApple = null;
let withObstacles = true;

// Serpenti (direzioni iniziali OPPOSTE e NON CONVERGENTI)
const snake1 = {
    body: [{x: 8, y: 10}, {x: 7, y: 10}, {x: 6, y: 10}],
    color: "#00FF88",
    direction: {x: 1, y: 0},  // Destra
    nextDirection: {x: 1, y: 0},
    score: 0,
    alive: true,
    deathPosition: null
};

const snake2 = {
    body: [{x: 12, y: 10}, {x: 13, y: 10}, {x: 14, y: 10}],
    color: "#FF3366",
    direction: {x: -1, y: 0},  // Sinistra
    nextDirection: {x: -1, y: 0},
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

function roundRect(x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
}

// Funzioni di gioco
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

function isPositionOccupied(pos) {
    return (
        snake1.body.some(s => s.x === pos.x && s.y === pos.y) ||
        snake2.body.some(s => s.x === pos.x && s.y === pos.y) ||
        obstacles.some(o => o.x === pos.x && o.y === pos.y) ||
        (food.x === pos.x && food.y === pos.y) ||
        (reviveApple && reviveApple.x === pos.x && reviveApple.y === pos.y)
    );
}

function drawApple(x, y, color, isRevive = false) {
    const size = gridSize * 0.8;
    const centerX = x * gridSize + gridSize/2;
    const centerY = y * gridSize + gridSize/2;
    
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = isRevive ? 15 : 10;
    
    // Corpo mela
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, size/2, size/2*0.9, 0, 0, Math.PI*2);
    ctx.fill();
    
    // Picciolo
    ctx.strokeStyle = "#8B4513";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX + size*0.2, centerY - size*0.3);
    ctx.lineTo(centerX + size*0.1, centerY - size*0.5);
    ctx.stroke();
    
    // Foglia
    ctx.fillStyle = "#00AA00";
    ctx.beginPath();
    ctx.ellipse(centerX + size*0.3, centerY - size*0.4, size*0.2, size*0.1, Math.PI/4, 0, Math.PI*2);
    ctx.fill();
    
    ctx.restore();
}

function drawCell(x, y, color, isHead = false) {
    const size = gridSize;
    const padding = 2;
    const innerSize = size - padding * 2;
    
    ctx.shadowColor = color;
    ctx.shadowBlur = isHead ? 15 : 8;
    
    ctx.fillStyle = color;
    roundRect(
        x * size + padding, 
        y * size + padding, 
        innerSize, 
        innerSize, 
        4, 
        true, 
        false
    );
    
    ctx.fillStyle = shadeColor(color, -20);
    roundRect(
        x * size + padding, 
        y * size + padding, 
        innerSize * 0.7, 
        innerSize, 
        4, 
        true, 
        true
    );
    
    if (isHead) {
        ctx.fillStyle = shadeColor(color, 40);
        ctx.beginPath();
        ctx.arc(
            x * size + size * 0.7, 
            y * size + size * 0.3, 
            size * 0.15, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
    }
    
    ctx.shadowBlur = 0;
}

function generateParticles(x, y, color, count = 15) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x * gridSize + gridSize/2,
            y: y * gridSize + gridSize/2,
            color: color,
            size: Math.random() * 3 + 1,
            speed: {
                x: (Math.random() - 0.5) * 5,
                y: (Math.random() - 0.5) * 5
            },
            life: 30 + Math.random() * 20
        });
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
        snake.score += 10;
        food = generatePosition();
        generateParticles(food.x, food.y, snake.color);
    } 
    // Controlla mela della resurrezione
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
    generateParticles(snake.body[0].x, snake.body[0].y, snake.color, 30);
    
    // Crea mela della resurrezione
    if ((snake === snake1 && snake2.alive) || (snake === snake2 && snake1.alive)) {
        reviveApple = {
            x: snake.deathPosition.x,
            y: snake.deathPosition.y,
            color: "#AA00FF"
        };
    }
    
    // Trasforma in ostacoli se l'opzione è attiva
    if (withObstacles) {
        snake.body.forEach(seg => {
            obstacles.push({
                x: seg.x,
                y: seg.y,
                color: shadeColor(snake.color, -40)
            });
        });
    }
    snake.body = [];
}

function reviveSnake(snake) {
    if (!snake.deathPosition) return;
    
    snake.alive = true;
    // Ricrea il serpente con 3 segmenti nella posizione di morte
    snake.body = [
        {x: snake.deathPosition.x, y: snake.deathPosition.y},
        {x: snake.deathPosition.x - snake.direction.x, y: snake.deathPosition.y - snake.direction.y},
        {x: snake.deathPosition.x - snake.direction.x*2, y: snake.deathPosition.y - snake.direction.y*2}
    ];
    snake.deathPosition = null;
    generateParticles(snake.body[0].x, snake.body[0].y, snake.color, 20);
}

function checkCollisions() {
    if (snake1.alive) {
        const head = snake1.body[0];
        if (
            (withObstacles && obstacles.some(o => o.x === head.x && o.y === head.y)) ||
            (snake2.alive && snake2.body.some(s => s.x === head.x && s.y === head.y)) ||
            snake1.body.slice(1).some(s => s.x === head.x && s.y === head.y)
        ) {
            killSnake(snake1);
        }
    }
    
    if (snake2.alive) {
        const head = snake2.body[0];
        if (
            (withObstacles && obstacles.some(o => o.x === head.x && o.y === head.y)) ||
            (snake1.alive && snake1.body.some(s => s.x === head.x && s.y === head.y)) ||
            snake2.body.slice(1).some(s => s.x === head.x && s.y === head.y)
        ) {
            killSnake(snake2);
        }
    }
}

// Render
function render() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Griglia
    ctx.strokeStyle = "rgba(50, 50, 50, 0.3)";
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
    if (withObstacles) {
        obstacles.forEach(obs => {
            drawCell(obs.x, obs.y, obs.color);
        });
    }
    
    // Cibo normale
    drawApple(food.x, food.y, "#FF0000");
    
    // Mela della resurrezione
    if (reviveApple) {
        drawApple(reviveApple.x, reviveApple.y, reviveApple.color, true);
    }
    
    // Serpenti
    if (snake1.alive) {
        snake1.body.forEach((seg, i) => {
            drawCell(seg.x, seg.y, snake1.color, i === 0);
        });
    }
    
    if (snake2.alive) {
        snake2.body.forEach((seg, i) => {
            drawCell(seg.x, seg.y, snake2.color, i === 0);
        });
    }
    
    // Particelle
    particles.forEach((p, i) => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 50;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        
        p.x += p.speed.x;
        p.y += p.speed.y;
        p.life--;
        
        if (p.life <= 0) particles.splice(i, 1);
    });
    ctx.globalAlpha = 1;
    
    // UI
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

function gameOver() {
    if (gameActive) {
        gameActive = false;
        clearInterval(gameInterval);
        
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = "#FFF";
        ctx.font = "30px Arial";
        ctx.textAlign = "center";
        
        let message;
        if (!snake1.alive && !snake2.alive) {
            message = "DOUBLE KO!";
        } else if (snake1.alive) {
            message = "PLAYER 1 WINS!";
        } else {
            message = "PLAYER 2 WINS!";
        }
        
        ctx.fillText(message, canvas.width/2, canvas.height/2 - 30);
        ctx.font = "20px Arial";
        ctx.fillText(`Final: ${snake1.score} - ${snake2.score}`, canvas.width/2, canvas.height/2 + 10);
        ctx.fillText("Press SPACE to restart", canvas.width/2, canvas.height/2 + 40);
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

function startGame() {
    // Aggiorna colori dai picker
    snake1.color = p1ColorPicker.value;
    snake2.color = p2ColorPicker.value;
    withObstacles = obstaclesToggle.checked;
    
    // Reset serpenti (direzioni OPPOSTE)
    snake1.body = [{x: 8, y: 10}, {x: 7, y: 10}, {x: 6, y: 10}];
    snake1.direction = {x: 1, y: 0};
    snake1.nextDirection = {x: 1, y: 0};
    snake1.alive = true;
    snake1.score = 0;
    snake1.deathPosition = null;
    
    snake2.body = [{x: 12, y: 10}, {x: 13, y: 10}, {x: 14, y: 10}];
    snake2.direction = {x: -1, y: 0};
    snake2.nextDirection = {x: -1, y: 0};
    snake2.alive = true;
    snake2.score = 0;
    snake2.deathPosition = null;
    
    // Reset elementi di gioco
    obstacles = [];
    particles = [];
    reviveApple = null;
    food = generatePosition();
    
    // Avvia gioco
    gameActive = true;
    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, 150);
    
    // Aggiorna UI
    p1Score.textContent = "Player 1: 0";
    p2Score.textContent = "Player 2: 0";
}

// Inizializzazione
startBtn.addEventListener("click", startGame);
startGame();
