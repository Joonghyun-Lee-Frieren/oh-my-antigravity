# oh-my-antigravity (OmA)

[![Version](https://img.shields.io/badge/version-1.2.0-0d8a83)](history.md)
[![Checks](https://img.shields.io/github/actions/workflow/status/Joonghyun-Lee-Frieren/oh-my-antigravity/version-check.yml?branch=main&label=checks)](https://github.com/Joonghyun-Lee-Frieren/oh-my-antigravity/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](../LICENSE)

[Website](https://joonghyun-lee-frieren.github.io/oh-my-antigravity/) · [History](history.md) · [English](../README.md) · [한국어](README_ko.md) · [日本語](README_ja.md) · [Français](README_fr.md) · [中文](README_zh.md) · [Español](README_es.md)

Un **plugin nativo para Antigravity CLI** orientado al trabajo de ingeniería, con turnos de diseño
separados, agentes de documentación de solo lectura, controles antes de editar, pruebas de
verificación reales y revisiones pequeñas.

<p align="center"><img src="../resources/image/oma_logo_02.png" alt="OmA" width="360"></p>

## Instalación

Requiere una versión actual de Antigravity CLI y Node.js 20 o superior.

```bash
agy plugin install https://github.com/Joonghyun-Lee-Frieren/oh-my-antigravity
agy plugin list
```

Dentro de la CLI, consulta `/plugin list` y `/hooks`, y empieza con:

```text
/oma-team-plan Describe el cambio y sus criterios de aceptación
```

El agente de documentación devuelve un resumen conciso. Registra un Scope Brief, fija el alcance de
los archivos y las verificaciones, y solicita un Design Check independiente. Una vez aprobado,
**termina el turno de diseño**. En el siguiente turno:

```text
/oma-team-exec Implementa el plan fijado
```

Ejecuta `/oma-team-verify` para recopilar las revisiones de secciones pendientes. El hook Stop programa
lotes de correcciones cuando fallan las verificaciones o las revisiones. La falta de servicios,
permisos o pruebas puede terminar en `blocked` o `unknown`; nunca se exige responder con un éxito.

Consulta la [guía del flujo de trabajo protegido](guide/guarded-workflow.md) para conocer los comandos
exactos del controlador, los ejemplos JSON, la recuperación y los límites de las restricciones.

## Novedades de la v1.2.0

Se registran las huellas de los scripts de validación y de los archivos declarados en
los `inputs` de cada comprobación. Los cambios bloquean el inicio, la validación o
la aceptación de pruebas obsoletas; Session Trail también informa de estos cambios.
El revisor recibe todos los resultados pertinentes y hasta dos extractos de registros,
con prioridad para los fallos. Consulta el [esquema de entradas](guide/guarded-workflow.md)
para los cambios legítimos en pruebas. Los planes ya sellados deben sellarse de nuevo
para obtener esta protección.

El material de las partes 1–7 también fundamenta la cobertura completa de lectura,
las dependencias de solo lectura, los límites de sobrescritura, los fallos tipados,
el AST de Python y los grupos de reparación ordenados por dependencias. La oscilación
reduce el lote a un grupo. Cada sección usa una conversación nueva con pruebas de
refutación y un juez determinista. Usa `/oma-read` antes del traspaso, `/oma-probe`
para la ayuda CLI, `/oma-failure` para fallos y `/oma-repair-context` para el lote activo.
Los archivos Python requieren Python 3.9+. Consulta los [esquemas y límites](guide/series-runtime.md).
Entregar todos los bytes no demuestra comprensión ni garantiza cero defectos.

## Alcance y continuidad de la v1.1.0

| Función | Comportamiento |
| --- | --- |
| **Scope Brief** | Registra el objetivo, las restricciones, las exclusiones, los responsables de las decisiones y los conflictos entre fuentes; los asuntos pendientes impiden fijar el plan |
| **Design Check** | Un auditor de solo lectura comprueba el plan exacto antes de cerrar el turno de diseño; los cambios en el plan invalidan la revisión anterior |
| **Evidence Window** | Lee fragmentos de registros con integridad comprobada mediante un cursor acotado de bytes UTF-8; la salida completa permanece en disco |
| **Session Trail** | Los puntos de control JSON/Markdown inmutables conservan la intención actual y la siguiente acción; al reanudar se detectan cambios en las fuentes o el plan |
| **Recibos de revisión nativos** | El revisor envía su propio resultado desde otra conversación; la conversación principal no puede redactar un PASS ni dirigir la revisión |
| **Perfiles Care** | Los alcances routine/elevated/critical usan secciones de 120/90/60 líneas y lotes de 3/2/1 unidades, conservando todas las verificaciones y los bloqueos |

Las rutas sensibles solo pueden elevar el nivel de cautela. Los paquetes compactos de estado y
contexto mantienen los registros completos y los tickets de recibo fuera del contexto habitual del
modelo. Las verificaciones siguen ejecutándose y, si faltan pruebas, el resultado sigue siendo unknown.
Consulta los [esquemas y ejemplos](guide/session-continuity.md).

## Modelos

Las recomendaciones proceden de [config/models.json](../config/models.json), contrastado con la
[disponibilidad oficial de modelos](https://antigravity.google/docs/models) el 2026-10-16.

| Rol | Perfil Balanced | Perfil Flash |
| --- | --- | --- |
| Diseño y planificación | `gemini-4-argon-high` | `gemini-3.8-flash-high` |
| Implementación | `gemini-3.8-flash-medium` | `gemini-3.8-flash-medium` |
| Tareas rápidas | `gemini-3.8-flash-low` | `gemini-3.8-flash-low` |
| Revisión y verificación | `gemini-4-argon-high` | `gemini-3.8-flash-high` |

Consulta `agy models` para tu cuenta y elige con `agy --model <id>` o con el selector del entorno de
ejecución. Los subagentes usan `model: inherit`. `/oma-model` explica los perfiles; `auto` conserva el
modelo seleccionado en el entorno de ejecución y `custom` exige definir los cuatro roles.
Los perfiles son recomendaciones y no cambian el modelo automáticamente: el contrato de hooks
nativos no ofrece una salida para sustituirlo. Si Argon no está disponible, elige explícitamente el
perfil Flash. Los modelos empresariales antiguos pueden seguir disponibles, pero no se incluyen
en los valores predeterminados distribuidos.

## Flujos de trabajo y roles

El plugin ofrece 64 skills breves, incluidos 53 puntos de entrada de comandos `/oma-<name>`, y
16 agentes con capacidades limitadas. Usa solo los procedimientos relevantes para la tarea actual.

| Comando | Propósito |
| --- | --- |
| `/oma-team-plan`, `/oma-team-prd` | Traspaso de documentación, alcance, criterios de aceptación y diseño |
| `/oma-brief` | Objetivo, restricciones, responsabilidad de decisiones y conflictos entre fuentes |
| `/oma-design-check` | Comprobación independiente del plan fijado exacto |
| `/oma-evidence` | Fragmentos acotados de registros de validadores con integridad comprobada |
| `/oma-checkpoint`, `/oma-resume` | Traspaso inmutable e inspección de continuidad de solo lectura |
| `/oma-team-exec` | Implementación del alcance fijado en el siguiente turno del usuario |
| `/oma-team-verify` | Verificaciones reales y traspasos de revisión de una sección cada vez |
| `/oma-team-fix` | Lote seleccionado por Stop de hasta tres unidades de corrección |
| `/oma-goal`, `/oma-ultragoal` | Seguimiento de la entrega con los mismos controles de turnos y pruebas |
| `/oma-status`, `/oma-doctor` | Fase, propiedad, pruebas faltantes, bloqueos y obstáculos |
| `/oma-model` | Recomendaciones actuales de modelos y selección en el entorno de ejecución |
| `/oma-hooks`, `/oma-hooks-validate` | Inspección de hooks nativos y diagnósticos de seguridad |
| `/oma-stop`, `/oma-cancel` | Detención conservando las pruebas y los bloqueos |

`oma-doc-reader` lee las especificaciones. `oma-planner` y `oma-architect` ayudan con el diseño.
`oma-executor` propone parches; solo los aplica la conversación principal propietaria.
`oma-design-auditor` comprueba el plan fijado. `oma-reviewer` examina una sección acotada;
`oma-verifier` comprueba las pruebas de aceptación. Todos los agentes de trabajo distribuidos
excluyen herramientas de escritura, shell, MCP y delegación.

El estado de referencia del flujo de trabajo es `.omg/state/guard.json`; los registros de ejecución
están en `.omg/evidence/`. Los agentes usan `.omg/drafts/` para solicitudes y notas auxiliares.
Solo el controlador es propietario del estado de protección, las pruebas y los puntos de control.
El hook captura los mensajes de revisores independientes con la identidad real del remitente.
Cada flujo de trabajo permite un solo espacio de trabajo y un único agente con permiso de escritura;
usa flujos separados para worktrees aislados.

## Actualización desde v1.0 o Gemini CLI

Reinstala el plugin nativo con `agy plugin install`. Los planes nuevos requieren un Scope Brief
resuelto y un Design Check nativo. Los roles independientes necesitan hooks send_message nativos
con el identificador real de la conversación hija; si el entorno de ejecución no lo admite, el
resultado sigue siendo unknown. Los estados v1.0 ya fijados pueden completarse mediante su ruta
antigua de recibos, pero los planes nuevos siempre usan la ruta nativa. Session Trail inspecciona
el estado actual sin restaurar propiedades, aprobaciones ni bloqueos anteriores.

Los comandos nativos usan `/oma-team-exec` en lugar de `/oma:team-exec`. Las fuentes antiguas de
protocolos TOML están en `protocols/oma/` y generan las envolturas de skills nativos; se sitúan fuera
del directorio de descubrimiento antiguo `commands/` del entorno de ejecución para evitar registros
duplicados.

`gemini-extension.json` permanece como marcador de migración. Elimina los hooks antiguos copiados
manualmente. Se han eliminado el enrutador Gemini `BeforeModel`, sus opciones de trazado y el
recordatorio de aprendizaje `AfterAgent`. Usa `/oma-learn` explícitamente y selecciona los modelos
mediante la CLI.

Los archivos aprobados permanecen bloqueados, también en flujos de trabajo posteriores. Abrir un
bloqueo, cambiar el alcance fijado o recuperar un estado bloqueado o perteneciente a otra conversación
requiere una acción explícita del operador fuera del agente protegido. Conserva las pruebas anteriores
durante la recuperación.

El arnés limita las herramientas del agente; no es un entorno aislado del sistema operativo.
Los validadores son código de confianza del proyecto. Las verificaciones de comportamiento y los
revisores aún deben detectar la fabricación semántica. Una unidad de corrección es un validador
fallido o una sección no aprobada, que puede contener varios diagnósticos.
Consulta el [contrato completo](guide/guarded-workflow.md).

## Desarrollo

```bash
npm test
npm run test:skills
npm run test:generated
npm run test:version
agy plugin validate .
```

Edita los procedimientos de comandos en `protocols/oma/` y ejecuta `npm run build:skills`.
Los procedimientos de los skills principales están en `references/`, junto a sus puntos de entrada.
Las pruebas cubren los límites entre turnos, las evasiones por shell o rutas, la propiedad, las
verificaciones fallidas o ausentes, la cobertura de revisiones, las pruebas obsoletas, los bloqueos,
los límites de corrección, la cancelación y los límites de reintento. La v1.1 también cubre los
conflictos entre fuentes, la invalidación de recibos de diseño, la suplantación de identidad, la
repetición de mensajes, el aumento de cautela, la paginación de registros UTF-8, la corrupción de
puntos de control y los cambios en las fuentes al reanudar.

## Agradecimientos especiales

**Gracias especialmente a [@hyunuk.lim](https://www.threads.com/@hyunuk.lim) (threads).** Sus hilos y
publicaciones fueron de gran ayuda para dar forma a esta refactorización: skills más pequeños,
restricciones físicas de herramientas, fallos honestos, correcciones acotadas y revisiones centradas.

Lectura adicional: [su artículo de Medium sobre las ideas detrás de la renovación v1.0](https://medium.com/@dev.hyunuk/3f86bb9b8ab7).
Gracias por compartir los conceptos y la experiencia que ayudaron a dar forma al flujo de trabajo de OmA.

El proyecto también creció a partir de la observación de Jeongkyu Shin de que el arnés de ingeniería
que rodea a un modelo importa tanto como el propio modelo.

[MIT License](../LICENSE) · [Sponsor](https://github.com/sponsors/Joonghyun-Lee-Frieren)
