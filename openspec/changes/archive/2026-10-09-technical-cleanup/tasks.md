# Tareas: Technical Cleanup (Base sólida)

Espejo en Engram: `sdd/technical-cleanup/tasks` (proyecto `webeevp`). Entradas: `proposal.md`, `design.md` y los specs `cv-data-contract`, `social-icon-rendering`, `quality-gates`, `ci-deploy`. No se toca código fuente en esta fase; este documento solo planifica.

Convenciones:

- Las referencias a requisitos usan `capacidad / Requirement` y los escenarios entre comillas. Las decisiones de diseño se citan como D1..D20.
- Una ruta entre comillas invertidas en una línea de tarea es un objetivo de edición. Las rutas que solo se leen llevan `(read-only)`.
- **Strict TDD**: las unidades 1 y 2 son tooling sin TDD posible (no existe runner; `strict_tdd` sigue en `false` hasta 2.6). Desde la unidad 3a rige RED → GREEN → REFACTOR (la 2 activa `strict_tdd: true`, D20). Una tarea RED solo se cierra con el fallo observado y registrado; una GREEN, con el comando en verde.
- Q1, Q2, Q3, Q4, Q5, Q8 y Q9 están RESUELTAS por el usuario; Q6 y Q7 también quedaron resueltas el 2026-10-09 (Q6 fuera de alcance, Q7 se conservan los íconos); las marcas **[Qn provisional]** que aparecen más abajo son históricas, de cuando se redactó este documento. Q2 fue revisada a Node 24 tras el verify. Cada puerta de decisión (sección siguiente) indica su estado.
- Presupuesto: 400 líneas cambiadas autoradas por PR (adiciones + eliminaciones; `pnpm-lock.yaml` excluido).

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | Total autorado sin 5b ni lockfile: ~1.100-2.200 líneas (suma de los rangos del diseño). 5b: reformateo de todo el código fuente (mecánico). |
| 400-line budget risk | High (total); por PR: Bajo en 1, 2, 5a, 5c, 6a, 7, 8; Medio en 3a, 3b, 4b, 6b; Medio-alto en 4a; Alto por diseño en 5b |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3a → PR 3b → PR 4a → PR 4b → PR 5a → PR 5b (+5c) → PR 6a → PR 6b → PR 7 → PR 8 |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main (elegida por el usuario) |
| Excepción de tamaño PR 5b | `size:exception` ACEPTADA por el usuario el 2026-10-09: commit de formato mecánico (1154 adiciones + 1178 eliminaciones = 2332 líneas, 40 archivos), sin dividir por directorios |
| Excepción de tamaño PR 3a | `size:exception` ACEPTADA por el usuario el 2026-10-09: 439 líneas autoradas (39 sobre el presupuesto de 400), sin dividir |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

**Recomendación (no fijada; la decide el usuario antes de apply):** `stacked-to-main` por defecto, porque las 12 porciones son autónomas, cada una deja los gates en verde y su rollback es un `git revert` independiente; permite además detenerse en 6a (criterio de parada de D17) sin un tracker que merger. `feature-branch-chain` es preferible solo si se quiere que nada llegue a `main` hasta cerrar 8, a costa de bases encadenadas (PR n+1 apunta a la rama del PR n). `size-exception` no se recomienda para el conjunto; solo se necesita para 5b (ver abajo).

Decisiones necesarias antes de apply (ninguna se resuelve en este documento):

1. Estrategia de cadena: `stacked-to-main` | `feature-branch-chain` (pendiente).
2. Excepción de tamaño para 5b: `size:exception` explícita **o** aceptar 5b como salida mecánica generada (D16). Es el único PR que supera 400 líneas por diseño. Condiciones de la excepción: el commit contiene únicamente `pnpm format`; se verifica con `git diff -w <padre> <5b>` sin cambios de lógica y con `pnpm format:check`, `pnpm lint`, `pnpm test`, `pnpm build` en verde; 5c registra el SHA en `.git-blame-ignore-revs`.
3. Q6 y Q7 según las puertas de decisión (las demás Q están resueltas). El supuesto de CI solo de gates sin deploy (unidad 8) fue CONFIRMADO por el usuario el 2026-10-09.
4. Versión de pnpm a fijar en `packageManager` (se confirma con `pnpm -v` en 1.2).

### Pronóstico por PR

| PR | Líneas autoradas estimadas | Riesgo > 400 | Nota |
|----|---------------------------|--------------|------|
| 1 | 40-150 | Bajo | Si `astro check` revela > ~250 líneas de correcciones, dividir 1a (tooling) / 1b (correcciones) |
| 2 | 60-140 | Bajo | |
| 3a | 180-300 (real: 439) | Medio | Variable: fixtures de prueba. `size:exception` aceptada el 2026-10-09 (439 líneas, +39 sobre 400) en lugar de dividir |
| 3b | 200-300 (incluye −145 de `src/cv.d.ts`) | Medio | |
| 4a | 250-380 | Medio-alto | Dividido por decisión del usuario (2026-10-09): PR 4a0 = caracterización (50 líneas reales, `667cb5f`); PR 4a = resto (385 líneas reales) |
| 4b | 80-200 + líneas de los dos SVG borrados | Medio | Los borrados se señalan como borrado puro |
| 5a | 60-150 | Bajo | |
| 5b | Todo el código fuente | Sí, por diseño | Excepción necesaria (ver arriba) |
| 5c | < 5 | No | Puede viajar con 5b o con 6a |
| 6a | 20-150 | Bajo-medio | |
| 6b | 20-200 | Medio | Si se activa el criterio de parada, no se mergea |
| 7 | 100-250 | Bajo | |
| 8 | 30-60 | Bajo | Solo un workflow de gates (sin deploy ni CNAME; Q1 = Vercel) |

### Suggested Work Units

Todas las unidades son work-unit commits (un PR = una o más commits de trabajo con pruebas y docs junto al comportamiento). **Deben ser commits/PR aislados, sin mezclar contenido:** PR 1 (tooling puro), PR 5b (solo formato mecánico), PR 5c (solo `.git-blame-ignore-revs`), PR 6a y PR 6b (cada upgrade en su propio PR, para poder detenerse en 6.x) y PR 8 (CI, sin cambios de código). Dentro de 3a, la corrección de contenido de `cv.json` va en su propio commit separado del código del esquema.

Para `feature-branch-chain` (si se elige): PR 1 base = rama tracker; PR n base = rama del PR n−1. Para `stacked-to-main`: cada PR apunta a `main` y se mergea en orden.

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Tooling base: `check`, `packageManager`, `site`, alias, errores base | PR 1 | `pnpm check` | `pnpm build` y prueba negativa manual de `check` (error de tipos temporal, no commiteado, salida != 0) | Revertir; el sitio compila como antes |
| 2 | vitest + smoke + `strict_tdd: true` | PR 2 | `pnpm test` | RED observado (`pnpm test` sin runner) y `pnpm build` | Revertir; `config.yaml` vuelve a `strict_tdd: false` |
| 3a | `CvSchema`, `src/lib/cv.ts`, correcciones de `cv.json` | PR 3a | `pnpm test src/lib` | `pnpm build` + diff normalizado de `dist/index.html` (solo prosa [Q5]) | Revertir; componentes aún leen `@cv` |
| 3b | Componentes a `@/lib/cv`, `Section` con `Props`, borrar `src/cv.d.ts` | PR 3b | `pnpm test src/components/Section.test.ts` | `pnpm build` + diff de `dist/index.html` sin diferencias | Revertir; vuelven `@cv` y `src/cv.d.ts` |
| 4a | `src/lib/icons.ts`, `SocialIcon`, caracterización, Hero, GitHub | PR 4a | `pnpm test src/lib/icons.test.ts src/components/icons src/pages` | `pnpm build` con `cv.json` temporal con perfil `mastodon` (no commiteado) | Revertir antes que 4b |
| 4b | `KeyboardManager`, `Skills`, borrado de assets | PR 4b | `pnpm test` | `pnpm build` + diff normalizado de `dist/index.html` | Revertir antes que 4a |
| 5a | ESLint/Prettier config, scripts, correcciones de lint | PR 5a | `pnpm lint` | Pruebas negativas manuales de `lint` y `format:check`; `pnpm build` | Revertir tras 5c/5b |
| 5b | `pnpm format` mecánico | PR 5b | `pnpm format:check` | `git diff -w <padre> <5b>` sin cambios de lógica; `pnpm lint`, `pnpm test`, `pnpm build` | Revertir primero (antes que 5a) |
| 5c | `.git-blame-ignore-revs` | PR 5c (o con 5b/6a) | `pnpm format:check` | N/A: archivo de metadatos sin efecto en build | Revertir primero junto con 5b |
| 6a | Node 24 + Astro 6 + vitest/Vite 7 | PR 6a | `pnpm test` | `pnpm build` + diff normalizado contra `dist/` de referencia | Revertir; vuelve Astro 5.7.12 |
| 6b | Astro 7 + Vite 8 + correcciones de markup | PR 6b | `pnpm test` | `pnpm build` + diff normalizado; criterio de parada | Revertir; queda Astro 6 |
| 7 | README | PR 7 | `pnpm format:check` | Revisión manual de secciones; `rg -i "ninja" README.md` sin coincidencias | Revertir README |
| 8 | CI solo de gates (deploy externo por Vercel) | PR 8 | `pnpm build` | Sintaxis del YAML validada en local; el repo no contiene workflow de deploy ni `public/CNAME`; validación con Node 24 real en la primera ejecución del CI | Deshabilitar o revertir; el deploy de Vercel no depende del workflow |

## Puertas de decisión (resolver antes de iniciar la unidad indicada; NO se deciden aquí)

| Puerta | Debe resolverse antes de | Qué se pregunta | Valor provisional (NO es decisión) | Si cambia |
|--------|--------------------------|-----------------|-------------------------------------|-----------|
| G0 | 1 (parcial) | **RESUELTA**: Q1 (Vercel) es coherente con `site: https://enzovera.dev` de 1.5 | `site: https://enzovera.dev` | Sin cambio |
| Q3, Q4, Q5 | Unidad 3 (PR 3a) | **RESUELTAS** (decisión del usuario): Q3 Zod vs solo tipos; Q4 relleno de `cv.json`; Q5 correcciones de `cv.json` | Q3 = Zod vía `astro/zod`; Q4 = mantener como `.optional()`; Q5 = corregir `key`→`keywords`, prosa y typos similares (commit aparte) | Q3 = tipos: `cv-types.ts` + guardas (D6); Q4 = eliminar: se borran del JSON y del esquema (D8); Q5 = no tocar: `keywords` pasa a `.optional()` y cambia el RED (D9) |
| Q6, Q7 | Unidad 4 (PR 4a para Q7 y 4b para ambas; resolver ambas antes de 4a) | Q6 errores de tema y `ctrl+C`; Q7 íconos sin coincidencia | Q6 fuera de alcance; Q7 conservar con nota en prueba | Q6 dentro: nuevo PR 4c con `src/lib/theme.ts` y RED propio (D15); Q7 eliminar: se borran 5 `.astro`, 5 claves y 5 imports (D13) |
| Q8 | Unidad 5 (PR 5a) | Estilo de Prettier | **RESUELTA (2026-10-09)**: defaults de Prettier (2 espacios, punto y coma, comillas dobles) + `prettier-plugin-astro` | Cambia `.prettierrc` y el tamaño de 5b |
| Q1, Q2 | **RESUELTAS (2026-10-09)**: Q1 = deploy en VERCEL (commit + push; NO GitHub Pages; `ci-deploy`, D19 y la unidad 8 ya reformulados: CI solo de gates); Q2 = Node 24 (`engines >=22.12`, `.nvmrc` y CI en 24). Unidad 6 (PR 6a) y Unidad 8 (PR 8) | Q1 destino de deploy; Q2 Node objetivo | Q1 = Vercel con `site: https://enzovera.dev`; Q2 = Node 24 | Sin cambio pendiente |
| Q9 | Unidad 7 (PR 7) | **RESUELTA (2026-10-09)**: idioma del README | Español (aplicado en el PR 7) | Sin cambio pendiente |

Nota sobre Q1 en la unidad 1: Q1 resolvió Vercel y el `site` aplicado en 1.5 (`https://enzovera.dev`, confirmado en el repositorio) sigue siendo coherente; no hay ajuste pendiente. Solo Q6 y Q7 conservan valor provisional.

---

## Phase 1: PR 1 — Tooling base (sin TDD: no existe runner)

Spec: `quality-gates / Verificación de tipos`, `Gestor de paquetes fijado`, `Build`; `cv-data-contract / Alias de tsconfig corregido`. Decisiones: D1, D2, D3, D4, D20. Comando de unidad: `pnpm check`.

- [x] 1.1 Registrar la línea base: ejecutar `pnpm build` en el estado actual y generar `dist/` de referencia en el scratchpad (no se versiona) para las comparaciones posteriores. Archivos: ninguno modificado. Verificación: `pnpm build` termina con 0.
- [x] 1.2 Confirmar `node -v` y `pnpm -v` locales; fijar `"packageManager": "pnpm@<versión de pnpm -v>"` en `package.json` (D2). Spec: `quality-gates / Gestor de paquetes fijado` ("packageManager declarado"). Verificación: `pnpm install` sin reescribir `lockfileVersion` de forma inesperada; la versión coincide con la que genera el lockfile.
- [x] 1.3 Agregar `typescript` y `@astrojs/check` como devDependencies y el script `"check": "astro check"` en `package.json`; regenerar `pnpm-lock.yaml` (D1: solo `check` en esta unidad). Spec: `quality-gates / Verificación de tipos`, `Scripts de verificación` (parcial, completa en 2 y 5a). Verificación: `pnpm check` corre (puede reportar errores base).
- [x] 1.4 Eliminar la entrada `"@/asset": ["src/assets/"]` de `tsconfig.json` (D3). Spec: `cv-data-contract / Alias de tsconfig corregido` ("Alias válido"). Verificación: `pnpm check` sin errores de resolución de alias; `Hero.astro` y `Skills.astro` siguen resolviendo `@/assets/...`.
- [x] 1.5 Definir `site` en `astro.config.mjs` **[Q1 resuelta: Vercel]**: `site: "https://enzovera.dev"`, sin `base` (D4). Spec: `quality-gates / Build`. Verificación: `pnpm build` con 0.
- [x] 1.6 Corregir los errores base reportados por `pnpm check` en los archivos de `src/` que correspondan, hasta 0 errores. Si el volumen supera ~250 líneas, dividir en 1a (tooling) y 1b (correcciones) y registrar el desvío. Spec: `quality-gates / Verificación de tipos` ("Check limpio"). Verificación: `pnpm check` con 0 errores.
- [x] 1.7 Prueba negativa manual de `check` ("Un error de tipos hace fallar el gate"): introducir temporalmente un error de tipos en un componente (sin commitear), ejecutar `pnpm check`, registrar el comando y el código de salida != 0 en la descripción del PR y descartar el cambio. Verificación: salida != 0 registrada.
- [x] 1.8 Actualizar `openspec/config.yaml`: `typecheck_command: "pnpm check"` y `quality.type_checker: true` (D20). Verificación: lectura del archivo; `pnpm check` y `pnpm build` en verde.
- [x] 1.9 Cierre de PR 1: `pnpm check` y `pnpm build` con 0; comparar `dist/index.html` contra la referencia de 1.1 (no debe haber diferencias de contenido). Registrar resultados en el PR.

## Phase 2: PR 2 — vitest y activación de Strict TDD (sin TDD: introduce el runner)

Spec: `quality-gates / Pruebas`, `Strict TDD habilitado`, `Scripts de verificación`. Decisiones: D5, D20. Comando de unidad: `pnpm test`. Depende de PR 1.

- [x] 2.1 RED de infraestructura: sin vitest instalado, ejecutar `pnpm test` y registrar que falla (script inexistente). Verificación: salida != 0 registrada. (No es un RED de código; es la evidencia exigida por el diseño §Estrategia de pruebas.)
- [x] 2.2 Agregar `vitest` como devDependency y los scripts `"test": "vitest run"` y `"test:watch": "vitest"` en `package.json`; regenerar `pnpm-lock.yaml`. Verificar compatibilidad de la versión de vitest con la versión de Vite que trae Astro 5 (supuesto no verificado en D5).
- [x] 2.3 Crear `vitest.config.ts` con `getViteConfig` de `astro/config`, entorno `node`, `include: ["src/**/*.test.ts"]` (D5).
- [x] 2.4 Crear `src/lib/smoke.test.ts`: (a) el alias `@cv` resuelve y devuelve un objeto con `basics`; (b) la Container API (`experimental_AstroContainer` de `astro/container`) renderiza `src/components/Section.astro` con un título y el HTML contiene el título. Si `experimental_AstroContainer` no se exporta con ese nombre o falla el render, registrar el hallazgo y reducir el smoke a (a) más una prueba de TS puro, avisando que la Container API queda sin verificar para 3b y 4a.
- [x] 2.5 GREEN: ejecutar `pnpm test` con 0. Verificación: `pnpm test`; además `pnpm check` y `pnpm build` siguen en verde.
- [x] 2.6 Actualizar `openspec/config.yaml` según D20: `test_command: "pnpm test"`, `testing.runner: vitest`, `layers.unit: true`, `layers.integration: true`, `strict_tdd: true`, eliminar `strict_tdd_note`; `rules.apply` y `rules.verify` pasan a citar `pnpm test`. Spec: `quality-gates / Strict TDD habilitado` ("Configuración actualizada"). Verificación: lectura del archivo.
- [x] 2.7 Cierre de PR 2: `pnpm test`, `pnpm check`, `pnpm build` con 0.

## Phase 3: PR 3a — Esquema del CV y accesor tipado (Strict TDD)

**Puerta previa: Q3, Q4 y Q5 RESUELTAS por el usuario (ya no provisionales): Q3 = Zod con `astro/zod`; Q4 = conservar el relleno como opcional; Q5 = corregir `key`→`keywords`, los errores de prosa y typos similares en un commit aparte solo de contenido.** Spec: `cv-data-contract / Fuente única de tipos del CV`, `Accesor tipado del CV`, `Detección de datos inválidos o incompletos`, `Corrección estructural de la habilidad PL/SQL`, `Corrección de errores tipográficos de prosa`, `Secciones de relleno opcionales`. Decisiones: D6, D8, D9. Comando de unidad: `pnpm test src/lib`. Depende de PR 2. Nota: Q3/Q4/Q5 están decididas (ver arriba); la columna "Si cambia" de las puertas ya no aplica a 3a.

- [x] 3.1 RED `src/lib/cv-schema.test.ts` (Q3): crear la prueba con fixtures en el propio test y `safeParse`: (a) fixture mínimo válido pasa; (b) `work[].endDate: null` pasa; (c) fecha `2024/08/01` falla; (d) `acknowledgments` ausente falla; (e) `basics.name` ausente falla y `error.issues[].path` contiene `basics`/`name`; (f) un número dentro de `work[].highlights` falla y la ruta es `work.0.highlights.0`. Spec: "Un campo obligatorio ausente falla", "Un tipo de dato incorrecto falla". Verificación RED: `pnpm test src/lib/cv-schema.test.ts` falla porque `@/lib/cv-schema` no existe (registrar).
- [x] 3.2 RED `src/lib/cv-schema.test.ts` (Q4, Q5): agregar (g) fixture sin `volunteer`, `awards`, `certificates`, `publications`, `interests` ni `references` pasa ("Sección de relleno ausente es válida"); (h) skill sin `keywords` falla **[Q5 resuelta]** (si Q5 = no tocar contenido: invertir a "skill sin keywords se acepta"). Verificación RED: sigue fallando por módulo inexistente.
- [x] 3.3 GREEN: crear `src/lib/cv-schema.ts` con `import { z } from "astro/zod"` y solo el subconjunto común Zod 3/4 (`z.object`, `z.string`, `z.number`, `z.boolean`, `z.array`, `.nullable()`, `.optional()`, `.regex()`, `z.infer`; sin `.url()`, `.email()`, `.passthrough()`, `.strict()`, `datetime`, ni mensajes personalizados). Declarar todo lo que se renderiza: `work[].city`, `work[].country`, `acknowledgments.summary`, `projects[].github` opcional; fechas con `.regex(/^\d{4}-\d{2}-\d{2}$/)`; secciones de relleno `.optional()` [Q4 resuelta]; exportar `CvSchema`, `CV`, `Work`, `Skill`, `Profile` (y los demás subtipos). Verificación GREEN: `pnpm test src/lib/cv-schema.test.ts` con 0. Inspeccionar `cv.json` real (read-only) para no omitir campos.
- [x] 3.4 RED `src/lib/cv.test.ts`: importar `@/lib/cv` (aún inexistente) y probar sobre el `cv.json` real: parsea; cada `work` cumple `startDate <= endDate` (cuando `endDate` no es null); `basics.profiles` no vacío; cada skill con `keywords` no vacío; el skill PL/SQL tiene `keywords` y no `key`; ninguna de las cadenas "TypeScritp", "directamentetación", "Licenciadoen" aparece en el JSON serializado. Spec: "El `cv.json` real es válido", "Habilidad PL/SQL con keywords", "Sin errores tipográficos conocidos". Verificación RED: `pnpm test src/lib/cv.test.ts` falla (módulo inexistente).
- [x] 3.5 GREEN parcial: crear `src/lib/cv.ts` con `import raw from "@cv"`, `export const cv: CV = CvSchema.parse(raw)` y exports con nombre (`basics`, `work`, `education`, `skills`, `languages`, `projects`, `acknowledgments`). Verificación: `pnpm test src/lib/cv.test.ts` sigue fallando solo por `key` en PL/SQL y los errores de prosa (RED natural, design §Estrategia de pruebas); registrar los fallos restantes.
- [x] 3.6 GREEN (commit separado de contenido, Q5 resuelta): corregir en `cv.json` `skills[PL/SQL].key` → `keywords` y los tres errores de prosa ("TypeScritp" ×2, "directamentetación", "Licenciadoen"). Q4: no eliminar secciones de relleno. Verificación: `pnpm test src/lib` con 0.
- [x] 3.7 REFACTOR: revisar `src/lib/cv-schema.ts` y `src/lib/cv.ts` (nombres, subtipos exportados, ausencia de duplicación entre sub-esquemas) sin cambiar el comportamiento. Verificación: `pnpm test src/lib` y `pnpm check` con 0.
- [x] 3.8 Cierre de PR 3a: `pnpm test`, `pnpm check`, `pnpm build` con 0; comparar `dist/index.html` normalizado (formatear ambos con Prettier antes del diff) contra la referencia de 1.1: las únicas diferencias esperadas son las correcciones de prosa de Q5. Registrar resultado en el PR. Spec: `cv-data-contract / Sin cambio de renderizado`.

Estado PR 3a: 8/8 completas en la rama `chore/technical-cleanup-3a-cv-schema` (evidencia RED/GREEN y diff de `dist/` en `apply-progress.md`, Lote 3). Corrección de contenido en commit aparte (`182b124`); el contador de líneas autoradas (439, sin lockfile) excede 400: el usuario ACEPTÓ `size:exception` el 2026-10-09 en lugar de dividir.

## Phase 4: PR 3b — Componentes al accesor y `Section` tipado (Strict TDD)

Spec: `cv-data-contract / Accesor tipado del CV` ("Componentes consumen el accesor"), `Fuente única de tipos del CV` ("Una sola definición de tipos"), `Props tipadas y flag booleano en Section`. Decisiones: D7, D10, D14. Comando de unidad: `pnpm test src/components/Section.test.ts`. Depende de PR 3a.

- [x] 4.1 RED `src/components/Section.test.ts` (Container API `renderToString`): (a) `printed` omitido → el HTML no contiene `no-print`; (b) `printed={false}` → contiene `no-print`; (c) `title` renderiza un `<h2>` con el título; (d) el HTML no contiene un `<script>` vacío. Spec: "Section con Props tipadas", "Sin script vacío". Verificación RED: `pnpm test src/components/Section.test.ts` falla en (b) y (d) contra el `Section.astro` actual (que usa `printed="0"` y trae `<script>` vacío); registrar.
- [x] 4.2 GREEN: editar `src/components/Section.astro`: `interface Props { title?: string; printed?: boolean }`, `const { title, printed = true } = Astro.props`, `className = printed ? "" : "no-print"`, eliminar el `<script>` vacío y los comentarios de servidor/cliente (D10; desvío desde la unidad 4 de la propuesta, constancia en el PR). Verificación: `pnpm test src/components/Section.test.ts` con 0.
- [x] 4.3 Editar `src/components/sections/Acknowledgments.astro`: `printed="0"` → `printed={false}` y import desde `@/lib/cv`. Verificación: `pnpm check` con 0.
- [x] 4.4 Cambiar a `import { ... } from "@/lib/cv"` en `src/pages/index.astro`, `src/layouts/Layout.astro`, `src/components/KeyboardManager.astro`, `src/components/sections/Hero.astro`, `src/components/sections/About.astro`, `src/components/sections/Experience.astro`, `src/components/sections/Education.astro`, `src/components/sections/Projects.astro`, `src/components/sections/Skills.astro` (D7; solo cambio de import, sin tocar más lógica en KeyboardManager, Hero ni Skills). Spec: "Componentes consumen el accesor". Verificación: `rg '@cv' src` solo coincide en `src/lib/cv.ts` y en `src/lib/smoke.test.ts` (read-only, prueba del alias de 2.4); `pnpm check` con 0.
- [x] 4.5 Eliminar `src/cv.d.ts` (duplicado sin uso, D14). Verificación: `pnpm check` con 0; `rg "cv.d" src` sin coincidencias.
- [x] 4.6 REFACTOR: revisar `Section.astro` y los imports tocados (orden, sin imports muertos). Verificación: `pnpm test`, `pnpm check` con 0.
- [x] 4.7 Cierre de PR 3b: `pnpm test`, `pnpm check`, `pnpm build` con 0; el diff normalizado de `dist/index.html` contra el build de cierre de PR 3a no debe mostrar diferencias de contenido (diferencias solo de espacios en blanco se revisan y se anotan). Spec: `cv-data-contract / Sin cambio de renderizado`.

Estado PR 3b: 7/7 completas en la rama `chore/technical-cleanup-3b-section-props` (apilada sobre 3a; commits `80bfaf3` y `7d99aa1`, evidencia en apply-progress, Lote 4). Desvío: 4.1(b) no fue RED (ver apply-progress); 4.4 se verificó con una prueba de código fuente (`src/lib/single-source.test.ts`); `rg '@cv' src` también coincide en `src/lib/cv.test.ts` (prueba de 3a, permitida). `dist/index.html` idéntico salvo espacios en blanco.

## Phase 5: PR 4a — Registro de íconos, `SocialIcon` y caracterización (Strict TDD)

**Puerta previa: Q6 y Q7 resueltas.** Spec: `social-icon-rendering / Registro compartido de íconos`, `Fallback para redes desconocidas`, `Íconos sin coincidencia conservados`; `cv-data-contract / Fuente única de tipos del CV` (tipado de `SocialIcon`, evaluado al cierre de 4a por D14). Decisiones: D11, D12, D13 (parcial), D14. Comando de unidad: `pnpm test src/lib/icons.test.ts src/components/icons src/pages`. Depende de PR 3b. Si el PR supera 400 líneas, dividir: PR 4a0 = 5.1-5.2 (caracterización).

- [x] 5.1 RED/caracterización `src/pages/index.test.ts` (Container API sobre `src/pages/index.astro`): el HTML contiene el nombre, el label, los títulos de sección, la URL de cada perfil, los nombres de las habilidades y el título "Agradecimientos" (aserciones de texto, sin snapshot de markup). Debe quedar **verde antes de refactorizar** Hero/KeyboardManager (protege 4 y 6). Verificación: `pnpm test src/pages/index.test.ts` con 0 sobre el código actual. Si la Container API no puede renderizar `index.astro` (CSS de `hotkeypad` o `<script>` del cliente), reemplazar por aserción manual sobre `dist/index.html` tras `pnpm build`, fuera de `pnpm test` (riesgo declarado en el diseño), y registrar el desvío.
- [x] 5.2 Registrar en el PR el HTML normalizado de `dist/index.html` (post-3b) como referencia para 4b. Verificación: `pnpm build` con 0.
- [x] 5.3 RED `src/lib/icons.test.ts`: (a) cada red conocida (`GitHub`, `LinkedIn`, `X`) devuelve su ícono, no el fallback; (b) `getSocialIcon("Mastodon")` devuelve el fallback con `title = "Mastodon"`, no lanza y nunca devuelve `undefined`; (c) coincidencia exacta: `getSocialIcon("GitHub")` ≠ fallback y `getSocialIcon("github")` devuelve el fallback con `title = "github"` sin lanzar; (d) `renderSvg`: tamaño por defecto 16, `style` aplicado, `title` escapado (`"<x>"` no genera etiqueta) y `style` escapado; (e) toda red de `basics.profiles` en `@/lib/cv` es conocida (invariante de datos); (f) `isKnownNetwork`. Spec: "Resolución unitaria del fallback", "Coincidencia exacta del nombre de red", "Redes conocidas resuelven desde el registro". Verificación RED: falla por módulo inexistente.
- [x] 5.4 RED `src/lib/icons.test.ts` (habilidades): (g) `resolveSkillIconKey` resuelve los 4 alias (`Next.js→Next`, `Astro→AstroBuild`, `PL/SQL→Oracle`, `LaTeX→Latex`), identidad para claves del registro y `undefined` para desconocidos; (h) **nota Q7 [provisional]**: prueba que calcula las claves de `SKILL_ICON_KEYS` sin coincidencia con ninguna habilidad de `cv.json` y afirma que son exactamente `Next`, `Swift`, `SwiftUI`, `Kotlin`, `Flutter`, con un comentario/`describe` que documenta que se conservan a propósito. Spec: "Íconos sin uso documentados". Verificación RED: falla por módulo inexistente.
- [x] 5.5 GREEN: crear `src/lib/icons.ts` (TS puro, sin imports de `.astro`) con `SvgIcon`, `SOCIAL_NETWORKS`, `SocialNetwork`, `SOCIAL_ICONS`, `FALLBACK_SOCIAL_ICON` (ícono genérico de enlace), `isKnownNetwork`, `getSocialIcon` (búsqueda exacta, fallback con `title = network`), `renderSvg(icon, { size = 16, style })` con escape de `title` y `style`, `SKILL_ICON_KEYS` (incluye `Next`, `Swift`, `SwiftUI`, `Kotlin`, `Flutter` [Q7 provisional]), `SkillIconKey` y `resolveSkillIconKey`. Tomar los paths SVG de los íconos actuales (`src/assets/icons/GitHub.astro`, `src/assets/icons/LinkedIn.astro`, `src/assets/icons/X.astro` y el SVG en línea de `src/components/KeyboardManager.astro`, todos (read-only) en esta tarea). Verificación GREEN: `pnpm test src/lib/icons.test.ts` con 0.
- [x] 5.6 RED `src/components/icons/SocialIcon.test.ts` (Container API): (a) `network: "GitHub"` contiene el path de GitHub; (b) `network: "Mastodon"` contiene el path del fallback y no la cadena `undefined`. Verificación RED: falla (componente inexistente). Evidencia: RED (módulo `SocialIcon.astro` inexistente, exit 1) y luego 3/3 verde (`e86ae2c`).
- [x] 5.7 GREEN: crear `src/components/icons/SocialIcon.astro` con `interface Props { network: string; size?: number; style?: string }` y `<Fragment set:html={renderSvg(getSocialIcon(network), { size, style })} />`. Verificación: `pnpm test src/components/icons` con 0. Evidencia: `pnpm test src/components/icons` 3/3 (`e86ae2c`).
- [x] 5.8 Editar `src/components/sections/Hero.astro`: reemplazar el mapa local de red a componente por `SocialIcon` (D11; sin mapa propio). Spec: "Sin mapas duplicados". Verificación: `pnpm test src/pages/index.test.ts` sigue en verde (caracterización), `pnpm check` con 0. Evidencia: `5d86bfb`; `pnpm test` 56/56, `pnpm check` 0 errores.
- [x] 5.9 Editar `src/assets/icons/GitHub.astro`: convertir en envoltorio de `SocialIcon network="GitHub"` (sigue sirviendo a `Skills.astro`; elimina de paso el `</svg\n>` problemático). Verificación: `pnpm check` y `pnpm test` con 0. Evidencia: `feffed0`; test 56/56, check 0 errores.
- [x] 5.10 Eliminar `src/assets/icons/LinkedIn.astro`, `src/assets/icons/X.astro` y `src/types.d.ts` (D14; el tipo `SocialIcon` de `any` queda reemplazado por `SocialNetwork`/`SvgIcon`). Verificación: `rg "types.d|icons/LinkedIn|icons/X" src` sin coincidencias; `pnpm check` con 0. **Parcial**: LinkedIn.astro y X.astro eliminados (`613bb39`). `src/types.d.ts` se CONSERVA: `KeyboardManager.astro` aún importa `SocialIcon` de `@/types`; se elimina en 4b junto con el mapa local de KeyboardManager (nuevo ítem 6.x/4b).
- [x] 5.11 REFACTOR: revisar `src/lib/icons.ts`, `SocialIcon.astro` y `Hero.astro` (nombres, sin duplicación de paths) sin cambiar comportamiento. Verificación: `pnpm test` y `pnpm check` con 0. Evidencia: revisión sin cambios necesarios (paths definidos solo en `icons.ts`; Hero sin mapa propio).
- [x] 5.12 Verificación manual de integración (spec "Perfil social desconocido no rompe el build"): crear una copia temporal de `cv.json` con un perfil `mastodon` agregado (no commiteada), ejecutar `pnpm build` y comprobar salida 0 y que el HTML contiene el path del fallback y no `undefined`; descartar la copia y registrar comando y resultado en el PR. Verificación: salida 0 registrada. Evidencia: `cv.json` temporal con perfil `mastodon` (jq, restaurado desde copia en scratchpad): `pnpm build` exit 0; el HTML contiene `<title>mastodon</title>` y el path del fallback, 0 coincidencias de `undefined`; `git status` sin cambios en `cv.json`.
- [x] 5.13 Cierre de PR 4a: `pnpm test`, `pnpm check`, `pnpm build` con 0; diff normalizado de `dist/index.html` vs 5.2: diferencias esperadas solo en el SVG de Hero (atributos uniformes de `renderSvg`, `<title>`); revisar y aceptar en el PR. Comprobar el escenario "Tipos completos / sin tipos sin usar" (D14): `rg "SocialIcon = Record" src` sin coincidencias. Evidencia: `pnpm test` 8 archivos/56 pruebas, `pnpm check` 0 errores (1 hint previo), `pnpm build` exit 0; `diff -w` normalizado vs dist-3b: única diferencia, orden de atributos `height/width` del SVG de LinkedIn en Hero (sin cambio de `<title>`). `rg "SocialIcon = Record" src` aún coincide en `src/types.d.ts` (diferido a 4b, ver 5.10).

**División del PR 4a (decisión del usuario, 2026-10-09, según la contingencia del diseño).** PR 4a0 = SOLO `667cb5f` (caracterización `src/pages/_index.test.ts`, 50 líneas; rama `chore/technical-cleanup-4a0-characterization`). PR 4a = `1dc66d6`, `e86ae2c`, `5d86bfb`, `feffed0`, `613bb39` (385 líneas reales: +331/-54; rama `chore/technical-cleanup-4a-icon-registry`, apilada sobre 4a0). Tareas 5.1-5.2 pertenecen a 4a0.

Estado PR 4a: 13/13 completas, con desvío en 5.10 (`src/types.d.ts` se elimina en 4b porque `KeyboardManager.astro` aún lo importa). Desvío 5.1: la prueba vive en `src/pages/_index.test.ts` (el prefijo `_` evita que Astro la enrute como página).

## Phase 6: PR 4b — KeyboardManager, Skills y assets (Strict TDD donde hay lógica)

Spec: `social-icon-rendering / Eliminación de duplicación y código muerto`, `Comportamiento de KeyboardManager sin cambios`, `Salida del build sin regresiones`, `Registro compartido de íconos` (habilidades). Decisiones: D13, D15. Comando de unidad: `pnpm test`. Depende de PR 4a. (Q6 provisional: fuera de alcance; si Q6 lo incorpora, abrir PR 4c adicional con `src/lib/theme.ts` y RED propio, y no editar la lógica de tema aquí.)

- [x] 6.1 RED: extender `src/lib/icons.test.ts` con una aserción de exhaustividad que verifique que cada clave de `SKILL_ICON_KEYS` está en la lista de claves que `Skills.astro` debe mapear (lista incluida en el test) y que `resolveSkillIconKey` cubre cada habilidad de `cv.json` o devuelve `undefined` solo para las no iconizadas esperadas. Verificación RED: falla si la lista del test se desincroniza (registrar cuál habilidad queda `undefined` hoy) antes de cablear `Skills.astro`. Evidencia: RED en `src/lib/icons.test.ts`: 2 fallos (`Skills.astro` sin `resolveSkillIconKey` ni `satisfies`); las pruebas de exhaustividad de claves y de habilidades de `cv.json` ya pasaban (el registro incluye `MySQL`; solo `Bootstrap` queda `undefined`, esperado), por lo que actúan como guarda de sincronía. `17b7f4e`.
- [x] 6.2 GREEN: editar `src/components/sections/Skills.astro`: reemplazar la cadena de ternarios por `resolveSkillIconKey(name)` y declarar el mapa de componentes `{...} satisfies Record<SkillIconKey, unknown>` (D13). Verificación: `pnpm check` y `pnpm test` con 0. Evidencia: GREEN `pnpm test` 60/60, `pnpm check` 0 errores (`17b7f4e`).
- [x] 6.3 Editar `src/components/KeyboardManager.astro` (D15): eliminar las líneas del SVG en línea de redes, usar `renderSvg(getSocialIcon(network), { style: "margin-right: 8px" })`, eliminar los 5 `console.log` y reemplazar `var event` por `const event`. No modificar la lógica de comandos de tema ni `ctrl+C`; los íconos de imprimir y temas se mantienen en línea. Spec: "Sin console.log en src", "Sin SVG de redes en línea", "Comportamiento preservado". Verificación: `rg "console\.log" src` sin coincidencias; `rg "<svg" src/components/KeyboardManager.astro` solo en íconos de comandos; `pnpm check` con 0; `pnpm test src/pages/index.test.ts` verde. Evidencia: RED `src/components/KeyboardManager.test.ts` (lectura `?raw`): 5 fallos de 7 (sin `renderSvg`, paths duplicados, import `@/types`, `console.log`, `var`); GREEN 67/67; `rg "console\.log" src` sin coincidencias; `<svg` solo en footer y 4 íconos de comandos; `pnpm check` 0 errores (`d905885`).
- [x] 6.4 Eliminar `src/assets/astro.svg` y `src/assets/background.svg` (borrado puro, sin referencias). Verificación: `rg "astro.svg|background.svg" src` sin coincidencias; `pnpm build` con 0. Evidencia: RED `src/lib/dead-code.test.ts` (2 fallos: `types.d.ts`, SVG existen); GREEN 69/69 tras `git rm` de `src/types.d.ts`, `astro.svg`, `background.svg`; `rg "astro.svg|background.svg" src` solo en la prueba; `pnpm build` 0 (`2f1b454`). Incluye la eliminación de `src/types.d.ts` heredada de 5.10.
- [x] 6.5 REFACTOR: revisar `KeyboardManager.astro` y `Skills.astro` (imports muertos, nombres) sin cambiar el comportamiento. Verificación: `pnpm test`, `pnpm check` con 0. Evidencia: revisión de imports y nombres sin cambios necesarios; `pnpm test` y `pnpm check` en verde.
- [x] 6.6 Cierre de PR 4b: `pnpm test`, `pnpm check`, `pnpm build` con 0; diff normalizado de `dist/index.html` vs el de cierre de 4a: solo diferencias esperadas (spec "Comparación de dist antes y después"); el comportamiento de tema y `ctrl+C` no cambia (comparar la lógica con la previa). Señalar en el PR el borrado de los SVG como borrado puro. Evidencia: `pnpm test` 9 archivos/69 pruebas, `pnpm check` 0 errores (1 hint previo), `pnpm build` exit 0; `rg "SocialIcon = Record" src` sin coincidencias; diff -w normalizado de `dist/index.html` vs dist-4a: solo (a) atributos/espaciado del SVG de LinkedIn y GitHub en `data-info`, (b) `<title>GitHub</title>` nuevo en el SVG de GitHub (esperado), (c) hash del script de KeyboardManager (11522 -> 11364 bytes, por quitar 5 `console.log`); lógica de tema y `ctrl+C` intacta (3 llamadas `handleToggleClick`, `hotkey: "ctrl+C"` verificados). Borrado puro: `astro.svg` (-15) y `background.svg` (-1).

## Phase 7: PR 5a — ESLint y Prettier, configuración y correcciones de lint

**Puerta previa: Q8 RESUELTA (2026-10-09): defaults de Prettier, sin opciones propias.** Spec: `quality-gates / Lint`, `Formato`, `Restricción de importación de @cv`, `Scripts de verificación`. Decisiones: D1, D16, D20. Comando de unidad: `pnpm lint`. Depende de PR 4b. Sin TDD posible para la configuración de herramientas; las reglas se comprueban con pruebas negativas manuales.

- [x] 7.1 Agregar devDependencies `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-astro`, `eslint-config-prettier`, `prettier`, `prettier-plugin-astro` y los scripts `"lint": "eslint ."`, `"format": "prettier --write ."`, `"format:check": "prettier --check ."` en `package.json`; regenerar `pnpm-lock.yaml`. Spec: `Scripts de verificación` (completa los seis scripts). Evidencia: `44104dd`; eslint 10.12.0, @eslint/js 10.0.1, typescript-eslint 8.71.1, eslint-plugin-astro 3.2.1, eslint-config-prettier 10.1.8, prettier 3.9.9, prettier-plugin-astro 1.1.0; pnpm 11 no pidió allowBuilds nuevo.
- [x] 7.2 Crear `eslint.config.js` (flat): `@eslint/js` recommended, `typescript-eslint` recommended, `eslint-plugin-astro` `flat/recommended`, `eslint-config-prettier` al final; reglas `no-console: "error"`, `no-var: "error"`, `@typescript-eslint/no-explicit-any: "error"`, `no-restricted-imports` que prohíbe `@cv` salvo en `src/lib/cv.ts` (override con la regla apagada para ese archivo); ignorar `dist/`, `.astro/`, `node_modules/` (D16). Spec: "Import directo de `@cv` falla el lint", "`src/lib/cv.ts` puede importar `@cv`". Evidencia: `44104dd`. Desvío: el override de `no-restricted-imports` cubre `src/lib/cv.ts`, `src/lib/cv.test.ts` y `src/lib/smoke.test.ts` (pruebas del alias, permitidas desde 3b); override adicional de `@typescript-eslint/triple-slash-reference` solo para `src/env.d.ts` (archivo convencional de Astro).
- [x] 7.3 Crear `.prettierrc` (valores por defecto + `"plugins": ["prettier-plugin-astro"]` y override `*.astro` → `parser: "astro"`) **[Q8 resuelta]** y `.prettierignore` (`dist`, `.astro`, `pnpm-lock.yaml`, `openspec/`, `public/`). Verificación: `pnpm exec prettier --check .prettierrc` ejecuta sin error de configuración. Evidencia: `.prettierignore` agrega `node_modules`; `pnpm exec prettier --check .prettierrc eslint.config.js` exit 0.
- [x] 7.4 Corregir los errores de lint (no de formato) que reporte `pnpm lint`, sin tocar lógica salvo lo estrictamente necesario. Verificación: `pnpm lint` con 0 (con `eslint-config-prettier`, pasa aunque el formato no esté aplicado). Evidencia: 2 hallazgos base: `highlights` sin uso en `Experience.astro` (corregido, `5996f3a`) y `triple-slash-reference` en `src/env.d.ts` (override de config); `pnpm lint` exit 0.
- [x] 7.5 Pruebas negativas manuales (registrar comando y código != 0 en el PR, cambios temporales no commiteados): (a) variable declarada y no usada → `pnpm lint` != 0; (b) un componente que importa `@cv` directo → `pnpm lint` != 0; (c) un archivo con indentación distinta → `pnpm format:check` != 0. Spec: "Una violación hace fallar el lint", "Archivo sin formatear falla". Evidencia: (a) variable sin uso: `pnpm lint` exit 1; (b) `import raw from "@cv"` en archivo temporal: exit 1 por `no-restricted-imports`; (c) archivo mal formateado: `prettier --check` exit 1; temporales eliminados, `git status` limpio.
- [x] 7.6 Actualizar `openspec/config.yaml` (D20): `linter: "pnpm lint"`, `formatter: "pnpm format:check"`, `quality.linter: true`, `quality.formatter: true`. Verificación: lectura del archivo. Evidencia: `openspec/config.yaml` actualizado (no versionado).
- [x] 7.7 Cierre de PR 5a: `pnpm lint`, `pnpm check`, `pnpm test`, `pnpm build` con 0. Nota: `pnpm format:check` aún puede fallar hasta 5b; es esperado y se anota en el PR. Evidencia: `pnpm lint` 0, `pnpm check` 0 errores, `pnpm test` 69/69, `pnpm build` 0; `pnpm format:check` falla (exit 1) en 40 archivos sin formatear: esperado hasta 5b.

Estado PR 5a: 7/7 completas en la rama `chore/technical-cleanup-5a-lint-config` (commits `5996f3a`, `44104dd`; 66 líneas autoradas sin lockfile). Q8 resuelta. Evidencia en apply-progress, Lote 8.

## Phase 8: PR 5b (+5c) — Commit de formato mecánico aislado

Spec: `quality-gates / Formato` ("Formato verificado", "Commit de formato aislado"). Decisión: D16. **Excepción de tamaño necesaria** (`size:exception` o tratamiento como salida mecánica; ver Review Workload Forecast). Depende de PR 5a. Sin TDD: salida mecánica de herramienta. Comando de unidad: `pnpm format:check`.

- [x] 8.1 Confirmar la excepción de tamaño para 5b (decisión del usuario/mantenedor, no se asume). Sin la excepción, no ejecutar 8.2. Evidencia: `size:exception` aceptada por el usuario el 2026-10-09 (sin dividir por directorios).
- [x] 8.2 Ejecutar únicamente `pnpm format` sobre el árbol (sin ediciones manuales ni de lógica) y commitear solo eso con el mensaje `style: apply prettier formatting`. Verificación: `pnpm format:check` con 0. Evidencia: `d8afb4ee88e4f72279d83be7d07f89d45103a8a9` (mensaje `style: format codebase with prettier`, por indicación del usuario); 40 archivos, +1154/-1178; árbol limpio previo; `pnpm format:check` exit 0.
- [x] 8.3 Verificar que no hay cambios de lógica: `git diff -w <padre> <5b>` no muestra cambios de lógica (salida revisada y registrada en el PR) y `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm check` con 0. Evidencia: `git diff -w` deja 37 archivos, +316/-340: solo reflujo de líneas (ver apply-progress Lote 9); comparación sin ningún espacio: 26 archivos idénticos, 14 difieren solo en punto y coma, comillas, coma final y cierre `>`/`}` de JSX; lint 0, check 0 errores, test 69/69, build 0; dist/index.html idéntico con `diff -w` (solo espacio en bordes de texto, +45 bytes).
- [x] 8.4 5c: crear `.git-blame-ignore-revs` con el SHA del commit de 8.2 en un commit propio (< 5 líneas); puede viajar con PR 5b o PR 6a. Verificación: `git blame --ignore-revs-file .git-blame-ignore-revs <archivo>` omite el commit de formato; `pnpm format:check` con 0. Evidencia: `b5ea647ae9de97a95134841bf00311d63d1cecdf` (3 líneas); `git blame` sin la opción atribuye `src/lib/cv.ts` líneas 1-2 a `d8afb4ee`, con `--ignore-revs-file` a `1e777397`; `pnpm format:check` exit 0.

Estado PR 5b/5c: 4/4 completas en la rama `chore/technical-cleanup-5b-format` (commits `d8afb4e`, `b5ea647`). `size:exception` en 5b aceptada el 2026-10-09.

## Phase 9: PR 6a — Node 22 y Astro 6

**Puerta previa: Q1 y Q2 resueltas** (Q2 condiciona `engines`/`.nvmrc`; Q1 condiciona `site`/`base`). Spec: `quality-gates / Build`, `Versión de Node fijada`. Decisiones: D17, D20. Comando de unidad: `pnpm test`. Depende de PR 5b. Re-verificar los supuestos no verificados de D5 y D17 (vitest con Vite 7, `getViteConfig`, `experimental_AstroContainer`, `astro/zod`). PR aislado (permite detenerse aquí si 6b falla).

- [x] 9.1 Confirmar `node -v` >= 22.12 (si no, documentar el bloqueo y no continuar). Generar el `dist/` de referencia previo (con Astro 5) en el scratchpad para el diff de 9.6. Evidencia: Node v26.8.2 (cumple >=22.12; no se pudo validar con Node 22: `mise` solo tiene 26.8.2 instalado y no se instaló nada global, verificación pendiente); `dist-5c` generado en el HEAD `b5ea647` con Astro 5.18.2.
- [x] 9.2 Fijar Node **[Q2 RESUELTA: Node 22]**: `engines.node: ">=22.12"` en `package.json` y crear `.nvmrc` con `22`. Spec: "Node fijado". Verificación: lectura de ambos archivos. Evidencia: `5514580` (`engines.node: ">=22.12"`, `.nvmrc` = `22`); Astro 6.4.8 declara `engines.node >=22.12.0`.
- [x] 9.3 Subir a `astro@^6`, `@astrojs/check` compatible y la versión de vitest compatible con Vite 7; regenerar `pnpm-lock.yaml`. Verificación: `pnpm install --frozen-lockfile` con 0. Evidencia: `d932d86`; astro 6.4.8 (vite 7.3.7, zod 4.6.5), `@astrojs/check` 0.9.10 y vitest 5.0.3 sin cambios (ya resuelve con vite 7.3.7 como peer); `pnpm install --frozen-lockfile` exit 0.
- [x] 9.4 Corregir lo que rompa el upgrade (API de Zod 3→4 en `src/lib/cv-schema.ts`, Container API, tipos). Las aserciones de las pruebas existentes NO deben cambiar; un cambio de aserción es señal de regresión que se justifica en el PR. Verificación: `pnpm check`, `pnpm lint`, `pnpm test`, `pnpm build` con 0. Evidencia: no hizo falta ningún cambio de código; `src/lib/cv-schema.ts` (subconjunto común Zod 3/4) pasa con Zod 4 sin tocar; Container API (`experimental_AstroContainer`), `getViteConfig` y `astro/zod` intactos; las 69 pruebas pasan sin cambiar aserciones; check 0 errores, lint 0, test 69/69, build 0 (solo avisos de Rollup sobre comentarios `@__PURE__` de zod 4.6.5).
- [x] 9.5 Verificar `hotkeypad` 1.0.2 con Vite 7 (carga del sitio en `pnpm preview` y `KeyboardManager` operativo). Evidencia: verificación manual del usuario (2026-10-09) en el navegador con Astro 6.4.8 / Vite 7: el command palette de hotkeypad (Ctrl+K), los atajos y el cambio de tema funcionan igual que antes; además `pnpm preview` sirve `/` y el script con 200 y el bundle cliente era idéntico al de Vite 6. Pendiente aparte (NO marcada como hecha): validación con Node 22 real (solo hay Node 26.8.2 vía mise; no se instaló nada global); queda para CI.
- [x] 9.6 Comparar `dist/index.html` normalizado (formateado con Prettier) con el de referencia de 9.1; revisar y aceptar explícitamente las diferencias de espacios en blanco en el PR. Spec: `social-icon-rendering / Salida del build sin regresiones`. Evidencia: `_astro/*.css` y `.js` byte a byte idénticos (mismos hashes), `me.jpeg` y `favicon.svg` idénticos; `index.html` +61 bytes: (a) las comillas de `data-info` pasan de `&#34;` a `&quot;` (equivalentes) y (b) espacio inicial en 6 etiquetas `<section>`/`</main>`/`</body>` y sin salto final; idéntico sin espacios y con las entidades normalizadas. Sin cambios de contenido.
- [x] 9.7 Actualizar `openspec/config.yaml` (D20): `context`/`stack` reflejan Astro 6. Cierre de PR 6a: `pnpm check`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm build` con 0. Evidencia: `config.yaml` (no versionado) actualizado y gates en verde (ver 9.4); solo dependía de 9.5, ya cerrada con la verificación manual del usuario. La validación con Node 22 real sigue pendiente para CI.

Estado PR 6a: 7/7 completas (9.1-9.7; 9.5 por verificación manual del usuario; validación con Node 22 real pendiente para CI) en la rama `chore/technical-cleanup-6a-astro-6` (apilada sobre 5b; commits `5514580`, `d932d86`; 6 líneas autoradas sin lockfile). Q1/Q2 resueltas (ver puertas); la reformulación de ci-deploy/D19/unidad 8 por Vercel ya está aplicada en los artefactos (fuera de este PR).

## Phase 10: PR 6b — Astro 7 (con criterio de parada)

Spec: `quality-gates / Build` ("Versión mayor de Astro"). Decisión: D17. Comando de unidad: `pnpm test`. Depende de PR 6a. PR aislado. **Criterio de parada:** si `hotkeypad` o vitest no funcionan con Vite 8 sin parches, o las correcciones de markup superan ~150 líneas o cambian contenido visible, no se mergea 6b; queda Astro 6.x y se documenta el bloqueo (el spec admite 6.x documentado).

- [x] 10.1 Generar `dist/` de referencia con Astro 6 (post-6a) en el scratchpad. Evidencia: `pnpm build` en el HEAD de 6a (`d932d86`, Astro 6.4.8) guardado en el scratchpad (`dist-6a`).
- [x] 10.2 Subir a `astro@^7`, `@astrojs/check` compatible y la versión de vitest compatible con Vite 8; regenerar `pnpm-lock.yaml`. Verificación: `pnpm install --frozen-lockfile` con 0. Evidencia: `6012cb2` (`build: upgrade astro to 7`): astro 7.3.8 (vite ^8.3.1, zod ^4.6.5, node >=22.12); `@astrojs/check` 0.9.10 y vitest 5.0.3 sin cambios (peer vite `^6.4.0 || ^7.0.0 || ^8.0.0`); TypeScript se queda en ^6 (TS 7 rompe `astro check`); `pnpm install --frozen-lockfile` exit 0.
- [x] 10.3 Corregir el markup que rechace el compilador Rust (p. ej. cualquier resto de `</svg\n>`) y revisar el efecto de `compressHTML: 'jsx'`; ajustar `astro.config.mjs` solo si hace falta. Medir las líneas de corrección contra el criterio de parada. Verificación: `pnpm check`, `pnpm lint`, `pnpm test`, `pnpm build` con 0. Evidencia: 0 líneas de corrección: el compilador Rust acepta el markup actual; `compressHTML` no se configuró (default `jsx`). `pnpm check` 0 errores (1 hint previo), `pnpm lint` 0, `pnpm format:check` 0, `pnpm test` 10 archivos/69 pruebas, `pnpm build` 0, sin avisos de build. Criterio de parada NO activado.
- [x] 10.4 Verificar `hotkeypad` con Vite 8 (`pnpm preview`, operativo). Registrar resultado. Evidencia PARCIAL: `pnpm preview` sirve `/`, el JS y el CSS con 200; el bundle cliente de KeyboardManager se construye con Vite 8 (11233 bytes, contiene `hotkeypad`, `ctrl+C`, `Cmd`; hash distinto al de Vite 6 por el minificador, 11364 bytes); vitest 5.0.3 funciona con Vite 8 (69/69). Sin navegador: la verificación manual del command palette con Astro 7 queda para el usuario (no se marca). Cierre (2026-10-09): verificación manual del usuario, descrita como aparente ("aparentemente sí"): con Astro 7.3.8 / Vite 8 el command palette (Ctrl+K), los atajos y el cambio de tema funcionan. RESIDUAL NO verificado: el orden de `animation-timeline` en el footer (Vite 8 lo fusionó en el shorthand `animation`) y la validación con Node 22 real (solo hay Node 26.8.2; queda para CI).
- [x] 10.5 Comparar `dist/index.html` normalizado contra 10.1; solo diferencias de espacios en blanco se aceptan (contenido visible no debe cambiar). Spec: "Comparación de dist antes y después". Evidencia: tokens de etiquetas idénticos (atributos incluidos, normalizando `data-astro-cid-*`, hashes y `&#34;`/`&quot;`); texto idéntico salvo espacios en los bordes (con `compressHTML: jsx` se pierde el espacio entre `</svg>` y "Valdivia, Chile", dentro de un `span` `display:flex; gap:.25rem`, sin efecto visual; y espacios al borde de textos de bloque). `index.html` 34410 -> 34066 bytes. CSS: mismas 132 reglas con otros formatos del minificador (`#0000` vs `transparent`, `.3s ease` vs `.3s`, `1 / 1`); observación: `animation-timeline` queda fusionado en el shorthand `animation` del footer (orden distinto al de 6a, mismo resultado esperado), no verificable sin navegador. `favicon.svg` y `me.jpeg` idénticos.
- [x] 10.6 Actualizar `openspec/config.yaml` (`context`/`stack`: versión mayor final). Cierre de PR 6b (o decisión documentada de parada en 6.x): gates completos en verde. Evidencia: `config.yaml` (no versionado) con Astro 7/Vite 8; gates completos en verde (ver 10.3) y `pnpm install --frozen-lockfile` 0. Pendiente (fuera de esta tarea): comprobación manual del command palette en Astro 7 (10.4) y Node 22 real en CI.

Estado PR 6b: 6/6 completas (10.4 cerrada por verificación manual del usuario, descrita como aparente; residual no verificado: orden de `animation-timeline` del footer y Node 22 real en CI). Rama `chore/technical-cleanup-6b-astro-7` (apilada sobre 6a; commit `6012cb2`, 1 línea autorada sin lockfile). Criterio de parada NO activado.

## Phase 11: PR 7 — README

**Puerta previa: Q9 resuelta.** Spec: `quality-gates / Documentación en README`. Decisión: D18. Comando de unidad: `pnpm format:check`. Depende de PR 6a o 6b (documenta el estado final). Sin TDD: documentación.

- [x] 11.1 Reescribir `README.md` en español **[Q9 resuelta: español neutro]**: propósito, stack, requisitos (Node, pnpm), instalación, tabla de scripts (`dev`, `build`, `preview`, `check`, `lint`, `format`, `format:check`, `test`), edición de contenido (`cv.json` validado por `src/lib/cv-schema.ts`, cómo agregar una red social y su ícono), deploy (según Q1). Sin HTML embebido ni instrucciones obsoletas. Evidencia: `19bd22a` (`docs: rewrite README for the current stack`; +140/-39 = 179 líneas autoradas de 400). Deploy documentado como Vercel (commit + push) sin afirmar ajustes de panel; no hay `vercel.json` ni workflow en el repo. Atajos tomados de `KeyboardManager.astro`; tabla de scripts verificada contra `package.json`. Desvío: se usan `<kbd>` (HTML mínimo, ya usado en el propio sitio) solo en los atajos de teclado.
- [x] 11.2 Verificar el contenido: `rg -i "ninja" README.md` sin coincidencias; cada sección exigida presente (propósito, stack, scripts, edición de `cv.json`, deploy). Spec: "README completo". Evidencia: `rg -i "ninja" README.md` 0 coincidencias; secciones propósito, stack, scripts, edición de `cv.json` y deploy presentes; los 10 scripts citados existen en `package.json`. Nota: el spec de quality-gates ya fue actualizado a español (Q9 resuelta).
- [x] 11.3 Cierre de PR 7: `pnpm format:check` con 0 (el README se formatea con Prettier) y `pnpm build` con 0. Evidencia: `pnpm format:check`, `pnpm check` (0 errores), `pnpm lint`, `pnpm test` (10 archivos/69 pruebas) y `pnpm build` todos exit 0.

Estado PR 7: 3/3 completas en la rama `chore/technical-cleanup-7-readme` (apilada sobre 6b; commit `19bd22a`). Q9 = español.

## Phase 12: PR 8 — CI y deploy

**Puerta previa: Q1 y Q2 RESUELTAS (Q1 = Vercel por commit + push, sin GitHub Pages; Q2 = Node 22).** **Decisión 3 CONFIRMADA por el usuario (2026-10-09): el CI es SOLO de gates, sin job de deploy; el despliegue lo hace Vercel al hacer push.** Spec: `ci-deploy / Ejecución de gates en CI`, `Permisos mínimos y trigger seguro`, `Despliegue externo por Vercel`, `Coherencia del dominio configurado`, `Reversibilidad del workflow`. Decisiones: D19, D2. Comando de unidad: `pnpm build`. Depende de 5a y 6a (en la cadena, tras 7). Sin TDD: configuración de infraestructura. NO se ejecuta el workflow de forma remota ni se hace push como parte de esta unidad de planificación; la ejecución real ocurre cuando el usuario publique el PR.

- [x] 12.1 Crear `.github/workflows/ci.yml` con un único job `verify`: `on: pull_request` (rama `main`) y `push` a `main` (nunca `pull_request_target`); `permissions: contents: read` a nivel de workflow; `concurrency` por ref con `cancel-in-progress`. Pasos: `actions/checkout`, `pnpm/action-setup` (lee `packageManager`), `actions/setup-node` con Node 22 (`node-version-file: .nvmrc`) y `cache: pnpm`, y en este orden `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm build`. Acciones oficiales fijadas a versión mayor. Sin job de deploy, sin `upload-pages-artifact`/`deploy-pages`, sin `pages: write` ni `id-token: write`, sin secretos. Spec: "PR dispara los gates", "Push a main dispara los gates", "Fallo de un gate falla el workflow", "Lockfile desactualizado falla", "Permisos de solo lectura", "Sin pull_request_target". Evidencia: `0b470cf` (`.github/workflows/ci.yml`, 48 líneas): triggers `pull_request`/`push` a `main`, `permissions: contents: read`, `concurrency` con `cancel-in-progress`, job único `verify` en ubuntu-latest; actions/checkout@v4, pnpm/action-setup@v4, actions/setup-node@v4 (`node-version-file: .nvmrc`, `cache: pnpm`) [versiones mayores asumidas, NO verificadas en línea].
- [x] 12.2 Validar en local la sintaxis del YAML (con la herramienta disponible, por ejemplo un parser YAML, o por lectura/`rg`) y el orden de los pasos: `rg -n "pull_request_target|pages: write|id-token|deploy-pages|upload-pages-artifact" .github` sin coincidencias; `rg -n "pnpm (install --frozen-lockfile|check|lint|format:check|test|build)" .github/workflows/ci.yml` en el orden esperado. No ejecutar el workflow remotamente ni hacer push. Spec: "Sin pull_request_target", "Permisos de solo lectura". Evidencia: YAML parseado con `python3 yaml` (claves name/on/permissions/concurrency/jobs; job `verify`); `rg` de `pull_request_target|pages:|id-token|deploy-pages|upload-pages-artifact|CNAME` sobre `.github` sin coincidencias; los 6 comandos aparecen en orden (líneas 33-48); `pnpm exec prettier --write` sin cambios.
- [x] 12.3 Verificar que el repositorio no contiene workflow de deploy ni artefactos de Pages: `fd . .github/workflows` lista solo `ci.yml`; `fd CNAME public` sin resultados; no existe `vercel.json` creado por este cambio. Confirmar con `rg site astro.config.mjs` que `site` sigue siendo `https://enzovera.dev` (coherente con Vercel; sin afirmar nada del DNS). Spec: "Sin workflow de deploy", "El CI no despliega", "`site` coherente". Evidencia: `fd . .github/workflows` = solo `ci.yml`; `vercel.json` y `CNAME` no existen; `site` = `https://enzovera.dev`.
- [x] 12.4 Registrar que la validación con Node 24 real se obtuvo en la primera ejecución del CI en GitHub Actions (en el evento pull_request sobre development y en el evento push sobre main, ambos con status 'success'), cerrando así la verificación pendiente de 9.1/9.5/9.7/10.4. Spec: "Validación con Node 24 real". CUMPLIDA (2026-10-09): el workflow ejecutó con Node 24 (del `.nvmrc` tomado por `actions/setup-node`); localmente se ejecutó con Node v26.8.2. Cubre las verificaciones pendientes 9.1, 9.5, 9.7 y 10.4. Nota: Q2 fue revisada de Node 22 a Node 24 por decisión del usuario.
- [ ] 12.5 Verificar reversibilidad: documentar en el PR cómo deshabilitar el workflow (Actions UI o `git revert`) sin afectar el despliegue de Vercel. Spec: "Deshabilitar el workflow". Cierre de PR 8: `pnpm check`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm build` con 0 en local; el workflow en verde se confirma al publicar el PR. PENDIENTE (queda `[ ]`): se documenta al abrir el PR (no se creó PR). Gates locales en 0 (install --frozen-lockfile, check, lint, format:check, test, build).

---

## Trazabilidad requisito → tareas

| Capacidad / Requisito | Tareas |
|------------------------|--------|
| cv-data-contract / Fuente única de tipos | 3.3, 4.5, 5.10, 5.13 |
| cv-data-contract / Accesor tipado | 3.5, 4.4 |
| cv-data-contract / Detección de datos inválidos | 3.1, 3.2, 3.3 |
| cv-data-contract / PL/SQL con `keywords` | 3.4, 3.6 |
| cv-data-contract / Errores de prosa | 3.4, 3.6 |
| cv-data-contract / Relleno opcional y sin cambio de render | 3.2, 3.8, 4.7 |
| cv-data-contract / `Section` con `Props` | 4.1, 4.2, 4.3 |
| cv-data-contract / Alias de tsconfig | 1.4 |
| social-icon-rendering / Registro compartido | 5.3, 5.5, 5.7, 5.8, 6.2, 6.3 |
| social-icon-rendering / Fallback | 5.3, 5.6, 5.12 |
| social-icon-rendering / Duplicación y código muerto | 6.3, 6.4 |
| social-icon-rendering / Íconos sin coincidencia | 5.4 |
| social-icon-rendering / KeyboardManager sin cambios | 6.3, 6.6 |
| social-icon-rendering / Build sin regresiones | 5.13, 6.6, 9.6, 10.5 |
| quality-gates / Scripts | 1.3, 2.2, 7.1 |
| quality-gates / Verificación de tipos | 1.3, 1.6, 1.7 |
| quality-gates / Lint | 7.2, 7.4, 7.5 |
| quality-gates / Formato | 7.3, 7.5, 8.2, 8.3 |
| quality-gates / Pruebas | 2.3, 2.4, 2.5 |
| quality-gates / Build | 1.5, 9.3, 10.2 |
| quality-gates / Gestor de paquetes | 1.2 |
| quality-gates / Restricción `@cv` | 7.2, 7.5 |
| quality-gates / Node fijado | 9.2 |
| quality-gates / Strict TDD | 2.6 |
| quality-gates / README | 11.1, 11.2 |
| ci-deploy / Gates en CI (incl. Node 24 real) | 12.1, 12.4 |
| ci-deploy / Permisos mínimos y trigger seguro | 12.1, 12.2 |
| ci-deploy / Despliegue externo por Vercel | 12.3 |
| ci-deploy / Coherencia del dominio | 12.3 |
| ci-deploy / Reversibilidad | 12.5 |

## Riesgos de dependencia

- 5b es el único PR por encima de 400 líneas y bloquea la cadena posterior hasta decidir la excepción.
- 4a es el PR de mayor riesgo de presupuesto; el plan de contingencia es el PR 4a0 (caracterización).
- Los supuestos no verificados de D5/D17 (Container API experimental, vitest con Vite 7/8, `hotkeypad`) se reverifican en 2.4, 9.4-9.5 y 10.3-10.4; un fallo en 2.4 reduce el alcance de 4.1, 5.1 y 5.6.
- Hay un único escritor de `openspec/config.yaml` por porción (1, 2, 5a, 6a/6b); no paralelizar esas porciones. Todo el plan es secuencial: la cadena 1→2→3a→3b→4a→4b→5a→5b→6a→6b→7→8 no admite paralelismo, salvo 7 y 8 (que pueden prepararse en paralelo tras 6a, pero se mergean en orden).

> Nota (Lote 14, correcciones del verify): W1, W2 y W3 resueltas en `bf744cf`, `385a25c` y `ce99ba2`. W2 elimina los 8 subtipos exportados de `cv-schema.ts` (supera la mención de "los subtipos" en D6; ver design.md).
