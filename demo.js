/* RestIA · demo interactiva del punto de venta.
   Simulación local con datos de ejemplo: no guarda nada ni habla con la app. */
(() => {
  'use strict';

  const PRODUCTOS = [
    { id: 'cafe', nombre: 'Café americano', precio: 35, cat: 'Bebidas' },
    { id: 'capu', nombre: 'Capuchino', precio: 48, cat: 'Bebidas' },
    { id: 'latte', nombre: 'Latte', precio: 52, cat: 'Bebidas' },
    { id: 'chai', nombre: 'Té chai', precio: 50, cat: 'Bebidas' },
    { id: 'croissant', nombre: 'Croissant', precio: 38, cat: 'Panadería' },
    { id: 'concha', nombre: 'Concha', precio: 22, cat: 'Panadería' },
    { id: 'masa', nombre: 'Pan de masa madre', precio: 45, cat: 'Panadería' },
    { id: 'sandwich', nombre: 'Sándwich de pavo', precio: 78, cat: 'Comida' },
    { id: 'cesar', nombre: 'Ensalada César', precio: 95, cat: 'Comida' },
    { id: 'bowl', nombre: 'Bowl de fruta', precio: 65, cat: 'Comida' },
  ];
  const CATEGORIAS = ['Bebidas', 'Panadería', 'Comida'];
  const NOTAS = ['Sin azúcar', 'Sin crema', 'Para llevar', 'Bien caliente'];
  const MESAS = [
    { id: 'm1', nombre: 'Mesa 1' },
    { id: 'm2', nombre: 'Mesa 2' },
    { id: 'm3', nombre: 'Mesa 3' },
    { id: 'm4', nombre: 'Mesa 4' },
    { id: 'm5', nombre: 'Mesa 5' },
    { id: 'm6', nombre: 'Mesa 6' },
    { id: 'llevar', nombre: 'Para llevar' },
  ];

  const mxn = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
  const dinero = (n) => mxn.format(Math.round(n * 100) / 100);

  const estado = {
    mesas: MESAS.map((m) => ({ ...m, lineas: [], notas: new Set(), pendiente: false })),
    cocina: [],
    ventas: [],
    activa: null,
    categoria: 'Bebidas',
    propina: 0,
    metodo: 'efectivo',
    recibidoTocado: false,
  };

  const $ = (id) => document.getElementById(id);
  const el = {
    mesas: $('demo-mesas'),
    categorias: $('demo-categorias'),
    productos: $('demo-productos'),
    lineas: $('demo-lineas'),
    chips: $('demo-chips'),
    titulo: $('demo-pedido-titulo'),
    total: $('demo-total'),
    totalMini: $('demo-total-mini'),
    enviar: $('demo-enviar'),
    cobrar: $('demo-cobrar'),
    cocina: $('demo-cocina'),
    cocinaCuenta: $('demo-cocina-cuenta'),
    estado: $('demo-estado'),
    reiniciar: $('demo-reiniciar'),
    dialogo: $('demo-cobro'),
    cobroMesa: $('demo-cobro-mesa'),
    cobroCuenta: $('demo-cobro-cuenta'),
    cobroTotal: $('demo-cobro-total'),
    propinas: $('demo-propinas'),
    recibido: $('demo-recibido'),
    efectivoFila: $('demo-efectivo-fila'),
    cambio: $('demo-cambio'),
    error: $('demo-cobro-error'),
    cobroOk: $('demo-cobro-ok'),
    cobroCancelar: $('demo-cobro-cancelar'),
  };

  const mesa = () => estado.mesas.find((m) => m.id === estado.activa) || null;

  const subtotal = () => {
    const m = mesa();
    return m ? m.lineas.reduce((s, l) => s + l.precio * l.cant, 0) : 0;
  };

  function avisar(texto) {
    el.estado.textContent = texto;
  }

  function renderMesas() {
    el.mesas.textContent = '';
    estado.mesas.forEach((m) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'demo-mesa';
      b.dataset.mesa = m.id;
      b.setAttribute('aria-pressed', String(estado.activa === m.id));
      if (m.lineas.length) b.classList.add('demo-mesa-ocupada');
      if (estado.activa === m.id) b.classList.add('demo-mesa-activa');
      const punto = document.createElement('i');
      punto.className = 'demo-punto';
      punto.setAttribute('aria-hidden', 'true');
      const nombre = document.createElement('span');
      nombre.className = 'demo-mesa-nombre';
      nombre.textContent = m.nombre;
      const detalle = document.createElement('small');
      if (m.lineas.length) {
        const n = m.lineas.reduce((s, l) => s + l.cant, 0);
        const importe = m.lineas.reduce((s, l) => s + l.precio * l.cant, 0);
        detalle.textContent = dinero(importe) + ' · ' + n + (n === 1 ? ' artículo' : ' artículos');
      } else {
        detalle.textContent = 'Libre';
      }
      b.append(punto, nombre, detalle);
      el.mesas.append(b);
    });
    const m = mesa();
    el.titulo.textContent = m ? m.nombre : 'Sin mesa';
    $('demo-pista-salon').textContent = m
      ? 'La cuenta abierta está en ' + m.nombre + '.'
      : 'Toca una mesa para abrir su cuenta.';
  }

  function renderCategorias() {
    el.categorias.textContent = '';
    CATEGORIAS.forEach((cat) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'demo-categoria';
      b.dataset.categoria = cat;
      b.setAttribute('aria-pressed', String(estado.categoria === cat));
      b.textContent = cat;
      el.categorias.append(b);
    });
  }

  function renderProductos() {
    el.productos.textContent = '';
    PRODUCTOS.filter((p) => p.cat === estado.categoria).forEach((p) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'demo-producto';
      b.dataset.producto = p.id;
      b.innerHTML = '<span class="demo-prod-nombre">' + p.nombre + '</span>' +
        '<span class="demo-prod-pie"><strong>' + dinero(p.precio) + '</strong><i aria-hidden="true">+</i></span>';
      el.productos.append(b);
    });
  }

  function renderLineas() {
    const m = mesa();
    el.lineas.textContent = '';
    if (!m || !m.lineas.length) {
      const p = document.createElement('p');
      p.className = 'demo-vacio';
      p.textContent = m
        ? 'Toca un producto para agregarlo.'
        : 'Elige una mesa y toca un producto para empezar.';
      el.lineas.append(p);
    } else {
      m.lineas.forEach((l) => {
        const fila = document.createElement('div');
        fila.className = 'demo-linea';
        fila.innerHTML =
          '<div class="demo-linea-nombre"><strong>' + (l.cant > 1 ? l.cant + '× ' : '') + l.nombre +
          '</strong><small>' + dinero(l.precio) + ' c/u</small></div>' +
          '<div class="demo-stepper">' +
          '<button type="button" data-restar="' + l.id + '" aria-label="Quitar uno de ' + l.nombre + '">−</button>' +
          '<span aria-label="Cantidad">' + l.cant + '</span>' +
          '<button type="button" data-sumar="' + l.id + '" aria-label="Agregar uno de ' + l.nombre + '">+</button>' +
          '</div>' +
          '<strong class="demo-linea-importe">' + dinero(l.precio * l.cant) + '</strong>';
        el.lineas.append(fila);
      });
    }
    const total = subtotal();
    el.total.textContent = dinero(total);
    el.totalMini.textContent = dinero(total);
    el.enviar.disabled = !m || !m.lineas.length || !m.pendiente;
    el.cobrar.disabled = !m || !m.lineas.length;
  }

  function renderChips() {
    const m = mesa();
    el.chips.textContent = '';
    NOTAS.forEach((nota) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'demo-chip';
      const activa = !!(m && m.notas.has(nota));
      b.setAttribute('aria-pressed', String(activa));
      b.textContent = nota;
      el.chips.append(b);
    });
  }

  function renderCocina() {
    el.cocina.textContent = '';
    if (!estado.cocina.length) {
      const p = document.createElement('p');
      p.className = 'demo-vacio';
      p.textContent = 'Las comandas que mandes aparecen aquí.';
      el.cocina.append(p);
    } else {
      estado.cocina.forEach((t) => {
        const caja = document.createElement('article');
        caja.className = 'demo-comanda';
        const ul = document.createElement('ul');
        t.items.forEach((i) => {
          const li = document.createElement('li');
          li.textContent = i.cant + '× ' + i.nombre;
          ul.append(li);
        });
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'demo-boton demo-boton-chico';
        b.dataset.listo = t.id;
        b.textContent = 'Listo';
        const h = document.createElement('h3');
        h.textContent = t.mesa + (t.notas.length ? ' · ' + t.notas.join(', ') : '');
        caja.append(h, ul, b);
        el.cocina.append(caja);
      });
    }
    el.cocinaCuenta.textContent = String(estado.cocina.length);
  }

  function renderCorte() {
    const total = estado.ventas.reduce((s, v) => s + v.total, 0);
    const propinas = estado.ventas.reduce((s, v) => s + v.propina, 0);
    const efectivo = estado.ventas.filter((v) => v.metodo === 'efectivo').reduce((s, v) => s + v.total + v.propina, 0);
    const tarjeta = estado.ventas.filter((v) => v.metodo === 'tarjeta').reduce((s, v) => s + v.total + v.propina, 0);
    $('demo-m-ventas').textContent = String(estado.ventas.length);
    $('demo-m-total').textContent = dinero(total);
    $('demo-m-propinas').textContent = dinero(propinas);
    $('demo-m-efectivo').textContent = dinero(efectivo);
    $('demo-m-tarjeta').textContent = dinero(tarjeta);
  }

  function render() {
    renderMesas();
    renderCategorias();
    renderProductos();
    renderLineas();
    renderChips();
    renderCocina();
    renderCorte();
  }

  function abrirMesa(id) {
    estado.activa = id;
    renderMesas();
    renderLineas();
    renderChips();
    avisar((mesa() ? mesa().nombre : 'Mesa') + ' abierta.');
  }

  function agregar(id) {
    const m = mesa();
    if (!m) {
      avisar('Primero elige una mesa o “Para llevar”.');
      return;
    }
    const p = PRODUCTOS.find((x) => x.id === id);
    const linea = m.lineas.find((l) => l.id === id);
    if (linea) linea.cant = Math.min(9, linea.cant + 1);
    else m.lineas.push({ id, nombre: p.nombre, precio: p.precio, cant: 1 });
    m.pendiente = true;
    renderMesas();
    renderLineas();
  }

  function cambiar(id, delta) {
    const m = mesa();
    if (!m) return;
    const i = m.lineas.findIndex((l) => l.id === id);
    if (i < 0) return;
    m.lineas[i].cant += delta;
    if (m.lineas[i].cant > 9) m.lineas[i].cant = 9;
    if (m.lineas[i].cant < 1) m.lineas.splice(i, 1);
    m.pendiente = true;
    renderMesas();
    renderLineas();
  }

  function alternarNota(nota) {
    const m = mesa();
    if (!m) {
      avisar('Primero elige una mesa.');
      return;
    }
    if (m.notas.has(nota)) m.notas.delete(nota);
    else m.notas.add(nota);
    m.pendiente = true;
    renderChips();
  }

  function enviar() {
    const m = mesa();
    if (!m || !m.lineas.length) return;
    estado.cocina.push({
      id: 'c' + Date.now(),
      mesa: m.nombre,
      notas: [...m.notas],
      items: m.lineas.map((l) => ({ nombre: l.nombre, cant: l.cant })),
    });
    m.pendiente = false;
    renderCocina();
    renderLineas();
    avisar('Comanda de ' + m.nombre + ' enviada a cocina.');
  }

  function totalConPropina() {
    const base = subtotal();
    return base + Math.round(base * estado.propina) / 100;
  }

  function pintarCobro() {
    const total = totalConPropina();
    el.cobroCuenta.textContent = dinero(subtotal());
    el.cobroTotal.textContent = dinero(total);
    el.efectivoFila.hidden = estado.metodo !== 'efectivo';
    const recibido = Number(el.recibido.value) || 0;
    const cambio = recibido - total;
    el.cambio.textContent = dinero(Math.max(0, cambio));
    el.cambio.classList.toggle('demo-falta', cambio < 0);
    el.propinas.querySelectorAll('button').forEach((b) => {
      b.setAttribute('aria-pressed', String(Number(b.dataset.propina) === estado.propina));
    });
  }

  function abrirCobro() {
    const m = mesa();
    if (!m || !m.lineas.length) return;
    estado.propina = 0;
    estado.metodo = 'efectivo';
    estado.recibidoTocado = false;
    const total = subtotal();
    el.recibido.value = String(Math.ceil(total * 2) / 2);
    el.dialogo.querySelectorAll('input[name="demo-metodo"]').forEach((r) => {
      r.checked = r.value === 'efectivo';
    });
    el.error.hidden = true;
    el.cobroMesa.textContent = m.nombre;
    el.dialogo.returnValue = '';
    pintarCobro();
    el.dialogo.showModal();
    el.recibido.focus();
    el.recibido.select();
  }

  function confirmarCobro() {
    const m = mesa();
    if (!m || !m.lineas.length) return;
    const total = totalConPropina();
    const recibido = Number(el.recibido.value) || 0;
    if (estado.metodo === 'efectivo' && recibido + 0.001 < total) {
      el.error.textContent = 'El efectivo recibido no alcanza: faltan ' + dinero(total - recibido) + '.';
      el.error.hidden = false;
      el.recibido.focus();
      return;
    }
    const cambio = estado.metodo === 'efectivo' ? recibido - total : 0;
    estado.ventas.push({ total: subtotal(), propina: total - subtotal(), metodo: estado.metodo, cambio });
    const nombre = m.nombre;
    m.lineas = [];
    m.notas.clear();
    m.pendiente = false;
    el.dialogo.close();
    render();
    avisar(nombre + ' cobrada: ' + dinero(total) + ' en ' + estado.metodo + (cambio > 0 ? ' · cambio ' + dinero(cambio) : '') + '.');
  }

  function reiniciar() {
    estado.mesas.forEach((m) => { m.lineas = []; m.notas.clear(); m.pendiente = false; });
    estado.cocina = [];
    estado.ventas = [];
    estado.activa = null;
    estado.propina = 0;
    estado.metodo = 'efectivo';
    estado.recibidoTocado = false;
    render();
    avisar('Demo reiniciada. Elige una mesa para empezar.');
  }

  el.mesas.addEventListener('click', (e) => {
    const b = e.target.closest('[data-mesa]');
    if (b) abrirMesa(b.dataset.mesa);
  });
  el.categorias.addEventListener('click', (e) => {
    const b = e.target.closest('[data-categoria]');
    if (!b) return;
    estado.categoria = b.dataset.categoria;
    renderCategorias();
    renderProductos();
  });
  el.productos.addEventListener('click', (e) => {
    const b = e.target.closest('[data-producto]');
    if (b) agregar(b.dataset.producto);
  });
  el.lineas.addEventListener('click', (e) => {
    const sumar = e.target.closest('[data-sumar]');
    const restar = e.target.closest('[data-restar]');
    if (sumar) cambiar(sumar.dataset.sumar, 1);
    if (restar) cambiar(restar.dataset.restar, -1);
  });
  el.chips.addEventListener('click', (e) => {
    const b = e.target.closest('.demo-chip');
    if (b) alternarNota(b.textContent);
  });
  el.enviar.addEventListener('click', enviar);
  el.cobrar.addEventListener('click', abrirCobro);
  el.cocina.addEventListener('click', (e) => {
    const b = e.target.closest('[data-listo]');
    if (!b) return;
    estado.cocina = estado.cocina.filter((t) => t.id !== b.dataset.listo);
    renderCocina();
    avisar('Comanda marcada como lista.');
  });
  el.propinas.addEventListener('click', (e) => {
    const b = e.target.closest('[data-propina]');
    if (!b) return;
    estado.propina = Number(b.dataset.propina);
    if (!estado.recibidoTocado) el.recibido.value = String(Math.ceil(totalConPropina() * 2) / 2);
    pintarCobro();
  });
  el.dialogo.querySelectorAll('input[name="demo-metodo"]').forEach((r) => {
    r.addEventListener('change', () => {
      estado.metodo = r.value;
      pintarCobro();
    });
  });
  el.recibido.addEventListener('input', () => {
    estado.recibidoTocado = true;
    pintarCobro();
  });
  el.cobroCancelar.addEventListener('click', () => el.dialogo.close());
  el.cobroOk.addEventListener('click', confirmarCobro);
  el.reiniciar.addEventListener('click', reiniciar);
  el.dialogo.addEventListener('click', (e) => {
    if (e.target === el.dialogo) el.dialogo.close();
  });

  render();
})();
