# Diseño: Technical Cleanup (Base sólida)

Espejo en Engram: `sdd/technical-cleanup/design` (proyecto `webeevp`). Entradas: `proposal.md`, `exploration.md`, `openspec/config.yaml` y el código actual del repositorio. No existe todavía `specs/` para este cambio; el diseño se apoya en las capacidades declaradas en la propuesta (`cv-data-contract`, `social-icon-rendering`, `quality-gates`, `ci-deploy`).

> **Convención de preguntas abiertas.** Q1, Q2, Q3, Q4, Q5, Q8 y Q9 están RESUELTAS por el usuario (Q1 = deploy en Vercel por commit + push, sin GitHub Pages; Q2 = Node 24; Q9 = README en español). Q6 (los bugs de KeyboardManager quedan fuera de alcance) y Q7 (se conservan los íconos sin coincidencia) también fueron RESUELTAS por el usuario el 2026-10-09; no quedan preguntas abiertas. La sección "Dependencias de Q1..Q9" indica el estado de cada una.

## Enfoque técnico

Se mantiene la estructura actual de Astro (`src/components/sections/*.astro`, `src/layouts`, `src/pages/index.astro`, `src/assets/icons/*.astro`, alias `@cv` y `@/*`), conforme a `rules.design` de `openspec/config.yaml`. La lógica que hoy vive dispersa en el frontmatter de los componentes (resolución de íconos, mapas `SOCIAL_ICONS`, cadena de ternarios de `Skills.astro`, acceso crudo a `cv.json`) se extrae a módulos TypeScript puros en `src/lib/`, que **no importan archivos `.astro`** y por lo tanto se prueban con vitest sin depender del compilador de Astro. Los componentes `.astro` quedan como capa de presentación delgada que consume esos módulos.

Las 8 unidades de la propuesta se mantienen en su orden; para respetar el presupuesto de 400 líneas se dividen en 12 porciones de PR (1, 2, 3a, 3b, 4a, 4b, 5a, 5b, 6a, 6b, 7, 8), más un commit trivial 5c (`.git-blame-ignore-revs`) que puede viajar con 5b o con 6a.

```
                 build/test time                                  render time
cv.json ──(@cv)──> src/lib/cv.ts ──parse(CvSchema)──> cv: CV ──> sections/*.astro, Layout, index
                        │                                  (named exports: basics, work, ...)
                        └── throws on invalid data → `pnpm build` / `pnpm test` fail

src/lib/icons.ts (pure TS, path data)
   ├── getSocialIcon(network) ──> SvgIcon | FALLBACK ──> renderSvg() ──> string
   │        ├──> components/icons/SocialIcon.astro (set:html) ──> Hero.astro, assets/icons/GitHub.astro
   │        └──> KeyboardManager.astro frontmatter ──> data-info JSON ──> <script> hotkeypad (client)
   └── resolveSkillIconKey(name) ──> SkillIconKey ──> Skills.astro (component map, satisfies)
```

## Decisiones de arquitectura

### D1. Cada script llega junto con su herramienta (Unidad 1, 2, 5a)

**Elección**: la unidad 1 agrega solo `check` (`astro check`); `test` llega en la unidad 2; `lint`, `format` y `format:check` llegan en 5a.
**Alternativas consideradas**: declarar los cinco scripts en la unidad 1 (lo que sugiere el texto de la propuesta) apuntando a binarios aún no instalados.
**Justificación**: un script que falla por binario inexistente es un gate roto; cada porción queda verde por sí misma y el rollback por porción no deja scripts huérfanos. El resultado final es el mismo que pide la propuesta.

### D2. Fijar el gestor de paquetes en la unidad 1

**Elección**: agregar `"packageManager": "pnpm@<versión local>"` en `package.json` (unidad 1) y regenerar el lockfile con esa versión.
**Alternativas consideradas**: dejarlo para la unidad 8; usar `version:` en `pnpm/action-setup`.
**Justificación**: `pnpm-lock.yaml` declara `lockfileVersion: '6.0'` (pnpm 8). Un pnpm 9/10 en CI con `--frozen-lockfile` falla o reescribe el lockfile. Fijarlo temprano hace que todo el churn del lockfile ocurra en porciones de dependencias y no en la de CI. La versión concreta se toma de `pnpm -v` local (no verificada en este diseño).

### D3. Corrección del alias `@/asset`: eliminarlo

**Elección**: eliminar la entrada `"@/asset": ["src/assets/"]` de `tsconfig.json`.
**Alternativas consideradas**: renombrarla a `"@/assets/*": ["src/assets/*"]`.
**Justificación**: `@/*` ya resuelve `@/assets/...` (lo usan `Hero.astro` y `Skills.astro`). Un alias redundante es una segunda forma de importar lo mismo.

### D4. `site` en `astro.config.mjs` **[Q1 resuelta: Vercel]**

**Elección**: `site: "https://enzovera.dev"`, sin `base` (aplicado en la porción 1; confirmado en el repositorio con `rg site astro.config.mjs`).
**Alternativas consideradas**: `https://<usuario>.github.io/webEEVP` con `base: "/webEEVP"` (Pages sin dominio propio); descartada al resolverse Q1 con Vercel.
**Justificación**: coincide con `basics.url` de `cv.json` y es coherente con el despliegue en Vercel y el dominio `enzovera.dev`; no requiere `base` ni `public/CNAME`. Este diseño no afirma nada sobre el estado del DNS.

### D5. Runner de pruebas: vitest con `getViteConfig` (Unidad 2)

**Elección**: `vitest.config.ts` con `getViteConfig` de `astro/config`, entorno `node`, `include: ["src/**/*.test.ts"]`. Pruebas de componentes `.astro` mediante la Container API (`experimental_AstroContainer` de `astro/container`), limitadas a pocos casos.
**Alternativas consideradas**: `node:test` + `tsx` (sin resolución de alias de Vite ni de `.astro`); Playwright/E2E (fuera de alcance).
**Justificación**: `getViteConfig` reutiliza los alias (`@cv`, `@/*`) y el pipeline de Astro; la Container API permite verificar el render de `Section.astro` y `SocialIcon.astro` sin un build completo. La lógica crítica vive en TS puro, así que la dependencia de la Container API (experimental) queda acotada a pruebas de integración, no a las de unidad.
**Supuesto NO verificado**: compatibilidad de vitest con Vite 7 (Astro 6) y Vite 8 (Astro 7), y que la Container API siga exportándose con ese nombre en Astro 6/7. Se reverifica en 6a/6b.

### D6. Fuente única de tipos del CV: esquema Zod vía `astro/zod` **[Q3 resuelta]**

**Elección**: `src/lib/cv-schema.ts` define `CvSchema` con `import { z } from "astro/zod"` y exporta `type CV = z.infer<typeof CvSchema>` y los subtipos. `src/lib/cv.ts` importa `@cv`, ejecuta `CvSchema.parse(raw)` a nivel de módulo y reexporta `cv` y las secciones con nombre (`basics`, `work`, `education`, `skills`, `projects`, `acknowledgments`, `languages`).
**Alternativas consideradas**: (a) interfaces escritas a mano + accesor con `as CV` (sin validación en runtime); (b) mantener la inferencia directa desde el JSON (estado actual); (c) dependencia directa `zod`.
**Justificación**: un único artefacto da tipos y validación; un `cv.json` inválido rompe `pnpm build` y `pnpm test` en lugar de renderizar `undefined`. `astro/zod` evita una dependencia adicional y sigue la versión de Zod que trae Astro. Se separa el esquema (`cv-schema.ts`, sin efectos) del parseo (`cv.ts`, con efecto) para poder probar el esquema contra fixtures sin cargar el `cv.json` real.
**Restricción por el salto Zod 3 → 4 (unidad 6a)**: usar solo el subconjunto común: `z.object`, `z.string`, `z.number`, `z.boolean`, `z.array`, `.nullable()`, `.optional()`, `.regex()`, `z.infer`. Evitar `.url()`, `.email()`, `.passthrough()`, `.strict()`, `z.string().datetime()` y mensajes de error personalizados con la firma `{ message }` vs `{ error }`. Las fechas se validan con `.regex(/^\d{4}-\d{2}-\d{2}$/)`.
**Política de claves desconocidas**: comportamiento por defecto de Zod (descarta claves no declaradas). Por eso el esquema debe declarar todo lo que se renderiza (`work[].city`, `work[].country`, `acknowledgments.summary`, `projects[].github`, etc.).
**Nota (correcciones del verify, 2026-10-09)**: los subtipos exportados (`Basics`, `Profile`, `Work`, `Education`, `Skill`, `Language`, `Project`, `Acknowledgments`) no tenían usos y se eliminaron en `ce99ba2`; `cv-schema.ts` exporta `CV` y los `*Schema`.
**Si Q3 = "solo tipos"**: `cv-schema.ts` se reemplaza por `cv-types.ts` con interfaces; `cv.ts` hace `raw satisfies CV` (comprobación en tiempo de compilación) y las pruebas de invariantes de 3a se escriben como funciones de guarda sobre el JSON. Las rutas y la API pública de `src/lib/cv.ts` no cambian.

### D7. Los componentes dejan de importar `@cv` directamente (Unidad 3b)

**Elección**: los 9 importadores de `@cv` (`index.astro`, `Layout.astro`, `KeyboardManager.astro`, `Hero`, `About`, `Experience`, `Education`, `Projects`, `Skills`, `Acknowledgments`) pasan a `import { ... } from "@/lib/cv"`. El alias `@cv` se conserva solo para `src/lib/cv.ts` y para las pruebas `src/lib/cv.test.ts` y `src/lib/smoke.test.ts` (que verifican el alias y el `cv.json` real); en 5a se agrega la regla ESLint `no-restricted-imports` que prohíbe `@cv` fuera de esos tres archivos (override en `eslint.config.js`).
**Alternativas consideradas**: redirigir el alias `@cv` hacia `src/lib/cv.ts` (cambio invisible en los componentes).
**Justificación**: redirigir el alias oculta que los datos ya no son el JSON crudo y crea una dependencia circular de nombres (`cv.ts` necesita leer el JSON). El cambio de import es mecánico y explícito; la regla de lint lo mantiene.

### D8. Secciones de relleno de `cv.json` **[Q4 resuelta]**

**Elección**: `volunteer`, `awards`, `certificates`, `publications`, `interests`, `references` se declaran `.optional()` en el esquema; no se renderizan (como hoy).
**Justificación**: cero cambio de comportamiento; la decisión de contenido es del usuario. Si Q4 = "eliminar", se borran del JSON y del esquema en 3a (resta líneas, no agrega riesgo).

### D9. Correcciones de `cv.json` **[Q5 resuelta]**

**Elección**: en 3a, `skills[PL/SQL].key` → `keywords` (requerido por el esquema: `keywords` es obligatorio) y los tres errores de prosa ("TypeScritp" ×2, "directamentetación", "Licenciadoen").
**Si Q5 = "no tocar contenido"**: `keywords` pasa a `.optional()` en `SkillSchema` y la prueba RED de 3a cambia de "falta keywords falla" a "skill sin keywords se acepta". Los errores de prosa no afectan al diseño.

### D10. `Section.astro` con `Props` y flag booleano real (Unidad 3b)

**Elección**:
```ts
interface Props { title?: string; printed?: boolean }
const { title, printed = true } = Astro.props
const className = printed ? "" : "no-print"
```
`Acknowledgments.astro` pasa de `printed="0"` a `printed={false}`. Se elimina el `<script>` vacío y los comentarios de "servidor/cliente".
**Alternativas consideradas**: `class:list={{ "no-print": !printed }}`; devolver `undefined` en lugar de `""`.
**Justificación**: mantener `""` minimiza la diferencia de HTML generado respecto del estado actual (criterio de éxito de "sin diferencias no intencionadas"). `class:list` es aceptable pero cambia la serialización del atributo; queda como opción del rediseño (propuesta 2).
**Nota**: la eliminación del `<script>` vacío pertenece a la unidad 4 en la propuesta; se mueve a 3b porque se edita el mismo archivo y es una línea. Se deja constancia del desvío.

### D11. Registro de íconos como datos (path data), no como componentes (Unidad 4)

**Elección**: `src/lib/icons.ts` guarda los íconos sociales como datos (`viewBox`, `paths[]`, `title`) y expone `renderSvg()` que produce el string SVG. Ese string se usa (a) en `KeyboardManager.astro` para `data-info` de hotkeypad y (b) en el nuevo `src/components/icons/SocialIcon.astro` mediante `<Fragment set:html={...} />`, que usa `Hero.astro`. `src/assets/icons/GitHub.astro` pasa a ser un envoltorio de `SocialIcon network="GitHub"` (sigue sirviendo a `Skills.astro`). `LinkedIn.astro` y `X.astro` se eliminan (solo los usa Hero).
**Alternativas consideradas**:
  - (a) Registro de componentes `.astro` y renderizarlos a string en `KeyboardManager` con la Container API: introduce una API experimental en el camino de producción.
  - (b) Archivos `.svg` + `import ... ?raw`: el estilo `margin-right: 8px` que necesita hotkeypad obliga a manipular strings de markup; las pruebas dependen del pipeline de Vite.
  - (c) Mantener dos mapas pero con un tipo común: no elimina la duplicación de markup (objetivo de la unidad).
**Justificación**: una sola definición del markup de cada red; el registro es TS puro, tipado y probable con vitest sin Astro; hotkeypad recibe exactamente un string como hoy. Diferencias de HTML esperadas y revisables: el SVG de Hero pasa a llevar los mismos atributos que genera `renderSvg` (p. ej. `<title>` uniforme).

### D12. Fallback para redes desconocidas (Unidad 4)

**Elección**: `getSocialIcon(network)` busca por nombre exacto en `SOCIAL_ICONS`; si no existe devuelve `FALLBACK_SOCIAL_ICON` (ícono genérico de enlace) con `title = network`. Nunca devuelve `undefined`. `SocialIcon.astro` y `KeyboardManager` siempre reciben un SVG válido.
**Alternativas consideradas**: no renderizar nada para redes desconocidas (el enlace quedaría vacío, sin texto accesible); búsqueda insensible a mayúsculas (se descarta para no introducir comportamiento implícito; las claves de `cv.json` ya coinciden exactamente).
**Justificación**: hoy una red desconocida produce `<Icon />` con `Icon === undefined` (error de render). El fallback elimina esa clase de fallo y es la base del requisito `social-icon-rendering`.

### D13. Habilidades: alias puro + mapa de componentes con `satisfies` (Unidad 4) **[Q7 resuelta: se conservan]**

**Elección**: `src/lib/icons.ts` exporta `SKILL_ICON_KEYS` (tupla `as const`, incluye `Next`, `Swift`, `SwiftUI`, `Kotlin`, `Flutter` por Q7) y `resolveSkillIconKey(name): SkillIconKey | undefined`, que reemplaza la cadena de ternarios (`Next.js→Next`, `Astro→AstroBuild`, `PL/SQL→Oracle`, `LaTeX→Latex`). `Skills.astro` conserva el mapa de componentes en su frontmatter declarado `{...} satisfies Record<SkillIconKey, unknown>` (exhaustividad sin `any` y sin depender de tipos internos de Astro).
**Alternativas consideradas**: mover el mapa de componentes a un `.ts` (obliga a importar `.astro` desde TS y a tipar con `AstroComponentFactory`, ruta interna de Astro que puede cambiar en 6/7).
**Justificación**: la parte con lógica (alias y exhaustividad) es pura y probable; la parte de componentes queda donde Astro la tipa bien. Si Q7 = "eliminar", se borran 5 archivos `.astro`, 5 claves y 5 imports.

### D14. `src/types.d.ts` y `SocialIcon` (Unidades 3 y 4)

**Elección**: la unidad 3 elimina `src/cv.d.ts` (reemplazado por `cv-schema.ts`). `src/types.d.ts` (`SocialIcon = Record<string, string | any>`) se elimina en 4a, reemplazado por los tipos `SocialNetwork`, `SvgIcon` y `SkillIconKey` de `src/lib/icons.ts`.
**Alternativas consideradas**: tipar `SocialIcon` en la unidad 3 y luego reemplazarlo en la 4.
**Justificación**: evita tipar dos veces algo que se elimina en la porción siguiente. El objetivo de la propuesta ("tipar `SocialIcon`", "ningún tipo de CV sin usar") se cumple al cierre de 4a.
**Momento de evaluación**: el escenario "Tipos completos / sin tipos sin usar" de cv-data-contract se evalúa al cierre de la unidad 4a; entre 3b y 4a `SocialIcon` sigue sin tipar por diseño, de modo que no debe exigirse en 3a ni 3b.

### D15. `KeyboardManager.astro`: alcance limitado **[Q6 resuelta: fuera de alcance]**

**Elección**: eliminar las líneas 10-41 (SVG en línea), usar `renderSvg(getSocialIcon(network), { style: "margin-right: 8px" })`, eliminar los 5 `console.log` y reemplazar `var event` por `const event` (exigido por `no-var` en 5a). Los íconos de comandos (imprimir, temas) se mantienen en línea: no están duplicados. Los errores de comportamiento (todos los temas alternan; `ctrl+C` anula la copia) NO se tocan.
**Justificación**: limpieza no conductual. Si Q6 los incorpora, se agrega una porción 4c con su propia prueba RED (requiere extraer la lógica de tema a `src/lib/theme.ts` para hacerla probable).

### D16. ESLint + Prettier con commit de formato aislado (Unidad 5) **[Q8 resuelta]**

**Elección**:
- `eslint.config.js` (flat): `@eslint/js` recommended, `typescript-eslint` recommended, `eslint-plugin-astro` `configs["flat/recommended"]`, `eslint-config-prettier` al final (desactiva reglas de estilo). Reglas del proyecto: `no-console: "error"`, `no-var: "error"`, `@typescript-eslint/no-explicit-any: "error"`, `no-restricted-imports` de `@cv` fuera de `src/lib/cv.ts`, `src/lib/cv.test.ts` y `src/lib/smoke.test.ts` (override). Ignorar `dist/`, `.astro/`, `node_modules/`.
- `.prettierrc`: valores por defecto + `"plugins": ["prettier-plugin-astro"]` y override `*.astro → parser: "astro"`. `.prettierignore`: `dist`, `.astro`, `pnpm-lock.yaml`, `openspec/`, `public/`.
- 5a: configuración + scripts + corrección de errores de lint (no de formato). 5b: únicamente `pnpm format` (commit `style: apply prettier formatting`). 5c: `.git-blame-ignore-revs` con el SHA de 5b.
**Alternativas consideradas**: formatear archivo por archivo en cada unidad (mezcla estilo con lógica); `eslint-plugin-prettier` (lint lento y ruidoso); Biome (soporte de `.astro` parcial).
**Justificación**: con `eslint-config-prettier`, `pnpm lint` pasa en 5a aunque el formato aún no esté aplicado; 5b no contiene ningún cambio de lógica y su revisión se reduce a comprobar que `pnpm format:check`, `pnpm lint`, `pnpm test` y `pnpm build` siguen verdes. Excluir `openspec/` evita reescribir artefactos SDD.

### D17. Actualización escalonada de Astro: 5 → 6 → 7 (Unidad 6) **[Q2 resuelta: Node 24]**

**Elección**: dos porciones. 6a: Node `>=22.12` (`engines` + `.nvmrc` con `24`), `astro@^6`, `@astrojs/check` compatible, vitest compatible con Vite 7; corregir lo que rompa. 6b: `astro@^7` (Vite 8, compilador Rust, `compressHTML: 'jsx'`), vitest compatible con Vite 8; corregir markup.
**Alternativas consideradas**: saltar directamente a 7 (`@astrojs/upgrade`); quedarse en 5.
**Justificación**: el escalonado separa riesgos (Node/Vite 7/Zod 4 vs compilador Rust/Vite 8/espacios en blanco), mantiene cada porción bajo 400 líneas y convierte la alternativa "recurrir a 6.x" de la propuesta en un punto de parada natural: si 6b falla, se mergea solo 6a. **Criterio de parada en 6.x**: hotkeypad o vitest no funcionan con Vite 8 sin parches, o las correcciones de markup exigidas por el compilador superan ~150 líneas o cambian contenido visible.
**Verificación de salida HTML**: antes de 6a se genera `dist/` de referencia (en el scratchpad, no se versiona) y tras 6a/6b se compara contenido textual normalizado (p. ej. formateando ambos `index.html` con Prettier antes de un diff). Las diferencias solo de espacios en blanco se revisan y se aceptan explícitamente en el PR.
**Supuestos NO verificados**: comportamiento del compilador Rust ante el markup actual (p. ej. el `</svg\n>` de `GitHub.astro`), cambios de espacios en blanco de `compressHTML: 'jsx'`, compatibilidad de `hotkeypad` 1.0.2 con Vite 8, versión de Node local >= 24, versión de vitest compatible con Vite 8, y que `astro/zod` y `getViteConfig` mantengan su API.

### D18. README (Unidad 7) **[Q9 resuelta: español]**

**Elección**: reescritura completa en español: propósito, stack, requisitos (Node, pnpm), instalación, tabla de scripts (`dev`, `build`, `preview`, `check`, `lint`, `format`, `format:check`, `test`), edición de contenido (`cv.json` validado por `src/lib/cv-schema.ts`, cómo agregar una red social y su ícono), deploy en Vercel por commit + push (Q1). Sin HTML embebido salvo `<kbd>` mínimo para atajos (aplicado en el PR 7).
**Justificación**: documenta el estado final de las unidades 1-6.

### D19. CI solo de gates; deploy externo por Vercel (Unidad 8) **[Q1, Q2 resueltas]**

**Elección**: `.github/workflows/ci.yml` con un único job `verify` y sin job de deploy:
- `on: pull_request` (rama `main`) y `push` a `main`. Se usa `pull_request`, nunca `pull_request_target`.
- `permissions: contents: read` a nivel de workflow; `concurrency` por ref con `cancel-in-progress`.
- Job `verify`: `actions/checkout`, `pnpm/action-setup` (lee `packageManager`), `actions/setup-node` con Node 22 (`node-version-file: .nvmrc`) y `cache: pnpm`, y en este orden `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm build`.
- Despliegue: lo realiza Vercel al hacer commit + push; el repositorio no contiene workflow de deploy. Sin `actions/upload-pages-artifact`, `actions/deploy-pages`, `withastro/action`, `public/CNAME`, ni permisos `pages: write` / `id-token: write`. No se crea `vercel.json` ni se definen ajustes del panel de Vercel en este cambio.
**Alternativas consideradas**: GitHub Pages con `upload-pages-artifact` + `deploy-pages` y `public/CNAME` (descartada por Q1 = Vercel); `withastro/action` (también apunta a Pages); Netlify (descartada por Q1).
**Justificación**: Vercel ya despliega por push, por lo que el CI solo debe proteger la calidad con los mismos gates que se usan en local. Esto elimina permisos de escritura, el job dependiente y el `CNAME`, y reduce la superficie del workflow. Aprovecha además que el CI usa Node 22 real, que es la verificación pendiente de las porciones 6a/6b (localmente solo hay Node 26.8.2). El DNS no se toca ni se afirma su estado.

### D20. `openspec/config.yaml` se actualiza por etapas

**Elección**: unidad 1: `typecheck_command: "pnpm check"`, `quality.type_checker: true`. Unidad 2: `test_command: "pnpm test"`, `testing.runner: vitest`, `layers.unit: true`, `layers.integration: true` (Container API), `strict_tdd: true`, eliminar `strict_tdd_note`; `rules.apply`/`rules.verify` pasan a citar `pnpm test`. Unidad 5a: `linter: "pnpm lint"`, `formatter: "pnpm format:check"`, `quality.linter/formatter: true`. Unidad 6: `context`/`stack` reflejan la versión mayor final.
**Justificación**: la configuración refleja en cada porción lo que realmente existe; Strict TDD rige desde 3a en adelante.

## Archivos afectados

| Archivo | Acción | Porción | Descripción |
|---------|--------|---------|-------------|
| `package.json` | Modificar | 1, 2, 5a, 6a, 6b | Dev deps (`typescript`, `@astrojs/check`, `vitest`, ESLint/Prettier), scripts, `packageManager`, `engines`, versión de Astro |
| `pnpm-lock.yaml` | Modificar (generado) | 1, 2, 5a, 6a, 6b | Regenerado; excluido del presupuesto |
| `astro.config.mjs` | Modificar | 1, (6b) | `site` [Q1]; opciones de upgrade si hicieran falta |
| `tsconfig.json` | Modificar | 1 | Eliminar `@/asset` |
| `openspec/config.yaml` | Modificar | 1, 2, 5a, 6b | Ver D20 |
| `vitest.config.ts` | Crear | 2 | `getViteConfig` + `test` |
| `src/lib/smoke.test.ts` | Crear | 2 | Smoke: alias `@cv` resuelve, Container API renderiza `Section.astro` |
| `src/lib/cv-schema.ts` | Crear | 3a | `CvSchema` y tipos inferidos [Q3] |
| `src/lib/cv-schema.test.ts` | Crear | 3a | Esquema contra fixtures válidos/ inválidos |
| `src/lib/cv.ts` | Crear | 3a | Parseo y exports con nombre |
| `src/lib/cv.test.ts` | Crear | 3a | `cv.json` real parsea; invariantes |
| `cv.json` | Modificar | 3a | `key`→`keywords`, errores de prosa [Q5]; relleno [Q4] |
| `src/cv.d.ts` | Eliminar | 3b | Duplicado sin uso |
| `src/pages/index.astro`, `src/layouts/Layout.astro` | Modificar | 3b | Import desde `@/lib/cv` |
| `src/components/sections/{About,Education,Experience,Projects,Acknowledgments}.astro` | Modificar | 3b | Import desde `@/lib/cv`; `printed={false}` en Acknowledgments |
| `src/components/Section.astro` | Modificar | 3b | `Props`, booleano, sin `<script>` vacío |
| `src/components/Section.test.ts` | Crear | 3b | Container API: `printed` true/false |
| `src/lib/icons.ts` | Crear | 4a | Registro social, fallback, `renderSvg`, alias de habilidades |
| `src/lib/icons.test.ts` | Crear | 4a | Registro, fallback, render, alias, nota Q7 |
| `src/components/icons/SocialIcon.astro` | Crear | 4a | `set:html` del registro |
| `src/components/icons/SocialIcon.test.ts` | Crear | 4a | Container API: red conocida y desconocida |
| `src/pages/index.test.ts` | Crear | 4a | Prueba de caracterización del contenido de la página |
| `src/components/sections/Hero.astro` | Modificar | 3b, 4a | Import `@/lib/cv` (3b); usa `SocialIcon` (4a) |
| `src/assets/icons/GitHub.astro` | Modificar | 4a | Envoltorio de `SocialIcon` |
| `src/assets/icons/LinkedIn.astro`, `X.astro` | Eliminar | 4a | Reemplazados por el registro |
| `src/types.d.ts` | Eliminar | 4a | Reemplazado por tipos de `icons.ts` |
| `src/components/KeyboardManager.astro` | Modificar | 3b, 4b | Import `@/lib/cv` (3b); registro, sin SVG en línea, sin `console.log`, `const` (4b) |
| `src/components/sections/Skills.astro` | Modificar | 3b, 4b | Import `@/lib/cv` (3b); `resolveSkillIconKey` + `satisfies` (4b) |
| `src/assets/astro.svg`, `src/assets/background.svg` | Eliminar | 4b | Sin referencias |
| `eslint.config.js`, `.prettierrc`, `.prettierignore` | Crear | 5a | Lint y formato [Q8] |
| `src/**`, `cv.json`, archivos de config | Modificar | 5b | Solo formato mecánico |
| `.git-blame-ignore-revs` | Crear | 5c | SHA de 5b |
| `.nvmrc` | Crear | 6a | `24` [Q2] |
| `README.md` | Reescribir | 7 | [Q9] |
| `.github/workflows/ci.yml` | Crear | 8 | Solo gates (job `verify`); el deploy lo hace Vercel [Q1] |

Totales: 14 archivos nuevos (sin contar 5b), ~20 modificados, 6 eliminados.

## Interfaces y contratos

### `src/lib/cv-schema.ts` [Q3, Q4, Q5]

```ts
import { z } from "astro/zod"

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const ProfileSchema = z.object({ network: z.string(), username: z.string(), url: z.string() })
export const WorkSchema = z.object({
  name: z.string(), position: z.string(), url: z.string(),
  startDate: IsoDate, endDate: IsoDate.nullable(),
  summary: z.string(), highlights: z.array(z.string()),
  city: z.string().optional(), country: z.string().optional(),
})
export const SkillSchema = z.object({
  name: z.string(), level: z.string(),
  keywords: z.array(z.string()),            // [Q5]: .optional() si no se corrige cv.json
})
// BasicsSchema, EducationSchema, ProjectSchema (github opcional), LanguageSchema,
// AcknowledgmentsSchema ({ summary: string }) siguen el mismo patrón.

export const CvSchema = z.object({
  basics: BasicsSchema,
  work: z.array(WorkSchema),
  education: z.array(EducationSchema),
  skills: z.array(SkillSchema),
  languages: z.array(LanguageSchema),
  projects: z.array(ProjectSchema),
  acknowledgments: AcknowledgmentsSchema,
  // [Q4] relleno: volunteer, awards, certificates, publications, interests, references → .optional()
})

export type CV = z.infer<typeof CvSchema>
export type Work = z.infer<typeof WorkSchema>
export type Skill = z.infer<typeof SkillSchema>
export type Profile = z.infer<typeof ProfileSchema>
```

### `src/lib/cv.ts`

```ts
import raw from "@cv"
import { CvSchema, type CV } from "@/lib/cv-schema"

export const cv: CV = CvSchema.parse(raw)   // lanza en build/test si cv.json es inválido
export const { basics, work, education, skills, languages, projects, acknowledgments } = cv
```

### `src/lib/icons.ts` [Q7]

```ts
export interface SvgIcon {
  title: string
  viewBox: string              // "0 0 24 24"
  paths: readonly string[]     // atributo d de cada <path>, fill="currentColor"
}

export const SOCIAL_NETWORKS = ["GitHub", "LinkedIn", "X"] as const
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number]
export const SOCIAL_ICONS: Readonly<Record<SocialNetwork, SvgIcon>>
export const FALLBACK_SOCIAL_ICON: SvgIcon

export function isKnownNetwork(network: string): network is SocialNetwork
/** Nunca devuelve undefined: redes desconocidas → FALLBACK con title = network. */
export function getSocialIcon(network: string): SvgIcon

export interface RenderSvgOptions { size?: number /* default 16 */; style?: string }
/** Serializa SvgIcon a markup. Escapa title y style (sin inyección de HTML). */
export function renderSvg(icon: SvgIcon, options?: RenderSvgOptions): string

export const SKILL_ICON_KEYS = [
  "HTML", "CSS", "JavaScript", "TypeScript", "React", "Node", "MySQL", "Git", "GitHub",
  "Tailwind", "AstroBuild", "Oracle", "Latex",
  "Next", "Swift", "SwiftUI", "Kotlin", "Flutter", // [Q7] sin coincidencia en cv.json hoy
] as const
export type SkillIconKey = (typeof SKILL_ICON_KEYS)[number]
/** "Next.js"→"Next", "Astro"→"AstroBuild", "PL/SQL"→"Oracle", "LaTeX"→"Latex"; identidad si es clave; si no, undefined. */
export function resolveSkillIconKey(name: string): SkillIconKey | undefined
```

### `src/components/icons/SocialIcon.astro`

```ts
interface Props { network: string; size?: number; style?: string }
// <Fragment set:html={renderSvg(getSocialIcon(network), { size, style })} />
```

### `src/components/Section.astro`

```ts
interface Props { title?: string; printed?: boolean }   // printed por defecto true
```

### Scripts finales de `package.json`

| Script | Comando | Porción |
|--------|---------|---------|
| `check` | `astro check` | 1 |
| `test` | `vitest run` | 2 |
| `test:watch` | `vitest` | 2 |
| `lint` | `eslint .` | 5a |
| `format` | `prettier --write .` | 5a |
| `format:check` | `prettier --check .` | 5a |

## Estrategia de pruebas

Strict TDD aplica desde 3a (la unidad 2 lo activa). Unidades 1 y 2 se verifican con `pnpm check` y `pnpm build`, y desde la 2 también con `pnpm test`.

| Capa | Qué se prueba | Cómo | Porción |
|------|---------------|------|---------|
| Smoke | vitest arranca con `getViteConfig`; `@cv` resuelve; Container API renderiza `Section.astro` con título | `src/lib/smoke.test.ts`. RED: `pnpm test` falla antes de instalar vitest; GREEN tras configurar | 2 |
| Unidad | `CvSchema`: fixture mínimo válido pasa; skill sin `keywords` falla [Q5]; `endDate: null` pasa; fecha `2024/08/01` falla; `acknowledgments` ausente falla; `basics.name` ausente falla; tipo incorrecto en arreglo (p. ej. un número en `work[].highlights`) falla; el mensaje de error de `safeParse` incluye la ruta del campo (p. ej. `basics.name`, `work.0.highlights.0`) verificada sobre `error.issues[].path`; secciones de relleno ausentes pasan [Q4] | Fixtures en el propio test, `safeParse` | 3a |
| Unidad | `cv.json` real: parsea; cada `work` cumple `startDate <= endDate`; `basics.profiles` no vacío; cada skill tiene `keywords` no vacío | Importa `@/lib/cv`. **RED natural**: falla hoy por `key` en PL/SQL hasta corregir `cv.json` | 3a |
| Integración | `Section`: `printed` omitido → sin `no-print`; `printed={false}` → `no-print`; `title` renderiza `<h2>` | Container API `renderToString(Section, { props, slots })` | 3b |
| Unidad | `getSocialIcon`: cada red conocida devuelve su ícono; red desconocida (`"Mastodon"`) devuelve fallback con `title = "Mastodon"`; nunca `undefined`. `renderSvg`: tamaño por defecto 16, `style` aplicado, `title` escapado (`"<x>"` no produce etiqueta). `resolveSkillIconKey`: los 4 alias, identidad, desconocido → `undefined`. Toda red de `cv.json` es conocida (invariante de datos). Nota Q7: prueba que lista las claves sin coincidencia en `cv.json` y documenta que se conservan a propósito | Vitest puro | 4a, 4b |
| Integración | `SocialIcon.astro`: red conocida contiene su path; red desconocida contiene el path del fallback | Container API | 4a |
| Caracterización | La página de inicio contiene: nombre, label, títulos de sección, URL de cada perfil, nombres de habilidades y el título "Agradecimientos" | Container API sobre `src/pages/index.astro`, aserciones de contenido textual (no snapshot de markup). Se escribe y queda verde **antes** de refactorizar Hero/KeyboardManager; protege 4 y 6 | 4a |
| Build | `pnpm build` termina con 0; diff normalizado de `dist/index.html` antes/después | Manual en 3a, 3b, 4b, 6a y 6b; resultado registrado en el PR. En 3a/3b se compara `dist/` antes/después (requerido por cv-data-contract §Sin cambio de renderizado): en 3b no debe haber diferencias; en 3a las únicas esperadas son las correcciones de prosa de `cv.json` [Q5] | 3a, 3b, 4b, 6a, 6b |
| Estáticos | `pnpm check`, `pnpm lint`, `pnpm format:check` | Scripts; en CI desde 8 | 1, 5a, 8 |
| E2E / visual | — | Fuera de alcance (propuesta) | — |

Verificaciones adicionales (declaradas explícitamente):

- **Escenarios negativos de quality-gates** (error de tipos, violación de lint, archivo sin formato hacen fallar el gate): verificación **manual reproducible en el PR** de la porción que introduce cada gate (1 para `check`, 5a para `lint` y `format:check`). Se introduce el defecto en un cambio temporal local (no commiteado), se registra el comando y el código de salida distinto de 0 en la descripción del PR y se descarta el cambio. No se crean fixtures versionados ni pruebas automáticas: serían código que rompe a propósito los propios gates.
- **Build con red social desconocida ('mastodon')**: nivel **integración**, con un `cv.json` temporal descartado (copia con un perfil `mastodon` añadido, usada en un `pnpm build` local y no commiteada); se comprueba código de salida 0 y que el HTML contiene el path del fallback, no `undefined`. Es coherente con el diseño: la prueba Container de `SocialIcon.astro` (4a) cubre el render del componente y la unitaria cubre `getSocialIcon`, pero ninguna ejecuta `pnpm build`, y D5 evita acoplar `test` a `build`. Se ejecuta en 4a y se registra en el PR.
- **Commit de formato 5b**: se verifica con `git diff -w <padre> <5b>` (equivalente a `--ignore-all-space`) y se registra en el PR que la salida no muestra cambios de lógica; sumado a `pnpm format:check`, `pnpm lint`, `pnpm test` y `pnpm build` en verde.
- **Workflow de CI (porción 8)**: se valida la sintaxis del YAML en local (herramienta disponible o lectura/`rg`) sin ejecutar el workflow de forma remota ni hacer push; se comprueba que el repositorio no contiene workflow de deploy ni `public/CNAME` (`rg "deploy-pages|upload-pages-artifact|pull_request_target" .github`, `fd CNAME public`). La validación con Node 22 real se obtiene en la primera ejecución del CI, no localmente.

Riesgo de pruebas: si la Container API no logra renderizar `index.astro` por las importaciones de CSS de `hotkeypad` o el `<script>` del cliente, la prueba de caracterización se reemplaza por una aserción sobre `dist/index.html` tras `pnpm build`, ejecutada como paso manual de verificación (no como parte de `pnpm test`, para no acoplar `test` a `build`). **No verificado.**

Reverificación tras 6a/6b: toda la suite debe pasar sin cambios en las aserciones; un cambio en una aserción durante el upgrade es una señal de regresión a justificar en el PR.

## Matriz de amenazas

N/A para todas las filas: el cambio no introduce enrutamiento, comandos de shell compuestos, subprocesos, automatización de commits/push/PR, ni clasificación de archivos ejecutables.

| Frontera | Aplicabilidad |
|---|---|
| Rutas tipo documentación | N/A: no se clasifican ni ejecutan archivos por nombre |
| Selección de repositorio Git | N/A: el workflow usa `actions/checkout` estándar, sin `git -C` ni rutas propias |
| Estado de commit | N/A: CI no crea commits |
| Estado de push | N/A: CI no hace push ni despliega; el deploy lo realiza Vercel fuera del repositorio |
| Comandos de PR | N/A: no se componen comandos `gh`/PR |

Endurecimiento de CI (requisito de diseño, no de la matriz): `pull_request` y nunca `pull_request_target`; `permissions: contents: read` (sin permisos de escritura); sin secretos en el job `verify`; acciones oficiales fijadas a versión mayor (fijar por SHA queda como mejora opcional). Seguridad de render: `renderSvg` escapa `title` y `style`; `Acknowledgments` ya usa `set:html` con contenido de `cv.json` (contenido propio, sin cambio en este alcance).

## Orden, dependencias y corte de PR

```
1 ─> 2 ─> 3a ─> 3b ─> 4a ─> 4b ─> 5a ─> 5b(+5c) ─> 6a ─> 6b ─> 7 ─> 8
```

| Porción | Depende de | Contenido | Pronóstico (líneas autoradas) | Riesgo > 400 |
|---------|------------|-----------|-------------------------------|--------------|
| 1 | — | typescript, `@astrojs/check`, `check`, `packageManager`, `site`, alias, errores base | 40-150 | Bajo. Si `astro check` revela > ~250 líneas de correcciones, dividir 1a (tooling) / 1b (correcciones) |
| 2 | 1 | vitest, config, smoke, `config.yaml` | 60-140 | Bajo |
| 3a | 2 | `cv-schema.ts`, `cv.ts`, pruebas, `cv.json` | 180-300 | Medio; las pruebas con fixtures son la parte variable |
| 3b | 3a | 11 componentes a `@/lib/cv`, `Section` Props + prueba, borrar `cv.d.ts` (−145) | 200-300 (incluye −145 de `cv.d.ts`) | Medio |
| 4a | 3b | `icons.ts` + pruebas, `SocialIcon`, caracterización, Hero, GitHub.astro, borrar LinkedIn/X/`types.d.ts` | 250-380 | Medio-alto. Si excede, mover la prueba de caracterización a una porción 4a0 previa |
| 4b | 4a | KeyboardManager (−32 SVG, −5 logs), Skills, borrar `astro.svg`/`background.svg` | 80-200 + líneas de los dos SVG borrados | Medio: los SVG eliminados pueden ser largos; las eliminaciones de archivos binarios-like se señalan en el PR como borrado puro |
| 5a | 4b | ESLint/Prettier config, scripts, correcciones de lint | 60-150 | Bajo |
| 5b | 5a | `pnpm format` | Todo el código | **Sí, por diseño**: requiere `size:exception` explícita o tratamiento como salida mecánica; sin cambios de lógica; revisión = gates verdes |
| 5c | 5b | `.git-blame-ignore-revs` | < 5 | No |
| 6a | 5b | Node 22.12, Astro 6, vitest, correcciones | 20-150 | Bajo-medio |
| 6b | 6a | Astro 7, vitest, correcciones de markup | 20-200 | Medio; si se activa el criterio de parada, no se mergea |
| 7 | 6a o 6b | README | 100-250 | Bajo |
| 8 | 5a, 6a | Workflow de CI solo con gates (sin deploy ni CNAME) | 30-60 | Bajo |

La estrategia de cadena (`stacked-to-main` o `feature-branch-chain`) la decide el usuario antes de apply (`ask-on-risk`); este diseño solo define porciones autónomas, cada una con gates verdes y rollback por `git revert`.

## Migración / despliegue y rollback

No hay migración de datos. El despliegue lo realiza Vercel al hacer commit + push (Q1 resuelta); la porción 8 solo agrega el CI de gates y este cambio no modifica el DNS de `enzovera.dev` ni afirma su estado.

| Porción | Rollback |
|---------|----------|
| 1 | Revertir; el sitio compila como antes |
| 2 | Revertir; `config.yaml` vuelve a `strict_tdd: false` y `test_command: null` |
| 3a | Revertir; `cv.json` vuelve al estado previo (los componentes aún leen `@cv`, nada se rompe) |
| 3b | Revertir; componentes vuelven a `@cv`; `cv.d.ts` vuelve |
| 4a / 4b | Revertir en orden inverso (4b, luego 4a) |
| 5c, 5b, 5a | Revertir en ese orden (formato antes que configuración) |
| 6b | Revertir; queda Astro 6 (estado soportado) |
| 6a | Revertir; vuelve Astro 5.7.12 y Node sin fijar |
| 7 | Revertir README |
| 8 | Deshabilitar el workflow o revertir; el despliegue de Vercel no depende de él, el sitio en vivo no se ve afectado |

## Dependencias de Q1..Q9

| Q | Valor / estado | Partes del diseño que dependen |
|---|-------------------|--------------------------------|
| Q1 | **RESUELTA**: deploy en Vercel (commit + push); sin GitHub Pages; `site: https://enzovera.dev` | D4 (`site`, sin `base`), D19 (CI solo gates, sin deploy ni CNAME), README §deploy (ya aplicado en PR 7) |
| Q2 | **RESUELTA**: Node 24 (`engines >=22.12`, `.nvmrc` = 24; aplicado en 6a) | D17 (`engines`, `.nvmrc`), D19 (`node-version-file`); validación con Node 24 real en la primera ejecución del CI |
| Q3 | Zod vía `astro/zod` | D6 (forma de `cv-schema.ts` vs `cv-types.ts`), pruebas de 3a |
| Q4 | Mantener relleno como `.optional()` | D8, `CvSchema`, una prueba de 3a |
| Q5 | Corregir `key`→`keywords` y prosa | D9, `SkillSchema.keywords` obligatorio, RED de 3a |
| Q6 | Fuera de alcance | D15; si entra, porción 4c nueva |
| Q7 | Conservar íconos sin coincidencia | D13, `SKILL_ICON_KEYS`, prueba-nota de 4b |
| Q8 | Prettier por defecto + plugin astro | D16 (`.prettierrc`), tamaño de 5b |
| Q9 | **RESUELTA**: español (aplicado en el PR 7) | D18 |

## Supuestos NO verificados

- El compilador Rust de Astro 7 acepta el markup actual o requiere correcciones acotadas; `compressHTML: 'jsx'` solo altera espacios en blanco.
- Validación con Node 24 real: localmente solo hay Node 26.8.2; se obtendrá en la primera ejecución del CI (porción 8).
- Versión local de pnpm (para `packageManager`), ya fijada en la porción 1.
- `hotkeypad` 1.0.2 funciona con Vite 7 y Vite 8.
- Existe una versión de vitest compatible con Vite 8, y `getViteConfig` conserva su firma en Astro 6/7.
- `experimental_AstroContainer` sigue disponible con ese nombre en Astro 6/7 y puede renderizar `index.astro` con las importaciones de CSS actuales.
- `astro/zod` sigue exportando `z` en Astro 6/7 y el subconjunto de API elegido es idéntico en Zod 3 y 4.
- `astro check` en el estado actual reporta pocos errores base.

## Preguntas abiertas

- [ ] Q1 a Q9 quedaron resueltas por el usuario (Q6 fuera de alcance, Q7 se conservan los íconos, Q2 revisada a Node 24). No quedan preguntas abiertas.
- [ ] Versión de pnpm a fijar en `packageManager` (confirmar con `pnpm -v` local en la porción 1).
- [ ] Aceptación explícita de `size:exception` para 5b, o confirmación de tratarla como salida mecánica.
