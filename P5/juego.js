const canvas = document.getElementById('field');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const hud = document.getElementById('hud');
const scoreDisplay = document.getElementById('score');
const announcer = document.getElementById('announcer');
const controls = document.getElementById('controls');

canvas.width = 1000;
canvas.height = 600;

// Sonidos
const sounds = {
    goalPlayer: new Audio('gol-2.mp3'),
    goalBot: new Audio('error-fallo 3.mp3'),
    win: new Audio('ganar-tonos.mp3'),
    lose: new Audio('kirby-death.mp3')
};
function playSound(a){ a.currentTime=0; a.play().catch(()=>{}); }

// Estado
let gameRunning = false;
let currentMode = ''; 
let score = { player: 0, bot: 0 };
const keys = {};

const player = { x: 150, y: 300, color: '#21ecf3', speed: 5, angle: 0 };
const bots = [
    { x: 800, y: 200, color: '#f436c5', speed: 3.2 },
    { x: 850, y: 400, color: '#f43678', speed: 2.8 }
];
const ball = { x: 500, y: 300, vx: 0, vy: 0, friction: 0.985};
const goalWidth = 160;
const goalY = (canvas.height - goalWidth) / 2;

// --- SISTEMA DE CONTROLES UNIFICADO ---
function bindButton(id, key) {
    const btn = document.getElementById(id);
    // pointerdown funciona en táctil y ratón
    btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        keys[key] = true;
    });
    btn.addEventListener('pointerup', (e) => {
        e.preventDefault();
        keys[key] = false;
    });
    btn.addEventListener('pointerleave', (e) => {
        keys[key] = false;
    });
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
window.addEventListener('keydown', e => { if(e.code==='Space') shoot(); });

function shoot() {
    if (!gameRunning) return;
    let dx = ball.x - player.x;
    let dy = ball.y - player.y;
    if (Math.sqrt(dx*dx + dy*dy) < 45) {
        ball.vx = Math.cos(player.angle) * 15;
        ball.vy = Math.sin(player.angle) * 15;
    }
}

// --- CORE ---
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

    if (keys['ArrowUp'] && player.y > 25) player.y -= player.speed;
    if (keys['ArrowDown'] && player.y < 575) player.y += player.speed;
    if (keys['ArrowLeft'] && player.x > 25) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x < 975) player.x += player.speed;
    if (keys['KeyA']) player.angle -= 0.07;
    if (keys['KeyD']) player.angle += 0.07;

    bots.forEach(b => {
        let dx = ball.x - b.x, dy = ball.y - b.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > 5) { b.x += (dx/dist)*b.speed; b.y += (dy/dist)*b.speed; }
        handleCollision(b);
    });

    ball.x += ball.vx; ball.y += ball.vy;
    ball.vx *= ball.friction; ball.vy *= ball.friction;

    if (ball.y < 12 || ball.y > 588) ball.vy *= -1;
    if (ball.x < 12) {
        if (ball.y > goalY && ball.y < goalY + goalWidth) checkGoal(false);
        else { ball.x = 12; ball.vx *= -1; }
    }
    if (ball.x > 988) {
        if (ball.y > goalY && ball.y < goalY + goalWidth) checkGoal(true);
        else { ball.x = 988; ball.vx *= -1; }
    }
    handleCollision(player);
}

function handleCollision(p) {
    let dx = ball.x - p.x, dy = ball.y - p.y;
    if (Math.sqrt(dx*dx + dy*dy) < 37) {
        let ang = Math.atan2(dy, dx);
        ball.vx += Math.cos(ang) * 2; ball.vy += Math.sin(ang) * 2;
    }
}

function checkGoal(isP) {
    gameRunning = false;
    isP ? score.player++ : score.bot++;
    announcer.innerText = isP ? "¡GOOOL!" : "¡GOL RIVAL!";
    playSound(isP ? sounds.goalPlayer : sounds.goalBot);
    scoreDisplay.innerText = `${score.player} - ${score.bot}`;
    setTimeout(() => {
        if (!checkWin()) { resetPositions(); gameRunning = true; announcer.innerText = ""; }
    }, 2000);
}

function checkWin() {
    let win = (currentMode==='GOLDEN' && (score.player>0||score.bot>0)) || (score.player>=3||score.bot>=3);
    if (win) {
        let pW = score.player > score.bot;
        document.getElementById('end-message').innerText = pW ? "¡GANASTE!" : "PERDISTE";
        playSound(pW ? sounds.win : sounds.lose);
        overlay.classList.remove('hidden');
        document.getElementById('menu').classList.add('hidden');
        document.getElementById('result-screen').classList.remove('hidden');
        controls.classList.add('hidden');
        return true;
    }
    return false;
}

function draw() {
    ctx.clearRect(0,0,1000,600);
    ctx.strokeStyle="white"; ctx.lineWidth=4; ctx.strokeRect(0,0,1000,600);
    ctx.beginPath(); ctx.moveTo(500,0); ctx.lineTo(500,600); ctx.stroke();
    ctx.fillStyle="#555"; ctx.fillRect(0,goalY,10,goalWidth); ctx.fillRect(990,goalY,10,goalWidth);

    [player, ...bots].forEach(p => {
        ctx.fillStyle="white"; ctx.beginPath(); ctx.arc(p.x,p.y,25,0,7); ctx.fill();
        ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,20,0,7); ctx.fill();
    });

    if (gameRunning) {
        ctx.save(); ctx.translate(player.x,player.y); ctx.rotate(player.angle);
        ctx.fillStyle="yellow"; ctx.beginPath(); ctx.moveTo(35,0); ctx.lineTo(25,-7); ctx.lineTo(25,7); ctx.fill();
        ctx.restore();
    }
    ctx.fillStyle="white"; ctx.beginPath(); ctx.arc(ball.x,ball.y,12,0,7); ctx.fill();
    requestAnimationFrame(draw);
}
function resetToMenu(){ location.reload(); }
setInterval(update, 1000/60);
draw();