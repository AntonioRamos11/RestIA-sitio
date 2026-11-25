/* Visor de capturas: amplía cualquier figura marcada con data-zoom.
   Sin dependencias, sin peticiones: solo transforma el DOM local. */
(function () {
  "use strict";
  var figuras = Array.prototype.slice.call(document.querySelectorAll("[data-zoom]"));
  if (!figuras.length) return;

  var visor = document.createElement("div");
  visor.className = "visor";
  visor.id = "visor";
  visor.hidden = true;
  visor.setAttribute("role", "dialog");
  visor.setAttribute("aria-modal", "true");
  visor.setAttribute("aria-label", "Captura ampliada");
  visor.innerHTML =
    '<div class="visor-cabecera"><span class="visor-cuenta"></span>' +
      '<button type="button" class="visor-cerrar">Cerrar (Esc)</button></div>' +
    '<figure class="visor-figura"><img alt=""><figcaption class="visor-pie"></figcaption></figure>' +
    '<div class="visor-nav"><button type="button" data-dir="-1">Anterior</button>' +
      '<button type="button" data-dir="1">Siguiente</button></div>';
document.body.appendChild(visor);

  var img = visor.querySelector(".visor-figura img");
  var pie = visor.querySelector(".visor-pie");
  var cuenta = visor.querySelector(".visor-cuenta");
  var btnCerrar = visor.querySelector(".visor-cerrar");
  var actual = 0;
  var disparador = null;

  function texto(fig) {
    var cap = fig.querySelector("figcaption");
    if (cap && cap.textContent.trim()) return cap.textContent.trim();
    var im = fig.querySelector("img");
    return im ? (im.alt || "") : "";
  }

  function abrir(i, origen) {
    actual = (i + figuras.length) % figuras.length;
    var fig = figuras[actual];
    var media = fig.querySelector("img");
    if (!media) return;
    img.src = media.currentSrc || media.src;
    img.alt = media.alt || "";
    pie.textContent = texto(fig);
    pie.hidden = !pie.textContent;
    cuenta.textContent = "Captura " + (actual + 1) + " de " + figuras.length;
    visor.hidden = false;
    document.documentElement.style.overflow = "hidden";
    disparador = origen || document.activeElement;
    btnCerrar.focus();
  }

  function cerrar() {
    visor.hidden = true;
    document.documentElement.style.overflow = "";
    if (disparador && disparador.focus) disparador.focus();
  }

  figuras.forEach(function (fig, i) {
    var media = fig.querySelector("picture, img");
    if (!media || fig.querySelector(":scope > button")) return;
    var boton = document.createElement("button");
    boton.type = "button";
    var etiqueta = texto(fig) || "captura de la app";
    boton.setAttribute("aria-label", "Ampliar: " + etiqueta);
    media.parentNode.insertBefore(boton, media);
    boton.appendChild(media);
    var lupa = document.createElement("span");
    lupa.className = "lupa";
    lupa.textContent = "Ampliar";
    boton.appendChild(lupa);
    boton.addEventListener("click", function () { abrir(i, boton); });
  });

  btnCerrar.addEventListener("click", cerrar);
  visor.addEventListener("click", function (e) {
    if (e.target === visor) cerrar();
  });
  visor.querySelectorAll("[data-dir]").forEach(function (b) {
    b.addEventListener("click", function () { abrir(actual + Number(b.dataset.dir)); });
  });

  document.addEventListener("keydown", function (e) {
    if (visor.hidden) return;
    if (e.key === "Escape") { e.preventDefault(); cerrar(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); abrir(actual + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); abrir(actual - 1); }
    else if (e.key === "Tab") {
      var foco = visor.querySelectorAll("button");
      var primero = foco[0], ultimo = foco[foco.length - 1];
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    }
  });
})();