# Especificación de quality-gates

## Purpose

Garantizar que el repositorio exponga scripts de verificación (`check`, `lint`, `format`, `format:check`, `test`, `build`) que pasen en la rama principal, que Strict TDD pueda aplicarse y que la versión de Astro esté actualizada.

Decisiones resueltas por el usuario: Q2 = Node 24 (revisada desde 22) fijado en `.nvmrc`, con `engines` en `>= 22.12` como mínimo de Astro; Q8 = valores por defecto de Prettier (2 espacios, punto y coma, comillas dobles) con `prettier-plugin-astro`; Q9 = README en español; Q1 = deploy en Vercel (ver `ci-deploy`).

## Requirements

### Requirement: Scripts de verificación

`package.json` MUST declarar los scripts `check`, `lint`, `format`, `format:check`, `test` y `build`.

#### Scenario: Scripts presentes

- GIVEN `package.json` tras el cambio
- WHEN se listan sus scripts
- THEN existen `check`, `lint`, `format`, `format:check`, `test` y `build`

### Requirement: Verificación de tipos

`pnpm check` MUST ejecutar `astro check` y terminar con código 0 y sin errores en la rama principal. `typescript` y `@astrojs/check` MUST estar declarados como dependencias de desarrollo.

#### Scenario: Check limpio

- GIVEN la rama principal tras el cambio
- WHEN se ejecuta `pnpm check`
- THEN termina con código 0 y sin errores

#### Scenario: Un error de tipos hace fallar el gate

- GIVEN un cambio que introduce un error de tipos en un componente
- WHEN se ejecuta `pnpm check`
- THEN termina con código distinto de 0

### Requirement: Lint

`pnpm lint` MUST ejecutar ESLint con configuración flat (`eslint-plugin-astro`, `typescript-eslint`) y terminar con código 0 en la rama principal.

#### Scenario: Lint limpio

- GIVEN la rama principal tras el cambio
- WHEN se ejecuta `pnpm lint`
- THEN termina con código 0

#### Scenario: Una violación hace fallar el lint

- GIVEN un archivo con una variable declarada y no usada
- WHEN se ejecuta `pnpm lint`
- THEN termina con código distinto de 0

### Requirement: Formato

`pnpm format:check` MUST ejecutar Prettier con `prettier-plugin-astro` en modo comprobación y terminar con código 0 en la rama principal; `pnpm format` MUST aplicar el formato. El estilo MUST ser el por defecto de Prettier. (Q8 resuelta.) El reformateo masivo MUST entregarse en un commit mecánico aislado, sin cambios de lógica.

#### Scenario: Formato verificado

- GIVEN la rama principal tras el commit de formato
- WHEN se ejecuta `pnpm format:check`
- THEN termina con código 0

#### Scenario: Archivo sin formatear falla

- GIVEN un archivo fuente con indentación distinta de la configurada
- WHEN se ejecuta `pnpm format:check`
- THEN termina con código distinto de 0

#### Scenario: Commit de formato aislado

- GIVEN el historial de la porción de formato
- WHEN se compara el commit de formato con su padre ignorando espacios en blanco
- THEN no hay cambios de lógica

### Requirement: Pruebas

`pnpm test` MUST ejecutar vitest (configurado con `getViteConfig` de Astro) y terminar con código 0. La suite MUST cubrir el parseo e invariantes del CV y el registro de íconos, incluyendo el fallback de red desconocida.

#### Scenario: Pruebas pasan

- GIVEN la rama principal tras el cambio
- WHEN se ejecuta `pnpm test`
- THEN termina con código 0

#### Scenario: Cobertura de invariantes

- GIVEN la suite de pruebas
- WHEN se inspeccionan sus casos
- THEN hay casos para el parseo de `cv.json` y para el registro de íconos con una red desconocida

### Requirement: Build

`pnpm build` MUST terminar con código 0 en la versión mayor de Astro actualizada (7.x, o 6.x si se usó la alternativa) y `astro.config.mjs` MUST definir `site` (`https://enzovera.dev`, coherente con el despliegue en Vercel; Q1 resuelta).

#### Scenario: Build exitoso

- GIVEN la rama principal tras la actualización
- WHEN se ejecuta `pnpm build`
- THEN termina con código 0
- AND `dist/` contiene la página de inicio

#### Scenario: Versión mayor de Astro

- GIVEN `package.json` y el lockfile
- WHEN se lee la versión instalada de `astro`
- THEN es 7.x, o 6.x únicamente si el compilador o Vite 8 bloquearon la actualización y eso queda documentado

### Requirement: Gestor de paquetes fijado

`package.json` MUST declarar `packageManager` con la versión de pnpm usada para generar `pnpm-lock.yaml`, de modo que local y CI usen la misma versión.

#### Scenario: packageManager declarado

- GIVEN `package.json` tras la unidad 1
- WHEN se lee el campo `packageManager`
- THEN contiene `pnpm@<versión>` y esa versión coincide con la que generó el lockfile

### Requirement: Restricción de importación de `@cv`

La configuración de ESLint MUST incluir la regla `no-restricted-imports` que prohíba importar `@cv` desde cualquier archivo distinto de `src/lib/cv.ts` y de las pruebas `src/lib/cv.test.ts` y `src/lib/smoke.test.ts` (override en `eslint.config.js`; las pruebas verifican el alias y el `cv.json` real).

#### Scenario: Import directo de `@cv` falla el lint

- GIVEN un componente que importa `@cv` directamente
- WHEN se ejecuta `pnpm lint`
- THEN termina con código distinto de 0

#### Scenario: Archivos permitidos pueden importar `@cv`

- GIVEN la rama principal tras el cambio
- WHEN se ejecuta `pnpm lint`
- THEN `src/lib/cv.ts`, `src/lib/cv.test.ts` y `src/lib/smoke.test.ts` no generan violación de `no-restricted-imports`

### Requirement: Versión de Node fijada

El repositorio MUST exigir Node >= 22.12 mediante `engines` (mínimo de Astro) y fijar la versión de desarrollo, CI y producción en Node 24 mediante `.nvmrc`. (Q2 resuelta y revisada a Node 24; el piso 22.12 no se prueba en el CI.)

#### Scenario: Node fijado

- GIVEN `package.json` y `.nvmrc`
- WHEN se leen
- THEN `engines` exige Node >= 22.12 y `.nvmrc` fija Node 24

### Requirement: Strict TDD habilitado

`openspec/config.yaml` MUST declarar un `test_command` no nulo y `strict_tdd: true` una vez disponible el test runner.

#### Scenario: Configuración actualizada

- GIVEN `openspec/config.yaml` tras la unidad de vitest
- WHEN se lee
- THEN `test_command` apunta a `pnpm test` y `strict_tdd` es `true`

### Requirement: Documentación en README

El README MUST documentar propósito, stack, instalación, scripts, edición de contenido (`cv.json`) y deploy, sin instrucciones obsoletas (Ninja Keys, plantilla). El idioma MUST ser español. (Q9 resuelta.) La sección de deploy MUST describir el despliegue por Vercel (commit + push).

#### Scenario: README completo

- GIVEN `README.md` tras el cambio
- WHEN se revisan sus secciones
- THEN cubre propósito, stack, scripts, edición de `cv.json` y deploy
- AND no menciona Ninja Keys
