# PetHealth — Interfaz dinámica con JavaScript

Clínica veterinaria ficticia. Esta versión agrega **dinamismo con JavaScript nativo** (sin frameworks) a la interfaz responsiva hecha con HTML5, CSS3 y Bootstrap 5.

Proyecto de la materia **Fundamentos de Aplicaciones Web** · UNAM · FCA · SUAyED.

## Qué hace

| Requisito | Dónde está | Cómo funciona |
|-----------|-----------|---------------|
| Validación en tiempo real (nombre, correo, teléfono) | `js/validacion.js` | Cada campo se valida al escribir (`input`) y al salir (`blur`) con mensajes específicos. El teléfono filtra todo lo que no sea dígito y muestra un contador `n/10`. |
| Consumo de una API REST falsa con `fetch` | `js/api.js`, `js/tutores.js` | `GET /users` carga tarjetas de tutores por páginas, con estados de carga, error y reintento. `POST /posts` simula el registro de la cita. |
| Manipulación del DOM (agregar/eliminar) | `js/citas.js` | Cada solicitud enviada con éxito se agrega como `<li>`; se elimina con su botón o con "Vaciar lista". |

API utilizada: [JSONPlaceholder](https://jsonplaceholder.typicode.com) (pública, gratuita y sin llave). **No guarda datos reales**: el `POST` responde con el mismo cuerpo y el id `101`.

## Estructura

```
index.html            Página principal (secciones nuevas: Tutores y lista de solicitudes)
css/styles.css        Estilos propios (+ Bootstrap 5.3 local)
js/api.js             Cliente fetch: GET /users, POST /posts, manejo de errores y tiempo de espera
js/tutores.js         Pinta y pagina las tarjetas de la API
js/citas.js           Lista dinámica de solicitudes (agregar / eliminar / vaciar)
js/validacion.js      Reglas de validación y envío del formulario
assets/img/           Logotipo e ilustraciones SVG
```

## Cómo ejecutarlo

No requiere instalación ni compilación. Se necesita conexión a internet para consultar la API.

1. Descarga o clona el repositorio.
2. Abre `index.html` en el navegador (doble clic), o sirve la carpeta:
   ```bash
   python3 -m http.server 8000
   # y visita http://localhost:8000
   ```

## Cómo probar cada función

1. **Validación:** en "Agenda una cita" escribe `Ana` en el nombre (pide más caracteres), `ana@` en el correo (formato inválido) y `55-12ab` en el teléfono (se queda en `5512` y marca `4/10 dígitos`).
2. **API:** al abrir la página aparecen 3 tutores; pulsa **Cargar más** hasta llegar a 10. Desconecta internet y pulsa **Reiniciar lista** para ver el mensaje de error y el botón **Reintentar**.
3. **DOM:** completa el formulario correctamente y envía; la solicitud aparece en "Solicitudes de esta sesión". Pulsa **Eliminar** para quitarla.

## Decisiones técnicas

- **JavaScript nativo y scripts clásicos** (sin módulos ES) para que funcione también con `file://`.
- **`textContent` y `createElement`** en lugar de `innerHTML` al insertar datos de la API o del usuario, para evitar inyección de HTML (XSS).
- **`fetch` con `AbortController`** (tiempo máximo de 8 s) y comprobación de `response.ok`, porque `fetch` no rechaza la promesa con errores HTTP como 404 o 500.
- **Delegación de eventos** en la lista de solicitudes: un solo listener atiende todos los botones, incluso los creados después.
- **Accesibilidad:** `aria-live` en contadores y avisos, `role="status"`/`role="alert"` en los estados, `aria-invalid` en campos con error.

## Créditos

- [Bootstrap 5.3](https://getbootstrap.com/) (incluido localmente).
- Datos de prueba: [JSONPlaceholder](https://jsonplaceholder.typicode.com).
- Autor: Emilio Farid Ochoa Cruz.
