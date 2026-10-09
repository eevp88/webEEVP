# webEEVP

Sitio web personal de currículum (CV) de Enzo Vera, minimalista, pensado para verse en la web y para imprimirse o exportarse a PDF. El contenido vive en un único archivo, `cv.json`, que sigue el esquema de [JSON Resume](https://jsonresume.org/schema/) y se valida durante el build.

El sitio es estático, está construido con [Astro](https://astro.build/) 7 y no requiere servidor en producción.

## Contenido

- [Stack](#stack)
- [Requisitos](#requisitos)
- [Instalación y uso](#instalación-y-uso)
- [Scripts](#scripts)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Editar el contenido (`cv.json`)](#editar-el-contenido-cvjson)
- [Paleta de comandos y atajos](#paleta-de-comandos-y-atajos)
- [Calidad](#calidad)
- [Despliegue](#despliegue)
- [Licencia y créditos](#licencia-y-créditos)

## Stack

| Herramienta                                          | Uso                                                    | Versión           |
| :--------------------------------------------------- | :----------------------------------------------------- | :---------------- |
| [Astro](https://astro.build/)                        | Framework web, salida estática                         | `^7.3.8`          |
| [TypeScript](https://www.typescriptlang.org/)        | Tipado, verificado con `astro check`                   | `^6.0.3`          |
| [Zod](https://zod.dev/) (expuesto como `astro/zod`)  | Esquema y validación de `cv.json`                      | incluido en Astro |
| [hotkeypad](https://www.npmjs.com/package/hotkeypad) | Paleta de comandos con atajos de teclado               | `^1.0.2`          |
| [Vitest](https://vitest.dev/)                        | Pruebas                                                | `^5.0.3`          |
| [ESLint](https://eslint.org/)                        | Lint (con `typescript-eslint` y `eslint-plugin-astro`) | `^10.12.0`        |
| [Prettier](https://prettier.io/)                     | Formato (con `prettier-plugin-astro`)                  | `^3.9.9`          |

## Requisitos

- Node.js `>=22.12` (campo `engines` de `package.json`). El archivo `.nvmrc` fija la versión mayor `22`.
- [pnpm](https://pnpm.io/installation) `11.3.0`, la versión declarada en el campo `packageManager`. Con [Corepack](https://nodejs.org/api/corepack.html) habilitado se selecciona automáticamente.

## Instalación y uso

```bash
# Instalar las dependencias respetando el lockfile
pnpm install --frozen-lockfile

# Iniciar el servidor de desarrollo
pnpm dev
```

Abre [http://localhost:4321](http://localhost:4321) en el navegador (puerto por defecto de Astro).

## Scripts

| Script              | Acción                                                                       |
| :------------------ | :--------------------------------------------------------------------------- |
| `pnpm dev`          | Inicia el servidor de desarrollo (`astro dev`).                              |
| `pnpm build`        | Genera el sitio estático de producción en `./dist/` (`astro build`).         |
| `pnpm preview`      | Sirve localmente el resultado de `pnpm build` (`astro preview`).             |
| `pnpm check`        | Verifica los tipos de TypeScript y de los archivos `.astro` (`astro check`). |
| `pnpm test`         | Ejecuta las pruebas una vez (`vitest run`).                                  |
| `pnpm test:watch`   | Ejecuta las pruebas en modo observación (`vitest`).                          |
| `pnpm lint`         | Ejecuta ESLint sobre el proyecto (`eslint .`).                               |
| `pnpm format`       | Da formato a todos los archivos con Prettier (`prettier --write .`).         |
| `pnpm format:check` | Comprueba el formato sin modificar archivos (`prettier --check .`).          |
| `pnpm astro`        | Acceso directo a la CLI de Astro.                                            |

## Estructura del proyecto

```text
.
├── cv.json                  # Datos del CV (fuente única de contenido)
├── astro.config.mjs         # Configuración de Astro (incluye `site`)
├── vitest.config.ts         # Configuración de Vitest
├── eslint.config.js         # Configuración de ESLint
├── public/                  # Archivos estáticos (favicon, foto)
└── src/
    ├── assets/icons/        # Íconos (habilidades y contacto)
    ├── components/          # Componentes Astro
    │   ├── sections/        # Secciones del CV (Hero, About, Experience, ...)
    │   ├── icons/           # SocialIcon
    │   ├── KeyboardManager.astro  # Paleta de comandos y atajos
    │   └── Section.astro    # Contenedor genérico de sección
    ├── layouts/Layout.astro # Estructura HTML base
    ├── lib/                 # Lógica compartida y sus pruebas
    │   ├── cv-schema.ts     # Esquema Zod y tipos de `cv.json`
    │   ├── cv.ts            # Acceso tipado a los datos validados
    │   └── icons.ts         # Registro de íconos de redes y habilidades
    ├── pages/index.astro    # Única página del sitio
    └── styles/global.css    # Estilos globales
```

Los componentes importan los datos desde `@/lib/cv`; la regla de ESLint `no-restricted-imports` impide importar `@cv` directamente fuera de `src/lib/cv.ts` y de las pruebas del alias.

## Editar el contenido (`cv.json`)

Todo el contenido visible se edita en `cv.json`. Los datos se validan con el esquema de `src/lib/cv-schema.ts` cuando se carga `src/lib/cv.ts`, es decir, en `pnpm dev`, `pnpm build` y `pnpm test`.

Reglas principales del esquema:

- Las fechas usan el formato `AAAA-MM-DD` (por ejemplo, `2024-08-01`).
- `work[].endDate` puede ser `null` para un cargo vigente.
- Cada habilidad (`skills[]`) requiere `name`, `level` y `keywords`.
- `acknowledgments.summary` es obligatorio.
- Las secciones heredadas de JSON Resume (`volunteer`, `awards`, `certificates`, `publications`, `interests`, `references`) son opcionales y no se muestran en el sitio.

Si un dato es inválido o falta un campo obligatorio, la validación lanza un error con la ruta del campo afectado (por ejemplo, `basics.name`) y el build falla en lugar de publicar datos incorrectos.

### Redes sociales

Cada entrada de `basics.profiles` tiene `network`, `username` y `url`. Las redes con ícono propio son `GitHub`, `LinkedIn` y `X`, y el nombre debe coincidir exactamente (se distingue entre mayúsculas y minúsculas). Una red con otro nombre se muestra con un ícono genérico de enlace y no rompe el build. Para añadir un ícono propio, extiende `SOCIAL_NETWORKS` y `SOCIAL_ICONS` en `src/lib/icons.ts`.

### Íconos (habilidades y contacto)

Los íconos de habilidades de `src/assets/icons/` se asocian a las habilidades según su nombre mediante `src/lib/icons.ts`. Una habilidad sin ícono asociado se muestra sin él.

## Paleta de comandos y atajos

La paleta de comandos se abre con <kbd>Ctrl</kbd> + <kbd>K</kbd> (el pie de página del sitio indica <kbd>Cmd</kbd> + <kbd>K</kbd>). En pantallas estrechas se abre con el botón del pie de página. Los atajos definidos en `src/components/KeyboardManager.astro` son:

| Atajo                               | Acción                                                                                                                   |
| :---------------------------------- | :----------------------------------------------------------------------------------------------------------------------- |
| <kbd>Ctrl</kbd> + <kbd>P</kbd>      | Imprimir                                                                                                                 |
| <kbd>Ctrl</kbd> + <kbd>D</kbd>      | Tema oscuro                                                                                                              |
| <kbd>Ctrl</kbd> + <kbd>C</kbd>      | Tema claro                                                                                                               |
| <kbd>Ctrl</kbd> + <kbd>S</kbd>      | Tema de color del sistema                                                                                                |
| <kbd>Ctrl</kbd> + inicial de la red | Abrir el perfil (por ejemplo, <kbd>Ctrl</kbd> + <kbd>G</kbd> para GitHub y <kbd>Ctrl</kbd> + <kbd>L</kbd> para LinkedIn) |

Los atajos de redes se generan a partir de `basics.profiles`, por lo que cambian si se modifican los perfiles.

## Calidad

Antes de integrar cambios deben pasar, en este orden:

```bash
pnpm check
pnpm lint
pnpm format:check
pnpm test
pnpm build
```

- `pnpm check` verifica los tipos.
- `pnpm lint` aplica ESLint, incluida la restricción de importación de `@cv`, la prohibición de `console`, `var` y `any`.
- `pnpm format:check` verifica el formato de Prettier con sus valores por defecto. El commit de formato masivo está registrado en `.git-blame-ignore-revs`; para que `git blame` lo omita, ejecuta `git config blame.ignoreRevsFile .git-blame-ignore-revs`.
- `pnpm test` ejecuta las pruebas de Vitest sobre el esquema, los íconos y los componentes.
- `pnpm build` genera el sitio y también valida `cv.json`.

## Despliegue

El sitio se despliega en [Vercel](https://vercel.com/): un commit con su `git push` al repositorio dispara el despliegue. El resultado de `pnpm build` es un sitio estático en `dist/`. El repositorio no incluye `vercel.json`; la configuración del proyecto en Vercel se administra fuera del repositorio. Además, el workflow de GitHub Actions `.github/workflows/ci.yml` (job `verify`) se ejecuta en cada pull request y en cada push a `main`, e instala con `pnpm install --frozen-lockfile` y ejecuta `pnpm check`, `pnpm lint`, `pnpm format:check`, `pnpm test` y `pnpm build`. Ese CI solo verifica la calidad del código: no despliega.

La URL canónica del sitio (`site` en `astro.config.mjs`) es `https://enzovera.dev`.

## Licencia y créditos

Proyecto bajo licencia [MIT](LICENSE), Copyright (c) 2025 Enzo Vera.

El diseño del sitio se basa en el trabajo de terceros:

- [Midudev](https://github.com/midudev/minimalist-portfolio-json): plantilla `minimalist-portfolio-json`, de la que parte este proyecto.
- [Bartosz Jarocki](https://github.com/BartoszJarocki/cv): diseño original en el que se inspira la plantilla.
