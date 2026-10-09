# Propuesta: Technical Cleanup (Base sólida)

Espejo en Engram: `sdd/technical-cleanup/proposal` (proyecto `webeevp`). Entrada: `openspec/changes/technical-cleanup/exploration.md`.

## Intención

El sitio de CV webEEVP (Astro 5, salida estática) no tiene herramientas de verificación: no hay script de typecheck, ni test runner, ni linter, ni formateador, ni CI. Strict TDD está habilitado globalmente pero no puede aplicarse porque **no existe un test runner** (`strict_tdd: false` en `openspec/config.yaml`). Los tipos están duplicados y en parte sin usar (`src/cv.d.ts`, `src/types.d.ts`), hay código muerto y markup SVG duplicado, el README está desactualizado y Astro está dos versiones mayores atrás (5.7.12 vs 7.x).

Este cambio establece una base técnica sólida para que las propuestas posteriores (rediseño visual, SEO/i18n/a11y) se apoyen en un código tipado, probado, con lint, y con build y deploy continuos. El éxito significa que todo cambio posterior a este queda controlado por `pnpm check`, `pnpm lint`, `pnpm format:check`, `pnpm test` y `pnpm build`, tanto en local como en CI.

## Alcance

### Dentro del alcance
1. **Base de tooling**: agregar `typescript` y `@astrojs/check`; scripts `check`, `lint`, `format`, `format:check`, `test`; definir `site` en `astro.config.mjs`; corregir los errores base de `astro check`; corregir el error tipográfico del alias `@/asset` en tsconfig.
2. **Test runner**: vitest configurado mediante `getViteConfig` de Astro, más las primeras pruebas; actualizar `openspec/config.yaml` (`test_command`, `strict_tdd: true`) para que Strict TDD aplique a cada unidad posterior.
3. **Tipado del CV con fuente única**: una sola fuente de tipos del CV (esquema o interfaces, ver Q3) con un accesor tipado `src/lib/cv.ts`; eliminar el duplicado `CV` sin uso; tipar `SocialIcon`; agregar `Props` a `Section.astro` y un flag booleano real `printed`.
4. **Código muerto y duplicación**: registro compartido de íconos usado por `Hero.astro` y `KeyboardManager.astro`; eliminar los SVG duplicados en línea, las cinco llamadas a `console.log`, el `<script>` vacío y los archivos sin referenciar `src/assets/astro.svg` y `background.svg`; renderizado de fallback para redes sociales desconocidas.
5. **ESLint + Prettier**: configuración flat (`eslint-plugin-astro`, `typescript-eslint`), `prettier-plugin-astro`; un único commit de formato mecánico y aislado.
6. **Actualización de Astro**: a 7.x (recurrir a 6.x si el compilador Rust o Vite 8 lo bloquean), incluyendo compatibilidad de `hotkeypad` y vitest.
7. **Reescritura del README**: propósito, stack, scripts, edición de contenido (`cv.json`), deploy.
8. **CI y deploy**: workflow de GitHub Actions en PR y push a `main` que ejecute install (lockfile congelado), check, lint, format:check, test, build; job de deploy hacia el destino seleccionado (Q1).

### Fuera del alcance
- Rediseño visual y tokens de tema (propuesta 2).
- Revisión integral de SEO, i18n y accesibilidad (propuesta 3).
- Errores de comportamiento en `KeyboardManager` (los comandos de tema alternan todos; `ctrl+C` anula la copia), salvo que Q6 los incorpore.
- Nuevo contenido o nuevas secciones del CV.
- Pruebas E2E/de regresión visual.

## Capacidades

`openspec/specs/` está vacío; todas las capacidades son nuevas.

### Capacidades nuevas
- `cv-data-contract`: la fuente de datos del CV tiene una única definición de tipos, los datos inválidos o incompletos de `cv.json` se detectan en build/test, y los componentes los consumen mediante un accesor tipado.
- `social-icon-rendering`: las redes sociales y las habilidades resuelven sus íconos mediante un registro compartido; las redes desconocidas renderizan un fallback definido en lugar de un ícono indefinido.
- `quality-gates`: el repositorio expone los scripts `check`, `lint`, `format:check`, `test` y `build`, que pasan en la rama principal.
- `ci-deploy`: cada PR y push a `main` ejecuta los quality gates; los push a `main` despliegan el sitio estático en el dominio configurado.

### Capacidades modificadas
- Ninguna.

## Enfoque

Entregar en las unidades de trabajo ordenadas de la exploración, una porción de PR encadenado por cada una (estrategia `ask-on-risk`, presupuesto de 400 líneas). Justificación del orden: primero el tooling para que cada unidad posterior tenga un control; segundo las pruebas para que Strict TDD gobierne las unidades 3-8; tipado y limpieza de código muerto antes del formato para que el commit de formato toque el código final; formato antes de la actualización para que los diffs de la actualización no queden enmascarados por cambios de estilo; README y CI al final porque documentan y controlan el estado final.

| # | Unidad | Dirección elegida | Compromiso aceptado |
|---|--------|-------------------|---------------------|
| 1 | Base de tooling | `@astrojs/check` + `typescript`; `site` según el dominio de Q1 | Errores base desconocidos pueden ampliar la unidad |
| 2 | vitest | vitest con `getViteConfig`, pruebas de invariantes del cv y helpers | Debe reverificarse tras la unidad 6 (Vite 8) |
| 3 | Tipado | Provisional: esquema Zod vía `astro/zod` (sin nueva dependencia directa) con `z.infer`, parseado en `src/lib/cv.ts` (Q3) | Salto de Zod 3 a 4 en la unidad 6; escribir el esquema con el subconjunto de API común a ambos |
| 4 | Código muerto | Registro `src/lib/icons.ts` con fallback, con pruebas | La forma del registro condiciona levemente la propuesta 2 |
| 5 | ESLint + Prettier | Commit de configuración separado del commit de formato mecánico | El commit de formato es grande pero trivial de revisar |
| 6 | Actualización de Astro | 7.x, alternativa 6.x | Rigurosidad del compilador Rust y cambios de espacios en blanco de `compressHTML: 'jsx'` |
| 7 | README | Reescritura desde cero | Idioma pendiente (Q9) |
| 8 | CI + deploy | GitHub Actions; provisional GitHub Pages (Q1) | Sin previews de PR en Pages |

Alternativas descartadas: `node:test` + tsx (sin integración con Astro/Vite); mantenerse en Astro 5 (acumula deuda de actualización); Netlify como opción por defecto (cuenta adicional y cambio de DNS, pendiente de Q1).

## Preguntas abiertas (sin resolver; los valores por defecto provisionales NO son decisiones)

| # | Pregunta | Valor provisional | Justificación | Condiciona |
|---|----------|-------------------|---------------|------------|
| Q1 | Destino del deploy, y ¿hacia dónde apunta hoy el DNS de `enzovera.dev`? | GitHub Pages con `public/CNAME` y `site: https://enzovera.dev` | Gratuito, misma plataforma que CI, sin cuenta nueva | Unidades 6, 8 (también el valor de `site` en 1) |
| Q2 | Node objetivo: ¿22 LTS o más nuevo? | Node 22 LTS (>= 22.12), fijado mediante `engines` y `.nvmrc` | Mínimo requerido por Astro 6/7; LTS | Unidades 6, 8 |
| Q3 | ¿Validación en runtime con Zod o solo tipos? | Zod vía `astro/zod` | Valida `cv.json` en build/test, sin dependencia adicional | Unidad 3 (y sus pruebas) |
| Q4 | ¿Mantener o eliminar las secciones de relleno de `cv.json`? | Mantener; el esquema las marca como opcionales; el renderizado no cambia | La decisión de contenido corresponde al usuario; cero cambio de comportamiento | Unidad 3 |
| Q5 | ¿Corregir los errores tipográficos de `cv.json` en este cambio? | Corregir `key` a `keywords` en PL/SQL (estructural, requerido por el tipado) y los tres errores tipográficos de prosa | Corrección de contenido pequeña y de bajo riesgo | Unidad 3 |
| Q6 | ¿Están en alcance los errores de comandos de tema y `ctrl+C`? | Fuera de alcance; registrar como seguimiento | Este cambio es una limpieza no conductual | Unidad 4 |
| Q7 | ¿Mantener los íconos sin coincidencia (next, swift, swiftui, kotlin, flutter)? | Mantener en el registro, marcados como sin uso mediante una nota en una prueba | Probables habilidades futuras; barato de conservar | Unidad 4 |
| Q8 | ¿Estilo de Prettier? | Valores por defecto de Prettier (2 espacios, punto y coma, comillas dobles) + `prettier-plugin-astro` | Configuración mínima, convención común | Unidad 5 |
| Q9 | ¿Idioma del README? | Inglés | Los artefactos del repositorio usan inglés por defecto | Unidad 7 |

Las unidades 1, 2 y la mitad de configuración de la 5 pueden comenzar antes de cualquier respuesta; cada unidad condicionada espera su(s) pregunta(s).

> **Nota de resolución (posterior a la propuesta):** Q1 se resolvió con Vercel como destino de deploy (commit + push); NO se usa GitHub Pages ni `public/CNAME`, y el CI de la unidad 8 queda solo con los gates, sin job de deploy. Q2 = Node 22 y Q9 = README en español también quedaron resueltas. Las referencias a GitHub Pages/CNAME de esta propuesta son el valor provisional original y han sido reemplazadas en `design.md`, `tasks.md` y `specs/ci-deploy/spec.md`.

## Áreas afectadas

| Área | Impacto | Descripción |
|------|---------|-------------|
| `package.json`, `pnpm-lock.yaml` | Modificado | Dependencias de desarrollo, scripts, `engines`, versión de Astro |
| `astro.config.mjs` | Modificado | `site`; opciones relacionadas con la actualización |
| `tsconfig.json` | Modificado | Corregir alias `@/asset` |
| `vitest.config.ts`, `src/**/*.test.ts` | Nuevo | Test runner y pruebas |
| `src/lib/cv.ts`, `src/lib/icons.ts` | Nuevo | Accesor tipado del CV, registro de íconos |
| `src/cv.d.ts`, `src/types.d.ts` | Modificado/Eliminado | Unificar en una única fuente de tipos |
| `cv.json` | Modificado | Corrección de `keywords`, errores tipográficos (Q5) |
| `src/components/Section.astro` | Modificado | Props, flag booleano, eliminar script vacío |
| `src/components/KeyboardManager.astro` | Modificado | Usar el registro, eliminar SVG en línea y `console.log` |
| `src/components/sections/{Hero,Experience,Acknowledgments,Skills}.astro` | Modificado | Datos tipados, registro, fallback |
| `src/assets/astro.svg`, `src/assets/background.svg` | Eliminado | Sin referenciar |
| `eslint.config.js`, `.prettierrc`, `.prettierignore` | Nuevo | Lint y formato |
| `README.md` | Modificado | Reescritura |
| `.github/workflows/ci.yml`, `public/CNAME`, `.nvmrc` | Nuevo | CI, deploy, fijación de Node |
| `openspec/config.yaml` | Modificado | Habilitar test runner y Strict TDD tras la unidad 2 |

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|--------|--------------|------------|
| El compilador Rust de Astro 7 rechaza el markup existente; `compressHTML: 'jsx'` cambia los espacios en blanco | Media | Comparar el HTML generado antes/después; recurrir a 6.x |
| Node local < 22.12 | Media | Verificar `node -v` antes de la unidad 6; fijar `.nvmrc` |
| `hotkeypad` o vitest incompatibles con Vite 8 | Baja-Media | Ejecutar pruebas y build en la unidad 6; recurrir a 6.x |
| El cambio de API de Zod 3 a 4 rompe el esquema | Baja | Usar el subconjunto común de la API; las pruebas cubren el parseo |
| `astro check` revela muchos errores base | Media | Corregir dentro de la unidad 1 o dividir en 1a/1b si excede el presupuesto |
| El commit de formato oculta cambios reales | Media | Commit mecánico aislado; sin cambios de lógica en él |
| Una mala configuración de DNS/dominio personalizado rompe el sitio en vivo | Media | No cambiar el DNS hasta responder Q1; verificar el deploy en Pages antes de cambiar |
| Regresiones en la salida del build sin detectar (sin pruebas visuales) | Media | Comparar el HTML de `dist/` antes/después de las unidades 4 y 6 |

## Plan de rollback

Cada unidad es un commit/porción de PR independiente; el rollback es `git revert` de esa porción, en orden inverso.

| Unidad | Rollback |
|--------|----------|
| 1 | Revertir scripts/dependencias de desarrollo/`site`; el sitio compila como antes |
| 2 | Revertir la configuración de vitest y las pruebas; restaurar `strict_tdd: false` en `openspec/config.yaml` |
| 3 | Revertir `src/lib/cv.ts` y los cambios de tipos; los componentes vuelven a leer `@cv` directamente |
| 4 | Revertir el registro; vuelven los SVG en línea y los assets |
| 5 | Revertir por separado el commit de formato y el de configuración (primero el de formato) |
| 6 | Revertir `package.json`/lockfile a 5.7.12 y cualquier corrección de markup; o detenerse en 6.x |
| 7 | Revertir el README |
| 8 | Deshabilitar o revertir el workflow; el DNS no se toca hasta verificar el deploy, por lo que el sitio en vivo no se ve afectado |

## Dependencias

- Respuestas a Q1-Q9 para las unidades condicionadas (ver tabla).
- Node >= 22.12 en local y en CI desde la unidad 6 en adelante.
- Repositorio de GitHub con Pages habilitado (si Q1 confirma Pages) y acceso al DNS de `enzovera.dev`.

## Entrega y pronóstico de tamaño

Líneas autoradas modificadas (adiciones + eliminaciones), excluyendo `pnpm-lock.yaml` (generado). Solo estimaciones.

| Unidad | Pronóstico | ¿Puede superar 400? |
|--------|------------|---------------------|
| 1 Tooling | 40-150 | No (salvo que haya muchos errores base) |
| 2 vitest | 80-180 | No |
| 3 Tipado | 150-320 | Posible con el esquema Zod y las pruebas |
| 4 Código muerto | 150-350 (más las líneas eliminadas de los SVG) | Posible si se cuentan los SVG eliminados |
| 5a Config de lint/formato | 60-150 | No |
| 5b Commit de formato | Reformateo de todo el código fuente | Sí; mecánico, aislado, tratado como salida generada |
| 6 Actualización de Astro | 20-250 | Posible si el compilador obliga a corregir markup |
| 7 README | 100-250 | No |
| 8 CI + deploy | 60-150 | No |

Total autorado (excluyendo 5b y el lockfile): aproximadamente 800-1.800 líneas. Se requieren PR encadenados; la estrategia de entrega es `ask-on-risk`, por lo que la estrategia de cadena debe confirmarse antes de apply. La unidad 5b necesita una excepción de tamaño explícita o tratarse como salida mecánica.

## Criterios de éxito

- [ ] `pnpm check` termina con código 0 y sin errores.
- [ ] `pnpm lint` y `pnpm format:check` terminan con código 0.
- [ ] `pnpm test` termina con código 0, con pruebas que cubren el parseo/invariantes del CV y el registro de íconos, incluyendo el fallback de red desconocida.
- [ ] `pnpm build` termina con código 0 en la versión mayor de Astro actualizada (7.x, o 6.x si se usó la alternativa).
- [ ] `openspec/config.yaml` declara un `test_command` y `strict_tdd: true`.
- [ ] Existe exactamente una fuente de tipos del CV; no queda ningún tipo de CV sin usar.
- [ ] Ningún `console.log` en `src/`; `src/assets/astro.svg` y `background.svg` eliminados; sin SVG de redes duplicados.
- [ ] El HTML generado de la página de inicio no muestra diferencias de contenido no intencionadas respecto del build previo al cambio (diferencias de espacios en blanco revisadas).
- [ ] CI ejecuta todos los gates en PR y push a `main`; un push a `main` despliega y el sitio es accesible en el dominio configurado.
- [ ] El README documenta la instalación, los scripts, la edición de contenido y el deploy.
