const canvas = document.getElementById('field');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const hud = document.getElementById('hud');
const scoreDisplay = document.getElementById('score');
const announcer = document.getElementById('announcer');
const controls = document.getElementById('controls');

canvas.width = 1000;
canvas.height = 600;

// --- SONIDOS ---
const sounds = {
    goalPlayer: new Audio('gol-2.mp3'),
    goalBot: new Audio('error-fallo 3.mp3'),
    win: new Audio('ganar-tonos.mp3'),
    lose: new Audio('kirby-death.mp3')
};

function playSound(a) { 
    a.currentTime = 0; 
    a.play().catch(() => {}); 
}

// --- ESTADO DEL JUEGO ---
let gameRunning = false;
let currentMode = ''; 
let score = { player: 0, bot: 0 };
const keys = {};

const player = { x: 150, y: 300, color: '#21ecf3', speed: 5, angle: 0 };
const bots = [
    { x: 800, y: 200, color: '#f436c5', speed: 3.2 },
    { x: 850, y: 400, color: '#f43678', speed: 2.8 }
];
const ball = { x: 500, y: 300, vx: 0, vy: 0, friction: 0.985 };
const goalWidth = 160;
const goalY = (canvas.height - goalWidth) / 2;

// --- CONTROLES ---
function bindButton(id, key) {
    const btn = document.getElementById(id);
    if(!btn) return;
    btn.addEventListener('pointerdown', (e) => { e.preventDefault(); keys[key] = true; });
    btn.addEventListener('pointerup', (e) => { e.preventDefault(); keys[key] = false; });
    btn.addEventListener('pointerleave', (e) => { keys[key] = false; });
}

bindButton('btn-up', 'ArrowUp');
bindButton('btn-down', 'ArrowDown');
bindButton('btn-left', 'ArrowLeft');
bindButton('btn-right', 'ArrowRight');
bindButton('btn-rot-l', 'KeyA');
bindButton('btn-rot-r', 'KeyD');

document.getElementById('btn-shoot').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    shoot();
});

window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);
window.addEventListener('keydown', e => { if(e.code === 'Space') shoot(); });

function shoot() {
    if (!gameRunning) return;
    let dx = ball.x - player.x;
    let dy = ball.y - player.y;
    let dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < 50) { // Rango de disparo ligeramente aumentado para mejor sensación
        ball.vx = Math.cos(player.angle) * 18;
        ball.vy = Math.sin(player.angle) * 18;
    }
}

// --- LÓGICA DE JUEGO ---
function initGame(mode) {
    currentMode = mode;
    score = { player: 0, bot: 0 };
    scoreDisplay.innerText = "0 - 0";
    resetPositions();
    overlay.classList.add('hidden');
    hud.classList.remove('hidden');
    controls.classList.remove('hidden');
    gameRunning = true;
}

function resetPositions() {
    player.x = 150; player.y = canvas.height/2; player.angle = 0;
    bots[0].x = 800; bots[0].y = canvas.height/2 - 100;
    bots[1].x = 850; bots[1].y = canvas.height/2 + 100;
    ball.x = canvas.width/2; ball.y = canvas.height/2;
    ball.vx = 0; ball.vy = 0;
}

function update() {
    if (!gameRunning) return;

    // Movimiento Jugador
    if (keys['ArrowUp'] && player.y > 25) player.y -= player.speed;
    if (keys['ArrowDown'] && player.y < 575) player.y += player.speed;
    if (keys['ArrowLeft'] && player.x > 25) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x < 975) player.x += player.speed;
    if (keys['KeyA']) player.angle -= 0.07;
    if (keys['KeyD']) player.angle += 0.07;

    // Movimiento Bots
    bots.forEach(b => {
        let dx = ball.x - b.x, dy = ball.y - b.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > 5) { 
            b.x += (dx/dist) * b.speed; 
            b.y += (dy/dist) * b.speed; 
        }
        handleCollision(b);
    });

    // Física del Balón
    ball.x += ball.vx; 
    ball.y += ball.vy;
    ball.vx *= ball.friction; 
    ball.vy *= ball.friction;

    // Límites de velocidad para evitar que "desaparezca"
    const maxSpeed = 20;
    ball.vx = Math.min(Math.max(ball.vx, -maxSpeed), maxSpeed);
    ball.vy = Math.min(Math.max(ball.vy, -maxSpeed), maxSpeed);

    // Rebotes Paredes
    if (ball.y < 12 || ball.y > 588) {
        ball.vy *= -1;
        ball.y = ball.y < 12 ? 12 : 588;
    }

    // Portería Izquierda (Bot marca)
    if (ball.x < 12) {
        if (ball.y > goalY && ball.y < goalY + goalWidth) {
            checkGoal(false);
        } else {
            ball.x = 12; 
            ball.vx *= -1;
        }
    }
    // Portería Derecha (Jugador marca)
    if (ball.x > 988) {
        if (ball.y > goalY && ball.y < goalY + goalWidth) {
            checkGoal(true);
        } else {
            ball.x = 988; 
            ball.vx *= -1;
        }
    }

    handleCollision(player);
}

function handleCollision(p) {
    let dx = ball.x - p.x;
    let dy = ball.y - p.y;
    let dist = Math.sqrt(dx*dx + dy*dy);
    
    if (dist < 37 && dist > 0) { 
        let ang = Math.atan2(dy, dx);
        // Reposicionar balón fuera del radio para evitar atascos
        ball.x = p.x + Math.cos(ang) * 38;
        ball.y = p.y + Math.sin(ang) * 38;
        
        // Transferir fuerza
        ball.vx += Math.cos(ang) * 2.5; 
        ball.vy += Math.sin(ang) * 2.5;
    }
}

function checkGoal(isP) {
    gameRunning = false;
    isP ? score.player++ : score.bot++;
    announcer.innerText = isP ? "¡GOOOL!" : "¡GOL RIVAL!";
    playSound(isP ? sounds.goalPlayer : sounds.goalBot);
    scoreDisplay.innerText = `${score.player} - ${score.bot}`;
    
    setTimeout(() => {
        if (!checkWin()) { 
            resetPositions(); 
            gameRunning = true; 
            announcer.innerText = ""; 
        }
    }, 2000);
}

function checkWin() {
    let win = (currentMode === 'GOLDEN' && (score.player > 0 || score.bot > 0)) || (score.player >= 3 || score.bot >= 3);
    if (win) {
        let pW = score.player > score.bot;
        document.getElementById('end-message').innerText = pW ? "¡GANASTE EL PARTIDO!" : "PERDISTE EL PARTIDO";
        playSound(pW ? sounds.win : sounds.lose);
        overlay.classList.remove('hidden');
        document.getElementById('menu').classList.add('hidden');
        document.getElementById('result-screen').classList.remove('hidden');
        controls.classList.add('hidden');
        return true;
    }
    return false;
}

// --- RENDERIZADO ---
function draw() {
    // Fondo y campo
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "white"; 
    ctx.lineWidth = 4; 
    ctx.strokeRect(0, 0, 1000, 600);
    
    // Línea de medio campo
    ctx.beginPath(); 
    ctx.moveTo(500, 0); 
    ctx.lineTo(500, 600); 
    ctx.stroke();

    // Porterías
    ctx.fillStyle = "rgba(85, 85, 85, 0.8)"; 
    ctx.fillRect(0, goalY, 10, goalWidth); 
    ctx.fillRect(990, goalY, 10, goalWidth);

    // Dibujar Jugador y Bots
    [player, ...bots].forEach(p => {
        if (!isNaN(p.x)) {
            ctx.fillStyle = "white"; 
            ctx.beginPath(); 
            ctx.arc(p.x, p.y, 25, 0, Math.PI * 2); 
            ctx.fill();
            
            ctx.fillStyle = p.color; 
            ctx.beginPath(); 
            ctx.arc(p.x, p.y, 20, 0, Math.PI * 2); 
            ctx.fill();
        }
    });

    // Indicador de dirección (Triángulo amarillo)
    if (gameRunning) {
        ctx.save(); 
        ctx.translate(player.x, player.y); 
        ctx.rotate(player.angle);
        ctx.fillStyle = "yellow"; 
        ctx.beginPath(); 
        ctx.moveTo(35, 0); 
        ctx.lineTo(25, -7); 
        ctx.lineTo(25, 7); 
        ctx.fill();
        ctx.restore();
    }

    // Dibujar Balón
    if (!isNaN(ball.x)) {
        ctx.fillStyle = "#333"; // Sombra balón
        ctx.beginPath(); ctx.arc(ball.x+2, ball.y+2, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "white"; 
        ctx.beginPath(); 
        ctx.arc(ball.x, ball.y, 12, 0, Math.PI * 2); 
        ctx.fill();
    }

    requestAnimationFrame(draw);
}

function resetToMenu() { 
    location.reload(); 
}

// Ejecutar bucles
setInterval(update, 1000/60);
draw();