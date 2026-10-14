/**
 * tutores.js — Sección "Tutores registrados"
 * ---------------------------------------------------------------
 * Consume la API REST falsa (PetHealthAPI.obtenerTutores) y pinta tarjetas en
 * el DOM SIN recargar la página. Maneja tres estados visibles para el usuario:
 *   1. Cargando  -> spinner con role="status".
 *   2. Error     -> mensaje y botón "Reintentar".
 *   3. Éxito     -> tarjetas; el botón "Cargar más" agrega otras sin borrar las anteriores.
 *
 * Seguridad: los datos que llegan de la API se insertan con textContent (nunca
 * con innerHTML), de modo que si traen etiquetas HTML no se ejecutan (evita XSS).
 */
(function () {
  'use strict';

  var POR_PAGINA = 3;   // tarjetas que se traen en cada petición
  var TOTAL_API = 10;   // JSONPlaceholder tiene 10 usuarios en total

  var contenedor = document.getElementById('listaTutores');
  var estado = document.getElementById('estadoTutores');
  var btnMas = document.getElementById('btnMasTutores');
  var btnReiniciar = document.getElementById('btnReiniciarTutores');
  var contador = document.getElementById('contadorTutores');

  if (!contenedor) { return; } // la página no incluye la sección

  var cargados = 0;       // cuántos tutores se han mostrado
  var cargando = false;   // evita peticiones duplicadas por doble clic

  /**
   * Crea un elemento con clase y texto de forma segura.
   * @param {string} etiqueta  Nombre de la etiqueta HTML.
   * @param {string} clase     Clases CSS (puede ir vacío).
   * @param {string} texto     Contenido de texto plano.
   */
  function crear(etiqueta, clase, texto) {
    var el = document.createElement(etiqueta);
    if (clase) { el.className = clase; }
    if (texto !== undefined) { el.textContent = texto; }
    return el;
  }

  /**
   * Construye la tarjeta (article) de un tutor a partir del objeto de la API.
   * @param {{name:string,email:string,phone:string,address:{city:string}}} tutor
   * @returns {HTMLElement}
   */
  function crearTarjeta(tutor) {
    var tarjeta = crear('article', 'tutor-card');

    // Avatar con iniciales (primera letra de las dos primeras palabras del nombre)
    var iniciales = tutor.name.split(' ')
      .filter(function (p) { return /^[A-Za-z]/.test(p) && p.indexOf('.') === -1; })
      .slice(0, 2)
      .map(function (p) { return p.charAt(0).toUpperCase(); })
      .join('');
    var avatar = crear('span', 'tutor-avatar', iniciales);
    avatar.setAttribute('aria-hidden', 'true');

    var cuerpo = crear('div', 'tutor-body');
    cuerpo.appendChild(crear('h3', 'h6 mb-1', tutor.name));
    cuerpo.appendChild(crear('p', 'mb-0 small', tutor.email));
    // El teléfono de la API trae lada y extensión; se muestra tal cual llega.
    cuerpo.appendChild(crear('p', 'mb-0 small', 'Tel. ' + tutor.phone.split(' x')[0]));
    cuerpo.appendChild(crear('p', 'mb-0 small text-muted', tutor.address.city));

    tarjeta.appendChild(avatar);
    tarjeta.appendChild(cuerpo);
    return tarjeta;
  }

  /** Muestra u oculta el bloque de estado (spinner o error). */
  function mostrarEstado(tipo, mensaje) {
    estado.replaceChildren(); // vacía el contenedor
    if (tipo === 'ninguno') { estado.classList.add('d-none'); return; }
    estado.classList.remove('d-none');

    if (tipo === 'cargando') {
      var spinner = crear('span', 'spinner-border spinner-border-sm me-2');
      spinner.setAttribute('aria-hidden', 'true');
      estado.appendChild(spinner);
      estado.appendChild(crear('span', '', mensaje));
      estado.setAttribute('role', 'status');
    } else {
      estado.setAttribute('role', 'alert');
      estado.appendChild(crear('span', 'me-3', mensaje));
      var reintentar = crear('button', 'btn btn-sm btn-outline-danger', 'Reintentar');
      reintentar.type = 'button';
      reintentar.addEventListener('click', cargarSiguiente);
      estado.appendChild(reintentar);
    }
  }

  /** Actualiza el contador y el estado del botón "Cargar más". */
  function actualizarControles() {
    contador.textContent = 'Mostrando ' + cargados + ' de ' + TOTAL_API + ' tutores';
    btnMas.disabled = cargando || cargados >= TOTAL_API;
    btnReiniciar.classList.toggle('d-none', cargados === 0);
  }

  /**
   * Pide la siguiente "página" a la API y agrega las tarjetas al final de la
   * lista. Usa async/await dentro de una función normal para mantener el
   * código legible.
   */
  async function cargarSiguiente() {
    if (cargando) { return; }
    cargando = true;
    btnMas.disabled = true;
    mostrarEstado('cargando', 'Consultando la API…');

    try {
      var tutores = await PetHealthAPI.obtenerTutores(cargados, POR_PAGINA);
      var fragmento = document.createDocumentFragment(); // un solo reflow del DOM
      tutores.forEach(function (t) { fragmento.appendChild(crearTarjeta(t)); });
      contenedor.appendChild(fragmento);
      cargados += tutores.length;
      mostrarEstado('ninguno');
    } catch (error) {
      mostrarEstado('error', 'No se pudieron cargar los tutores. ' + error.message);
    } finally {
      cargando = false;
      actualizarControles();
    }
  }

  /** Elimina todas las tarjetas del DOM y vuelve a empezar desde cero. */
  function reiniciar() {
    contenedor.replaceChildren();
    cargados = 0;
    actualizarControles();
    cargarSiguiente();
  }

  btnMas.addEventListener('click', cargarSiguiente);
  btnReiniciar.addEventListener('click', reiniciar);

  // Carga inicial al abrir la página
  actualizarControles();
  cargarSiguiente();
})();
