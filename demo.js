/* Demo interactiva de RestIA — simulación local, sin datos reales.
   Imita el armazón de la app: barra de módulos, salón, pedido, cocina y caja. */
(() => {
  'use strict';

  const el = {
    tituloApp: document.getElementById('demo-titulo-app'),
    rail: [...document.querySelectorAll('.demo-destino')],
    paneles: [...document.querySelectorAll('.demo-vista')],
    mesas: document.getElementById('demo-mesas'),
    pistaSalon: document.getElementById('demo-pista-salon'),
    categorias: document.getElementById('demo-categorias'),
    categoriaActual: document.getElementById('demo-categoria-actual'),
    productos: document.getElementById('demo-productos'),
    lineas: document.getElementById('demo-lineas'),
    chips: document.getElementById('demo-chips'),
    total: document.getElementById('demo-total'),
    totalMini: document.getElementById('demo-total-mini'),
    enviar: document.getElementById('demo-enviar'),
    cobrar: document.getElementById('demo-cobrar'),
    reiniciar: document.getElementById('demo-reiniciar'),
    volver: document.getElementById('demo-volver'),
    pedidoTitulo: document.getElementById('demo-pedido-titulo'),
    cocina: document.getElementById('demo-cocina'),
    cocinaCuenta: document.getElementById('demo-cocina-cuenta'),
    cocinaResumen: document.getElementById('demo-cocina-resumen'),
    estado: document.getElementById('demo-estado'),
    m: {
      ventas: document.getElementById('demo-m-ventas'),
      total: document.getElementById('demo-m-total'),
      propinas: document.getElementById('demo-m-propinas'),
      efectivo: document.getElementById('demo-m-efectivo'),
      tarjeta: document.getElementById('demo-m-tarjeta'),
    },
    dialog: document.getElementById('demo-cobro'),
    cobroMesa: document.getElementById('demo-cobro-mesa'),
    cobroCuenta: document.getElementById('demo-cobro-cuenta'),
    cobroTotal: document.getElementById('demo-cobro-total'),
    recibido: document.getElementById('demo-recibido'),
    cambio: document.getElementById('demo-cambio'),
    efectivoFila: document.getElementById('demo-efectivo-fila'),
    propinas: [...document.querySelectorAll('[data-propina]')],
    metodos: [...document.querySelectorAll('input[name="demo-metodo"]')],
    error: document.getElementById('demo-cobro-error'),
    cancelar: document.getElementById('demo-cobro-cancelar'),
    ok: document.getElementById('demo-cobro-ok'),
  };

  const CATEGORIAS = [
    { id: 'bebidas', nombre: 'Bebidas' },
    { id: 'comida', nombre: 'Comida' },
    { id: 'postres', nombre: 'Postres' },
  ];

  const PRODUCTOS = [
    { id: 'cafe', nombre: 'Café americano', precio: 35, categoria: 'bebidas' },
    { id: 'capu', nombre: 'Capuchino', precio: 48, categoria: 'bebidas' },
    { id: 'latte', nombre: 'Latte', precio: 52, categoria: 'bebidas' },
    { id: 'limonada', nombre: 'Limonada', precio: 38, categoria: 'bebidas' },
    { id: 'chilaquiles', nombre: 'Chilaquiles verdes', precio: 95, categoria: 'comida' },
    { id: 'molletes', nombre: 'Molletes', precio: 68, categoria: 'comida' },
    { id: 'sandwich', nombre: 'Sándwich de pollo', precio: 85, categoria: 'comida' },
    { id: 'pastel', nombre: 'Pastel de chocolate', precio: 55, categoria: 'postres' },
    { id: 'flan', nombre: 'Flan napolitano', precio: 45, categoria: 'postres' },
    { id: 'galletas', nombre: 'Galletas de avena', precio: 28, categoria: 'postres' },
  ];

  const NOTAS = ['Sin azúcar', 'Sin crema', 'Para llevar', 'Bien caliente'];

  const estado = {
    vista: 'mesas',
    mesaId: null,
    categoria: 'bebidas',
    propina: 0,
    metodo: 'efectivo',
    recibidoTocado: false,
    mesas: [],
    cocina: [],
    ventas: [],
    folio: 1,
  };

  const dinero = (n) => new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', minimumFractionDigits: 2,
  }).format(n);

  const aviso = (texto) => { el.estado.textContent = texto; };

  function reiniciar() {
    estado.mesas = [
      { id: 'm1', nombre: 'Mesa 1', lineas: [], notas: [], enviado: 0 },
      { id: 'm2', nombre: 'Mesa 2', lineas: [], notas: [], enviado: 0 },
      { id: 'm3', nombre: 'Mesa 3', lineas: [], notas: [], enviado: 0 },
      { id: 'm4', nombre: 'Mesa 4', lineas: [], notas: [], enviado: 0 },
      { id: 'm5', nombre: 'Mesa 5', lineas: [], notas: [], enviado: 0 },
      { id: 'm6', nombre: 'Mesa 6', lineas: [], notas: [], enviado: 0 },
      { id: 'llevar', nombre: 'Para llevar', lineas: [], notas: [], enviado: 0 },
    ];
    estado.cocina = [];
    estado.ventas = [];
    estado.folio = 1;
    estado.mesaId = null;
    estado.categoria = 'bebidas';
    estado.propina = 0;
    estado.metodo = 'efectivo';
    estado.recibidoTocado = false;
    estado.vista = 'mesas';
    render();
    aviso('Demo reiniciada. Elige una mesa para empezar.');
  }

  function mesaActual() {
    return estado.mesas.find((m) => m.id === estado.mesaId) || null;
  }

  function articulos(m) {
    return m.lineas.reduce((s, l) => s + l.cant, 0);
  }

  function subtotal(m) {
    return m.lineas.reduce((s, l) => s + l.precio * l.cant, 0);
  }
  const subtotalActual = () => (mesaActual() ? subtotal(mesaActual()) : 0);

  function totalConPropina() {
    const base = subtotalActual();
    return Math.round((base + base * (estado.propina / 100)) * 100) / 100;
  }

  /* ── Navegación entre vistas ─────────────────────────────────────────── */
  function setVista(vista, mensaje) {
    if (vista === 'pedido' && !mesaActual()) {
      vista = 'mesas';
      mensaje = 'Elige una mesa (o “Para llevar”) para levantar el pedido.';
    }
    estado.vista = vista;
    el.rail.forEach((b) => {
      const activa = b.dataset.vista === vista;
      if (activa) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
    el.paneles.forEach((p) => { p.hidden = p.dataset.panel !== vista; });
    el.tituloApp.textContent = {
      mesas: 'Mesas del Salón',
      pedido: mesaActual() ? 'Pedido · ' + mesaActual().nombre : 'Pedido',
      cocina: 'Cocina',
      caja: 'Caja',
    }[vista];
    if (mensaje) aviso(mensaje);
    if (vista === 'pedido') {
      renderCategorias();
      renderProductos();
      renderLineas();
    }
    if (vista === 'cocina') renderCocina();
    if (vista === 'caja') renderCaja();
  }

  function abrirMesa(id) {
    estado.mesaId = id;
    setVista('pedido');
    aviso(mesaActual().nombre + ' abierta. Toca un producto para agregarlo.');
  }

  /* ── Salón ───────────────────────────────────────────────────────────── */
  function renderMesas() {
    el.mesas.replaceChildren();
    for (const m of estado.mesas) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'demo-mesa';
      b.dataset.mesa = m.id;
      const ocupada = m.lineas.length > 0;
      if (ocupada) b.classList.add('demo-mesa-ocupada');
      if (m.id === estado.mesaId) b.classList.add('demo-mesa-activa');
      b.setAttribute('aria-label', m.nombre + (ocupada ? ': ' + dinero(subtotal(m)) + ', ' + articulos(m) + ' artículos' : ': libre'));
      const punto = document.createElement('i');
      punto.className = 'demo-punto';
      punto.setAttribute('aria-hidden', 'true');
      const nombre = document.createElement('span');
      nombre.className = 'demo-mesa-nombre';
      nombre.textContent = m.nombre;
      const detalle = document.createElement('small');
      detalle.textContent = ocupada
        ? dinero(subtotal(m)) + ' · ' + articulos(m) + (articulos(m) === 1 ? ' artículo' : ' artículos')
        : 'Libre';
      b.append(punto, nombre, detalle);
      b.addEventListener('click', () => abrirMesa(m.id));
      el.mesas.append(b);
    }
  }

  /* ── Pedido ──────────────────────────────────────────────────────────── */
  function renderCategorias() {
    el.categorias.replaceChildren();
    for (const c of CATEGORIAS) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'demo-categoria';
      b.dataset.categoria = c.id;
      b.textContent = c.nombre;
      if (c.id === estado.categoria) b.setAttribute('aria-current', 'true');
      b.addEventListener('click', () => {
        estado.categoria = c.id;
        renderCategorias();
        renderProductos();
      });
      el.categorias.append(b);
    }
    el.categoriaActual.textContent = CATEGORIAS.find((c) => c.id === estado.categoria).nombre;
  }

  function renderProductos() {
    el.productos.replaceChildren();
    for (const p of PRODUCTOS.filter((p) => p.categoria === estado.categoria)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'demo-producto';
      b.dataset.producto = p.id;
      b.innerHTML = '<span class="demo-prod-nombre"></span>' +
        '<span class="demo-prod-pie"><strong>' + dinero(p.precio) + '</strong><i aria-hidden="true">+</i></span>';
      b.querySelector('.demo-prod-nombre').textContent = p.nombre;
      b.setAttribute('aria-label', 'Agregar ' + p.nombre + ', ' + dinero(p.precio));
      b.addEventListener('click', () => agregar(p.id));
      el.productos.append(b);
    }
  }

  function renderLineas() {
    const m = mesaActual();
    el.lineas.replaceChildren();
    if (!m || !m.lineas.length) {
      const p = document.createElement('p');
      p.className = 'demo-vacio';
      p.textContent = 'Toca un producto para agregarlo.';
      el.lineas.append(p);
    } else {
      for (const linea of m.lineas) {
        const fila = document.createElement('div');
        fila.className = 'demo-linea';
        fila.dataset.linea = linea.id;

        const nombre = document.createElement('span');
        nombre.className = 'demo-linea-nombre';
        nombre.textContent = linea.nombre;

        const unitario = document.createElement('small');
        unitario.textContent = dinero(linea.precio) + ' c/u';

        const stepper = document.createElement('div');
        stepper.className = 'demo-stepper';
        const menos = document.createElement('button');
        menos.type = 'button';
        menos.textContent = '−';
        menos.setAttribute('aria-label', 'Quitar uno de ' + linea.nombre);
        menos.dataset.accion = 'menos';
        const cant = document.createElement('span');
        cant.textContent = linea.cant;
        cant.setAttribute('aria-label', linea.cant + ' unidades');
        const mas = document.createElement('button');
        mas.type = 'button';
        mas.textContent = '+';
        mas.setAttribute('aria-label', 'Agregar uno de ' + linea.nombre);
        mas.dataset.accion = 'mas';
        stepper.append(menos, cant, mas);
        stepper.addEventListener('click', (ev) => {
          const b = ev.target.closest('button');
          if (!b) return;
          cambiar(linea.id, b.dataset.accion === 'mas' ? 1 : -1);
        });

        const importe = document.createElement('strong');
        importe.textContent = dinero(linea.precio * linea.cant);

        fila.append(nombre, unitario, stepper, importe);
        el.lineas.append(fila);
      }
    }

    const total = subtotalActual();
    el.total.textContent = dinero(total);
    el.totalMini.textContent = dinero(total);
    el.enviar.disabled = !m || !m.lineas.length || m.enviado === articulos(m);
    el.cobrar.disabled = !m || !m.lineas.length;
    el.pedidoTitulo.textContent = m ? m.nombre : 'Sin mesa';
    renderChips();
  }

  function renderChips() {
    const m = mesaActual();
    el.chips.replaceChildren();
    for (const nota of NOTAS) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'demo-chip';
      b.textContent = nota;
      const activa = !!m && m.notas.includes(nota);
      b.setAttribute('aria-pressed', String(activa));
      b.disabled = !m;
      b.addEventListener('click', () => {
        if (!m) return;
        const i = m.notas.indexOf(nota);
        if (i >= 0) m.notas.splice(i, 1);
        else m.notas.push(nota);
        renderChips();
        aviso(m.notas.length ? 'Notas: ' + m.notas.join(', ') : 'Sin notas en la comanda.');
      });
      el.chips.append(b);
    }
  }

  function agregar(id) {
    const m = mesaActual();
    if (!m) { setVista('mesas', 'Primero elige una mesa.'); return; }
    const p = PRODUCTOS.find((p) => p.id === id);
    const existente = m.lineas.find((l) => l.producto === id);
    if (existente) {
      if (existente.cant >= 9) { aviso('Máximo 9 por producto en esta demo.'); return; }
      existente.cant += 1;
    } else {
      m.lineas.push({ id: 'l' + (++estado.folio), producto: id, nombre: p.nombre, precio: p.precio, cant: 1 });
    }
    renderLineas();
    renderMesas();
    aviso(p.nombre + ' agregado a ' + m.nombre + '.');
  }

  function cambiar(lineaId, delta) {
    const m = mesaActual();
    if (!m) return;
    const linea = m.lineas.find((l) => l.id === lineaId);
    if (!linea) return;
    linea.cant += delta;
    if (linea.cant <= 0) m.lineas = m.lineas.filter((l) => l.id !== lineaId);
    if (!m.lineas.length) m.notas = [];
    if (m.enviado > articulos(m)) m.enviado = 0;
    renderLineas();
    renderMesas();
  }

  function enviar() {
    const m = mesaActual();
    if (!m || !m.lineas.length) return;
    estado.cocina.push({
      id: 'c' + (++estado.folio),
      mesa: m.nombre,
      notas: [...m.notas],
      lineas: m.lineas.map((l) => ({ nombre: l.nombre, cant: l.cant })),
      hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    });
    m.enviado = articulos(m);
    render();
    aviso('Comanda de ' + m.nombre + ' enviada a cocina.');
  }

  /* ── Cocina ──────────────────────────────────────────────────────────── */
  function renderCocina() {
    el.cocina.replaceChildren();
    if (!estado.cocina.length) {
      const p = document.createElement('p');
      p.className = 'demo-vacio';
      p.textContent = 'Las comandas que mandes aparecen aquí.';
      el.cocina.append(p);
    }
    for (const c of estado.cocina) {
      const t = document.createElement('article');
      t.className = 'demo-comanda';
      const cab = document.createElement('header');
      const mesa = document.createElement('strong');
      mesa.textContent = c.mesa;
      const hora = document.createElement('span');
      hora.textContent = c.hora;
      cab.append(mesa, hora);
      const ul = document.createElement('ul');
      for (const l of c.lineas) {
        const li = document.createElement('li');
        li.textContent = l.cant + '× ' + l.nombre;
        ul.append(li);
      }
      t.append(cab);
      if (c.notas.length) {
        const notas = document.createElement('p');
        notas.className = 'demo-comanda-notas';
        notas.textContent = c.notas.join(' · ');
        t.append(notas);
      }
      t.append(ul);
      const listo = document.createElement('button');
      listo.type = 'button';
      listo.className = 'demo-boton demo-boton-chico';
      listo.textContent = 'Listo';
      listo.addEventListener('click', () => {
        estado.cocina = estado.cocina.filter((x) => x.id !== c.id);
        render();
        aviso('Comanda de ' + c.mesa + ' marcada como lista.');
      });
      t.append(listo);
      el.cocina.append(t);
    }
    el.cocinaCuenta.textContent = estado.cocina.length;
    el.cocinaCuenta.dataset.cero = String(estado.cocina.length === 0);
    el.cocinaResumen.textContent = estado.cocina.length === 1 ? '1 pendiente' : estado.cocina.length + ' pendientes';
  }

  /* ── Caja ────────────────────────────────────────────────────────────── */
  function renderCaja() {
    const total = estado.ventas.reduce((s, v) => s + v.total, 0);
    const propinas = estado.ventas.reduce((s, v) => s + v.propina, 0);
    const efectivo = estado.ventas.filter((v) => v.metodo === 'efectivo').reduce((s, v) => s + v.total, 0);
    const tarjeta = estado.ventas.filter((v) => v.metodo === 'tarjeta').reduce((s, v) => s + v.total, 0);
    el.m.ventas.textContent = estado.ventas.length;
    el.m.total.textContent = dinero(total);
    el.m.propinas.textContent = dinero(propinas);
    el.m.efectivo.textContent = dinero(efectivo);
    el.m.tarjeta.textContent = dinero(tarjeta);
  }

  /* ── Cobro ───────────────────────────────────────────────────────────── */
  function pintarCobro() {
    const base = subtotalActual();
    const total = totalConPropina();
    el.cobroCuenta.textContent = dinero(base);
    el.cobroTotal.textContent = dinero(total);
    const recibido = Number(el.recibido.value || 0);
    const esEfectivo = estado.metodo === 'efectivo';
    el.efectivoFila.hidden = !esEfectivo;
    el.cambio.textContent = dinero(Math.max(0, recibido - total));
    el.propinas.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.propina) === estado.propina)));
    el.metodos.forEach((r) => { r.checked = r.value === estado.metodo; });
    el.error.hidden = true;
    el.error.textContent = '';
  }

  function abrirCobro() {
    const m = mesaActual();
    if (!m || !m.lineas.length) return;
    estado.propina = 0;
    estado.metodo = 'efectivo';
    estado.recibidoTocado = false;
    const total = subtotal(m);
    el.cobroMesa.textContent = m.nombre;
    el.recibido.value = String(total);
    pintarCobro();
    el.dialog.showModal();
  }

  function cerrarCobro() {
    el.dialog.close();
  }

  function confirmarCobro() {
    const m = mesaActual();
    if (!m || !m.lineas.length) return;
    const total = totalConPropina();
    if (estado.metodo === 'efectivo' && Number(el.recibido.value || 0) < total) {
      el.error.textContent = 'El efectivo recibido no alcanza. Faltan ' + dinero(total - Number(el.recibido.value || 0)) + '.';
      el.error.hidden = false;
      el.recibido.focus();
      return;
    }
    const cambio = estado.metodo === 'efectivo' ? Math.round((Number(el.recibido.value) - total) * 100) / 100 : 0;
    const propina = Math.round(subtotal(m) * (estado.propina / 100) * 100) / 100;
    estado.ventas.push({ total, propina, metodo: estado.metodo });
    const nombre = m.nombre;
    m.lineas = [];
    m.notas = [];
    m.enviado = 0;
    estado.mesaId = null;
    cerrarCobro();
    setVista('mesas');
    renderMesas();
    aviso(nombre + ' cobrada: ' + dinero(total) + ' en ' + (estado.metodo === 'efectivo' ? 'efectivo · cambio ' + dinero(cambio) : 'tarjeta') + '.');
  }

  function render() {
    renderMesas();
    renderCategorias();
    renderProductos();
    renderLineas();
    renderCocina();
    renderCaja();
    setVista(estado.vista);
  }

  /* ── Eventos ─────────────────────────────────────────────────────────── */
  el.rail.forEach((b) => b.addEventListener('click', () => setVista(b.dataset.vista)));
  el.volver.addEventListener('click', () => setVista('mesas', 'Elige otra mesa o vuelve a la que dejaste abierta.'));
  el.enviar.addEventListener('click', enviar);
  el.cobrar.addEventListener('click', abrirCobro);
  el.reiniciar.addEventListener('click', reiniciar);
  el.cancelar.addEventListener('click', cerrarCobro);
  el.ok.addEventListener('click', confirmarCobro);
  el.dialog.addEventListener('cancel', () => { el.error.hidden = true; });
  document.getElementById('demo-cobro-form').addEventListener('submit', (ev) => ev.preventDefault());
  el.recibido.addEventListener('input', () => {
    estado.recibidoTocado = true;
    pintarCobro();
  });
  el.propinas.forEach((b) => b.addEventListener('click', () => {
    estado.propina = Number(b.dataset.propina);
    if (!estado.recibidoTocado) el.recibido.value = String(Math.ceil(totalConPropina() * 2) / 2);
    pintarCobro();
  }));
  el.metodos.forEach((r) => r.addEventListener('change', () => {
    if (!r.checked) return;
    estado.metodo = r.value;
    if (r.value === 'tarjeta') {
      el.recibido.value = String(totalConPropina());
      estado.recibidoTocado = false;
    }
    pintarCobro();
  }));

  reiniciar();
})();
