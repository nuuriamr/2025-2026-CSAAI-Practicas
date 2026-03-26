// --- CONFIGURACIÓN ---
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const puntosTxt = document.getElementById("puntos");
const livesTxt = document.getElementById("vivas-display");
const energyFill = document.getElementById("energy-fill");

// Recursos
const sonidoBala = new Audio("choque.mp3");
const sonidoVictoria = new Audio("victoria.mp3");
const sonidoDerrota = new Audio("Derrota.mp3");
const sonidoExplosion = new Audio("bum.mp3");

const jugadorImg = new Image(); jugadorImg.src = "nave.png";
const enemigoImg = new Image(); enemigoImg.src = "alien.webp";
const balaImg = new Image();    balaImg.src = "balaa.png";
const boomImg = new Image();    boomImg.src = "pum.png";

canvas.width = 1100;
canvas.height = 500;

// --- ESTADO DEL JUEGO ---
let puntuacion = 0;
let vidas = 3;
let juegoActivo = false;
let nivelActual = 1;

// Jugador
let jugadorX = 515;
const jugadorY = canvas.height - 70;
const jugadorAncho = 70;
let teclas = {};

// Energía
let energiaMax = 5;
let energiaActual = 5;
let ultimaRecarga = 0;
const TIEMPO_RECARGA = 500; 

// Flota
const LADRILLO = { F: 3, C: 8, w: 60, h: 40, padding: 20, speedBase: 2 };
let ladrillos = [];
let direccionFlota = 1;
let velocidadFlota = 2;

// Proyectiles
let balasJugador = [];
let balasEnemigas = [];
let ultimoDisparoEnemigo = 0;

// --- FUNCIONES LÓGICAS ---

function inicializarNivel() {
    ladrillos = [];
    for (let f = 0; f < LADRILLO.F; f++) {
        for (let c = 0; c < LADRILLO.C; c++) {
            ladrillos.push({
                x: 100 + c * (LADRILLO.w + LADRILLO.padding),
                y: 50 + f * (LADRILLO.h + LADRILLO.padding),
                visible: true,
                pum: 0
            });
        }
    }
}

function disparar() {
    // Solo si hay energía disponible (1 o más)
    if (energiaActual >= 1) { 
        // CAMBIO: Usar 'balasJugador' en lugar de 'balas'
        // CAMBIO: Usar 'jugadorX' y 'jugadorY'
        balasJugador.push({ 
            x: jugadorX + 20, 
            y: jugadorY - 30, 
            w: 30, 
            h: 30 
        });
        
        energiaActual--; 
        
        // CAMBIO: La función se llama 'actualizarUI' en tu código, no 'actualizarUIEnergia'
        actualizarUI(); 
        
        sonidoBala.currentTime = 0;
        sonidoBala.play();
    } 
}
function gestionarEnergia(timestamp) {
    if (energiaActual < energiaMax) {
        // Si ha pasado el tiempo de recarga (500ms), sumamos 1 de energía
        if (timestamp - ultimaRecarga > TIEMPO_RECARGA) {
            energiaActual++;
            ultimaRecarga = timestamp;
            actualizarUIEnergia();
        }
    } else {
        // Mantiene el contador de tiempo al día si la energía ya está a tope
        ultimaRecarga = timestamp;
    }
}

function actualizarUI() {
    energyFill.style.width = (energiaActual / energiaMax * 100) + "%";
    livesTxt.innerHTML = "LIVES: " + "❤️".repeat(vidas);
    puntosTxt.innerHTML = "SCORE: " + puntuacion;
}

function update(timestamp) {
    if (!juegoActivo) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Recarga de Energía
    if (energiaActual < energiaMax && timestamp - ultimaRecarga > TIEMPO_RECARGA) {
        energiaActual++;
        ultimaRecarga = timestamp;
        actualizarUI();
    }

    // 2. Movimiento Jugador
    if (teclas["ArrowLeft"] && jugadorX > 0) jugadorX -= 7;
    if (teclas["ArrowRight"] && jugadorX < canvas.width - jugadorAncho) jugadorX += 7;
    ctx.drawImage(jugadorImg, jugadorX, jugadorY, jugadorAncho, jugadorAncho);

    // 3. Gestión de Flota (Movimiento y Velocidad)
    let tocarBorde = false;
    let vivos = ladrillos.filter(b => b.visible);
    
    // Aceleración según enemigos restantes
    let ratioVivos = vivos.length / (LADRILLO.F * LADRILLO.C);
    velocidadFlota = (LADRILLO.speedBase + (1 - ratioVivos) * 5);

    vivos.forEach(b => {
        b.x += velocidadFlota * direccionFlota;
        if (b.x + LADRILLO.w > canvas.width || b.x < 0) tocarBorde = true;
        ctx.drawImage(enemigoImg, b.x, b.y, LADRILLO.w, LADRILLO.h);
        if (b.y + LADRILLO.h > jugadorY) finalizarJuego("INVASION COMPLETADA", false);
    });

    if (tocarBorde) {
        direccionFlota *= -1;
        ladrillos.forEach(b => b.y += 15);
    }

    // Dibujar explosiones temporales
    ladrillos.filter(b => b.pum > 0).forEach(b => {
        ctx.drawImage(boomImg, b.x, b.y, LADRILLO.w, LADRILLO.h);
        b.pum--;
    });

    // 4. Balas Jugador
    balasJugador.forEach((bala, index) => {
        bala.y -= 8;
        ctx.drawImage(balaImg, bala.x, bala.y, bala.w, bala.h);
        
        vivos.forEach(b => {
            if (bala.x < b.x + LADRILLO.w && bala.x + bala.w > b.x && bala.y < b.y + LADRILLO.h && bala.y + bala.h > b.y) {
                b.visible = false;
                b.pum = 15;
                balasJugador.splice(index, 1);
                puntuacion += 10;
                sonidoExplosion.play();
                actualizarUI();
            }
        });
        if (bala.y < 0) balasJugador.splice(index, 1);
    });

    // 5. Disparos Enemigos (1 por segundo aprox)
    if (timestamp - ultimoDisparoEnemigo > 1000 && vivos.length > 0) {
        let r = vivos[Math.floor(Math.random() * vivos.length)];
        balasEnemigas.push({ x: r.x + LADRILLO.w/2, y: r.y + LADRILLO.h, w: 5, h: 15 });
        ultimoDisparoEnemigo = timestamp;
    }

    balasEnemigas.forEach((eb, index) => {
        eb.y += 5;
        ctx.fillStyle = "#0f0";
        ctx.fillRect(eb.x, eb.y, eb.w, eb.h);

        if (eb.x > jugadorX && eb.x < jugadorX + jugadorAncho && eb.y > jugadorY && eb.y < jugadorY + jugadorAncho) {
            vidas--;
            balasEnemigas.splice(index, 1);
            actualizarUI();
            if (vidas <= 0) finalizarJuego("ANIQUILADOS", false);
        }
        if (eb.y > canvas.height) balasEnemigas.splice(index, 1);
    });

    if (vivos.length === 0) finalizarJuego("TIERRA A SALVO", true);

    requestAnimationFrame(update);
}

// --- CONTROLES Y EVENTOS ---
// --- CONTROLES DE TECLADO REPARADOS ---
// --- CONTROLES DE TECLADO CORREGIDOS ---
window.addEventListener("keydown", (e) => {
    // Control de movimiento directo
    if (e.code === "ArrowRight") {
        if (jugadorX < canvas.width - jugadorAncho) jugadorX += 25;
    }
    if (e.code === "ArrowLeft") {
        if (jugadorX > 0) jugadorX -= 25;
    }

    // Disparo con Barra Espaciadora
    if (e.code === "Space") {
        e.preventDefault(); // Evita que la página baje
        disparar();
    }
});
function finalizarJuego(msg, victoria) {
    juegoActivo = false;
    document.getElementById("game-over").style.display = "flex";
    document.getElementById("modal-title").textContent = msg;
    victoria ? sonidoVictoria.play() : sonidoDerrota.play();
}

document.getElementById("single-level").onclick = () => {
    document.querySelector(".modos").style.display = "none";
    juegoActivo = true;
    inicializarNivel();
    requestAnimationFrame(update);
};

document.getElementById("restart-button").onclick = () => location.reload();

// Soporte móvil
document.getElementById('btn-left').ontouchstart = () => teclas["ArrowLeft"] = true;
document.getElementById('btn-left').ontouchend = () => teclas["ArrowLeft"] = false;
document.getElementById('btn-right').ontouchstart = () => teclas["ArrowRight"] = true;
document.getElementById('btn-right').ontouchend = () => teclas["ArrowRight"] = false;
document.getElementById('btn-shoot').onclick = () => disparar();