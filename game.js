const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let snake = [{x: 200, y: 200}];
let food = {x: 0, y: 0};
let dx = 20, dy = 0;

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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawSnake();
    ctx.fillStyle = "red";
    ctx.fillRect(food.x, food.y, 20, 20);

    // Movimento base (senza eval)
    const head = {x: snake[0].x + dx, y: snake[0].y + dy};
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
        generateFood();
    } else {
        snake.pop();
    }
}

// Controlli da tastiera
document.addEventListener("keydown", e => {
    switch(e.key) {
        case "ArrowUp": if (dy !== 20) { dx = 0; dy = -20; } break;
        case "ArrowDown": if (dy !== -20) { dx = 0; dy = 20; } break;
        case "ArrowLeft": if (dx !== 20) { dx = -20; dy = 0; } break;
        case "ArrowRight": if (dx !== -20) { dx = 20; dy = 0; } break;
    }
});

generateFood();
setInterval(gameLoop, 100);
