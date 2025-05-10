const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let snake = [{x: 200, y: 200}];
let food = {x: 0, y: 0};
let dx = 20, dy = 0;
let score = 0;

function drawSnake() {
    snake.forEach(segment => {
        ctx.fillStyle = "green";
        ctx.fillRect(segment.x, segment.y, 20, 20);
    });
}

function generateFood() {
    food.x = Math.floor(Math.random() * 20) * 20;
    food.y = Math.floor(Math.random() * 20) * 20;
}

function gameLoop() {
    // Logica del gioco qui (movimento, collisioni, ecc.)
}
generateFood();
setInterval(gameLoop, 100);