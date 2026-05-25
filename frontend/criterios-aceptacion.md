# Criterios de aceptación — tests frontend (Jest)

Documento de referencia para convertir en tests con Jest + React Testing Library. La app activa está en `App.js` (routing y pantallas); `App.tsx` es el boilerplate por defecto de CRA y no forma parte del flujo de negocio.

## Flujos prioritarios

| Prioridad | Área | Motivo |
|-----------|------|--------|
| Alta | `AddCandidateForm` — envío al API | Lógica de negocio, transformación de fechas, manejo de errores HTTP |
| Alta | `FileUploader` | Subida de CV, estados de carga y callbacks |
| Media | Routing (`App.js`) | Navegación entre dashboard y formulario |
| Media | `RecruiterDashboard` | Punto de entrada y enlace al flujo principal |
| Baja | `candidateService` | Servicio auxiliar no usado aún por los componentes (fetch directo) |

---

## 1. Routing — `App.js`

### CA-R01 — Ruta raíz muestra el dashboard
- **Dado** que la app está montada con `MemoryRouter` en `/`
- **Cuando** se renderiza `App`
- **Entonces** se muestra el título "Dashboard del Reclutador"

### CA-R02 — Ruta `/add-candidate` muestra el formulario
- **Dado** que la app está montada con `MemoryRouter`> en `/add-candidate`
- **Cuando** se renderiza `App`
- **Entonces** se muestra el título "Agregar Candidato"

---

## 2. Dashboard del reclutador — `RecruiterDashboard.js`

### CA-D01 — Renderizado básico
- **Cuando** se renderiza el componente
- **Entonces** se muestran:
  - El logo con alt "LTI Logo"
  - El encabezado "Dashboard del Reclutador"
  - La tarjeta "Añadir Candidato"

### CA-D02 — Navegación al formulario
- **Cuando** el usuario hace clic en "Añadir Nuevo Candidato"
- **Entonces** la URL cambia a `/add-candidate` (test con `MemoryRouter` + `Routes`)

---

## 3. Formulario de candidato — `AddCandidateForm.js`

### CA-F01 — Campos obligatorios visibles
- **Cuando** se renderiza el formulario
- **Entonces** existen campos requeridos para:
  - Nombre (`firstName`)
  - Apellido (`lastName`)
  - Correo electrónico (`email`)
- **Y** el botón "Enviar" está presente

### CA-F02 — Campos opcionales editables
- **Cuando** el usuario escribe en teléfono y dirección
- **Entonces** los valores quedan reflejados en los inputs correspondientes

### CA-F03 — Añadir sección de educación
- **Cuando** el usuario hace clic en "Añadir Educación"
- **Entonces** aparece un bloque con inputs: institución, título, fecha inicio y fecha fin
- **Y** el botón "Eliminar" asociado a esa sección

### CA-F04 — Eliminar sección de educación
- **Dado** que hay al menos una educación añadida
- **Cuando** el usuario hace clic en "Eliminar"
- **Entonces** desaparece ese bloque de educación

### CA-F05 — Añadir y eliminar experiencia laboral
- **Cuando** el usuario hace clic en "Añadir Experiencia Laboral"
- **Entonces** aparece un bloque con inputs: empresa, puesto, fecha inicio y fecha fin
- **Cuando** el usuario hace clic en "Eliminar" de esa experiencia
- **Entonces** desaparece el bloque

### CA-F06 — Envío exitoso (HTTP 201)
- **Dado** que `fetch` está mockeado para devolver `{ status: 201 }`
- **Y** el usuario ha rellenado nombre, apellido y email válidos
- **Cuando** envía el formulario
- **Entonces** se llama a `POST http://localhost:3010/candidates` con `Content-Type: application/json`
- **Y** se muestra la alerta de éxito "Candidato añadido con éxito"
- **Y** no se muestra alerta de error

### CA-F07 — Error de validación del servidor (HTTP 400)
- **Dado** que `fetch` devuelve `{ status: 400, json: () => ({ message: 'Email duplicado' }) }`
- **Cuando** el usuario envía el formulario
- **Entonces** se muestra alerta de error que incluye "Datos inválidos: Email duplicado"
- **Y** no se muestra mensaje de éxito

### CA-F08 — Error interno del servidor (HTTP 500)
- **Dado** que `fetch` devuelve `{ status: 500 }`
- **Cuando** el usuario envía el formulario
- **Entonces** se muestra alerta de error que incluye "Error interno del servidor"

### CA-F09 — Error de red u otro fallo
- **Dado** que `fetch` rechaza la promesa (p. ej. red caída)
- **Cuando** el usuario envía el formulario
- **Entonces** se muestra alerta de error que comienza con "Error al añadir candidato:"

### CA-F10 — Formato de fechas en el payload
- **Dado** que el candidato tiene educación con `startDate` y `endDate` como objetos `Date`
- **Cuando** se envía el formulario
- **Entonces** el body JSON incluye esas fechas en formato `YYYY-MM-DD` (ISO slice 0–10)
- **Y** fechas vacías se envían como cadena vacía `''`

### CA-F11 — Inclusión de CV en el payload
- **Dado** que el candidato tiene un CV subido con `{ filePath: '/uploads/cv.pdf', fileType: 'application/pdf' }`
- **Cuando** se envía el formulario
- **Entonces** el body incluye `cv: { filePath, fileType }` (sin el objeto File crudo)

### CA-F12 — Envío sin CV
- **Dado** que no se ha subido CV
- **Cuando** se envía el formulario
- **Entonces** el body incluye `cv: null`

---

## 4. Subida de archivos — `FileUploader.js`

### CA-U01 — Selección de archivo
- **Cuando** el usuario selecciona un archivo en el input `type="file"`
- **Entonces** se muestra "Selected file: {nombreDelArchivo}"
- **Y** se invoca el callback `onChange` con el archivo seleccionado

### CA-U02 — Subida exitosa
- **Dado** que hay un archivo seleccionado
- **Y** `fetch` a `POST http://localhost:3010/upload` responde OK con `{ filePath, fileType }`
- **Cuando** el usuario hace clic en "Subir Archivo"
- **Entonces** se envía `FormData` con la clave `file`
- **Y** se muestra "Archivo subido con éxito"
- **Y** se invoca `onUpload` con la respuesta del servidor

### CA-U03 — Estado de carga durante la subida
- **Dado** que la subida tarda en resolverse
- **Cuando** el usuario hace clic en "Subir Archivo"
- **Entonces** el botón muestra un spinner (`Spinner`) mientras `loading === true`
- **Y** vuelve a mostrar "Subir Archivo" al finalizar

### CA-U04 — Error en la subida
- **Dado** que `fetch` responde con status no OK
- **Cuando** el usuario intenta subir
- **Entonces** no se muestra "Archivo subido con éxito"
- **Y** el spinner desaparece (loading vuelve a false)

### CA-U05 — Subir sin archivo seleccionado
- **Dado** que no hay archivo seleccionado
- **Cuando** el usuario hace clic en "Subir Archivo"
- **Entonces** no se llama a `fetch`
- **Y** no se muestra spinner

---

## 5. Servicio de candidatos — `candidateService.js`

> Nota: los componentes usan `fetch` directamente; estos criterios cubren el servicio por si se refactoriza o se reutiliza.

### CA-S01 — `uploadCV` éxito
- **Dado** que `axios.post` a `/upload` resuelve con `{ filePath, fileType }`
- **Cuando** se llama `uploadCV(file)`
- **Entonces** devuelve esos datos
- **Y** envía `multipart/form-data` con el archivo

### CA-S02 — `uploadCV` error
- **Dado** que `axios.post` rechaza la petición
- **Cuando** se llama `uploadCV(file)`
- **Entonces** lanza un error con mensaje "Error al subir el archivo:"

### CA-S03 — `sendCandidateData` éxito
- **Dado** que `axios.post` a `/candidates` resuelve con datos del candidato
- **Cuando** se llama `sendCandidateData(candidateData)`
- **Entonces** devuelve la respuesta del servidor

### CA-S04 — `sendCandidateData` error
- **Dado** que `axios.post` rechaza la petición
- **Cuando** se llama `sendCandidateData(candidateData)`
- **Entonces** lanza un error con mensaje "Error al enviar datos del candidato:"

---

## Notas técnicas para la implementación de tests

- **Mocks habituales:** `global.fetch`, `axios` (en tests de servicio), `react-datepicker` (simplificar interacción con fechas).
- **Routing:** envolver con `MemoryRouter` y rutas iniciales según el caso.
- **Archivos:** simular selección con `userEvent.upload` o `fireEvent.change` en el input file.
- **Imágenes:** Jest ya mapea assets estáticos vía configuración; el logo en dashboard puede requerir mock de `*.png`.
- **Orden sugerido de implementación:** CA-F06 → CA-F07 → CA-U02 → CA-R01/CA-R02 → resto.
