# Especificación de ci-deploy

## Purpose

Garantizar que cada PR y cada push a `main` ejecuten los quality gates en GitHub Actions. El despliegue es externo al repositorio: lo realiza Vercel al hacer commit + push, por lo que el repositorio no contiene ningún workflow de deploy (el nombre de la capacidad `ci-deploy` se conserva por trazabilidad con la propuesta).

Decisiones resueltas por el usuario (ya no son provisionales): Q1 = el destino es Vercel (despliegue por commit + push; NO se usa GitHub Pages); Q2 = Node 24 (revisada desde 22; `.nvmrc` = `24`, `engines >=22.12` como mínimo de Astro). El valor `site: https://enzovera.dev` de `astro.config.mjs` (aplicado en la porción 1) es coherente con Vercel y el dominio `enzovera.dev`; este spec no afirma nada sobre el estado del DNS.

## Requirements

### Requirement: Ejecución de gates en CI

Un workflow de GitHub Actions (`.github/workflows/ci.yml`) MUST ejecutarse en cada pull request (`pull_request`) y en cada push a `main`, con un único job `verify` que ejecute en este orden: instalación con lockfile congelado (`pnpm install --frozen-lockfile`), `pnpm check`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm build`. El job MUST usar la versión de Node fijada en `.nvmrc` (Node 24; `engines` exige >= 22.12) con caché de pnpm y la versión de pnpm declarada en `packageManager`. (Q2 resuelta.)

#### Scenario: PR dispara los gates

- GIVEN un pull request abierto contra `main`
- WHEN se crea o actualiza
- THEN el workflow se ejecuta y corre los cinco gates tras la instalación

#### Scenario: Push a main dispara los gates

- GIVEN un push a `main`
- WHEN llega a GitHub
- THEN el workflow se ejecuta y corre los mismos gates en el mismo orden

#### Scenario: Fallo de un gate falla el workflow

- GIVEN un pull request cuyo código incumple `pnpm lint`
- WHEN corre el workflow
- THEN el workflow termina en estado fallido
- AND los pasos posteriores al gate fallido no se ejecutan

#### Scenario: Lockfile desactualizado falla

- GIVEN un `package.json` modificado sin actualizar `pnpm-lock.yaml`
- WHEN corre `pnpm install --frozen-lockfile`
- THEN la instalación falla y el workflow termina fallido

#### Scenario: Validación con la versión de Node fijada

- GIVEN la primera ejecución del workflow en GitHub Actions
- WHEN el job `verify` corre con Node 24 (`.nvmrc`)
- THEN los gates terminan en verde, lo que constituye la verificación con la versión de producción (localmente solo se dispone de Node 26.8.2; el piso 22.12 de `engines` no se prueba)

### Requirement: Permisos mínimos y trigger seguro

El workflow MUST declarar `permissions: contents: read` y MUST usar `concurrency` con `cancel-in-progress`. MUST NOT usar el trigger `pull_request_target`, MUST NOT otorgar permisos de escritura (`pages: write`, `id-token: write` u otros) y MUST NOT usar secretos.

#### Scenario: Permisos de solo lectura

- GIVEN `.github/workflows/ci.yml`
- WHEN se inspeccionan sus permisos
- THEN el único permiso declarado es `contents: read`

#### Scenario: Sin pull_request_target

- GIVEN `.github/workflows/ci.yml`
- WHEN se inspeccionan sus triggers
- THEN solo incluyen `pull_request` y `push` a `main`

### Requirement: Despliegue externo por Vercel

El despliegue del sitio estático MUST ser realizado por Vercel al hacer commit + push. El repositorio MUST NOT contener un workflow de deploy ni artefactos de GitHub Pages: sin `actions/upload-pages-artifact`, sin `actions/deploy-pages`, sin `public/CNAME` y sin permisos `pages: write` ni `id-token: write`. Este cambio no crea `vercel.json` ni define ajustes del panel de Vercel. (Q1 resuelta.)

#### Scenario: Sin workflow de deploy

- GIVEN el repositorio tras el cambio
- WHEN se inspeccionan `.github/workflows/` y `public/`
- THEN no existe ningún job de deploy ni referencia a `deploy-pages` o `upload-pages-artifact`
- AND no existe `public/CNAME`

#### Scenario: El CI no despliega

- GIVEN un pull request o un push a `main`
- WHEN corre el workflow
- THEN solo ejecuta los gates; el despliegue lo gestiona Vercel de forma independiente

### Requirement: Coherencia del dominio configurado

`site` en `astro.config.mjs` MUST ser `https://enzovera.dev`, coherente con `basics.url` de `cv.json`, Vercel como destino y el dominio `enzovera.dev`. Este cambio MUST NOT modificar el DNS ni afirmar su estado.

#### Scenario: `site` coherente

- GIVEN `astro.config.mjs`
- WHEN se lee la opción `site`
- THEN es `https://enzovera.dev`, sin `base`

### Requirement: Reversibilidad del workflow

El workflow MUST poder deshabilitarse o revertirse sin afectar el sitio publicado.

#### Scenario: Deshabilitar el workflow

- GIVEN el workflow deshabilitado o revertido
- WHEN se consulta el sitio publicado
- THEN permanece accesible con el último despliegue de Vercel, que no depende del workflow
