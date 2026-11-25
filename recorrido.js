/* Recorrido guiado: pasa las capturas reales de la app paso a paso.
   Si el visitante pide menos movimiento, no se reproduce solo. */
(function () {
  "use strict";
  var datos = document.getElementById("tour-pasos");
  var marco = document.querySelector("[data-tour]");
  if (!datos || !marco) return;

  var pasos;
  try { pasos = JSON.parse(datos.textContent); } catch (e) { return; }
  if (!Array.isArray(pasos) || !pasos.length) return;

  var img = marco.querySelector(".tour-pantalla img");
  var titulo = marco.querySelector(".tour-titulo");
  var texto = marco.querySelector(".tour-texto");
  var contador = marco.querySelector(".tour-contador");
  var barra = marco.querySelector(".barra-progreso i");
  var btnPlay = marco.querySelector("[data-play]");
  var btnAntes = marco.querySelector("[data-antes]");
  var btnDespues = marco.querySelector("[data-despues]");
  var miniaturas = Array.prototype.slice.call(document.querySelectorAll("[data-ir]"));
  var DURACION = 7000;
  var indice = 0;
  var jugando = false;
  var inicio = 0;
  var raf = 0;
  var reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function pintar(i) {
    indice = (i + pasos.length) % pasos.length;
    var paso = pasos[indice];
    img.src = paso.img;
    img.alt = paso.alt || paso.titulo;
    titulo.textContent = paso.titulo;
    texto.textContent = paso.texto;
    contador.textContent = (indice + 1) + " / " + pasos.length;
    img.classList.remove("tour-transicion");
    void img.offsetWidth;
    img.classList.add("tour-transicion");
    miniaturas.forEach(function (b, n) {
      if (n === indice) b.setAttribute("aria-current", "true");
      else b.removeAttribute("aria-current");
    });
    barra.style.width = "0%";
    if (jugando) { inicio = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); }
  }

  function tick(ahora) {
    if (!jugando) return;
    var avance = Math.min(1, (ahora - inicio) / DURACION);
    barra.style.width = (avance * 100).toFixed(1) + "%";
    if (avance >= 1) {
      inicio = ahora;
      pintar(indice + 1);
      return;
    }
    raf = requestAnimationFrame(tick);
  }

  function reproducir() {
    jugando = true;
    btnPlay.textContent = "Pausar";
    btnPlay.setAttribute("aria-pressed", "true");
    inicio = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  }

  function pausar() {
    jugando = false;
    btnPlay.textContent = "Reproducir";
    btnPlay.setAttribute("aria-pressed", "false");
    cancelAnimationFrame(raf);
  }

  btnPlay.addEventListener("click", function () { jugando ? pausar() : reproducir(); });
  btnAntes.addEventListener("click", function () { pausar(); pintar(indice - 1); });
  btnDespues.addEventListener("click", function () { pausar(); pintar(indice + 1); });
  miniaturas.forEach(function (b) {
    b.addEventListener("click", function () { pausar(); pintar(Number(b.dataset.ir)); });
  });

  marco.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { e.preventDefault(); pausar(); pintar(indice + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); pausar(); pintar(indice - 1); }
  });

  marco.addEventListener("mouseenter", function () { if (jugando) pausar(); });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden && jugando) pausar();
  });

  pintar(0);
  if (!reducido) reproducir();
})();