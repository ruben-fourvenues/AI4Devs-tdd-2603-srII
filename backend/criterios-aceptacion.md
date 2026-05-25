# Criterios de aceptación para tests backend (Jest)

Documento derivado del análisis del código en `backend/src/`. Define los flujos prioritarios y los criterios que posteriormente se convertirán en tests con Jest.

## Resumen de flujos identificados

| Prioridad | Flujo | Capa | Tipo de test recomendado |
|-----------|-------|------|--------------------------|
| Alta | Validación de datos de candidato | `application/validator.ts` | Unitario |
| Alta | Alta de candidato con entidades relacionadas | `application/services/candidateService.ts` | Unitario (mocks) / integración |
| Alta | Endpoint `POST /candidates` | `routes/candidateRoutes.ts` | Integración (supertest) |
| Media | Subida de CV | `application/services/fileUploadService.ts` | Integración (supertest + mocks multer) |
| Media | Persistencia del modelo `Candidate` | `domain/models/Candidate.ts` | Unitario (mock Prisma) |
| Baja | Persistencia de `Education`, `WorkExperience`, `Resume` | `domain/models/*.ts` | Unitario (mock Prisma) |

---

## 1. Validación de candidato (`validateCandidateData`)

**Archivo:** `src/application/validator.ts`

Funciones puras, sin dependencias externas. Máxima prioridad para TDD.

### 1.1 Datos obligatorios del candidato (alta nueva, sin `id`)

- **CA-VAL-01:** Si `firstName` está vacío, tiene menos de 2 caracteres, más de 100, o contiene caracteres no permitidos, debe lanzar `Error` con mensaje `Invalid name`.
- **CA-VAL-02:** Si `lastName` incumple las mismas reglas que `firstName`, debe lanzar `Error` con mensaje `Invalid name`.
- **CA-VAL-03:** Si `email` está vacío o no cumple el formato de email, debe lanzar `Error` con mensaje `Invalid email`.
- **CA-VAL-04:** Si `phone` está presente y no cumple el patrón español `(6|7|9)` + 8 dígitos, debe lanzar `Error` con mensaje `Invalid phone`.
- **CA-VAL-05:** Si `phone` está ausente o es vacío, la validación debe pasar (campo opcional).
- **CA-VAL-06:** Si `address` supera 100 caracteres, debe lanzar `Error` con mensaje `Invalid address`.
- **CA-VAL-07:** Si `address` está ausente, la validación debe pasar.

### 1.2 Edición de candidato existente

- **CA-VAL-08:** Si el payload incluye `id`, `validateCandidateData` no debe validar ningún campo (retorno temprano).

### 1.3 Educación

- **CA-VAL-09:** Si `institution` está vacía o supera 100 caracteres → `Invalid institution`.
- **CA-VAL-10:** Si `title` está vacío o supera 100 caracteres → `Invalid title`.
- **CA-VAL-11:** Si `startDate` está vacía o no tiene formato `YYYY-MM-DD` → `Invalid date`.
- **CA-VAL-12:** Si `endDate` está presente y no tiene formato `YYYY-MM-DD` → `Invalid end date`.
- **CA-VAL-13:** Si `endDate` está ausente, la validación debe pasar.

### 1.4 Experiencia laboral

- **CA-VAL-14:** Si `company` está vacía o supera 100 caracteres → `Invalid company`.
- **CA-VAL-15:** Si `position` está vacía o supera 100 caracteres → `Invalid position`.
- **CA-VAL-16:** Si `description` supera 200 caracteres → `Invalid description`.
- **CA-VAL-17:** Si `startDate` es inválida → `Invalid date`.
- **CA-VAL-18:** Si `endDate` está presente y es inválida → `Invalid end date`.

### 1.5 CV

- **CA-VAL-19:** Si `cv` es un objeto no vacío sin `filePath` o `fileType` válidos (strings) → `Invalid CV data`.
- **CA-VAL-20:** Si `cv` es un objeto vacío `{}`, no debe ejecutarse la validación de CV.
- **CA-VAL-21:** Si `cv` tiene `filePath` y `fileType` como strings, la validación debe pasar.

### 1.6 Payload válido completo

- **CA-VAL-22:** Un candidato con datos mínimos válidos (`firstName`, `lastName`, `email`) debe pasar la validación sin errores.
- **CA-VAL-23:** Un candidato con educaciones, experiencias y CV válidos debe pasar la validación sin errores.

---

## 2. Servicio de alta de candidato (`addCandidate`)

**Archivo:** `src/application/services/candidateService.ts`

Orquesta validación, creación del modelo y persistencia de entidades relacionadas.

### 2.1 Flujo feliz

- **CA-SVC-01:** Con datos válidos, debe llamar a `validateCandidateData` antes de persistir.
- **CA-SVC-02:** Con datos válidos mínimos, debe crear el candidato y devolver el registro guardado (con `id`).
- **CA-SVC-03:** Si el payload incluye `educations`, debe crear un registro de educación por cada elemento, asociado al `candidateId` generado.
- **CA-SVC-04:** Si el payload incluye `workExperiences`, debe crear un registro de experiencia por cada elemento, asociado al `candidateId`.
- **CA-SVC-05:** Si el payload incluye `cv` no vacío, debe crear un registro de `Resume` asociado al candidato.

### 2.2 Errores de validación

- **CA-SVC-06:** Si la validación falla, debe propagar un `Error` con el mensaje de validación correspondiente (sin persistir en base de datos).

### 2.3 Restricciones de base de datos

- **CA-SVC-07:** Si Prisma devuelve error `P2002` (email duplicado), debe lanzar `Error` con mensaje `The email already exists in the database`.
- **CA-SVC-08:** Si ocurre otro error de Prisma no controlado, debe relanzarlo sin transformarlo.

### 2.4 Casos límite

- **CA-SVC-09:** Si no se envían `educations`, `workExperiences` ni `cv`, solo debe persistir el candidato base.
- **CA-SVC-10:** Arrays vacíos de educaciones o experiencias no deben provocar errores.

---

## 3. Endpoint `POST /candidates`

**Archivos:** `src/routes/candidateRoutes.ts`, `src/index.ts`

Test de integración con supertest; mockear Prisma o usar base de datos de test según estrategia del proyecto.

### 3.1 Respuestas HTTP

- **CA-API-01:** Con payload válido y persistencia exitosa, debe responder **201** con el candidato creado en el body.
- **CA-API-02:** Con datos inválidos (p. ej. email mal formado), debe responder **400** con `{ message: "<mensaje de error>" }`.
- **CA-API-03:** Con email duplicado, debe responder **400** con mensaje `The email already exists in the database`.
- **CA-API-04:** Si ocurre un error no instancia de `Error`, debe responder **500** con `{ message: "An unexpected error occurred" }`.

### 3.2 Contrato de entrada

- **CA-API-05:** El body debe aceptar JSON con campos `firstName`, `lastName`, `email`, `phone`, `address`, `educations`, `workExperiences`, `cv`.
- **CA-API-06:** El candidato creado debe incluir al menos `id`, `firstName`, `lastName`, `email` en la respuesta.

---

## 4. Subida de archivos `POST /upload`

**Archivo:** `src/application/services/fileUploadService.ts`

### 4.1 Tipos permitidos

- **CA-UPL-01:** Un archivo PDF (`application/pdf`) debe responder **200** con `{ filePath, fileType }`.
- **CA-UPL-02:** Un archivo DOCX (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`) debe responder **200** con `{ filePath, fileType }`.
- **CA-UPL-03:** Un archivo con MIME no permitido (p. ej. `image/png`) debe responder **400** con `{ error: "Invalid file type, only PDF and DOCX are allowed!" }`.

### 4.2 Límites y errores

- **CA-UPL-04:** Un archivo que supere 10 MB debe provocar error de Multer y responder **500** con `{ error: "<mensaje>" }`.
- **CA-UPL-05:** Si no se adjunta archivo en el campo `file`, debe responder **400** indicando tipo de archivo inválido.

### 4.3 Comportamiento de almacenamiento

- **CA-UPL-06:** El nombre del archivo guardado debe incluir un sufijo único basado en timestamp más el nombre original.
- **CA-UPL-07:** La respuesta debe incluir la ruta (`filePath`) y el MIME type (`fileType`) del archivo subido.

---

## 5. Modelo de dominio `Candidate`

**Archivo:** `src/domain/models/Candidate.ts`

Tests con Prisma mockeado.

### 5.1 Creación

- **CA-MOD-CAND-01:** `save()` sin `id` debe invocar `prisma.candidate.create` con los campos definidos.
- **CA-MOD-CAND-02:** Solo deben incluirse en el payload de Prisma los campos que no son `undefined`.
- **CA-MOD-CAND-03:** Si hay educaciones, experiencias o resumes en la instancia, deben enviarse como relaciones `create` anidadas.

### 5.2 Actualización

- **CA-MOD-CAND-04:** `save()` con `id` debe invocar `prisma.candidate.update` con `where: { id }`.
- **CA-MOD-CAND-05:** Si Prisma lanza `P2025` (registro no encontrado), debe lanzar `Error` con mensaje indicando que no se encontró el candidato.

### 5.3 Errores de conexión

- **CA-MOD-CAND-06:** Si Prisma lanza `PrismaClientInitializationError`, debe lanzar `Error` con mensaje de imposibilidad de conectar con la base de datos.

### 5.4 Consulta

- **CA-MOD-CAND-07:** `Candidate.findOne(id)` debe devolver una instancia de `Candidate` cuando existe el registro.
- **CA-MOD-CAND-08:** `Candidate.findOne(id)` debe devolver `null` cuando no existe el registro.

---

## 6. Modelos relacionados (`Education`, `WorkExperience`, `Resume`)

### 6.1 Education

- **CA-MOD-EDU-01:** `save()` sin `id` crea un registro con `institution`, `title`, `startDate`, `endDate` y `candidateId` si está definido.
- **CA-MOD-EDU-02:** `save()` con `id` actualiza el registro existente.
- **CA-MOD-EDU-03:** Las fechas string del constructor se convierten a objetos `Date`.

### 6.2 WorkExperience

- **CA-MOD-WE-01:** `save()` sin `id` crea un registro con todos los campos obligatorios y opcionales.
- **CA-MOD-WE-02:** `save()` con `id` actualiza el registro existente.

### 6.3 Resume

- **CA-MOD-RES-01:** `save()` sin `id` crea un registro con `filePath`, `fileType`, `uploadDate` y `candidateId`.
- **CA-MOD-RES-02:** `save()` con `id` existente debe lanzar `Error` indicando que no se permite actualizar un currículum.
- **CA-MOD-RES-03:** `uploadDate` se establece automáticamente en el momento de creación.

---

## 7. Orden sugerido de implementación (TDD)

1. **Fase 1 — Validador:** CA-VAL-01 a CA-VAL-23 (rápido, sin infraestructura).
2. **Fase 2 — Servicio:** CA-SVC-01 a CA-SVC-10 (mock de modelos de dominio y Prisma).
3. **Fase 3 — API candidatos:** CA-API-01 a CA-API-06 (supertest + mocks).
4. **Fase 4 — Upload:** CA-UPL-01 a CA-UPL-07.
5. **Fase 5 — Modelos de dominio:** CA-MOD-* (refactor y cobertura de persistencia).

---

## Notas para la implementación de tests

- **Mock de Prisma:** Los modelos instancian `PrismaClient` directamente; conviene usar `jest.mock('@prisma/client')` o inyectar dependencias en una iteración posterior.
- **Discrepancia ruta/controlador:** `candidateRoutes.ts` llama a `addCandidate` del servicio (reexportado desde el controller) y responde con el candidato directamente; `addCandidateController` existe pero no se usa en la ruta. Los tests deben reflejar el comportamiento real de la ruta.
- **Discrepancia OpenAPI vs código:** El validador usa teléfono español de 9 dígitos (`^(6|7|9)\d{8}$`); la spec OpenAPI define otro patrón. Los tests deben alinearse con la implementación actual en `validator.ts`.
- **Entorno de test:** Configurar `DATABASE_URL` de test o mockear Prisma para evitar dependencia de PostgreSQL en CI.
