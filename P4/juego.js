// CONFIGURACIÓN DE NIVELES: Velocidad (ms) y patrón (0 = Ron/Larios, 1 = Cola/Limón)
const NIVELES = {
    1: { vel: 700, patron: [0, 0, 0, 0, 1, 1, 1, 1] },
    2: { vel: 500,  patron: [0, 1, 0, 1, 0, 1, 0, 1] },
    3: { vel: 400,  patron: [1, 1, 0, 0, 1, 1, 0, 0] },
    4: { vel: 300,  patron: [1, 0, 1, 1, 0, 1, 0, 0] },
    5: { vel: 200,  patron: [0, 1, 0, 0, 1, 0, 1, 1] }
};

const SETS = {
    "ron-cola": {
        palabras: ["RON", "COLA"],
        fotos: ["url('ron.jpg')", "url('cola.jpg')"]
    },
    "larios-limon": {
        palabras: ["LARIOS", "LIMÓN"],
        fotos: ["url('larios.jpg')", "url('limon.jpg')"]
    }
};

// Variables de estado
let nivelActual = 1;
let segundos = 0;
let idCrono = null;
let idSecuencia = null;
let musica = new Audio('musica.mp3');
musica.loop = true;

// Referencias al DOM
const btnStart = document.getElementById('btn-start');
const btnStop = document.getElementById('btn-stop');
const checkMusica = document.getElementById('check-music');
const pantallaPalabra = document.getElementById('pantalla-palabra');
const displayNivel = document.getElementById('nivel-num');
const displayEstado = document.getElementById('estado-txt');
const displayCrono = document.getElementById('crono');

btnStart.onclick = iniciarPartida;
btnStop.onclick = pararTodo;

function iniciarPartida() {
    // Bloqueamos configuración
    document.getElementById('select-level').disabled = true;
    document.getElementById('select-set').disabled = true;
    btnStart.disabled = true;

    nivelActual = parseInt(document.getElementById('select-level').value);
    segundos = 0;
    displayCrono.innerText = "00:00";

    // Iniciamos cronómetro global
    if (idCrono) clearInterval(idCrono);
    idCrono = setInterval(() => {
        segundos++;
        let m = Math.floor(segundos / 60).toString().padStart(2, '0');
        let s = (segundos % 60).toString().padStart(2, '0');
        displayCrono.innerText = `${m}:${s}`;
    }, 1000);

    jugarNivel();
}

async function jugarNivel() {
    if (nivelActual > 5) {
        pararTodo();
        pantallaPalabra.innerText = "¡FIN DE LA FIESTA!";
        return;
    }

    displayNivel.innerText = nivelActual;
    displayEstado.innerText = "Preparando...";
    pantallaPalabra.innerText = "NIVEL " + nivelActual;

    // Música
    if (checkMusica.checked) {
        musica.play().catch(() => console.log("Falta archivo musica.mp3"));
    }

    // Dibujamos las 8 imágenes en el tablero antes de empezar (modo espera)
    prepararTablero();

    // Pausa de preparación (2 segundos)
    await new Promise(r => setTimeout(r, 2000));

    displayEstado.innerText = "¡DALE!";
    correrSecuencia();
}

function prepararTablero() {
    const datosSet = SETS[document.getElementById('select-set').value];
    const config = NIVELES[nivelActual];

    for (let i = 0; i < 8; i++) {
        const celda = document.getElementById(`c${i}`);
        const tipo = config.patron[i];
        celda.style.backgroundImage = datosSet.fotos[tipo];
        celda.classList.remove('active'); // Todas apagadas al inicio
    }
}

function correrSecuencia() {
    let paso = 0;
    const config = NIVELES[nivelActual];
    const datosSet = SETS[document.getElementById('select-set').value];

    idSecuencia = setInterval(() => {
        // Apagamos la luz de la celda anterior
        limpiarResaltado();

        if (paso < 8) {
            const celdaActual = document.getElementById(`c${paso}`);
            const tipoActual = config.patron[paso];

            // Encendemos la celda actual
            celdaActual.classList.add('active');
            pantallaPalabra.innerText = datosSet.palabras[tipoActual];

            paso++;
        } else {
            // Fin de la ronda
            clearInterval(idSecuencia);
            nivelActual++;
            jugarNivel();
        }
    }, config.vel);
}

function limpiarResaltado() {
    for (let i = 0; i < 8; i++) {
        document.getElementById(`c${i}`).classList.remove('active');
    }
}

function limpiarTodo() {
    limpiarResaltado();
    for (let i = 0; i < 8; i++) {
        document.getElementById(`c${i}`).style.backgroundImage = "";
    }
}

function pararTodo() {
    clearInterval(idCrono);
    clearInterval(idSecuencia);
    musica.pause();
    musica.currentTime = 0;

    btnStart.disabled = false;
    document.getElementById('select-level').disabled = false;
    document.getElementById('select-set').disabled = false;

    limpiarTodo();
    displayEstado.innerText = "Parado";
}