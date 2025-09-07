document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const levelElement = document.getElementById('level');
    const statusMessage = document.getElementById('status-message');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const restartBtn = document.getElementById('restart-btn');

    // 游戏配置
    const gridSize = 20; // 每个格子的大小
    const gridWidth = canvas.width / gridSize; // 网格宽度
    const gridHeight = canvas.height / gridSize; // 网格高度
    const totalCells = gridWidth * gridHeight; // 总格子数

    // 游戏状态
    let snake = []; // 蛇的身体部分
    let food = {}; // 食物位置
    let obstacles = []; // 障碍物位置
    let direction = ''; // 当前方向
    let nextDirection = ''; // 下一个方向
    let gameInterval = null; // 游戏循环
    let score = 0; // 分数
    let level = 1; // 等级
    let speed = 150; // 初始速度 (毫秒)
    let isPaused = false; // 是否暂停
    let isGameOver = false; // 游戏是否结束
    let isWin = false; // 是否获胜

    // 初始化游戏
    function initGame() {
        // 重置游戏状态
        snake = [{ x: Math.floor(gridWidth / 2), y: Math.floor(gridHeight / 2) }];
        direction = 'right';
        nextDirection = 'right';
        score = 0;
        level = 1;
        speed = 150;
        obstacles = [];
        isGameOver = false;
        isWin = false;
        isPaused = false;

        // 更新UI
        scoreElement.textContent = score;
        levelElement.textContent = level;
        statusMessage.textContent = '';

        // 生成食物和障碍物
        generateFood();
        generateObstacles();

        // 清除之前的游戏循环
        if (gameInterval) {
            clearInterval(gameInterval);
            gameInterval = null;
        }

        // 绘制初始状态
        draw();

        // 更新按钮状态
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        restartBtn.disabled = false;
    }

    // 开始游戏
    function startGame() {
        if (isGameOver || isWin) {
            initGame();
        }

        if (!gameInterval) {
            gameInterval = setInterval(gameLoop, speed);
            isPaused = false;
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            pauseBtn.textContent = '暂停';
            statusMessage.textContent = '';
        }
    }

    // 暂停游戏
    function togglePause() {
        if (isGameOver || isWin) return;

        if (isPaused) {
            gameInterval = setInterval(gameLoop, speed);
            isPaused = false;
            pauseBtn.textContent = '暂停';
            statusMessage.textContent = '';
        } else {
            clearInterval(gameInterval);
            gameInterval = null;
            isPaused = true;
            pauseBtn.textContent = '继续';
            statusMessage.textContent = '游戏已暂停';
        }
    }

    // 重新开始游戏
    function restartGame() {
        initGame();
    }

    // 游戏主循环
    function gameLoop() {
        moveSnake();
        checkCollision();
        if (!isGameOver && !isWin) {
            draw();
        }
    }

    // 移动蛇
    function moveSnake() {
        // 更新方向
        direction = nextDirection;

        // 获取蛇头位置
        const head = { ...snake[0] };

        // 根据方向移动蛇头
        switch (direction) {
            case 'up':
                head.y -= 1;
                break;
            case 'down':
                head.y += 1;
                break;
            case 'left':
                head.x -= 1;
                break;
            case 'right':
                head.x += 1;
                break;
        }

        // 添加新的蛇头
        snake.unshift(head);

        // 检查是否吃到食物
        if (head.x === food.x && head.y === food.y) {
            // 增加分数
            score += 10;
            scoreElement.textContent = score;

            // 检查是否需要升级
            checkLevelUp();

            // 生成新的食物
            generateFood();

            // 检查是否获胜
            if (snake.length === totalCells - obstacles.length) {
                gameWin();
            }
        } else {
            // 如果没有吃到食物，移除蛇尾
            snake.pop();
        }
    }

    // 检查碰撞
    function checkCollision() {
        const head = snake[0];

        // 检查是否撞墙
        if (head.x < 0 || head.x >= gridWidth || head.y < 0 || head.y >= gridHeight) {
            gameOver('撞到墙壁了！');
            return;
        }

        // 检查是否撞到自己（自杀机制）
        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                gameOver('撞到自己了！');
                return;
            }
        }

        // 检查是否撞到障碍物（自杀机制）
        for (const obstacle of obstacles) {
            if (head.x === obstacle.x && head.y === obstacle.y) {
                gameOver('撞到障碍物了！');
                return;
            }
        }
    }

    // 游戏结束
    function gameOver(message) {
        clearInterval(gameInterval);
        gameInterval = null;
        isGameOver = true;
        statusMessage.textContent = `游戏结束！${message}`;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    }

    // 游戏胜利
    function gameWin() {
        clearInterval(gameInterval);
        gameInterval = null;
        isWin = true;
        statusMessage.textContent = `恭喜你赢了！点击开始进入下一级`;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        level++;
        levelElement.textContent = level;
    }

    // 检查是否需要升级
    function checkLevelUp() {
        // 每获得50分升一级
        if (score > 0 && score % 50 === 0) {
            level++;
            levelElement.textContent = level;
            // 提高游戏速度
            speed = Math.max(50, 150 - (level - 1) * 10);
            // 重新设置游戏循环以应用新速度
            if (gameInterval) {
                clearInterval(gameInterval);
                gameInterval = setInterval(gameLoop, speed);
            }
            // 每升级增加一个障碍物
            generateObstacle();
            statusMessage.textContent = `升级到 ${level} 级！速度增加！`;
            setTimeout(() => {
                if (!isPaused && !isGameOver && !isWin) {
                    statusMessage.textContent = '';
                }
            }, 2000);
        }
    }

    // 生成食物
    function generateFood() {
        let validPosition = false;
        let newFood;

        while (!validPosition) {
            newFood = {
                x: Math.floor(Math.random() * gridWidth),
                y: Math.floor(Math.random() * gridHeight)
            };

            validPosition = true;

            // 确保食物不会生成在蛇身上
            for (const segment of snake) {
                if (newFood.x === segment.x && newFood.y === segment.y) {
                    validPosition = false;
                    break;
                }
            }

            // 确保食物不会生成在障碍物上
            if (validPosition) {
                for (const obstacle of obstacles) {
                    if (newFood.x === obstacle.x && newFood.y === obstacle.y) {
                        validPosition = false;
                        break;
                    }
                }
            }
        }

        food = newFood;
    }

    // 生成障碍物
    function generateObstacle() {
        let validPosition = false;
        let newObstacle;

        while (!validPosition) {
            newObstacle = {
                x: Math.floor(Math.random() * gridWidth),
                y: Math.floor(Math.random() * gridHeight)
            };

            validPosition = true;

            // 确保障碍物不会生成在蛇身上
            for (const segment of snake) {
                if (newObstacle.x === segment.x && newObstacle.y === segment.y) {
                    validPosition = false;
                    break;
                }
            }

            // 确保障碍物不会生成在食物上
            if (validPosition && newObstacle.x === food.x && newObstacle.y === food.y) {
                validPosition = false;
            }

            // 确保障碍物不会生成在其他障碍物上
            if (validPosition) {
                for (const obstacle of obstacles) {
                    if (newObstacle.x === obstacle.x && newObstacle.y === obstacle.y) {
                        validPosition = false;
                        break;
                    }
                }
            }
        }

        obstacles.push(newObstacle);
    }

    // 生成初始障碍物
    function generateObstacles() {
        // 根据等级生成障碍物
        const obstacleCount = Math.min(10, level);
        for (let i = 0; i < obstacleCount; i++) {
            generateObstacle();
        }
    }

    // 绘制游戏
    function draw() {
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 绘制网格背景
        ctx.fillStyle = '#ecf0f1';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#bdc3c7';
        ctx.lineWidth = 0.5;

        // 绘制网格线
        for (let x = 0; x <= canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }

        for (let y = 0; y <= canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        // 绘制食物
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(
            food.x * gridSize + gridSize / 2,
            food.y * gridSize + gridSize / 2,
            gridSize / 2 - 2,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // 绘制障碍物
        ctx.fillStyle = '#8e44ad';
        for (const obstacle of obstacles) {
            ctx.fillRect(
                obstacle.x * gridSize,
                obstacle.y * gridSize,
                gridSize,
                gridSize
            );
        }

        // 绘制蛇
        for (let i = 0; i < snake.length; i++) {
            // 蛇头用不同颜色
            if (i === 0) {
                ctx.fillStyle = '#2ecc71';
            } else {
                // 蛇身体渐变色
                const greenValue = Math.floor(46 - (i * 2) % 30);
                ctx.fillStyle = `rgb(46, ${170 + greenValue}, ${113 + greenValue})`;
            }

            ctx.fillRect(
                snake[i].x * gridSize,
                snake[i].y * gridSize,
                gridSize,
                gridSize
            );

            // 给蛇身体添加边框
            ctx.strokeStyle = '#27ae60';
            ctx.lineWidth = 1;
            ctx.strokeRect(
                snake[i].x * gridSize,
                snake[i].y * gridSize,
                gridSize,
                gridSize
            );

            // 给蛇头添加眼睛
            if (i === 0) {
                ctx.fillStyle = '#000';
                const eyeSize = gridSize / 5;
                const eyeOffset = gridSize / 3;

                // 根据方向绘制眼睛
                if (direction === 'right') {
                    ctx.fillRect(snake[i].x * gridSize + gridSize - eyeOffset, snake[i].y * gridSize + eyeOffset, eyeSize, eyeSize);
                    ctx.fillRect(snake[i].x * gridSize + gridSize - eyeOffset, snake[i].y * gridSize + gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
                } else if (direction === 'left') {
                    ctx.fillRect(snake[i].x * gridSize + eyeOffset - eyeSize, snake[i].y * gridSize + eyeOffset, eyeSize, eyeSize);
                    ctx.fillRect(snake[i].x * gridSize + eyeOffset - eyeSize, snake[i].y * gridSize + gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
                } else if (direction === 'up') {
                    ctx.fillRect(snake[i].x * gridSize + eyeOffset, snake[i].y * gridSize + eyeOffset - eyeSize, eyeSize, eyeSize);
                    ctx.fillRect(snake[i].x * gridSize + gridSize - eyeOffset - eyeSize, snake[i].y * gridSize + eyeOffset - eyeSize, eyeSize, eyeSize);
                } else if (direction === 'down') {
                    ctx.fillRect(snake[i].x * gridSize + eyeOffset, snake[i].y * gridSize + gridSize - eyeOffset, eyeSize, eyeSize);
                    ctx.fillRect(snake[i].x * gridSize + gridSize - eyeOffset - eyeSize, snake[i].y * gridSize + gridSize - eyeOffset, eyeSize, eyeSize);
                }
            }
        }
    }

    // 键盘控制
    function handleKeydown(e) {
        // 如果游戏结束或暂停，不处理按键
        if (isGameOver || isWin || isPaused) return;

        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                if (direction !== 'down') {
                    nextDirection = 'up';
                }
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                if (direction !== 'up') {
                    nextDirection = 'down';
                }
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                if (direction !== 'right') {
                    nextDirection = 'left';
                }
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                if (direction !== 'left') {
                    nextDirection = 'right';
                }
                break;
            case ' ':
                togglePause();
                break;
        }
    }

    // 添加触摸控制（适用于移动设备）
    let touchStartX = 0;
    let touchStartY = 0;

    function handleTouchStart(e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        e.preventDefault();
    }

    function handleTouchMove(e) {
        if (isGameOver || isWin || isPaused) return;
        e.preventDefault();

        const touchEndX = e.touches[0].clientX;
        const touchEndY = e.touches[0].clientY;
        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;

        // 确定滑动方向
        if (Math.abs(dx) > Math.abs(dy)) {
            // 水平滑动
            if (dx > 0 && direction !== 'left') {
                nextDirection = 'right';
            } else if (dx < 0 && direction !== 'right') {
                nextDirection = 'left';
            }
        } else {
            // 垂直滑动
            if (dy > 0 && direction !== 'up') {
                nextDirection = 'down';
            } else if (dy < 0 && direction !== 'down') {
                nextDirection = 'up';
            }
        }

        // 更新触摸起始位置
        touchStartX = touchEndX;
        touchStartY = touchEndY;
    }

    // 处理鼠标点击
    function handleMouseClick(e) {
        if (isGameOver || isWin || isPaused) return;

        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // 获取蛇头在画布上的实际像素位置
        const headX = snake[0].x * gridSize + gridSize / 2;
        const headY = snake[0].y * gridSize + gridSize / 2;

        // 计算点击位置相对于蛇头的方向
        const dx = clickX - headX;
        const dy = clickY - headY;

        // 判断主要移动方向（水平或垂直）
        if (Math.abs(dx) > Math.abs(dy)) {
            // 水平移动
            if (dx > 0 && direction !== 'left') {
                nextDirection = 'right';
            } else if (dx < 0 && direction !== 'right') {
                nextDirection = 'left';
            }
        } else {
            // 垂直移动
            if (dy > 0 && direction !== 'up') {
                nextDirection = 'down';
            } else if (dy < 0 && direction !== 'down') {
                nextDirection = 'up';
            }
        }
    }

    // 事件监听
    document.addEventListener('keydown', handleKeydown);
    canvas.addEventListener('touchstart', handleTouchStart, false);
    canvas.addEventListener('touchmove', handleTouchMove, false);
    canvas.addEventListener('click', handleMouseClick, false);
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', togglePause);
    restartBtn.addEventListener('click', restartGame);

    // 初始化游戏
    initGame();
});