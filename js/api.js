/**
 * api.js — Cliente de la API REST falsa de PetHealth
 * ---------------------------------------------------------------
 * Usa JSONPlaceholder (https://jsonplaceholder.typicode.com), una API REST
 * pública de pruebas. No guarda nada de verdad: responde con datos de ejemplo
 * y "simula" la creación de recursos.
 *
 * Endpoints que se consumen:
 *   GET  /users?_start=0&_limit=3   -> lista paginada de tutores (dueños)
 *   POST /posts                     -> simula el registro de una cita
 *
 * Se expone en el espacio de nombres global `PetHealthAPI` para que los demás
 * scripts (pacientes.js, validacion.js) puedan usarlo sin necesitar módulos ES,
 * así el proyecto también funciona abriendo index.html con doble clic.
 */
(function (global) {
  'use strict';

  var API_BASE = 'https://jsonplaceholder.typicode.com';
  var TIMEOUT_MS = 8000; // si el servidor tarda más, se cancela la petición

  /**
   * Función base: hace la petición con fetch, aplica un tiempo máximo de espera
   * y convierte los errores HTTP (404, 500...) en excepciones, porque fetch por
   * sí solo SOLO falla ante errores de red, no ante códigos de estado.
   *
   * @param {string} ruta     Ruta relativa, por ejemplo "/users?_limit=3".
   * @param {object} [opciones] Opciones de fetch (method, body, headers...).
   * @returns {Promise<any>}  JSON de la respuesta.
   */
  function solicitar(ruta, opciones) {
    var controlador = new AbortController();
    var temporizador = setTimeout(function () { controlador.abort(); }, TIMEOUT_MS);

    var config = Object.assign({ signal: controlador.signal }, opciones);

    return fetch(API_BASE + ruta, config)
      .then(function (respuesta) {
        if (!respuesta.ok) {
          throw new Error('El servidor respondió con el código ' + respuesta.status);
        }
        return respuesta.json();
      })
      .catch(function (error) {
        // AbortError = se agotó el tiempo; lo traducimos a un mensaje entendible.
        if (error.name === 'AbortError') {
          throw new Error('El servidor tardó demasiado en responder.');
        }
        if (error instanceof TypeError) {
          throw new Error('No hay conexión con el servidor. Revisa tu internet.');
        }
        throw error;
      })
      .finally(function () { clearTimeout(temporizador); });
  }

  /**
   * GET: obtiene una "página" de tutores registrados.
   * @param {number} inicio  Posición desde la que se empieza a leer.
   * @param {number} limite  Cuántos registros traer.
   * @returns {Promise<Array>} Arreglo de usuarios (name, email, phone, address...).
   */
  function obtenerTutores(inicio, limite) {
    return solicitar('/users?_start=' + inicio + '&_limit=' + limite);
  }

  /**
   * POST: simula el envío de una solicitud de cita.
   * JSONPlaceholder acepta cualquier cuerpo y responde con el mismo objeto
   * más un `id` nuevo (siempre 101), sin guardar nada en el servidor.
   *
   * @param {object} cita  Datos capturados en el formulario.
   * @returns {Promise<object>} Objeto "creado" por la API, con su id.
   */
  function crearCita(cita) {
    return solicitar('/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({
        title: 'Cita para ' + cita.mascota,
        body: cita.motivo,
        userId: 1,
        // Se envían también los datos del formulario para que se vean en la
        // pestaña Network de las herramientas de desarrollador.
        duenio: cita.nombre,
        correo: cita.correo,
        telefono: cita.telefono,
        especie: cita.especie,
        fecha: cita.fecha
      })
    });
  }

  global.PetHealthAPI = {
    obtenerTutores: obtenerTutores,
    crearCita: crearCita
  };
})(window);
