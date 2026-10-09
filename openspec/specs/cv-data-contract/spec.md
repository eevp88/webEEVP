# Especificación de cv-data-contract

## Purpose

Garantizar que los datos del CV (`cv.json`, alias `@cv`) tengan una única definición de tipos, que los datos inválidos o incompletos se detecten en build y en pruebas, y que los componentes consuman los datos mediante un accesor tipado (`src/lib/cv.ts`).

Decisiones resueltas: Q3 = validación en runtime con Zod vía `astro/zod` (resuelta); Q4 = mantener las secciones de relleno como opcionales (resuelta); Q5 = corregir `key` a `keywords` y los tres errores tipográficos de prosa (resuelta).

## Requirements

### Requirement: Fuente única de tipos del CV

El repositorio MUST definir los tipos del CV en una sola fuente. No MUST existir ningún tipo de CV sin usar ni duplicado (el tipo `CV` de `src/cv.d.ts` y las definiciones paralelas de `src/types.d.ts`). El tipo de las redes sociales (`SocialIcon`) MUST estar tipado explícitamente y no resolverse a `any`. (Q3 resuelta: la fuente única es un esquema Zod con tipos derivados mediante `z.infer`.)

#### Scenario: Una sola definición de tipos

- GIVEN el repositorio tras aplicar el cambio
- WHEN se buscan en `src/` las declaraciones de tipos del CV
- THEN existe exactamente una fuente de la que derivan todos los tipos del CV
- AND no queda ningún tipo de CV declarado sin ser referenciado

#### Scenario: Tipos completos respecto de los datos reales

- GIVEN los datos actuales de `cv.json`, incluyendo `acknowledgments` y los campos `city` y `country` en trabajos
- WHEN se ejecuta `pnpm check`
- THEN termina con código 0
- AND los tipos reflejan esos campos sin tipos `any` implícitos en la capa de datos

### Requirement: Accesor tipado del CV

Los componentes MUST obtener los datos del CV a través del accesor tipado `src/lib/cv.ts` y no MUST importar `@cv` directamente. El accesor MUST devolver datos ya validados contra el esquema.

#### Scenario: Componentes consumen el accesor

- GIVEN los componentes en `src/components/` y `src/pages/`
- WHEN se inspeccionan sus importaciones de datos del CV
- THEN todas provienen de `src/lib/cv.ts`
- AND ninguna importa `@cv` directamente

#### Scenario: El accesor devuelve datos tipados

- GIVEN `cv.json` válido
- WHEN se invoca el accesor
- THEN devuelve un objeto cuyo tipo coincide con el tipo derivado del esquema

### Requirement: Detección de datos inválidos o incompletos

Un `cv.json` que incumpla el esquema MUST producir un fallo en `pnpm build` y en `pnpm test`, con un mensaje que identifique el campo inválido. (Provisional, pendiente de Q3: la validación en runtime se realiza con Zod; si Q3 se resolviera como solo tipos, este requisito deberá reformularse.)

#### Scenario: Un campo obligatorio ausente falla

- GIVEN un `cv.json` al que se le quita un campo obligatorio (por ejemplo `basics.name`)
- WHEN se ejecuta `pnpm test` o `pnpm build`
- THEN el comando termina con código distinto de 0
- AND el mensaje de error indica la ruta del campo ausente

#### Scenario: Un tipo de dato incorrecto falla

- GIVEN un `cv.json` donde un campo esperado como arreglo de textos contiene un valor numérico
- WHEN se ejecuta la validación
- THEN la validación falla indicando la ruta del campo

#### Scenario: El `cv.json` real es válido

- GIVEN el `cv.json` del repositorio tras las correcciones de contenido
- WHEN se ejecuta `pnpm test`
- THEN las pruebas de parseo e invariantes del CV pasan

### Requirement: Corrección estructural de la habilidad PL/SQL

La entrada de habilidad PL/SQL MUST usar la propiedad `keywords` en lugar de `key`, de modo que cumpla el esquema. (Provisional, Q5.)

#### Scenario: Habilidad PL/SQL con keywords

- GIVEN `cv.json` tras el cambio
- WHEN se valida contra el esquema
- THEN la habilidad PL/SQL tiene `keywords` y no tiene `key`

### Requirement: Corrección de errores tipográficos de prosa

El contenido de `cv.json` MUST NOT contener las cadenas erróneas "TypeScritp", "directamentetación" ni "Licenciadoen". (Provisional, Q5; si Q5 se resuelve por no corregir, este requisito se retira.)

#### Scenario: Sin errores tipográficos conocidos

- GIVEN `cv.json` tras el cambio
- WHEN se buscan las tres cadenas erróneas
- THEN no hay coincidencias

### Requirement: Secciones de relleno opcionales

El esquema MUST aceptar como opcionales las secciones de relleno (`volunteer`, `awards`, `certificates`, `publications`, `interests`, `references`), y el renderizado MUST NOT cambiar por ello. (Provisional, Q4; no se eliminan secciones; pendiente de Q4 cualquier eliminación.)

#### Scenario: Sección de relleno ausente es válida

- GIVEN un `cv.json` sin la sección `awards`
- WHEN se valida contra el esquema
- THEN la validación pasa

#### Scenario: Sin cambio de renderizado

- GIVEN el build previo al cambio y el build posterior
- WHEN se compara el HTML generado de la página de inicio
- THEN no hay diferencias de contenido atribuibles a las secciones de relleno

### Requirement: Props tipadas y flag booleano en Section

`Section.astro` MUST declarar `Props` y MUST exponer `printed` como booleano real, sin comparaciones con cadenas (`"0"`), y MUST NOT incluir un `<script>` vacío.

#### Scenario: Section con Props tipadas

- GIVEN `Section.astro`
- WHEN se ejecuta `pnpm check`
- THEN no se reportan errores de tipos para sus props
- AND pasar `printed={false}` oculta el contenido impreso y `printed={true}` (valor por defecto) lo muestra

#### Scenario: Sin script vacío

- GIVEN el HTML generado de una sección
- WHEN se inspecciona
- THEN no contiene un elemento `<script>` vacío proveniente de `Section.astro`

### Requirement: Alias de tsconfig corregido

`tsconfig.json` MUST definir el alias de assets sin el error tipográfico (`@/asset`), de forma que resuelva a un directorio existente o se elimine si no se usa.

#### Scenario: Alias válido

- GIVEN `tsconfig.json` tras el cambio
- WHEN se ejecuta `pnpm check`
- THEN no hay errores de resolución de alias
