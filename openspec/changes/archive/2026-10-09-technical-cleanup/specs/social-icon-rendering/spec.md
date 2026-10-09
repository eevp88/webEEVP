# Especificación de social-icon-rendering

## Purpose

Garantizar que las redes sociales y las habilidades resuelvan sus íconos mediante un registro compartido (`src/lib/icons.ts`), que se elimine el markup SVG duplicado y que una red desconocida renderice un fallback definido en lugar de un ícono indefinido.

Valores provisionales (NO son decisiones): Q6 = los errores de comportamiento de comandos de tema y `ctrl+C` quedan fuera de alcance; Q7 = los íconos sin coincidencia (next, swift, swiftui, kotlin, flutter) se mantienen en el registro, marcados como sin uso mediante una nota en una prueba.

## Requirements

### Requirement: Registro compartido de íconos

Existe un único registro de íconos que MUST ser usado por `Hero.astro` y `KeyboardManager.astro` para las redes sociales, y por las habilidades para sus íconos. Los componentes MUST NOT mantener mapas propios de red social a SVG. Excepción permitida: el mapa de componentes de íconos de habilidades de `Skills.astro` (clave de habilidad a componente `.astro`, declarado con `satisfies`), que no es un mapa de red social a SVG.

#### Scenario: Redes conocidas resuelven desde el registro

- GIVEN perfiles sociales de GitHub, LinkedIn y X en `cv.json`
- WHEN se renderizan `Hero.astro` y `KeyboardManager.astro`
- THEN ambos obtienen el ícono desde el registro compartido
- AND el ícono renderizado coincide con la red

#### Scenario: Sin mapas duplicados

- GIVEN el código fuente tras el cambio
- WHEN se inspeccionan `Hero.astro` y `KeyboardManager.astro`
- THEN ninguno declara un mapa local de red a ícono

### Requirement: Fallback para redes desconocidas

Un perfil social cuya red no esté en el registro MUST renderizar un ícono de fallback definido (o un enlace con texto) y MUST NOT romper el build ni producir un ícono indefinido en el HTML. El helper de resolución MUST ser comprobable de forma unitaria.

#### Scenario: Perfil social desconocido no rompe el build

- GIVEN un perfil social con red "mastodon" ausente del registro
- WHEN se ejecuta `pnpm build`
- THEN el build termina con código 0
- AND el enlace se renderiza con el ícono de fallback y no con `undefined`

#### Scenario: Resolución unitaria del fallback

- GIVEN el helper de resolución de íconos
- WHEN se le pasa un nombre de red desconocido
- THEN devuelve el ícono de fallback
- AND no lanza excepción

#### Scenario: Coincidencia exacta del nombre de red

- GIVEN el helper de resolución, cuyo registro usa claves exactas (por ejemplo "GitHub") y no normaliza mayúsculas ni minúsculas
- WHEN se resuelve la red "GitHub"
- THEN devuelve el ícono de GitHub, no el fallback
- AND al resolver "github" (casing distinto de la clave) devuelve el ícono de fallback con `title = "github"`, sin lanzar excepción

### Requirement: Eliminación de duplicación y código muerto

`KeyboardManager.astro` MUST NOT contener SVG de GitHub/LinkedIn/X en línea ni llamadas a `console.log`. Los archivos `src/assets/astro.svg` y `src/assets/background.svg` MUST NOT existir. Ninguna llamada a `console.log` MUST permanecer en `src/`.

#### Scenario: Sin console.log en src

- GIVEN el código fuente tras el cambio
- WHEN se buscan llamadas a `console.log` en `src/`
- THEN no hay coincidencias

#### Scenario: Assets sin referenciar eliminados

- GIVEN el repositorio tras el cambio
- WHEN se comprueba la existencia de `src/assets/astro.svg` y `src/assets/background.svg`
- THEN ninguno existe
- AND `pnpm build` termina con código 0

#### Scenario: Sin SVG de redes en línea

- GIVEN `KeyboardManager.astro`
- WHEN se inspecciona su marcado
- THEN no contiene SVG en línea de GitHub, LinkedIn ni X

### Requirement: Íconos sin coincidencia conservados

El registro MUST conservar los íconos next, swift, swiftui, kotlin y flutter, y una prueba MUST documentar que no coinciden hoy con ninguna habilidad. (Provisional, Q7; pendiente de Q7 si se decide eliminarlos.)

#### Scenario: Íconos sin uso documentados

- GIVEN el registro y la suite de pruebas
- WHEN se ejecuta `pnpm test`
- THEN la prueba pasa y su nota identifica los cinco íconos como sin uso actual

### Requirement: Comportamiento de KeyboardManager sin cambios

Este cambio MUST NOT modificar el comportamiento de los comandos de tema ni del atajo `ctrl+C` (Provisional, Q6; si Q6 los incorpora, se añadirán requisitos nuevos).

#### Scenario: Comportamiento preservado

- GIVEN `KeyboardManager.astro` tras reemplazar los SVG por el registro
- WHEN se compara su lógica de comandos con la previa
- THEN solo cambian el origen de los íconos y la eliminación de `console.log`

### Requirement: Salida del build sin regresiones

El HTML generado de la página de inicio MUST NOT mostrar diferencias de contenido no intencionadas respecto del build previo al cambio; las diferencias de espacios en blanco MUST revisarse.

#### Scenario: Comparación de dist antes y después

- GIVEN el HTML de `dist/index.html` antes y después de la unidad de código muerto
- WHEN se comparan
- THEN las únicas diferencias son las esperadas (ícono de fallback en redes desconocidas, si aplica, y espacios en blanco revisados)
