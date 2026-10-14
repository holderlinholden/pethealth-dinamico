/**
 * validacion.js — Validación en tiempo real del formulario de citas
 * ---------------------------------------------------------------
 * Qué hace:
 *   1. Valida cada campo MIENTRAS el usuario escribe (evento "input") y al salir
 *      del campo (evento "blur"), mostrando un mensaje específico del error.
 *   2. Para nombre, correo y teléfono usa reglas propias (más precisas que las
 *      nativas de HTML5); para el resto aplica reglas simples equivalentes.
 *   3. Al enviar, valida todo; si hay errores enfoca el primero. Si todo está
 *      bien, manda la cita a la API falsa con fetch (POST) y agrega la
 *      solicitud a la lista del DOM (PetHealthCitas.agregar).
 *
 * Cada regla es una función que recibe el campo y devuelve un texto con el
 * error, o una cadena vacía ('') si el valor es correcto.
 */
(function () {
  'use strict';

  var form = document.getElementById('formCita');
  var fecha = document.getElementById('fecha');
  var exito = document.getElementById('exito');
  var errorEnvio = document.getElementById('errorEnvio');
  var btnEnviar = document.getElementById('btnEnviar');
  var ayudaTelefono = document.getElementById('telefonoAyuda');

  // La fecha mínima de la cita es hoy (hora local, no UTC)
  var hoy = new Date();
  hoy.setMinutes(hoy.getMinutes() - hoy.getTimezoneOffset());
  fecha.min = hoy.toISOString().slice(0, 10);

  /* ------------------------------------------------------------------
   * REGLAS DE VALIDACIÓN
   * ------------------------------------------------------------------ */

  /** Solo letras (con acentos y ñ), espacios, apóstrofo, punto y guion. */
  var PATRON_NOMBRE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ'.\- ]+$/;
  /** Estructura básica usuario@dominio.ext sin espacios. */
  var PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  /** Nombre completo: obligatorio, ≥ 5 caracteres, solo letras, nombre y apellido. */
  function validarNombre(campo) {
    var v = campo.value.trim();
    if (v === '') { return 'El nombre es obligatorio.'; }
    if (!PATRON_NOMBRE.test(v)) { return 'Usa solo letras y espacios, sin números ni símbolos.'; }
    if (v.length < 5) { return 'Escribe tu nombre completo (mínimo 5 caracteres).'; }
    if (v.split(/\s+/).length < 2) { return 'Agrega al menos tu nombre y un apellido.'; }
    return '';
  }

  /** Correo: obligatorio y con formato usuario@dominio.ext. */
  function validarCorreo(campo) {
    var v = campo.value.trim();
    if (v === '') { return 'El correo es obligatorio.'; }
    if (v.indexOf('@') === -1) { return 'Falta el símbolo @ en el correo.'; }
    if (!PATRON_CORREO.test(v)) { return 'Ingresa un correo válido, por ejemplo nombre@dominio.com.'; }
    return '';
  }

  /** Teléfono: obligatorio, exactamente 10 dígitos (los no numéricos ya se filtran al escribir). */
  function validarTelefono(campo) {
    var v = campo.value;
    if (v === '') { return 'El teléfono es obligatorio.'; }
    if (v.length < 10) {
      var faltan = 10 - v.length;
      return 'Faltan ' + faltan + (faltan === 1 ? ' dígito' : ' dígitos') + ' (deben ser 10).';
    }
    return '';
  }

  /** Nombre de la mascota: obligatorio, mínimo 2 caracteres. */
  function validarMascota(campo) {
    var v = campo.value.trim();
    if (v === '') { return 'Escribe el nombre de tu mascota.'; }
    if (v.length < 2) { return 'El nombre debe tener al menos 2 caracteres.'; }
    return '';
  }

  /** Especie: debe elegirse una opción distinta de la deshabilitada. */
  function validarEspecie(campo) {
    return campo.value === '' ? 'Selecciona la especie.' : '';
  }

  /** Fecha: obligatoria y de hoy en adelante. */
  function validarFecha(campo) {
    if (campo.value === '') { return 'Elige la fecha de la cita.'; }
    if (campo.value < campo.min) { return 'Elige una fecha de hoy en adelante.'; }
    return '';
  }

  /** Motivo: al menos 10 caracteres (sin contar espacios en los extremos). */
  function validarMotivo(campo) {
    return campo.value.trim().length < 10 ? 'Cuéntanos el motivo en al menos 10 caracteres.' : '';
  }

  /** Aviso de privacidad: debe estar marcado. */
  function validarPrivacidad(campo) {
    return campo.checked ? '' : 'Debes aceptar el aviso para continuar.';
  }

  // Relaciona el id de cada campo con su regla
  var reglas = {
    nombre: validarNombre,
    correo: validarCorreo,
    telefono: validarTelefono,
    mascota: validarMascota,
    especie: validarEspecie,
    fecha: validarFecha,
    motivo: validarMotivo,
    privacidad: validarPrivacidad
  };

  /* ------------------------------------------------------------------
   * MOSTRAR RESULTADOS EN LA INTERFAZ
   * ------------------------------------------------------------------ */

  /**
   * Valida UN campo y actualiza su aspecto (verde/rojo) y su mensaje.
   * setCustomValidity mantiene sincronizada la API nativa de validación
   * (checkValidity) con nuestras reglas personalizadas.
   *
   * @param {HTMLElement} campo  Input, select o textarea del formulario.
   * @returns {boolean} true si el campo es válido.
   */
  function validarCampo(campo) {
    var mensaje = reglas[campo.id](campo);
    campo.setCustomValidity(mensaje);

    var feedback = campo.parentElement.querySelector('.invalid-feedback');
    if (feedback && mensaje) { feedback.textContent = mensaje; }

    campo.classList.toggle('is-invalid', mensaje !== '');
    campo.classList.toggle('is-valid', mensaje === '');
    campo.setAttribute('aria-invalid', mensaje !== '' ? 'true' : 'false');
    return mensaje === '';
  }

  /** Muestra "n/10 dígitos" debajo del campo de teléfono. */
  function actualizarContadorTelefono() {
    var n = document.getElementById('telefono').value.length;
    ayudaTelefono.textContent = n + '/10 dígitos';
  }

  /** Valida todos los campos; devuelve el primero inválido (o null si todo está bien). */
  function validarTodo() {
    var primeroInvalido = null;
    Object.keys(reglas).forEach(function (id) {
      var campo = document.getElementById(id);
      if (!validarCampo(campo) && !primeroInvalido) { primeroInvalido = campo; }
    });
    return primeroInvalido;
  }

  /* ------------------------------------------------------------------
   * EVENTOS EN TIEMPO REAL
   * ------------------------------------------------------------------ */

  Object.keys(reglas).forEach(function (id) {
    var campo = document.getElementById(id);
    var evento = (campo.type === 'checkbox' || campo.tagName === 'SELECT' || campo.type === 'date')
      ? 'change' : 'input';

    // Mientras escribe (o al cambiar la opción)
    campo.addEventListener(evento, function () {
      if (id === 'telefono') {
        // Filtra al instante: quita todo lo que no sea dígito y limita a 10
        campo.value = campo.value.replace(/\D/g, '').slice(0, 10);
        actualizarContadorTelefono();
      }
      validarCampo(campo);
    });

    // Al salir del campo (también marca los campos que se dejaron vacíos)
    campo.addEventListener('blur', function () { validarCampo(campo); });
  });

  /* ------------------------------------------------------------------
   * ENVÍO CON FETCH
   * ------------------------------------------------------------------ */

  /** Activa/desactiva el estado "enviando" del botón (evita envíos duplicados). */
  function marcarEnviando(enviando) {
    btnEnviar.disabled = enviando;
    btnEnviar.textContent = enviando ? 'Enviando…' : 'Enviar solicitud';
  }

  /** Quita todas las marcas de validación y mensajes (se usa al limpiar/reiniciar). */
  function limpiarEstados() {
    Object.keys(reglas).forEach(function (id) {
      var campo = document.getElementById(id);
      campo.setCustomValidity('');
      campo.classList.remove('is-valid', 'is-invalid');
      campo.removeAttribute('aria-invalid');
    });
    // El evento "reset" se dispara ANTES de vaciar los campos, por eso el
    // contador se actualiza después con setTimeout.
    setTimeout(actualizarContadorTelefono, 0);
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault(); // evita que la página se recargue
    exito.classList.add('d-none');
    errorEnvio.classList.add('d-none');

    var invalido = validarTodo();
    if (invalido) { invalido.focus(); return; }

    // Datos del formulario en un objeto simple
    var datos = {
      nombre: document.getElementById('nombre').value.trim(),
      correo: document.getElementById('correo').value.trim(),
      telefono: document.getElementById('telefono').value,
      mascota: document.getElementById('mascota').value.trim(),
      especie: document.getElementById('especie').value,
      fecha: document.getElementById('fecha').value,
      motivo: document.getElementById('motivo').value.trim()
    };

    marcarEnviando(true);
    try {
      var respuesta = await PetHealthAPI.crearCita(datos); // POST a la API falsa
      PetHealthCitas.agregar({
        mascota: datos.mascota,
        especie: datos.especie,
        fecha: datos.fecha,
        nombre: datos.nombre,
        apiId: respuesta.id
      });
      form.reset();       // dispara el evento "reset" (limpia estados)
      exito.textContent = 'Solicitud enviada para ' + datos.mascota +
        '. La API confirmó el registro con el id ' + respuesta.id + '.';
      exito.classList.remove('d-none');
    } catch (error) {
      errorEnvio.textContent = 'No se pudo enviar la solicitud. ' + error.message;
      errorEnvio.classList.remove('d-none');
    } finally {
      marcarEnviando(false);
    }
  });

  // Al limpiar el formulario se borran también las marcas verdes/rojas y los avisos
  form.addEventListener('reset', function () {
    limpiarEstados();
    exito.classList.add('d-none');
    errorEnvio.classList.add('d-none');
  });

  actualizarContadorTelefono();
})();
