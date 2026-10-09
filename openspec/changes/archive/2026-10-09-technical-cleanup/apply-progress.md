# Apply-progress: technical-cleanup

Espejo en Engram: `sdd/technical-cleanup/apply-progress` (proyecto `webeevp`). Modo: Standard en PR 1 (sin runner); Strict TDD activo desde el cierre de PR 2 (`strict_tdd: true`). Estrategia: stacked-to-main.

## Lote 1: PR 1 (Fase 1, tooling base) COMPLETO 9/9

Rama: `chore/technical-cleanup-1-tooling` (desde `main`). Sin push, sin PR.

| Tarea | Estado | Evidencia |
|-------|--------|-----------|
| 1.1 Línea base | [x] | `pnpm build` exit 0; `dist/` de referencia en el scratchpad (no versionado) |
| 1.2 packageManager | [x] | `pnpm@11.3.0` (local: node v26.8.2, pnpm 11.3.0). Difiere del lockfile original (v6, pnpm 8) como anticipa D2 |
| 1.3 check + deps | [x] | `typescript@^6` (6.0.3) y `@astrojs/check@^0.9.10`; script `check` |
| 1.4 alias `@/asset` | [x] | Eliminado; `pnpm check` 0 errores |
| 1.5 `site` | [x] | `https://enzovera.dev` **[Q1 provisional]** |
| 1.6 Errores base | [x] | `astro check`: 0 errores, 0 warnings, 2 hints (variables sin usar en Experience.astro y Hero.astro); no hubo correcciones, no se divide 1a/1b |
| 1.7 Prueba negativa | [x] | Error de tipos temporal en `About.astro`: `pnpm check` exit 1 (1 error); revertido, árbol limpio, `pnpm check` exit 0 |
| 1.8 config.yaml | [x] | `typecheck_command: "pnpm check"`, `quality.type_checker: true` (archivo aún sin versionar, ver riesgos) |
| 1.9 Cierre | [x] | `pnpm check` 0, `pnpm build` 0, `diff -r` de `dist/` vs referencia: IDÉNTICO |

### Work Unit Evidence

| Evidencia | Valor |
|---|---|
| Comando focal | `pnpm check` exit 0 (0 errors, 0 warnings, 2 hints, 39 archivos) |
| Harness de ejecución | `pnpm build` exit 0 + `diff -r dist-ref dist` idéntico; prueba negativa exit 1 |
| Rollback | `git revert` de los 4 commits; el sitio compila como antes |

### Commits

- `948bbb3` build: pin pnpm 11.3.0 and regenerate lockfile
- `ced5ceb` build: add astro check script with typescript 6
- `470de1f` fix: remove redundant @/asset tsconfig alias
- `07009d7` build: set astro site (provisional Q1: https://enzovera.dev)

### Desvíos y hallazgos

1. pnpm 11 no lee lockfile v6: `pnpm install --frozen-lockfile` falla con `ERR_PNPM_LOCKFILE_BREAKING_CHANGE`; se regeneró como v9 (la resolución de astro pasó a 5.18.2). La línea base 1.1 se generó tras esa regeneración.
2. pnpm 11 bloquea scripts de build no revisados (`ERR_PNPM_IGNORED_BUILDS`). Se agregó `pnpm-workspace.yaml` con `allowBuilds` (esbuild: true, sharp: false; sharp usa binarios precompilados). No estaba en el diseño.
3. `typescript@7` (resolución por defecto) rompe `astro check` (sin API programática); se fijó `^6`. Re-evaluar en 6a/6b.
4. `@/asset` no generaba errores en `astro check`; eliminado por D3 de todos modos.
5. Tamaño: autorado sin lockfile = 21 líneas (adiciones+eliminaciones); lockfile 3.294/1.966 excluido.
6. `openspec/` y `.atl/` están sin versionar en el repo; la edición de `config.yaml` (1.8) no se commiteó.

## Lote 2: PR 2 (Fase 2, vitest y Strict TDD) COMPLETO 7/7

Rama: `chore/technical-cleanup-2-vitest` (apilada sobre `chore/technical-cleanup-1-tooling`). Sin push, sin PR. Fase de introducción del runner: sin TDD de código posible; la evidencia RED/GREEN es la de infraestructura exigida por el diseño.

| Tarea | Estado | Evidencia |
|-------|--------|-----------|
| 2.1 RED infra | [x] | Antes de instalar: `pnpm run test` -> `ERR_PNPM_NO_SCRIPT Missing script: test`, exit 1 (`pnpm test` a secas imprime vacío con exit 1 en pnpm 11) |
| 2.2 vitest + scripts | [x] | `vitest@5.0.3` (`^5.0.3`); peer `vite: ^6.4.0 \|\| ^7 \|\| ^8`, instalado vite 6.4.4 (el de Astro 5.18.2, una sola versión): compatible. Node peer `^22.12 \|\| ^24 \|\| >=26` cumple con v26.8.2. Scripts `test` y `test:watch`. No hizo falta tocar `allowBuilds` |
| 2.3 vitest.config.ts | [x] | `getViteConfig` de `astro/config`, entorno node, include `src/**/*.test.ts`; vitest arranca sin error de configuración (verificado: antes de existir tests, "No test files found") |
| 2.4 smoke | [x] | `src/lib/smoke.test.ts`: (a) `@cv` resuelve (basics.name no vacío, work no vacío); (b) `experimental_AstroContainer` de `astro/container` renderiza `Section.astro`. No hubo contingencia: la Container API funciona en Astro 5.18.2 |
| 2.5 GREEN | [x] | `pnpm test` exit 0 (1 archivo, 2 tests); `pnpm check` exit 0 (41 archivos, 0 errores, 2 hints); `pnpm build` exit 0 |
| 2.6 config.yaml | [x] | `test_command: "pnpm test"`, `testing.runner: vitest`, `layers.unit/integration: true`, `strict_tdd: true`, sin `strict_tdd_note`, rules apply/verify citan `pnpm test`; `context` y reglas proposal/tasks sin referencias a "sin runner" (archivo sin versionar) |
| 2.7 Cierre | [x] | `pnpm test`, `pnpm check`, `pnpm build` con 0 |

### TDD Cycle Evidence (infraestructura)

| Tarea | Archivo | Capa | RED | GREEN | Nota |
|-------|---------|------|-----|-------|------|
| 2.1-2.5 | `src/lib/smoke.test.ts` | Unit + Integración (Container API) | `pnpm run test` sin script: exit 1. Además, primer run del smoke: 1 test falló (`toContain("<h2>Smoke Title</h2>")`: en dev el `<h2>` lleva atributos `data-astro-*`) | Aserción cambiada a `toMatch(/<h2[^>]*>Smoke Title<\/h2>/)`: 2/2 pasan, exit 0 | Triangulación omitida: smoke de infraestructura, sin lógica de producción |

### Work Unit Evidence (PR 2)

| Evidencia | Valor |
|---|---|
| Comando focal | `pnpm test` exit 0 (1 archivo, 2 tests passed) |
| Harness de ejecución | `pnpm build` exit 0; `pnpm check` exit 0 |
| Rollback | `git revert` del commit de PR 2; `config.yaml` (sin versionar) debe volver manualmente a `strict_tdd: false` |

### Commits (PR 2)

- `03e1c08` test: add vitest runner with astro getViteConfig and smoke tests

### Tamaño (PR 2)

Autorado sin lockfile: 7 (package.json: 5+2) + 24 (smoke.test.ts) + 9 (vitest.config.ts) = 40 líneas, de 400. Lockfile +169 excluido.

### Desvíos y hallazgos (PR 2)

1. vitest resolvió a la 5.x, no a la 3.x/4.x que el diseño suponía; su rango de Vite incluye 6.4+, por lo que el supuesto D5 queda verificado para Astro 5.18.2 / Vite 6.4.4. Sigue pendiente reverificar con Vite 7 y 8 (6a/6b).
2. `getViteConfig` y `experimental_AstroContainer` (nombre exacto) verificados en Astro 5.18.2. Hallazgo para 3b: el HTML renderizado en vitest incluye atributos `data-astro-cid-*`, `data-astro-source-*` y conserva el `<script>` vacío de `Section.astro`; las aserciones deben usar regex/substring tolerantes a atributos, no coincidencias de etiqueta exacta.
3. `pnpm peers check` avisa `typescript@6` frente a peers `^5` de `tsconfck` y `zod-to-ts` (dependencias de Astro); sin efecto observado.
4. `openspec/config.yaml` sigue sin versionar; la edición de 2.6 no está en el commit.
5. El primer intento de crear el smoke falló por directorio `src/lib` inexistente (el shell no lo creó); corregido, sin impacto.

## Lote 3: PR 3a (Fase 3, esquema y fuente única del CV) COMPLETO 8/8

Rama: `chore/technical-cleanup-3a-cv-schema` (apilada sobre `chore/technical-cleanup-2-vitest`). Sin push, sin PR. Strict TDD activo.

Decisiones del usuario RESUELTAS (ya no provisionales): Q3 = Zod con `astro/zod`; Q4 = relleno de `cv.json` conservado como opcional; Q5 = corregir `key`→`keywords`, errores de prosa y typos similares, en commit aparte de solo contenido. Q6-Q9 siguen provisionales y fuera de este PR. `tasks.md` marca Q3/Q4/Q5 como resueltas (solo marcas de estado); `design.md` y specs conservan los rótulos "[Qn provisional]" sin reescribir.

| Tarea | Estado | Evidencia |
|-------|--------|-----------|
| 3.1 RED esquema (a-f) | [x] | `pnpm test src/lib/cv-schema.test.ts` exit 1: `Cannot find package '@/lib/cv-schema'` (0 tests) |
| 3.2 RED relleno y keywords (g, h) | [x] | Mismo fallo (módulo inexistente); se añadió además un caso: sección de relleno mal formada falla con ruta `awards.0.title` |
| 3.3 GREEN `cv-schema.ts` | [x] | `pnpm test src/lib/cv-schema.test.ts`: 10/10, exit 0 |
| 3.4 RED `cv.test.ts` | [x] | `pnpm test src/lib/cv.test.ts` exit 1: `Cannot find package '@/lib/cv'` |
| 3.5 GREEN parcial `cv.ts` | [x] | RED natural observado: `ZodError` en `skills.2.keywords` ("Required", PL/SQL con `key`) al cargar el módulo (0 tests ejecutados) |
| 3.6 contenido `cv.json` | [x] | Tras `key`→`keywords` solo: 5 pasan, 3 fallan (typos TypeScritp, directamentetación, Licenciadoen). Tras las correcciones de prosa: `pnpm test src/lib` 3 archivos, 20/20 |
| 3.7 REFACTOR | [x] | Revisión sin cambios necesarios (sub-esquemas sin duplicación; `IsoDate` compartido). `pnpm test src/lib` y `pnpm check` en verde |
| 3.8 Cierre | [x] | `pnpm test` 20/20 exit 0; `pnpm check` 0 errores (2 hints previos); `pnpm build` exit 0; diff de `dist/` abajo |

### Verificación de `astro/zod` (supuesto D6 verificado en la versión instalada)

Astro 5.18.2 reexporta `zod` 3.25.76 (API v3 en la raíz): `astro/zod` exporta `z` (namespace) y también todos los nombres de zod; `z.object`, `z.string().regex`, `.nullable()`, `.optional()`, `z.array`, `z.infer` funcionan. Con `safeParse`, `error.issues[].path` trae la ruta (`basics.name`, `work.0.highlights.0`). No se instaló `zod` aparte. Se usó solo el subconjunto común Zod 3/4. Pendiente reverificar en 6a (Zod 4).

### TDD Cycle Evidence

| Tarea | Archivo | Capa | Safety net | RED | GREEN | Triangulación | REFACTOR |
|-------|---------|------|------------|-----|-------|---------------|----------|
| 3.1-3.3 | `src/lib/cv-schema.test.ts` | Unidad | N/A (nuevo) | Módulo inexistente, exit 1 | 10/10 | Casos válido/inválido por campo, endDate null vs fecha, relleno presente/ausente/mal formado | Sin cambios |
| 3.4-3.6 | `src/lib/cv.test.ts` | Unidad (datos reales) | N/A (nuevo) | Módulo inexistente; luego ZodError real por `key`; luego 3 typos fallando | 20/20 en `src/lib` | `it.each` de 3 typos; invariantes de fechas/perfiles/keywords | Sin cambios |

Total de pruebas nuevas: 10 + 8 = 18 (más 2 del smoke previo = 20). Funciones puras nuevas: 0 (esquemas declarativos).

Decisión sobre la habilidad PL/SQL: se corrigió el dato (Q5 = sí); el esquema mantiene `keywords` obligatorio.

### Correcciones de contenido (commit aparte `182b124`)

`key`→`keywords` (PL/SQL); "TypeScritp"→"TypeScript" (×2); "directamentetación"→"Documentación" (inferido: keyword de LaTeX; la intención exacta no es verificable); "Licenciadoen ciencias"→"Licenciado en ciencias"; extras hallados al leer el JSON: "pequeñá"→"pequeña", "manufacturtera"→"manufacturera", "Projecto"→"Proyecto", "Lider"→"Líder", "Desarrollé de documentación"→"Desarrollé documentación", "Realice"→"Realicé", "Practica"→"Práctica". No corregido por ser estilo, no typo: "Mutuos(FFMM)" sin espacio.

### Comparación manual de `dist/` (antes: build del HEAD de PR 2; después: HEAD de 3a)

`diff -rq`: solo `index.html` difiere. Normalizado (un tag por línea, sin Prettier porque aún no está instalado, llega en 5a): 5 líneas distintas de 615, todas prosa renderizada: "Desarrollé documentación... Realicé", "pequeña... manufacturera", "TypeScript" ×2, "Proyecto personal". Las demás correcciones (keywords, studyType, Líder, Práctica) no se renderizan hoy. Sin diferencias estructurales.

### Work Unit Evidence (PR 3a)

| Evidencia | Valor |
|---|---|
| Comando focal | `pnpm test src/lib` exit 0 (3 archivos, 20 pruebas) |
| Harness de ejecución | `pnpm build` exit 0 y diff de `dist/` solo prosa; `pnpm check` exit 0 |
| Rollback | `git revert` de los 3 commits de 3a; los componentes aún leen `@cv`, nada se rompe |

### Commits (PR 3a)

- `643a660` feat: add zod CV schema as single source of CV types (cv-schema.ts 151, cv-schema.test.ts 201)
- `182b124` fix: correct cv.json PL/SQL skill key and Spanish typos (solo contenido, +10/-10)
- `1e77739` feat: add validated cv accessor with real-data invariant tests (cv.ts 18, cv.test.ts 49)

### Tamaño (PR 3a)

Autorado sin lockfile (no hubo cambios de lockfile): 439 líneas (429 adiciones + 10 eliminaciones) contra presupuesto 400: EXCEDE en 39. Causa: fixtures de prueba (201 líneas en cv-schema.test.ts) y esquemas completos del relleno. No se recortó para ajustar el número. El diseño no define una contingencia específica para 3a; corte natural si se prefiere: 3a-i = commit 1 (352) y 3a-ii = commits 2-3 (87), o `size:exception`. Decisión del orquestador/usuario.

### Desvíos y hallazgos (PR 3a)

1. Los esquemas del relleno se declararon con la forma completa de `cv.json` (no mínima) para validarlos si existen; añade ~50 líneas.
2. Las claves no declaradas se descartan (política Zod por defecto); los esquemas declaran todo lo que `cv.json` contiene.
3. Los componentes siguen importando `@cv` (cambio en 3b). `openspec/` sigue sin versionar: tasks.md y apply-progress no están en commits.
4. `sd` requiere `--` antes de patrones que empiezan con `-`.

### Registro de decisión (2026-10-09)

El usuario ACEPTÓ `size:exception` para el PR 3a (439 líneas autoradas, 39 sobre el presupuesto de 400) en lugar de dividirlo. Registrado también en `tasks.md` (forecast y pronóstico por PR).


## Lote 4: PR 3b (Fase 4, Section tipado y accesor) COMPLETO 7/7

Rama: `chore/technical-cleanup-3b-section-props` (apilada sobre `chore/technical-cleanup-3a-cv-schema`). Sin push, sin PR. Strict TDD activo.

| Tarea | Estado | Evidencia |
|-------|--------|-----------|
| 4.1 RED Section | [x] | `pnpm test src/components/Section.test.ts`: 5 pasan, 1 falla (exit 1): `<script type="module" src=".../Section.astro?astro&type=script...">` presente (script vacío). El caso (b) `printed={false}` NO fue RED: en JS `false == "0"` es true, así que el código viejo ya agregaba `no-print` con `false`. Se conserva como prueba de caracterización |
| 4.2 GREEN Section | [x] | `Props`, `printed ? "" : "no-print"`, sin `<script>` ni comentarios: 6/6 |
| 4.3 Acknowledgments | [x] | `printed={false}` (commit 1); import en commit 2 |
| 4.4 imports a `@/lib/cv` | [x] | RED `src/lib/single-source.test.ts` (3 pruebas): 3 fallan, exit 1 (10 importadores de `@cv`, 10 sin `@/lib/cv`, `cv.d.ts` presente). GREEN: 3/3 |
| 4.5 borrar `src/cv.d.ts` | [x] | `git rm`; `rg "cv.d" src` solo coincide en el propio test |
| 4.6 REFACTOR | [x] | Primer intento del test usaba `node:fs`/`__dirname` y `pnpm check` dio 4 errores (no hay `@types/node`); se reescribió con `import.meta.glob ?raw` sin dependencias nuevas. Tras ello `pnpm test` 29/29, `pnpm check` 0 errores |
| 4.7 Cierre | [x] | `pnpm test` 5 archivos/29 pruebas exit 0; `pnpm check` 0 errores (2 hints previos); `pnpm build` exit 0 |

### TDD Cycle Evidence (PR 3b)

| Tarea | Archivo | Capa | Safety net | RED | GREEN | Triangulación | REFACTOR |
|-------|---------|------|------------|-----|-------|---------------|----------|
| 4.1-4.3 | `src/components/Section.test.ts` | Componente (Container API) | smoke previo 2/2 | 1 de 6 falla (script vacío); (b) ya verde por coerción `false == "0"` | 6/6 | omitido/true/false, con/sin título, slot | Sin cambios |
| 4.4-4.5 | `src/lib/single-source.test.ts` | Estructura de código fuente | N/A (nuevo) | 3/3 fallan | 3/3 | allowlist de importadores, lista explícita de 10 consumidores, ausencia de `cv.d.ts` | Reescrito sin node typings |

### Comparación manual de `dist/` (antes: build del HEAD de 3a; después: HEAD de 3b)

`diff -rq`: solo `index.html` difiere. Normalizado (un tag por línea): 7 líneas distintas, todas SOLO cantidad de espacios iniciales antes de `<section ...>` y `</main>` (por el `<script>` y comentarios eliminados de `Section.astro`); `diff -w` = idéntico. Un solo `<script` en ambos (el bundle del cliente, no el vacío de Section). Sin diferencias de contenido.

### Work Unit Evidence (PR 3b)

| Evidencia | Valor |
|---|---|
| Comando focal | `pnpm test src/components/Section.test.ts` 6/6; `pnpm test` 29/29 exit 0 |
| Harness de ejecución | `pnpm build` exit 0; diff de `dist/` solo espacios en blanco; `pnpm check` 0 errores |
| Rollback | `git revert` de los 2 commits de 3b: vuelven `@cv`, `src/cv.d.ts` y `printed="0"` |

### Commits (PR 3b)

- `80bfaf3` refactor: type Section props and use a real boolean printed flag (3 archivos, +57/-7)
- `7d99aa1` refactor: read CV data via @/lib/cv and drop duplicated cv.d.ts (12 archivos, +58/-155)

### Tamaño (PR 3b)

Autorado sin lockfile: 115 adiciones + 162 eliminaciones = 277 líneas (de 400; incluye -145 de `cv.d.ts`).

### Desvíos y hallazgos (PR 3b)

1. Ningún componente depende de campos fuera del esquema: `city`/`country` (Experience) y `city`/`region` (Hero) están declarados en `cv-schema.ts`.
2. `rg '@cv' src` también coincide en `src/lib/cv.test.ts` (prueba de 3a, permitida junto a `cv.ts` y `smoke.test.ts`).
3. Q1, Q2 y Q6-Q9 no condicionan este PR.
4. `openspec/` sigue sin versionar.

## Lote 5: PR 4a (Fase 5, registro de íconos) PARCIAL 5/13

Rama: `chore/technical-cleanup-4a-icon-registry` (apilada sobre 3b, HEAD 7d99aa1). Sin push, sin PR. Strict TDD activo. DETENIDO por presupuesto: 318 líneas autoradas con 5.1-5.5; faltan 5.6-5.13 (~100 líneas) que llevarían el PR a ~415 (> umbral de aviso ~360).

| Tarea | Estado | Evidencia |
|-------|--------|-----------|
| 5.1 caracterización index | [x] | `pnpm test src/pages` 5/5 verde sobre código sin refactorizar (exit 0). Container API sí renderiza `index.astro`. Desvío: archivo `src/pages/_index.test.ts` (con `index.test.ts` Astro lo trató como ruta y `pnpm build` falló: "Cannot read properties of undefined (reading 'config')" desde vitest; corregido y fusionado en el commit de la prueba) |
| 5.2 referencia dist | [x] | Build del HEAD de 3b copiado a `scratchpad/dist-3b` (exit 0) |
| 5.3 RED icons (a-f) | [x] | `pnpm test src/lib/icons.test.ts`: fallo por módulo `@/lib/icons` inexistente (exit 1, "no tests") |
| 5.4 RED habilidades (g,h) | [x] | mismo archivo, mismo RED; (h) afirma que las claves sin uso son exactamente Next, Swift, SwiftUI, Kotlin, Flutter |
| 5.5 GREEN icons.ts | [x] | `pnpm test src/lib/icons.test.ts` 19/19; `pnpm test` 7 archivos/53 pruebas; `pnpm check` 0 errores; `pnpm build` exit 0 |
| 5.6-5.13 | [ ] | No iniciadas |

### TDD Cycle Evidence (PR 4a, parcial)

| Tarea | Archivo | Capa | Safety net | RED | GREEN | Triangulación | REFACTOR |
|-------|---------|------|------------|-----|-------|---------------|----------|
| 5.1 | `src/pages/_index.test.ts` | Caracterización (Container API) | 48 pruebas previas verdes | N/A (caracterización: debe nacer verde) | 5/5 sobre código actual | nombre/label, 5 títulos, URL de cada perfil, cada skill, Agradecimientos | Sin cambios |
| 5.3-5.5 | `src/lib/icons.test.ts` | Unitaria (TS puro) | 34 pruebas previas | módulo inexistente (exit 1) | 19/19 | conocidas x3, fallback, exacto vs `github`, `constructor`, escape de title y style, alias x4, identidad, Q7 | Sin cambios (se añadió desde el inicio la guarda contra claves heredadas `constructor` con `includes`/`hasOwnProperty`) |

### Commits (PR 4a, parcial)

- `667cb5f` test: add home page characterization test (1 archivo, +50)
- `1dc66d6` feat: add shared icon registry with unknown-network fallback (2 archivos, +268)

### Tamaño (PR 4a, parcial)

318 líneas autoradas (318 adiciones, 0 eliminaciones; sin lockfile). Estimación de lo pendiente: SocialIcon + prueba ~38, Hero ~17, GitHub.astro ~15, borrado de LinkedIn/X/types.d.ts ~26: total final ~415. Opciones: (a) cortar en 4a0 = caracterización (50, ya en commit propio) + 4a = resto (~365), (b) `size:exception`.

### Desvíos y hallazgos (PR 4a)

1. Archivos `.ts` dentro de `src/pages/` son rutas de Astro: las pruebas ahí deben llevar prefijo `_`.
2. Q1, Q2, Q8, Q9 no condicionan este PR. `cv.json` solo tiene perfiles LinkedIn y GitHub (X solo en el registro).
3. El ícono de GitHub del KeyboardManager actual no lleva `<title>`; `renderSvg` lo hará uniforme (diferencia esperada en 4b).
4. `openspec/` sigue sin versionar.

### Pendiente

5.6-5.13 (SocialIcon, Hero, GitHub.astro, borrados, verificación `mastodon`, diff de dist). Esperando decisión sobre el presupuesto.


## Lote 6: PR 4a (continuación) COMPLETO 13/13 (con desvío en 5.10)

División decidida por el usuario (2026-10-09): **PR 4a0** = solo `667cb5f` (50 líneas), rama `chore/technical-cleanup-4a0-characterization` (apunta a `667cb5f`). **PR 4a** = `1dc66d6`..`613bb39`, 385 líneas (+331/-54), rama `chore/technical-cleanup-4a-icon-registry` (apilada sobre 4a0; `667cb5f` es ancestro). Historial: 3b(7d99aa1) → 667cb5f → 1dc66d6 → e86ae2c → 5d86bfb → feffed0 → 613bb39. Sin push ni PR.

| Tarea | Estado | Evidencia |
|-------|--------|-----------|
| 5.6 RED SocialIcon | [x] | `pnpm test src/components/icons`: fallo por `./SocialIcon.astro` inexistente (exit 1, no tests) |
| 5.7 GREEN SocialIcon | [x] | 3/3 verde; commit `e86ae2c` (+47) |
| 5.8 Hero | [x] | `5d86bfb` (+11/-24); sin mapa local; test 56/56, check 0 errores |
| 5.9 GitHub wrapper | [x] | `feffed0` (+5/-10) |
| 5.10 borrados | [x] parcial | `613bb39` elimina LinkedIn.astro y X.astro (-20). `src/types.d.ts` NO se elimina: `KeyboardManager.astro` línea 5 lo importa. Se traslada a 4b |
| 5.11 REFACTOR | [x] | Sin cambios necesarios |
| 5.12 mastodon | [x] | `cv.json` temporal: build exit 0, `<title>mastodon</title>` y path fallback presentes, 0 `undefined`; `cv.json` restaurado, `git status` limpio |
| 5.13 cierre | [x] | test 8/56, check 0 errores, build 0; diff -w vs dist-3b: solo orden de atributos del SVG de LinkedIn en Hero |

### TDD Cycle Evidence (continuación)

| Tarea | Archivo | RED | GREEN | REFACTOR |
|-------|---------|-----|-------|----------|
| 5.6-5.7 | `src/components/icons/SocialIcon.test.ts` | componente inexistente (exit 1) | 3/3 (conocida, fallback sin `undefined`, size/style) | Sin cambios |
| 5.8-5.10 | refactor protegido por `_index.test.ts` y `SocialIcon.test.ts` | N/A (refactor) | 56/56 | Sin cambios |

### Work Unit Evidence

| Evidencia | Valor |
|---|---|
| Comando focal | `pnpm test src/components/icons` 3/3; `pnpm test` 56/56 |
| Harness | `pnpm build` exit 0 (también con `mastodon`); `pnpm check` 0 errores |
| Rollback | Revertir `613bb39`..`e86ae2c`; el registro `1dc66d6` es autónomo |

### Pendiente para 4b
Eliminar `src/types.d.ts` y el mapa local de `KeyboardManager.astro` (usa `renderSvg(getSocialIcon(...))`); el escenario "sin tipos sin usar" (`rg "SocialIcon = Record" src`) se cierra ahí.


## Lote 7: PR 4b (Fase 6, KeyboardManager, Skills y assets) COMPLETO 6/6

Rama `chore/technical-cleanup-4b-keyboard-manager`, apilada sobre `chore/technical-cleanup-4a-icon-registry` (613bb39). Sin push ni PR. Q6 fuera de alcance: no se tocó la lógica de tema ni `ctrl+C`.

| Tarea | Estado | Evidencia |
|-------|--------|-----------|
| 6.1 RED Skills | [x] | 2 fallos (wiring de `Skills.astro`); guardas de claves/habilidades ya verdes (MySQL presente en el registro) |
| 6.2 GREEN Skills | [x] | `17b7f4e`; test 60/60, check 0 |
| 6.3 KeyboardManager | [x] | RED 5/7 fallos; `d905885`; GREEN 67/67 |
| 6.4 borrados | [x] | RED 2 fallos; `2f1b454`; GREEN 69/69; incluye `src/types.d.ts` (diferido desde 5.10) |
| 6.5 REFACTOR | [x] | Sin cambios necesarios |
| 6.6 cierre | [x] | test 69/69, check 0 errores, build 0; `rg "SocialIcon = Record" src` sin coincidencias |

### TDD Cycle Evidence (PR 4b)

| Tarea | Archivo | RED | GREEN | REFACTOR |
|-------|---------|-----|-------|----------|
| 6.1-6.2 | `src/lib/icons.test.ts` | 2 fallos de wiring | 23/23 en el archivo; 60/60 total | Sin cambios |
| 6.3 | `src/components/KeyboardManager.test.ts` | 5 de 7 fallan | 7/7; 67/67 total | Sin cambios |
| 6.4 | `src/lib/dead-code.test.ts` | 2 de 2 fallan | 2/2; 69/69 total | Sin cambios |

### Comparación de `dist/` (dist-4a vs HEAD de 4b)
Solo diferencias esperadas en `data-info`: atributos/espaciado de LinkedIn y GitHub, `<title>GitHub</title>` nuevo en GitHub, y hash del script de KeyboardManager (-158 bytes por quitar 5 `console.log`).

### Work Unit Evidence (PR 4b)

| Evidencia | Valor |
|---|---|
| Comando focal | `pnpm test` 9 archivos/69 pruebas |
| Harness | `pnpm build` exit 0; `pnpm check` 0 errores |
| Rollback | Revertir `2f1b454`, `d905885`, `17b7f4e` (independientes entre sí salvo la prueba de KeyboardManager) |

### Commits y tamaño (PR 4b)
`17b7f4e` (+65/-13), `d905885` (+54/-42), `2f1b454` (+23/-18; incluye 16 líneas de borrado puro de SVG). Total 142 insertadas + 73 borradas = 215 (199 sin el borrado puro de SVG); bajo el presupuesto de 400.

### Pendiente
PR 5a (no iniciado, fuera de alcance).


## Lote 8: PR 5a (Fase 7, ESLint y Prettier, configuración) COMPLETO 7/7

Rama `chore/technical-cleanup-5a-lint-config`, apilada sobre `chore/technical-cleanup-4b-keyboard-manager` (2f1b454). Sin push ni PR. Q8 RESUELTA por el usuario (2026-10-09): defaults de Prettier (2 espacios, punto y coma, comillas dobles); `.prettierrc` solo con `prettier-plugin-astro` y el override `*.astro -> parser: astro` (necesarios para parsear `.astro`). Q1, Q2 y Q9 siguen provisionales; no se tocó `engines` ni `.nvmrc`.

| Tarea | Estado | Evidencia |
|-------|--------|-----------|
| 7.1 deps y scripts | [x] | `44104dd`; eslint 10.12.0, typescript-eslint 8.71.1, eslint-plugin-astro 3.2.1, prettier 3.9.9, prettier-plugin-astro 1.1.0, eslint-config-prettier 10.1.8; sin cambios en allowBuilds |
| 7.2 eslint.config.js | [x] | `no-restricted-imports` de `@cv` con override para `src/lib/cv.ts`, `src/lib/cv.test.ts`, `src/lib/smoke.test.ts`; override de `triple-slash-reference` para `src/env.d.ts` |
| 7.3 Prettier | [x] | `.prettierrc`, `.prettierignore` (+ `node_modules`) |
| 7.4 correcciones | [x] | `highlights` sin uso en `Experience.astro` (`5996f3a`); `pnpm lint` exit 0 |
| 7.5 negativas | [x] | (a) exit 1 `no-unused-vars`; (b) exit 1 `no-restricted-imports`; (c) `prettier --check` exit 1; temporales eliminados |
| 7.6 config.yaml | [x] | `linter`, `formatter`, `quality.*` en true (archivo no versionado) |
| 7.7 cierre | [x] | lint 0, check 0 errores (1 hint previo), test 69/69, build 0; `format:check` exit 1 en 40 archivos (esperado hasta 5b) |

### Work Unit Evidence (PR 5a)

| Evidencia | Valor |
|---|---|
| Comando focal | `pnpm lint` exit 0 |
| Harness | pruebas negativas (a)(b)(c) con exit 1; `pnpm build` exit 0 |
| Rollback | Revertir `44104dd` (y `5996f3a`, independiente) |

### Commits y tamaño (PR 5a)
`5996f3a` (+0/-1), `44104dd` (+64/-1 sin lockfile: eslint.config.js 42, .prettierrc 4, .prettierignore 7, package.json 11/1). Total 66 líneas autoradas; lockfile +1181/-4 excluido. Bajo 400.

### Pendiente
PR 5b (`pnpm format` aislado, requiere confirmar la excepción de tamaño) y 5c; fuera de alcance de este lote.

## Lote 9: PR 5b + 5c (Fase 8, formato mecánico y blame-ignore) COMPLETO 4/4

Rama `chore/technical-cleanup-5b-format`, apilada sobre `chore/technical-cleanup-5a-lint-config` (44104dd). Modo: Strict TDD activo, pero el cambio es mecánico sin lógica nueva: no se inventa RED/GREEN; la evidencia son los gates y la comparación sin espacios.

- **8.1** `size:exception` ACEPTADA por el usuario el 2026-10-09 para 5b (2332 líneas autoradas, 40 archivos), sin dividir por directorios. Registrada en tasks.md (forecast y 8.1).
- **8.2** Árbol limpio previo (solo `.atl/` y `openspec/` sin versionar); línea base `dist/` guardada en el scratchpad (`dist-before`); `pnpm format` ejecutado UNA vez (exit 0). Commit `d8afb4ee88e4f72279d83be7d07f89d45103a8a9` (`d8afb4e`), `style: format codebase with prettier`: 40 archivos, +1154/-1178. Solo tocó archivos fuente, README.md, cv.json y astro.config.mjs; ni lockfile, openspec/, dist/ ni generados.
- **8.3** `git diff -w d8afb4e~1 d8afb4e`: 37 archivos, +316/-340 (no es casi vacío: Prettier reflujo líneas, y `-w` no ignora saltos de línea). Análisis: comparando con TODO el espacio en blanco eliminado, 26 archivos son idénticos; los 14 restantes (README.md, astro.config.mjs, Section/About/Experience/Hero/Layout, SocialIcon.test.ts, cv-schema(.test).ts, cv.test.ts, cv.ts, single-source.test.ts, index.astro) difieren solo en tokens de formato: `;` añadido, comillas simples a dobles, coma final, `>` de apertura JSX unido, `{expr}` en línea. Cero cambios de lógica.
- **Gates** (post-5b): `pnpm format:check` 0; `pnpm lint` 0; `pnpm check` 0 errores/0 warnings; `pnpm test` 10 archivos / 69 pruebas; `pnpm build` 0.
- **dist/**: 5 archivos; solo `index.html` difiere en bytes (34304 -> 34349, +45); idéntico con `diff -w` normalizado y con todo el espacio eliminado. La diferencia real es espacio en los bordes de texto (`<p>{summary}</p>`, `<footer>{printInfo}</footer>`), sin efecto visual en HTML.
- Ninguna prueba depende del formato exacto de las fuentes (todas pasan sin arreglos).
- **8.4 (5c)** Commit `b5ea647ae9de97a95134841bf00311d63d1cecdf` (`b5ea647`), `chore: ignore the format commit in git blame`: crea `.git-blame-ignore-revs` (3 líneas: 2 comentarios y el SHA completo de 5b). Verificado: `git blame -L1,5 src/lib/cv.ts` atribuye a `d8afb4ee`; con `--ignore-revs-file .git-blame-ignore-revs` atribuye a `1e777397`. `pnpm format:check` 0. Comando para usarlo: `git config blame.ignoreRevsFile .git-blame-ignore-revs` (NO configurado, ni global ni local). Sin reescritura de historia.
- Rollback: `git revert b5ea647` y luego `git revert d8afb4e` (5c antes que 5b).
- Q1, Q2, Q9 provisionales: no condicionan este PR. tasks.md y apply-progress.md siguen sin versionar.


## Lote 10: PR 6a (Fase 9, Astro 5 -> 6) 5/7 (9.5 parcial, 9.7 parcial)

Rama `chore/technical-cleanup-6a-astro-6`, apilada sobre `chore/technical-cleanup-5b-format` (b5ea647). Sin push, PR ni merge. Modo: Strict TDD activo; la actualización no exigió cambios de código de producción, por lo que no hubo RED/GREEN nuevo (los gates y las 69 pruebas de caracterización fueron la red de seguridad; no se inventa evidencia).

Decisiones del usuario (2026-10-09), registradas como resueltas: Q1 = deploy en Vercel (commit + push; no GitHub Pages; ci-deploy/D19 y unidad 8 se reformularán aparte, no tocados); Q2 = Node 22 (`engines >=22.12`, `.nvmrc` y CI en 22). Q3 Zod, Q4 conservar, Q5 hecha, Q6 fuera, Q7 conservar, Q8 defaults; Q9 provisional.

| Tarea | Estado | Evidencia |
|-------|--------|-----------|
| 9.1 | [x] | Node v26.8.2 >= 22.12; `dist-5c` en scratchpad. Node 22 NO validado (mise solo tiene 26.8.2; no se instaló nada global): verificación pendiente |
| 9.2 | [x] | `5514580`: `engines.node ">=22.12"`, `.nvmrc` = `22` |
| 9.3 | [x] | `d932d86`: astro 6.4.8 (vite 7.3.7, zod 4.6.5); vitest 5.0.3 y @astrojs/check 0.9.10 sin cambios; `--frozen-lockfile` exit 0 |
| 9.4 | [x] | Sin cambios de código: check 0 errores (1 hint previo), lint 0, format:check 0, test 69/69, build 0 |
| 9.5 | [ ] parcial | `pnpm preview` sirve `/` y el script con 200; bundle cliente idéntico al de Vite 6; sin navegador para ejecutar el command palette: pendiente manual |
| 9.6 | [x] | assets idénticos; `index.html` solo difiere en `&#34;` -> `&quot;` en `data-info` y espacio en bordes de etiquetas (+61 bytes); idéntico sin espacios y con entidades normalizadas |
| 9.7 | parcial | `config.yaml` (no versionado) actualizado a Astro 6; gates en verde; cierre formal tras 9.5 |

Documentación oficial: WebFetch/context7 no disponibles en este ejecutor; no se consultó la guía de v6. Solo lo observado: Astro 6.4.8 exige Node >=22.12, trae Vite 7 y Zod 4; el proyecto no usa `Astro.glob`, content collections, ViewTransitions ni `astro:env`; usa `astro/zod`, `getViteConfig` y `experimental_AstroContainer`, que siguen funcionando. Aviso nuevo (inocuo): Rollup avisa de comentarios `@__PURE__` en zod 4.6.5.

### Work Unit Evidence (PR 6a)

| Evidencia | Valor |
|---|---|
| Comando focal | `pnpm test` 10 archivos / 69 pruebas, exit 0 |
| Harness | `pnpm build` exit 0; diff normalizado de dist (ver 9.6); preview 200 |
| Rollback | `git revert d932d86` (vuelve Astro 5.18.2); `5514580` independiente |

### Commits y tamaño (PR 6a)
`5514580` (.nvmrc +1, package.json +3), `d932d86` (package.json +1/-1; lockfile +207/-586 excluido). 6 líneas autoradas de 400.


## Lote 11: cierre de 6a (9.5, 9.7) y PR 6b (Fase 10, Astro 6 -> 7) 5/6 (10.4 parcial)

**Cierre de 6a.** El usuario VERIFICÓ MANUALMENTE en el navegador (2026-10-09), con Astro 6.4.8 / Vite 7, que el command palette de hotkeypad (Ctrl+K), los atajos y el cambio de tema funcionan igual que antes. 9.5 pasa a `[x]` (evidencia: verificación manual del usuario) y 9.7 se cierra (solo dependía de 9.5; `config.yaml` y gates ya estaban). Sigue PENDIENTE (no marcada): validación con Node 22 real (solo Node 26.8.2 vía mise; nada instalado global); queda para CI. Estado PR 6a: 7/7.

**PR 6b.** Rama `chore/technical-cleanup-6b-astro-7` (creada antes de escribir), apilada sobre `chore/technical-cleanup-6a-astro-6` (d932d86). Sin push/PR/merge. Strict TDD: no se tocó código de producción, así que no hubo RED/GREEN nuevo (las 69 pruebas y la caracterización de index.astro fueron la red de seguridad; no se inventa evidencia).

Guía oficial de Astro v6/v7: WebFetch no disponible para este ejecutor; el orquestador la consultó y la relayó (docs.astro.build/en/guides/upgrade-to/v7: Vite 8, compilador Rust más estricto, `compressHTML` default `jsx`, `src/fetch.ts` reservado, sin cambios rotos para Vitest/getViteConfig). Hallazgos contra la guía: el compilador Rust acepta el markup (0 correcciones); no usamos `src/fetch.ts`; `compressHTML: 'jsx'` solo quitó espacios sin efecto visual (ver abajo).

| Tarea | Estado | Evidencia |
|-------|--------|-----------|
| 10.1 | [x] | `dist-6a` (Astro 6.4.8) en scratchpad |
| 10.2 | [x] | `6012cb2`: astro 7.3.8 (vite ^8.3.1, zod ^4.6.5); `@astrojs/check` 0.9.10 y vitest 5.0.3 sin cambios (peer vite incluye ^8); TS ^6 se queda; `--frozen-lockfile` exit 0 |
| 10.3 | [x] | 0 líneas de corrección; check 0 errores (1 hint previo), lint 0, format:check 0, test 10 archivos/69, build 0 sin avisos |
| 10.4 | [ ] parcial | preview sirve `/`, JS y CSS con 200; bundle de hotkeypad construido (11233 bytes; contiene hotkeypad/ctrl+C/Cmd); vitest 69/69 con Vite 8; falta verificación manual del command palette en navegador (usuario) |
| 10.5 | [x] | ver abajo |
| 10.6 | [x] | `config.yaml` (no versionado) a Astro 7 / Vite 8; gates en verde |

Comparación de dist (vs `dist-6a`): `favicon.svg` y `me.jpeg` idénticos. `index.html` 34410 -> 34066 bytes: tokens de etiquetas idénticos (normalizando data-astro-cid, hashes y `&#34;`/`&quot;`); texto idéntico salvo espacios en los bordes: se pierde el espacio entre `</svg>` y "Valdivia, Chile" (en un `span` flex con `gap: .25rem`, sin efecto visual) y espacios al borde de textos de bloque; "Pulsa <kbd>Cmd</kbd> + <kbd>K</kbd> para..." conserva los espacios internos. CSS: mismas 132 reglas con otro formato del minificador (Vite 8): `#0000`/`transparent`, `.3s ease`/`.3s`, `1 / 1`, `0px`/`0`, `rgb(0 0 0 / .3)`/`#0000004d`; en el footer de KeyboardManager `animation-timeline` queda fusionado en el shorthand `animation` (orden distinto al de 6a; no verificable sin navegador). JS del cliente: 11364 -> 11233 bytes (minificador), mismas cadenas clave.

### Work Unit Evidence (PR 6b)

| Evidencia | Valor |
|---|---|
| Comando focal | `pnpm test` 10 archivos / 69 pruebas, exit 0 |
| Harness | `pnpm build` exit 0; diff normalizado de dist; preview 200 |
| Rollback | `git revert 6012cb2` (vuelve Astro 6.4.8) |

### Commits y tamaño (PR 6b)
`6012cb2` `build: upgrade astro to 7`: package.json +1/-1; pnpm-lock.yaml +612/-1457 excluido. 2 líneas autoradas de 400. Criterio de parada no activado.


## Lote 12: cierre de 10.4 y PR 7 (Fase 11, README) 3/3

**Cierre de 10.4 (PR 6b).** El usuario VERIFICÓ MANUALMENTE (2026-10-09, descrito como "aparentemente sí") que con Astro 7.3.8 / Vite 8 el command palette (Ctrl+K), los atajos y el cambio de tema funcionan. 10.4 pasa a `[x]` (evidencia: verificación manual del usuario, descrita como aparente). Residual NO verificado: (a) el orden de `animation-timeline` en el footer (Vite 8 lo fusionó en el shorthand `animation`); (b) validación con Node 22 real (solo Node 26.8.2 vía mise; queda para CI). Estado unidad 6: 6a 7/7 y 6b 6/6 completas.

**PR 7.** Rama `chore/technical-cleanup-7-readme` (creada antes de escribir), apilada sobre `chore/technical-cleanup-6b-astro-7` (6012cb2). Sin push/PR/merge. Strict TDD activo pero el PR es solo documentación: no hay lógica ni RED/GREEN; la evidencia es la verificación del contenido contra el repo.

Decisiones: Q9 = español neutro; Q1 = Vercel (sin afirmar ajustes de panel: no hay `vercel.json` ni workflow); Q2 = Node >=22.12.

| Tarea | Estado | Evidencia |
|-------|--------|-----------|
| 11.1 | [x] | `19bd22a` `docs: rewrite README for the current stack`; contenido verificado: versiones de `package.json`, pnpm 11.3.0 (`packageManager`), 10 scripts, estructura de `src/`, atajos de `KeyboardManager.astro` (ctrl+P/D/C/S y ctrl+inicial de la red), esquema de `cv-schema.ts`, `site` de `astro.config.mjs` |
| 11.2 | [x] | `rg -i "ninja" README.md` 0 coincidencias; todos los scripts citados existen en `package.json` |
| 11.3 | [x] | `pnpm install --frozen-lockfile` 0; `pnpm check` 0 errores; `pnpm lint` 0; `pnpm format:check` 0; `pnpm test` 10 archivos/69; `pnpm build` 0 |

Atribución: se conserva. El README previo, `cv.json` (agradecimiento a Midudev) y el historial (Initial commit + README creado a mano) muestran que el diseño deriva de `midudev/minimalist-portfolio-json` (y este de Bartosz Jarocki). `LICENSE` solo lista "Copyright (c) 2025 Enzo Vera": puede faltar el aviso de copyright de la plantilla original; no verificado contra la licencia de origen (reportado como riesgo).

### Work Unit Evidence (PR 7)

| Evidencia | Valor |
|---|---|
| Comando focal | `pnpm format:check` exit 0 |
| Harness | `rg -i ninja README.md` sin coincidencias; gates completos exit 0; N/A runtime (documentación) |
| Rollback | `git revert 19bd22a` |

### Commits y tamaño (PR 7)
`19bd22a`: README.md +140/-39 = 179 líneas autoradas de 400.

### Pendiente
Unidad 8 (CI/deploy, reformular por Vercel) fuera de alcance. El spec `quality-gates / Documentación en README` aún dice inglés; actualizar a español (Q9).


## Lote 13: PR 8 (Fase 12, CI solo de gates) 3/5 (12.1-12.3; 12.4 y 12.5 pendientes)

**Decisión del usuario (2026-10-09), registrada.** El CI es SOLO de gates, sin job de deploy: el despliegue lo hace Vercel al hacer push (Q1). Sin GitHub Pages, sin CNAME, sin `vercel.json`, sin permisos `pages`/`id-token`. Q2: Node 22. Puerta de la Fase 12 / decisión 3 marcada como confirmada en `tasks.md`.

**Nota de procedencia.** El commit `88f65d8` (`docs: add upstream copyright notices to LICENSE`, rama `chore/technical-cleanup-7b-license-notices`) es un chore de licencia fuera del plan SDD (2026-10-09, aviso de copyright de midudev y Bartosz Jarocki, decidido por el usuario). Es la base de este PR.

**PR 8.** Rama `chore/technical-cleanup-8-ci-gates` (creada antes de escribir), apilada sobre `chore/technical-cleanup-7b-license-notices` (88f65d8). Sin push/PR/merge. Strict TDD activo pero infraestructura sin lógica: no hay RED/GREEN; la evidencia son comandos locales y verificaciones estructurales.

| Tarea | Estado | Evidencia |
|-------|--------|-----------|
| 12.1 | [x] | `0b470cf` `ci: add verify workflow for quality gates` (48 líneas) |
| 12.2 | [x] | YAML parseado con python3 yaml; `rg` de patrones prohibidos sin coincidencias; 6 comandos en orden; prettier sin cambios |
| 12.3 | [x] | solo `ci.yml` en workflows; sin `vercel.json` ni `CNAME`; `site` = `https://enzovera.dev` |
| 12.4 | [ ] | Pendiente: Node 22 real y ejecución real del workflow hasta el primer push; cubre 9.1, 9.5, 9.7, 10.4 |
| 12.5 | [ ] | Pendiente: se documenta en la descripción del PR al abrirlo |

Supuesto NO verificado en línea (sin acceso web): versiones mayores `actions/checkout@v4`, `pnpm/action-setup@v4`, `actions/setup-node@v4`. El design no las fija.

### Work Unit Evidence (PR 8)

| Evidencia | Valor |
|---|---|
| Comando focal | `pnpm format:check` exit 0; YAML parseado OK |
| Harness | Gates locales en orden del workflow, todos exit 0: `pnpm install --frozen-lockfile`, `check` (0 errores, 0 warnings, 1 hint), `lint`, `format:check`, `test`, `build` (1 página). Node local v26.8.2; workflow no ejecutado |
| Rollback | `git revert 0b470cf` o deshabilitar el workflow en la UI de Actions; no afecta a Vercel |

### Commits y tamaño (PR 8)
`0b470cf`: `.github/workflows/ci.yml` +48/-0 = 48 líneas autoradas de 400.

## Lote 14: correcciones del verify (W1, W2, W3) COMPLETO

Rama `chore/technical-cleanup-8-ci-gates`. Alcance elegido por el usuario tras el sdd-verify (PASS WITH WARNINGS). Sin PR, sin push.

| Advertencia | Corrección | Commit |
|---|---|---|
| W1 | `README.md`: se elimina la afirmación falsa de que no hay workflow de CI; se describe `.github/workflows/ci.yml` (job `verify`, en PR y push a `main`, gates `install --frozen-lockfile`, `check`, `lint`, `format:check`, `test`, `build`) y se aclara que no despliega. Sin otras afirmaciones desactualizadas sobre CI | `bf744cf` |
| W3 | `astro.config.mjs`: comentario obsoleto `Provisional (Q1 undecided)` reemplazado por `Production domain, served by Vercel.`; `site` sin cambios | `385a25c` |
| W2 | `src/lib/cv-schema.ts`: eliminados los 8 exports de tipo sin uso (`Basics`, `Profile`, `Work`, `Education`, `Skill`, `Language`, `Project`, `Acknowledgments`), verificados con `rg` (sin referencias en `src/` ni pruebas; los nombres `Education`/`Acknowledgments` que aparecen son componentes `.astro`). Se conservan `CV` y todos los `*Schema` (los usa `CvSchema`) | `ce99ba2` |

Strict TDD: refactor sin lógica nueva; 69/69 pruebas en verde antes y después; no se añadieron pruebas ni se inventó RED/GREEN.

Nota de diseño: el texto de D6 ("exporta `type CV` y los subtipos") queda superado por W2; se añadió una nota en design.md y tasks.md.

Verificación (Node v26.8.2): `pnpm install --frozen-lockfile` OK; `pnpm check` 0 errores, 0 warnings, 1 hint (preexistente); `pnpm lint` OK; `pnpm format:check` OK; `pnpm test` 69/69; `pnpm build` 1 página.
Tamaño: 3 commits, aprox. 4 + 2 + 8 líneas autoradas.
