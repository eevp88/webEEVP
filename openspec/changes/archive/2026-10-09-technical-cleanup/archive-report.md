# Informe de archivo: technical-cleanup

**Cambio**: `technical-cleanup` (propuesta 1: saneamiento técnico)
**Fecha de archivo**: 2026-10-09
**Estado**: archivado. Implementación completa; la verificación terminó en PASS WITH WARNINGS.

> Nota de corrección: el primer borrador de este informe (generado por el agente de archivo) contenía errores factuales. Esta versión fue reescrita por el orquestador y contrastada con `tasks.md`, `git log`, el historial de PRs y la API pública de GitHub Actions. Lo que no se pudo comprobar se declara como tal.

## 1. Resumen

El sitio (CV en Astro) pasó de Astro 5.7 sin herramientas de calidad a Astro 7.3.8 con tipado de `cv.json` validado con Zod, pruebas (vitest), ESLint, Prettier, CI de GitHub Actions y un README en español. El cambio no altera lo que ve el visitante, salvo las correcciones de texto de `cv.json` (Q5) y un `<title>` accesible en el ícono de GitHub. El despliegue lo hace Vercel al llegar a `main`.

## 2. Decisiones (Q1 a Q9)

| Q   | Decisión                                                                               | Estado                                                       |
| --- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Q1  | Deploy en Vercel (commit + push a `main`); CI solo de gates, sin job de deploy         | Resuelta                                                     |
| Q2  | Versión de Node: **revisada de 22 a 24** (producción en Vercel usa 24). `.nvmrc` = 24; `engines` sigue en `>=22.12` (mínimo de Astro) | Resuelta (revisada tras el verify, commit `883f5af`) |
| Q3  | Validación de `cv.json` con Zod vía `astro/zod`                                         | Resuelta                                                     |
| Q4  | Conservar las secciones de relleno de `cv.json` como opcionales                         | Resuelta                                                     |
| Q5  | Corregir los typos de `cv.json` en un commit aparte                                     | Resuelta (commit `182b124`)                                  |
| Q6  | Los bugs de comportamiento de `KeyboardManager` (comandos de tema, Ctrl+C) quedan fuera | Resuelta: fuera de alcance                                   |
| Q7  | Conservar los íconos sin coincidencia (next, swift, swiftui, kotlin, flutter)           | Resuelta: se conservan                                       |
| Q8  | Prettier con los defaults (2 espacios, punto y coma, comillas dobles)                  | Resuelta                                                     |
| Q9  | README en español                                                                       | Resuelta                                                     |

## 3. Unidades de trabajo (8 unidades en 13 PRs planificados)

Líneas autoradas = adiciones + eliminaciones, sin lockfile. Cifras tomadas de los informes de cada lote; no se recalcularon.

| PR   | Commits                                  | Líneas | Contenido                                                                 |
| ---- | ---------------------------------------- | ------ | ------------------------------------------------------------------------- |
| 1    | `948bbb3` `ced5ceb` `470de1f` `07009d7`  | 21     | pnpm 11 fijado, script `check`, alias `@/asset` eliminado, `site`          |
| 2    | `03e1c08`                                | 40     | vitest 5 con `getViteConfig`, pruebas de humo, `strict_tdd: true`          |
| 3a   | `643a660` `182b124` `1e77739`            | 439    | Esquema Zod, accesor `cv.ts`, correcciones de `cv.json` (`size:exception`) |
| 3b   | `80bfaf3` `7d99aa1`                      | 277    | `Section` con Props, componentes leen de `@/lib/cv`, se borra `cv.d.ts`   |
| 4a0  | `667cb5f`                                | 50     | Prueba de caracterización de `index.astro` (división de 4a)                |
| 4a   | `1dc66d6` `e86ae2c` `5d86bfb` `feffed0` `613bb39` | 385 | Registro de íconos con fallback, `SocialIcon`, `Hero`                 |
| 4b   | `17b7f4e` `d905885` `2f1b454`            | 215    | `KeyboardManager` y `Skills` usan el registro; se borran `types.d.ts` y SVG sin uso |
| 5a   | `5996f3a` `44104dd`                      | 66     | ESLint + Prettier, scripts `lint` y `format`                               |
| 5b   | `d8afb4e`                                | 2332   | Commit mecánico de `pnpm format` (`size:exception`)                        |
| 5c   | `b5ea647`                                | 3      | `.git-blame-ignore-revs` con el SHA de 5b                                  |
| 6a   | `5514580` `d932d86`                      | 6      | `engines`/`.nvmrc` (entonces 22) y Astro 6.4.8                             |
| 6b   | `6012cb2`                                | 2      | Astro 7.3.8 (Vite 8)                                                       |
| 7    | `19bd22a`                                | 179    | README en español                                                          |
| 7b   | `88f65d8`                                | 2      | Avisos de copyright de midudev y Bartosz Jarocki en `LICENSE` (fuera del plan, decidido por el usuario) |
| 8    | `0b470cf`                                | 48     | `.github/workflows/ci.yml` (job `verify`, solo gates)                      |

Correcciones posteriores al verify: `bf744cf` (README), `385a25c` (comentario de `astro.config.mjs`), `ce99ba2` (subtipos sin uso). Pin a Node 24: `883f5af`.
Total aproximado: unas 1.750 líneas autoradas sin contar 5b ni el lockfile (suma de los informes por lote, no un conteo independiente).

## 4. Tareas

`tasks.md` archivado: **81 completas `[x]` y 1 incompleta `[ ]`**.
- **12.4** (validación con CI real): cumplida con una salvedad: el CI corrió con **Node 24**, no con 22.
- **12.5** (documentar la reversibilidad en el PR): **no se hizo**; queda sin marcar. La reversibilidad se documenta en la sección 7.

## 5. Verificación

`sdd-verify` (informe en `verify-report.md`): **PASS WITH WARNINGS**, 0 críticos, 7 advertencias, 7 sugerencias. Matriz de 48 filas: 42 cumplen, 2 parciales, 4 sin poder probarse localmente, 0 fallan. Los gates locales (`install --frozen-lockfile`, `check`, `lint`, `format:check`, `test` con 69 pruebas, `build`) pasaron en la ejecución del verify.

Estado final de las advertencias:

| Advertencia | Estado |
| ----------- | ------ |
| W1: el README decía que no había workflow de CI | Corregida (`bf744cf`) |
| W2: 8 subtipos exportados sin uso en `cv-schema.ts` | Corregida (`ce99ba2`) |
| W3: comentario obsoleto `Provisional (Q1 undecided)` en `astro.config.mjs` | Corregida (`385a25c`) |
| W4: el CI nunca había corrido | Resuelta: GitHub Actions ejecutó el workflow con éxito en el PR #2 (evento `pull_request`, commit `883f5af`) y en el push a `main` (commit `8754a43`), con Node 24 |
| W5: `openspec/` y `.atl/` sin versionar | **Abierta al archivar.** El usuario pidió subir `openspec/` al repositorio mediante una rama nueva y un PR; `.atl/` queda fuera |
| W6: pruebas estructurales débiles (`dead-code.test.ts`, `KeyboardManager.test.ts` acoplada al texto, `SKILLS_COMPONENT_KEYS` copiada a mano) | **Abierta** (seguimiento) |
| W7: verificación manual de navegador descrita por el usuario como "aparentemente"; orden de `animation-timeline` del footer no verificado | **Abierta** (seguimiento) |

Sugerencias abiertas: `tseslint.config` obsoleto en `eslint.config.js` (usar `defineConfig`), fijar las actions por SHA, versiones `@v4` de las actions sin verificar en línea, `.nvmrc` mayor frente a `engines`, actualizar el contexto de `openspec/config.yaml`, sondas no vacías en pruebas de resultado vacío, escapar `d`/`viewBox` en `renderSvg`, y seguimientos fuera de alcance (`network[0]` con nombre vacío, colisión de atajos por letra inicial, Q6).

## 6. Entrega

- **PR #1**: rama `chore/technical-cleanup-7-readme` hacia `main`, merge commit `5544d9a` (2026-10-09, 14:36). Llevó a `main` las unidades 1 a 7. No pudo correr el CI porque el workflow todavía no estaba en `main`.
- **PR #2**: `development` hacia `main`, merge commit `8754a43`, 6 commits (licencia, CI, las 3 correcciones del verify y el pin a Node 24). Es el primer PR con CI: `verify` en verde.
- **Estado final**: `origin/main` y `origin/development` tienen el mismo contenido (diferencia vacía); `main` solo suma los dos merge commits. Las 14 ramas `chore/technical-cleanup-*` están incluidas en `main`.
- **Producción**: Vercel desplegó (preview de `development` y producción). Se comprobó leyendo el HTML público de `https://enzovera.dev`: HTTP 200, 34.066 bytes (el mismo tamaño que el build de Astro 7 de la unidad 6b), typos corregidos y `<title>GitHub</title>` presente.

## 7. Reversibilidad (pendiente 12.5)

- Revertir el PR #2: `git revert -m 1 8754a43` (quita licencia, CI, correcciones del verify y Node 24).
- Revertir el PR #1: `git revert -m 1 5544d9a` (quita las unidades 1 a 7, incluido el upgrade a Astro 7). Hacerlo después de revertir el #2.
- Para detener solo el CI: deshabilitar el workflow en la pestaña Actions de GitHub; no afecta al despliegue de Vercel.
- Vercel permite volver a un deployment anterior desde su panel.

## 8. Desviaciones aceptadas

División de 4a en 4a0 y 4a; `size:exception` en 3a (439 líneas) y 5b (2.332 líneas, mecánico); tarea 5.10 pasada a 4b; `_index.test.ts` con prefijo para no ser tratado como ruta; `pnpm-workspace.yaml` con `allowBuilds`; TypeScript fijado en `^6` (TypeScript 7 rompe `astro check`); vitest 5; commit de `LICENSE` fuera del plan; Q2 revisada a Node 24 después del verify. Nota: el piso `22.12` de `engines` ya no se prueba en ningún entorno (local: Node 26.8.2; CI y producción: 24).

## 9. Supuestos del diseño: qué se comprobó

- Compilador Rust de Astro 7 acepta el markup actual: comprobado (build y pruebas sin correcciones de markup).
- vitest y `getViteConfig` con Vite 6, 7 y 8, y Container API: comprobado por las pruebas.
- `astro/zod` con Zod 3.25.76 (Astro 5) y Zod 4.6.5 (Astro 6 y 7): el esquema funcionó sin cambios.
- `hotkeypad` con Vite 7 y 8: el bundle del cliente es idéntico y el usuario probó a mano el command palette (Astro 6 y 7); la prueba de Astro 7 la describió como "aparentemente".
- Node 22 real: **no comprobado**.

## 10. Fuera de este cambio

La propuesta 2 (rediseño visual: tokens CSS, tema claro/oscuro sin parpadeo, tipografía) y la propuesta 3 (SEO, i18n es/en, accesibilidad WCAG 2.2 AA) no se iniciaron. Cualquier trabajo futuro empieza un cambio SDD nuevo.

## 11. Artefactos

- Archivados en `openspec/changes/archive/2026-10-09-technical-cleanup/`: `proposal.md`, `exploration.md`, `design.md`, `tasks.md`, `apply-progress.md`, `verify-report.md`, `specs/` (4 capacidades) y este informe.
- Specs principales: `openspec/specs/{cv-data-contract,social-icon-rendering,quality-gates,ci-deploy}/spec.md`.
- Engram (proyecto `webeevp`): `sdd/technical-cleanup/{proposal,explore,spec,design,tasks,apply-progress,verify-report,archive-report,state}`. Las copias de `spec`, `design`, `tasks` y `apply-progress` son resúmenes que apuntan a los archivos, que son la fuente completa.
