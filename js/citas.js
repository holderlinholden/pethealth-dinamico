/**
 * citas.js — Lista dinámica de solicitudes de cita
 * ---------------------------------------------------------------
 * Manipulación del DOM: agrega un <li> cada vez que el formulario se envía
 * con éxito y permite eliminarlo individualmente o vaciar toda la lista.
 *
 * Se expone `PetHealthCitas.agregar(cita)` para que validacion.js la llame
 * cuando la API responde correctamente.
 *
 * Técnicas usadas:
 *   - createElement / appendChild / remove (sin innerHTML con datos del usuario).
 *   - Delegación de eventos: un solo "click" en la <ul> atiende todos los botones
 *     "Eliminar", incluso los que se crean después.
 *   - Región aria-live para avisar a lectores de pantalla de los cambios.
 */
(function (global) {
  'use strict';

  var lista = document.getElementById('listaCitas');
  var vacio = document.getElementById('citasVacio');
  var contador = document.getElementById('contadorCitas');
  var btnVaciar = document.getElementById('btnVaciarCitas');
  var aviso = document.getElementById('avisoCitas');

  if (!lista) { return; }

  var secuencia = 0; // genera folios locales únicos: PH-0001, PH-0002...

  /** Formatea una fecha ISO (AAAA-MM-DD) como "12 oct 2026" sin errores de zona horaria. */
  function formatearFecha(iso) {
    var partes = iso.split('-');
    var meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return Number(partes[2]) + ' ' + meses[Number(partes[1]) - 1] + ' ' + partes[0];
  }

  /** Muestra/oculta el mensaje de lista vacía, actualiza el contador y el botón "Vaciar". */
  function actualizarVista() {
    var total = lista.children.length;
    vacio.classList.toggle('d-none', total > 0);
    btnVaciar.classList.toggle('d-none', total === 0);
    contador.textContent = total === 1 ? '1 solicitud' : total + ' solicitudes';
  }

  /** Crea un elemento con clase y texto seguro (textContent). */
  function crear(etiqueta, clase, texto) {
    var el = document.createElement(etiqueta);
    if (clase) { el.className = clase; }
    if (texto !== undefined) { el.textContent = texto; }
    return el;
  }

  /**
   * Agrega una solicitud a la lista.
   * @param {{mascota:string,especie:string,fecha:string,nombre:string,apiId:number}} cita
   */
  function agregar(cita) {
    secuencia += 1;
    var folio = 'PH-' + String(secuencia).padStart(4, '0');

    var item = crear('li', 'cita-item');
    item.dataset.folio = folio;

    var info = crear('div', 'cita-info');
    info.appendChild(crear('strong', '', cita.mascota + ' (' + cita.especie + ')'));
    info.appendChild(crear('span', 'small d-block', formatearFecha(cita.fecha) + ' · ' + cita.nombre));
    info.appendChild(crear('span', 'small text-muted d-block', 'Folio ' + folio + ' · id API ' + cita.apiId));

    var btn = crear('button', 'btn btn-sm btn-outline-danger', 'Eliminar');
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Eliminar la solicitud de ' + cita.mascota);
    btn.dataset.accion = 'eliminar';

    item.appendChild(info);
    item.appendChild(btn);
    lista.prepend(item); // la más reciente aparece arriba

    aviso.textContent = 'Solicitud ' + folio + ' agregada a la lista.';
    actualizarVista();
  }

  /** Elimina un <li> de la lista a partir del botón pulsado. */
  function eliminar(item) {
    var folio = item.dataset.folio;
    item.remove();
    aviso.textContent = 'Solicitud ' + folio + ' eliminada.';
    actualizarVista();
  }

  // Delegación de eventos: un único listener para todos los botones "Eliminar"
  lista.addEventListener('click', function (e) {
    var boton = e.target.closest('button[data-accion="eliminar"]');
    if (boton) { eliminar(boton.closest('li')); }
  });

  btnVaciar.addEventListener('click', function () {
    lista.replaceChildren();
    aviso.textContent = 'Se vació la lista de solicitudes.';
    actualizarVista();
  });

  actualizarVista();
  global.PetHealthCitas = { agregar: agregar };
})(window);
