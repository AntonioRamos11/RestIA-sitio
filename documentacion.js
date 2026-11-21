// Buscador local de la documentación. Sin peticiones, analítica ni HTML nuevo:
// solo oculta secciones existentes y muestra cuántas coinciden.
(() => {
  "use strict";

  const input = document.querySelector("#buscador-documentacion");
  const conteo = document.querySelector("#conteo-busqueda");
  const vacio = document.querySelector("#sin-resultados");
  const limpiar = document.querySelector("#limpiar-busqueda");
  const secciones = [...document.querySelectorAll("[data-doc-seccion]")];
  if (!input || !secciones.length) return;

  const normalizar = (texto) => (texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim();

  const indice = secciones.map((el) => ({
    el,
    texto: normalizar(el.textContent),
    titulo: normalizar(el.querySelector("h2")?.textContent || ""),
  }));

  function filtrar() {
    const consulta = normalizar(input.value);
    let visibles = 0;
    for (const item of indice) {
      const coincide = !consulta || item.texto.includes(consulta);
      item.el.hidden = !coincide;
      item.el.classList.toggle("resultado-busqueda", Boolean(consulta && coincide && item.titulo.includes(consulta)));
      if (coincide) visibles++;
    }
    if (conteo) {
      conteo.textContent = consulta
        ? `${visibles} de ${secciones.length} temas. Pulsa un resultado del índice o sigue leyendo.`
        : "";
    }
    if (vacio) vacio.hidden = !consulta || visibles > 0;
  }

  input.addEventListener("input", filtrar);
  if (limpiar) {
    limpiar.addEventListener("click", () => {
      input.value = "";
      filtrar();
      input.focus();
    });
  }
  document.querySelectorAll(".indice a[href^='#']").forEach((enlace) => {
    enlace.addEventListener("click", () => {
      const destino = document.querySelector(enlace.getAttribute("href"));
      if (destino && destino.hidden) {
        input.value = "";
        filtrar();
      }
    });
  });
})();
