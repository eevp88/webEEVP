# Informe de verificación: technical-cleanup

Espejo en Engram: `sdd/technical-cleanup/verify-report` (proyecto `webeevp`). Fecha: 2026-10-09. Verificación diagnóstica (no bloquea el archivo). Modo: Strict TDD activo (`strict_tdd: true`, runner `pnpm test`, vitest 5.0.3).

## Alcance

- Rama verificada: `chore/technical-cleanup-8-ci-gates`, HEAD `0b470cf` (29 commits sobre `main` `726b456`; pila 1 → 8 sin push). Árbol limpio salvo `openspec/` y `.atl/` sin versionar.
- Entradas leídas completas: `proposal.md`, `specs/{cv-data-contract,social-icon-rendering,quality-gates,ci-deploy}/spec.md`, `design.md`, `tasks.md`, `apply-progress.md`, `openspec/config.yaml`.
- Entorno: Node v26.8.2, pnpm 11.3.0. No se ejecutó Node 22 ni el workflow de CI, ni se levantó dev/preview ni navegador.
- Las pruebas dinámicas adicionales (cv.json inválido, red `mastodon`, gates negativos, comparación con `main`) se ejecutaron sobre copias del árbol en el scratchpad (`git archive`), sin modificar el repositorio.

## Comandos ejecutados (salida real)

| Comando | Exit | Resultado observado |
|---|---|---|
| `pnpm install --frozen-lockfile` | 0 | "Already up to date", pnpm v11.3.0 |
| `pnpm check` | 0 | 51 archivos: 0 errores, 0 warnings, 1 hint (`eslint.config.js:6` ts(6387): `tseslint.config` obsoleto) |
| `pnpm lint` | 0 | sin hallazgos |
| `pnpm format:check` | 0 | "All matched files use Prettier code style!" |
| `pnpm test` | 0 | 10 archivos, 69 pruebas, 69 pasan |
| `pnpm build` | 0 | 1 página (`/index.html`), Astro 7.3.8 (lockfile v9, `astro@7.3.8`) |

Pruebas dinámicas en copia aislada del árbol HEAD:

| Escenario | Exit | Evidencia |
|---|---|---|
| `cv.json` sin `basics.name` → `astro build` | 1 | `ZodError` con `"path": ["basics","name"]`, "expected string, received undefined" |
| `work[0].highlights[0] = 42` → `astro build` | 1 | `ZodError` `invalid_type`, `"path": ["work",0,"highlights",0]` |
| Perfil `mastodon` agregado → `astro build` | 0 | `<title>mastodon</title>` y path del fallback presentes; 0 apariciones de `undefined` en `dist/index.html` |
| Variable sin uso → `eslint` | 1 | `@typescript-eslint/no-unused-vars` |
| Componente que importa `@cv` → `eslint` | 1 | `no-restricted-imports` con el mensaje del proyecto |
| Archivo mal indentado → `prettier --check` | 1 | "Code style issues found" |
| Error de tipos en un `.astro` → `astro check` | 1 | ts(2322), "1 error" |
| Texto visible de `dist/index.html`: árbol `main` vs HEAD (mismo toolchain) | — | Solo difieren las correcciones de prosa de Q5 (×5 líneas) y el `<title>GitHub</title>` nuevo del SVG (esperado por D11) |
| Commit de formato `d8afb4e`: archivos normalizados (sin espacios, `;`, `,`, paréntesis; comillas unificadas) | — | 39/40 idénticos; el único distinto (`README.md`) solo cambia guiones del separador de tabla Markdown |

Comprobaciones estáticas (`rg`/`fd`): sin `console.log` en `src`; `@cv` solo en `src/lib/cv.ts`, `cv.test.ts`, `smoke.test.ts`; no existen `src/cv.d.ts`, `src/types.d.ts`, `src/assets/astro.svg`, `background.svg`; 0 coincidencias de "TypeScritp|directamentetación|Licenciadoen"; PL/SQL con `keywords`; sin `<script>` en `Section.astro`; `README.md` sin "ninja"; `.github/workflows/` solo `ci.yml`; sin `public/CNAME` ni `vercel.json`; sin `pull_request_target`, `pages: write`, `id-token`, `deploy-pages`, `upload-pages-artifact` ni `secrets.`; sin `any` en `src`.

## Completitud de tareas (observada, sin reescribir)

- `tasks.md`: 80 `[x]`, 2 `[ ]` (82 en total).
- Pendientes: 12.4 (validación con Node 22 real en la primera ejecución del CI) y 12.5 (documentar la reversibilidad en el PR). Ambos son pendientes legítimos que dependen de publicar el PR; no son brechas de implementación.
- Marcas `[x]` con evidencia solo declarada (no reproducible ahora): RED históricos (1.7, 2.1, 3.1-3.5, 4.1, 5.3-5.6, 6.1, 6.3, 6.4), diffs de `dist/` por porción (1.9, 3.8, 4.7, 5.13, 6.6, 9.6, 10.5) y verificación manual en navegador (9.5, 10.4; la de 10.4 descrita por el usuario como "aparentemente"). Se re-ejecutaron los equivalentes actuales (gates negativos, `mastodon`, comparación de texto con `main`) y coinciden con lo declarado.
- 5.10 se marcó `[x]` siendo parcial; la parte diferida (`src/types.d.ts`) se completó en 6.4 (`2f1b454`), verificado.

## Matriz de cumplimiento

Leyenda de cobertura: A = prueba automática; M = comprobación manual reproducible ejecutada en esta verificación; D = declarada en apply-progress (no re-ejecutada); N = no verificable localmente.

### cv-data-contract

| Requisito / escenario | Dictamen | Evidencia |
|---|---|---|
| Una sola definición de tipos | PARTIAL | Fuente única `src/lib/cv-schema.ts` (A: `single-source.test.ts`, `dead-code.test.ts`). Pero los subtipos exportados `Basics`, `Profile`, `Work`, `Education`, `Skill`, `Language`, `Project`, `Acknowledgments` no se referencian en ningún archivo (rg); el escenario exige "ningún tipo de CV declarado sin ser referenciado". Son derivados (no duplicados) y D6 pide exportarlos: tensión spec/design |
| Tipos completos respecto de los datos reales | COMPLIANT | `pnpm check` 0 errores; esquema declara `work[].city/country`, `acknowledgments`; sin `any` en `src` |
| Componentes consumen el accesor | COMPLIANT | A (`single-source.test.ts`, 10 consumidores) + lint `no-restricted-imports` (M) |
| El accesor devuelve datos tipados | COMPLIANT | `src/lib/cv.ts:8` `CvSchema.parse(raw)`; A (`cv.test.ts`) |
| Campo obligatorio ausente falla (test/build, con ruta) | COMPLIANT | A (`cv-schema.test.ts`, ruta en `issues[].path`) + M (build exit 1 con `basics.name`) |
| Tipo de dato incorrecto falla con ruta | COMPLIANT | A + M (`work.0.highlights.0`) |
| `cv.json` real válido | COMPLIANT | A (`cv.test.ts` 8/8) |
| PL/SQL con `keywords` | COMPLIANT | A + `cv.json:144-146` |
| Sin errores tipográficos conocidos | COMPLIANT | A (`it.each`) + rg 0 |
| Sección de relleno ausente es válida | COMPLIANT | A (`cv-schema.test.ts`) |
| Sin cambio de renderizado | COMPLIANT | M: texto visible `main` vs HEAD solo difiere en prosa Q5 y `<title>` SVG |
| Section con Props tipadas / printed booleano | COMPLIANT | `Section.astro:2-8`; A (`Section.test.ts` omitido/true/false). El ocultamiento real depende de `@media print` en `Layout.astro:100` (N: impresión no probada) |
| Sin script vacío | COMPLIANT | A + rg |
| Alias de tsconfig corregido | COMPLIANT | `tsconfig.json` sin `@/asset`; `pnpm check` 0 |

### social-icon-rendering

| Requisito / escenario | Dictamen | Evidencia |
|---|---|---|
| Redes conocidas resuelven desde el registro (Hero y KeyboardManager) | COMPLIANT | `Hero.astro` usa `SocialIcon`; `KeyboardManager.astro:9-12` usa `renderSvg(getSocialIcon())`; A (`icons.test.ts`, `SocialIcon.test.ts`, `KeyboardManager.test.ts`) |
| Sin mapas duplicados | COMPLIANT | A (prueba de código fuente) + diff de `KeyboardManager` vs `main` |
| Excepción `Skills.astro` con `satisfies` | COMPLIANT | `Skills.astro:22-41`; exhaustividad real garantizada por `pnpm check` |
| Perfil desconocido no rompe el build | COMPLIANT | M (build exit 0 con `mastodon`, sin `undefined`) |
| Resolución unitaria del fallback | COMPLIANT | A |
| Coincidencia exacta (`GitHub` vs `github`) | COMPLIANT | A (`icons.test.ts`, incluye `constructor`) |
| Sin console.log en src | COMPLIANT | rg 0 + regla `no-console` |
| Assets sin referenciar eliminados | COMPLIANT | A (`dead-code.test.ts`) + fd |
| Sin SVG de redes en línea | COMPLIANT | A + diff |
| Íconos sin uso documentados (Q7) | COMPLIANT | A (`icons.test.ts`, describe con nota Q7) |
| Comportamiento de KeyboardManager preservado | COMPLIANT | `git diff -w main HEAD`: solo origen de íconos, `console.log` eliminados y `var`→`const`; A de caracterización |
| Comparación de dist antes/después | COMPLIANT (parcial en CSS) | M para texto; CSS/JS: D (orden de `animation-timeline` del footer, N sin navegador) |

### quality-gates

| Requisito / escenario | Dictamen | Evidencia |
|---|---|---|
| Scripts presentes | COMPLIANT | `package.json` (check, lint, format, format:check, test, build) |
| Check limpio / error de tipos falla | COMPLIANT | exit 0 / M exit 1 |
| Lint limpio / violación falla | COMPLIANT | exit 0 / M exit 1 |
| Formato verificado / archivo sin formatear falla | COMPLIANT | exit 0 / M exit 1; `.prettierrc` solo plugin + parser (defaults) |
| Commit de formato aislado | COMPLIANT | M (normalización de `d8afb4e`) |
| Pruebas pasan / cobertura de invariantes | COMPLIANT | 69/69; casos de `cv.json` y fallback presentes |
| Build exitoso / versión mayor de Astro | COMPLIANT | exit 0; `astro@7.3.8` |
| packageManager declarado | COMPLIANT | `pnpm@11.3.0`, lockfile v9 coherente; `--frozen-lockfile` 0 |
| Restricción `@cv` (overrides) | COMPLIANT | `eslint.config.js:28-31`; M |
| Node fijado | COMPLIANT | `engines >=22.12`, `.nvmrc` = `22` (ver SUGGESTION sobre la precisión de `.nvmrc`) |
| Strict TDD habilitado | COMPLIANT (no versionado) | `openspec/config.yaml`: `strict_tdd: true`, `test_command: "pnpm test"` (en `projects[0]`); el archivo no está en git |
| README completo, en español, sin Ninja Keys, deploy Vercel | PARTIAL | Secciones presentes y en español; sin "ninja". Pero `README.md:147` afirma "El repositorio no incluye `vercel.json` ni un workflow de CI", falso desde `0b470cf` (instrucción obsoleta) |

### ci-deploy

| Requisito / escenario | Dictamen | Evidencia |
|---|---|---|
| PR / push a main disparan los gates en orden | COMPLIANT (estático) / N (ejecución) | `ci.yml:3-48`, orden install → check → lint → format:check → test → build |
| Fallo de gate falla el workflow | UNTESTED | Semántica estándar de Actions; no ejecutado |
| Lockfile desactualizado falla | UNTESTED (en CI) | `--frozen-lockfile` presente |
| Validación con Node 22 real | UNTESTED | Tarea 12.4 pendiente; solo Node 26.8.2 local |
| Permisos de solo lectura / concurrency | COMPLIANT | `ci.yml:9-14` |
| Sin pull_request_target | COMPLIANT | rg 0 |
| Sin workflow de deploy / CNAME / vercel.json | COMPLIANT | fd/rg |
| El CI no despliega | COMPLIANT (estático) | un solo job `verify` |
| `site` coherente | COMPLIANT | `astro.config.mjs:7` `https://enzovera.dev`, sin `base`; igual a `cv.json` `basics.url` (comentario obsoleto en `:6`) |
| Reversibilidad del workflow | UNTESTED | Tarea 12.5 pendiente; por diseño el deploy de Vercel no depende del workflow |

Resumen: 48 filas evaluadas → 42 COMPLIANT (varias de CI solo de forma estática), 2 PARTIAL, 4 UNTESTED (todas de ejecución real del CI), 0 FAILING.

## Coherencia con el diseño (D1-D20)

Implementadas: D1-D19 según lo especificado; D20 aplicada en un archivo no versionado.
Desviaciones documentadas y aceptables: 4a dividido en 4a0 (`667cb5f`) y 4a; 3a y 5b con `size:exception` aceptada; 5.10 diferido a 4b; prueba de caracterización en `src/pages/_index.test.ts` (prefijo `_` para no generar ruta); `pnpm-workspace.yaml` con `allowBuilds` (exigido por pnpm 11); TypeScript fijado en `^6` (TS 7 rompe `astro check`); vitest 5.x en lugar de 3/4; commit de LICENSE `88f65d8` fuera del plan; mensaje del commit 5b distinto al planificado; `<kbd>` en el README.
Desviaciones no documentadas: comentario `Provisional (Q1 undecided)` en `astro.config.mjs:6` contradice D4 (Q1 resuelta); `config.yaml` `context` dice "no CI yet".

## Strict TDD

### TDD Compliance

| Check | Resultado | Detalle |
|---|---|---|
| Evidencia TDD reportada | Sí | Tablas en Lotes 2, 3, 4, 5, 6 y 7; Lotes 8-13 declaran honestamente que no hubo RED/GREEN (configuración, formato mecánico, upgrade sin cambios de código, docs, CI) |
| Módulos/componentes de producción nuevos con prueba | Sí | `cv-schema.ts`, `cv.ts`, `icons.ts`, `SocialIcon.astro`, `Section.astro` (modificado) tienen prueba; Hero/Skills/KeyboardManager cubiertos por caracterización y pruebas de código fuente |
| RED confirmado (archivos de prueba existen) | Sí (declarado) | Los 10 archivos existen; el RED histórico no es reproducible y se acepta como declarado. 4.1(b) no fue RED (coerción `false == "0"`), documentado con honestidad |
| GREEN confirmado (pasan ahora) | Sí | 69/69 en esta ejecución |
| Triangulación | Adecuada | Múltiples casos por comportamiento (conocido/desconocido/casing/`constructor`; omitido/true/false; ruta de error en dos campos) |
| Safety net en archivos modificados | Parcial | Registrada en 3b/4a; en 4b solo columnas RED/GREEN |

### Distribución por capa

| Capa | Pruebas | Archivos |
|---|---|---|
| Unidad (TS puro / datos reales) | 43 | `cv-schema.test.ts` (10), `cv.test.ts` (8), `icons.test.ts` (23, 2 de ellas leen código fuente), `smoke.test.ts` (2, 1 de Container) |
| Integración (Container API) | 14 | `Section.test.ts` (6), `SocialIcon.test.ts` (3), `_index.test.ts` (5) |
| Estructural (lectura de código fuente / existencia de archivos) | 12 | `KeyboardManager.test.ts` (7), `single-source.test.ts` (3), `dead-code.test.ts` (2) |
| E2E | 0 | fuera de alcance |

Cobertura: omitida (no hay herramienta de cobertura instalada; `testing.coverage: false`).

### Calidad de aserciones

| Archivo | Línea | Aserción | Problema | Severidad |
|---|---|---|---|---|
| `src/lib/dead-code.test.ts` | 13, 21 | `expect(Object.keys(files)).toEqual([])` | Vacío sin sonda compañera no vacía: si las rutas del glob cambian, la prueba pasa siempre (el RED histórico sí demostró que coincidían) | WARNING |
| `src/components/KeyboardManager.test.ts` | 14-48 | `source` contiene/no contiene cadenas | Acoplada a la implementación (texto fuente), no a comportamiento | WARNING |
| `src/lib/icons.test.ts` | 162-190 | lista `SKILLS_COMPONENT_KEYS` copiada a mano; regex `satisfies` sobre el fuente | Detector de cambios, no prueba exhaustividad real (la garantiza `pnpm check`) | WARNING |
| `src/lib/icons.test.ts` / `src/pages/_index.test.ts` | 90-94 / 43-46 | bucles sobre `basics.profiles` / `skills` | Sin guarda de no vacío en la misma prueba (mitigado: `cv.test.ts` exige longitud > 0) | SUGGESTION |

No hay tautologías, ni aserciones sin llamada a producción, ni mocks. Resultado: 0 CRITICAL, 3 WARNING.

### Métricas de calidad

Linter: 0 errores. Type checker: 0 errores, 1 hint en un archivo de este cambio (`eslint.config.js`).

## Calidad y seguridad del diff

`git diff main...HEAD` sin lockfile: 66 archivos, +2372/-1361 (incluye el formato mecánico 5b).
- `renderSvg` escapa `title` y `style` (`icons.ts:68-91`), con pruebas de inyección. `d` y `viewBox` no se escapan, pero solo provienen de constantes internas.
- `set:html`: `SocialIcon.astro:13` (salida de `renderSvg`, segura) y `Acknowledgments.astro:10` (contenido propio de `cv.json`, preexistente, fuera de alcance).
- Sin secretos, sin `any`, sin imports muertos detectados por lint; código muerto eliminado (SVG, `console.log`, `cv.d.ts`, `types.d.ts`, `highlights`).
- Workflow: `permissions: contents: read`, sin escritura ni secretos; acciones por versión mayor (`@v4`) sin SHA.
- Dependencias nuevas: solo de desarrollo y coherentes con el diseño; `hotkeypad` sin cambios.
- `KeyboardManager.astro:13` `network[0].toUpperCase()` falla con una red vacía (el esquema permite `""`); preexistente.

## Hallazgos

### CRITICAL
Ninguno.

### WARNING
1. `README.md:147` afirma que el repositorio no incluye un workflow de CI; es falso desde `0b470cf`. Incumple "sin instrucciones obsoletas". Recomendado corregir antes de archivar.
2. Spec cv-data-contract "no queda ningún tipo de CV declarado sin ser referenciado": 8 subtipos exportados de `cv-schema.ts` no se usan. Resolver la tensión: ajustar la redacción del spec (fuente única, sin duplicados) o dejar de exportar los subtipos no usados.
3. `astro.config.mjs:6` conserva el comentario `Provisional (Q1 undecided)`, contradictorio con Q1 resuelta.
4. Escenarios de CI sin ejecutar: Node 22 real, fallo de gate, lockfile desactualizado y reversibilidad (12.4, 12.5). Las versiones `actions/*@v4` y `pnpm/action-setup@v4` no se verificaron en línea.
5. `openspec/` (incluido `config.yaml` con `strict_tdd: true` y `test_command`) y `.atl/` no están versionados: el requisito "Strict TDD habilitado" solo se cumple localmente y no viaja con los PR.
6. Pruebas estructurales acopladas al texto fuente y aserciones vacías sin sonda (ver tabla de calidad de aserciones).
7. Verificación en navegador solo manual del usuario ("aparentemente" en Astro 7); el orden de `animation-timeline` en el CSS minificado del footer no está verificado.

### SUGGESTION
1. El hint de `pnpm check` no es preexistente: proviene de `eslint.config.js` (agregado en 5a). Migrar a `defineConfig` de `eslint/config`.
2. `.nvmrc` = `22` no codifica `>=22.12`; en CI `setup-node` toma la última 22.x, pero un 22.x local antiguo pasaría. Considerar `22.12` o superior.
3. Actualizar `context` de `openspec/config.yaml` ("no CI yet").
4. Fijar acciones por SHA (mejora opcional del diseño).
5. Agregar sondas no vacías a `dead-code.test.ts` o validar con `fd` en una prueba de existencia controlada.
6. Considerar escapar `d`/`viewBox` en `renderSvg` como defensa en profundidad.
7. Seguimiento fuera de alcance: red vacía en `KeyboardManager`, colisión de atajos por inicial, errores de tema/`ctrl+C` (Q6).

## Veredicto diagnóstico

**PASS WITH WARNINGS.** Todos los gates locales pasan (install, check, lint, format:check, 69/69 pruebas, build con Astro 7.3.8), las pruebas negativas y los escenarios de datos inválidos y red desconocida se reprodujeron, y no hay escenarios FAILING. Las advertencias son de documentación (README, comentario de `site`), una tensión de redacción del spec sobre tipos exportados, calidad de algunas pruebas estructurales y verificaciones que solo pueden obtenerse en CI o en navegador.

Corregir antes de archivar (recomendado): W1 (README) y W3 (comentario), y decidir W2 (spec o exports). Pueden quedar como seguimiento: W4 (se cierra al publicar el PR), W5, W6, W7 y las sugerencias.

Siguiente paso recomendado: `sdd-archive` (implementación completa; 12.4 y 12.5 dependen de publicar el PR).

## Seguimiento

Tras este informe el usuario eligió corregir W1, W2 y W3 (2026-10-09). Las conclusiones originales no se modifican.

- W1 (README sobre CI): resuelta en `bf744cf`.
- W3 (comentario de `site`): resuelta en `385a25c`.
- W2 (exports sin uso): resuelta en `ce99ba2`, eliminando los 8 subtipos exportados; D6 anotado.
- Verificación posterior: check 0 errores, lint, format:check, 69/69 pruebas y build en verde.
- Siguen abiertas W4-W7 y las sugerencias.
