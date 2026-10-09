# Exploración: technical-cleanup

Espejo en Engram: `sdd/technical-cleanup/explore` (proyecto `webeevp`, obs 1178).

## Estado actual

- **Dependencias/configuración**: `astro ^5.7.12` (bloqueado en 5.7.12, typescript 5.8.3) y `hotkeypad`. Scripts: `dev`, `build`, `preview`, `astro`. `astro.config.mjs` es un `defineConfig({})` vacío (sin `site`). URL del sitio en `cv.json`: `https://enzovera.dev`.
- **Actualización de Astro (documentación oficial)**: la última versión es 7.3.8 (Node >=22.12). v6 eleva el mínimo de Node, pasa a Vite 7 y Zod 4, y elimina `Astro.glob` y `<ViewTransitions/>`. v7 pasa a Vite 8 y a un compilador en Rust que falla ante etiquetas sin cerrar y cambia `compressHTML` a las reglas de espacios en blanco `'jsx'`. El proyecto no usa ninguna de las APIs eliminadas; los riesgos reales son la rigurosidad del markup `.astro`, los cambios de espacios en blanco y el mínimo de Node. **No verificado con un build.**
- **Tipos**: `CV` en `src/cv.d.ts` no se usa y carece de `acknowledgments`; `Work` carece de `city`/`country`; `Highlight` es `Array<String>`. `SocialIcon` en `src/types.d.ts` es en la práctica `any`. `Section.astro` no tiene `Props`, asigna por defecto `printed = true` pero compara `printed == "0"`, y tiene un `<script>` vacío. El alias `"@/asset"` de `tsconfig.json` es un error tipográfico y nunca coincide.
- **Calidad de cv.json**: secciones de relleno (`volunteer`, `awards`, `certificates`, `publications`, `interests`, `references`); la habilidad PL/SQL usa `key` en lugar de `keywords`; errores tipográficos ("TypeScritp", "directamentetación", "Licenciadoen").
- **Código muerto/duplicación**: `src/assets/astro.svg` y `background.svg` sin referenciar. Los 23 íconos se importan, pero `next`, `swift`, `swiftui`, `kotlin`, `flutter` no coinciden con ninguna habilidad de `cv.json`. `KeyboardManager.astro` duplica en línea los SVG de GitHub/LinkedIn/X (líneas 10-41) y tiene `console.log` en las líneas 117, 135, 169, 180, 196. Los mapas de íconos de `Hero.astro` y `KeyboardManager` cubren solo GitHub/LinkedIn/X, por lo que cualquier otra red renderiza un ícono indefinido. Errores de comportamiento (probablemente fuera de alcance): los comandos de tema light/dark/system alternan todos; el atajo `ctrl+C` anula la copia.
- **README**: desactualizado (Ninja Keys, instrucciones de plantilla, mezcla de HTML/Markdown).

## Áreas afectadas

`package.json`, `pnpm-lock.yaml`, `astro.config.mjs`, `tsconfig.json`, `src/cv.d.ts`, `src/types.d.ts`, `src/components/Section.astro`, `src/components/KeyboardManager.astro`, `src/components/sections/{Hero,Experience,Acknowledgments,Skills}.astro`, `src/assets/{astro,background}.svg`, `README.md`. Nuevos: `eslint.config.js`, `.prettierrc`, `.github/workflows/ci.yml`, posiblemente `public/CNAME`.

## Enfoques

1. **Actualización de Astro**: 7.x (actual; riesgo de compilador Rust/espacios en blanco/Node; Medio) vs 6.x (menor riesgo, requiere una segunda actualización posterior; Bajo-Medio) vs mantener 5.x (sin riesgo, desactualizado).
2. **Tipado del CV**: esquema Zod como fuente única con `z.infer` y parseo en build (validación en runtime, testeable; dependencia adicional; Medio) vs interfaces escritas a mano más un wrapper tipado `src/lib/cv.ts` (simple, sin validación; Bajo) vs solo inferencia desde el JSON (actual).
3. **Test runner**: vitest con `getViteConfig` (cubre invariantes del cv, helpers, registro de íconos; satisface Strict TDD; compatibilidad con Vite 8 sin verificar; Bajo-Medio) vs `node:test` + tsx (más liviano, sin integración con Astro/Vite).
4. **Lint/formato**: configuración flat de ESLint (eslint-plugin-astro, typescript-eslint) + Prettier (prettier-plugin-astro). El estilo del código fuente es mixto, por lo que un commit de formato único es ruidoso y debe aislarse.
5. **Deploy**: GitHub Pages (`withastro/action`, `deploy-pages`, `site: https://enzovera.dev`, `public/CNAME`; gratuito, sin previews de PR) vs Netlify (cero configuración, previews de PR, cuenta adicional y cambio de DNS).
6. **CI**: PR/push a main con pnpm, Node 22, `pnpm install --frozen-lockfile`, luego check, lint, format:check, test, build.

## Recomendación (unidades de trabajo ordenadas)

1. Base de tooling: typescript, `@astrojs/check`, scripts (`check`, `lint`, `format`, `build`), `site`; corregir los errores base de check.
2. vitest y primeras pruebas (para que Strict TDD aplique desde aquí).
3. Tipado: fuente única de tipos del CV, `SocialIcon`, `Props` de `Section` y flag booleano, alias de tsconfig.
4. Código muerto: registro compartido de íconos, eliminar los dos SVG, `console.log`, el script vacío; fallback en Hero para redes desconocidas.
5. ESLint y Prettier, más un commit de formato aislado.
6. Actualizar Astro a 7.x (recurrir a 6.x si el compilador falla).
7. Reescritura del README.
8. Workflow de CI y deploy.

Rollback: revertir por unidad de trabajo.

## Riesgos

- Rigurosidad del compilador Rust y cambios de espacios en blanco de `compressHTML: 'jsx'`.
- Se requiere Node >=22.12 en local y en CI (versión local sin verificar).
- Compatibilidad de `hotkeypad` con Vite 8 desconocida.
- Compatibilidad de Vitest/Vite 8 y de la API de Zod bajo Astro 7 sin verificar.
- `astro check` puede revelar errores base desconocidos.
- El commit de formato será un diff grande y ruidoso.
- Impacto de la actualización no confirmado con un build.

## Preguntas abiertas

1. Destino del deploy, y ¿hacia dónde apunta hoy el DNS de enzovera.dev? (condiciona CI/deploy)
2. Versión objetivo de Node: ¿22 LTS o más nueva? (condiciona actualización/CI)
3. ¿Validación en runtime con Zod, o solo tipos?
4. ¿Mantener o eliminar las secciones de relleno de `cv.json`?
5. ¿Corregir los errores tipográficos de contenido de `cv.json` en este cambio?
6. ¿Está dentro del alcance la corrección de los comandos de tema y de `ctrl+C`?
7. ¿Mantener los íconos sin coincidencia (next, swift, swiftui, kotlin, flutter)?
8. ¿Estilo de Prettier (indentación, punto y coma)?
9. Idioma del README: ¿español, inglés o bilingüe?
