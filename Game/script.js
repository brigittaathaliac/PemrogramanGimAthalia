const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

let player = { x: 400, y: 550, width: 50, height: 50, speed: 5 };
let bullets = [];
let enemies = [];
let particles = [];
let score = 0;
let gameRunning = false;
let keys = {};

// Audio context for sound effects (simple beep)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(frequency, duration) {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + duration);
}

// Particle system for explosions
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.life = 100;
        this.color = color;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 2;
    }
    draw() {
        ctx.globalAlpha = this.life / 100;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, 2, 2);
        ctx.globalAlpha = 1;
    }
}

// Draw player (larger spaceship without any balls)
function drawPlayer() {
    const scale = 2.0; // Faktor perbesar untuk badan pesawat lebih besar
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;
    
    // Efek glow di sekitar pesawat
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 20 * scale;
    
    // Badan utama pesawat (oval, lebih besar)
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 25 * scale);
    gradient.addColorStop(0, '#00d4ff');
    gradient.addColorStop(1, '#0099cc');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 20 * scale, 15 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Sayap kiri (lebih besar)
    ctx.fillStyle = '#66ccff';
    ctx.beginPath();
    ctx.moveTo(centerX - 25 * scale, centerY - 5 * scale);
    ctx.lineTo(centerX - 10 * scale, centerY - 15 * scale);
    ctx.lineTo(centerX - 10 * scale, centerY + 5 * scale);
    ctx.closePath();
    ctx.fill();
    
    // Sayap kanan (lebih besar)
    ctx.beginPath();
    ctx.moveTo(centerX + 25 * scale, centerY - 5 * scale);
    ctx.lineTo(centerX + 10 * scale, centerY - 15 * scale);
    ctx.lineTo(centerX + 10 * scale, centerY + 5 * scale);
    ctx.closePath();
    ctx.fill();
    
    // Ekor pesawat (lebih besar)
    ctx.fillStyle = '#33aaff';
    ctx.beginPath();
    ctx.moveTo(centerX - 15 * scale, centerY + 10 * scale);
    ctx.lineTo(centerX + 15 * scale, centerY + 10 * scale);
    ctx.lineTo(centerX, centerY + 25 * scale);
    ctx.closePath();
    ctx.fill();
    
    // Jendela kokpit (lebih besar)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(centerX, centerY - 5 * scale, 5 * scale, 0, Math.PI * 2);
    ctx.fill();
    
    // Efek cahaya di depan pesawat (lebih besar)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(centerX + 20 * scale, centerY, 3 * scale, 0, Math.PI * 2);
    ctx.fill();
    
    // Reset shadow
    ctx.shadowBlur = 0;
}

// Draw enemies (aliens with animation)
function drawEnemies() {
    enemies.forEach(enemy => {
        const gradient = ctx.createRadialGradient(enemy.x + 25, enemy.y + 25, 0, enemy.x + 25, enemy.y + 25, 25);
        gradient.addColorStop(0, '#ff6b6b');
        gradient.addColorStop(1, '#4ecdc4');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(enemy.x + 25, enemy.y + 25, 25, 0, Math.PI * 2);
        ctx.fill();
        // Simple animation: pulsing
        enemy.radius = 25 + Math.sin(Date.now() * 0.01) * 5;
    });
}

// Draw bullets
function drawBullets() {
    bullets.forEach(bullet => {
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(bullet.x, bullet.y, 5, 10);
    });
}

// Update game logic
function update() {
    if (!gameRunning) return;

    // Player movement
    if (keys.ArrowLeft && player.x > 0) player.x -= player.speed;
    if (keys.ArrowRight && player.x < canvas.width - player.width) player.x += player.speed;
    if (keys.ArrowUp && player.y > 0) player.y -= player.speed;
    if (keys.ArrowDown && player.y < canvas.height - player.height) player.y += player.speed;

    // Bullets
    bullets.forEach((bullet, index) => {
        bullet.y -= 7;
        if (bullet.y < 0) bullets.splice(index, 1);
    });

    // Enemies
    if (Math.random() < 0.02) {
        enemies.push({ x: Math.random() * (canvas.width - 50), y: 0, width: 50, height: 50, speed: 2 });
    }
    enemies.forEach((enemy, index) => {
        enemy.y += enemy.speed;
        if (enemy.y > canvas.height) {
            gameRunning = false;
            alert('Game Over! Skor: ' + score);
            resetGame();
        }
        // Collision with bullets
        bullets.forEach((bullet, bIndex) => {
            if (bullet.x < enemy.x + enemy.width && bullet.x + 5 > enemy.x &&
                bullet.y < enemy.y + enemy.height && bullet.y + 10 > enemy.y) {
                bullets.splice(bIndex, 1);
                enemies.splice(index, 1);
                score += 10;
                scoreElement.textContent = 'Score: ' + score;
                playSound(800, 0.1); // Explosion sound
                // Add particles
                for (let i = 0; i < 20; i++) {
                    particles.push(new Particle(enemy.x + 25, enemy.y + 25, ['#ff6b6b', '#4ecdc4', '#ffff00'][Math.floor(Math.random() * 3)]));
                }
            }
        });
    });

    // Particles
    particles.forEach((particle, index) => {
        particle.update();
        if (particle.life <= 0) particles.splice(index, 1);
    });
}

// Draw everything
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPlayer();
    drawEnemies();
    drawBullets();
    particles.forEach(p => p.draw());
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Reset game
function resetGame() {
    player.x = 400;
    bullets = [];
    enemies = [];
    particles = [];
    score = 0;
    scoreElement.textContent = 'Score: 0';
}

// Event listeners
canvas.addEventListener('click', () => {
    if (!gameRunning) {
        gameRunning = true;
        resetGame();
    }
});

document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space') {
        e.preventDefault();
        bullets.push({ x: player.x + player.width / 2 - 2.5, y: player.y });
        playSound(600, 0.05); // Shoot sound
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Start game loop
gameLoop();
