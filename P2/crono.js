// VARIABLES GLOBALES
let claveSecreta = [];
let intentos = 7;
let partidaActiva = true;
let segundos = 0;
let intervalo;

// 1. AL CARGAR: Arrancamos el juego
window.onload = function() {
    crearTeclado();
    resetJuego();
};

// 2. GENERAR TECLADO (0-9)
function crearTeclado() {
    const contenedor = document.getElementById('teclado');
    const numeros = [7, 8, 9, 4, 5, 6, 1, 2, 3, 0] ;
    
    numeros.forEach(n => {
        let btn = document.createElement('button');
        btn.innerText = n;
        btn.id = "btn-" + n;
        btn.onclick = () => pulsarNumero(n);
        contenedor.appendChild(btn);
    });
}

// 3. LOGICA AL PULSAR UN NÚMERO
function pulsarNumero(num) {
    if (!partidaActiva) return;

    // Si es el primer toque, arranca el crono
    if (segundos === 0) iniciarCrono();

    // Desactivar botón
    document.getElementById("btn-" + num).disabled = true;

    // Comprobar si está en la clave
    let acierto = false;
    for (let i = 0; i < 4; i++) {
        if (claveSecreta[i] === num) {
            let hueco = document.getElementById("pos" + i);
            hueco.innerText = num;
            hueco.classList.add("acierto");
            acierto = true;
        }
    }

    // Gastar intento
    intentos--;
    document.getElementById("intentos-txt").innerText = intentos;

    comprobarFinal();
}

// 4. COMPROBAR SI GANA O PIERDE
function comprobarFinal() {
    // ¿Ha adivinado todo?
    let descubiertos = 0;
    for (let i = 0; i < 4; i++) {
        if (document.getElementById("pos" + i).innerText !== "*") descubiertos++;
    }

    if (descubiertos === 4) {
        pararCrono();
        partidaActiva = false;
        document.getElementById("mensaje").innerText = "¡VICTORIA! Tiempo: " + document.getElementById("crono").innerText;
    } 
    else if (intentos <= 0) {
        pararCrono();
        partidaActiva = false;
        document.getElementById("mensaje").innerText = "Perdiste pulsa RESET para volver a jugar. La clave era " + claveSecreta.join("");
    }
}

// 5. FUNCIONES DE APOYO
function resetJuego() {
    pararCrono();
    segundos = 0;
    intentos = 7;
    partidaActiva = true;
    document.getElementById("crono").innerText = "0:00:00";
    document.getElementById("intentos-txt").innerText = intentos;
    document.getElementById("mensaje").innerText = "Nueva partida lista.";
    
    // Generar 4 números distintos
    claveSecreta = [];
    while(claveSecreta.length < 4) {
        let n = Math.floor(Math.random() * 10);
        if(!claveSecreta.includes(n)) claveSecreta.push(n);
    }

    // Resetear visualmente
    for(let i=0; i<4; i++) {
        let h = document.getElementById("pos"+i);
        h.innerText = "*";
        h.classList.remove("acierto");
    }
    
    // Habilitar botones de nuevo
    for(let i=0; i<=9; i++) {
        let b = document.getElementById("btn-"+i);
        if(b) b.disabled = false;
    }
}

function iniciarCrono() {
    if (intervalo) return;
    intervalo = setInterval(() => {
        segundos++;
        let m = Math.floor(segundos / 60);
        let s = segundos % 60;
        document.getElementById("crono").innerText = `0:${m}:${s < 10 ? '0'+s : s}`;
    }, 1000);
}

function pararCrono() {
    clearInterval(intervalo);
    intervalo = null;
}