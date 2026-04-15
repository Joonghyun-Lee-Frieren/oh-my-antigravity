# oh-my-gemini-cli (OmG)

[![Release](https://img.shields.io/github/v/tag/Joonghyun-Lee-Frieren/oh-my-gemini-cli?sort=semver&label=release)](https://github.com/Joonghyun-Lee-Frieren/oh-my-gemini-cli/releases)
[![Version Check](https://img.shields.io/github/actions/workflow/status/Joonghyun-Lee-Frieren/oh-my-gemini-cli/version-check.yml?branch=main&label=version%20check)](https://github.com/Joonghyun-Lee-Frieren/oh-my-gemini-cli/actions/workflows/version-check.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](../LICENSE)
[![Stars](https://img.shields.io/github/stars/Joonghyun-Lee-Frieren/oh-my-gemini-cli?style=social)](https://github.com/Joonghyun-Lee-Frieren/oh-my-gemini-cli/stargazers)
[![Gemini Extension](https://img.shields.io/badge/Gemini-Extension-0d8a83)](https://geminicli.com/extensions/?name=Joonghyun-Lee-Frierenoh-my-gemini-cli)
[![Sponsor](https://img.shields.io/badge/Sponsor-GitHub_Sponsors-ea4aaa?logo=githubsponsors&logoColor=white)](https://github.com/sponsors/Joonghyun-Lee-Frieren)

[Página principal](https://joonghyun-lee-frieren.github.io/oh-my-gemini-cli/) | [Historial](./history.md)

[한국어](./README_ko.md) | [日本語](./README_ja.md) | [Français](./README_fr.md) | [中文](./README_zh.md) | [Español](./README_es.md)

Paquete de flujo de trabajo multiagente para Gemini CLI, impulsado por ingeniería de contexto.

> "La ventaja competitiva real de Claude Code no es Opus ni Sonnet. Es Claude Code en sí. Sorprendentemente, Gemini también funciona muy bien cuando se conecta al mismo harness."
>
> - Jeongkyu Shin (CEO de Lablup Inc.), en una entrevista de YouTube

Este proyecto empezó con esa observación:
"¿Qué pasa si llevamos ese modelo de harness a Gemini CLI?"

OmG amplía Gemini CLI desde un asistente de sesión única hacia un flujo de ingeniería estructurado y orientado por roles.

<p align="center">
  <img src="../resources/image/omg_logo_02.jpg" alt="OmG Logo" width="280" />
</p>

## Inicio rápido

### Instalación

Instálalo desde GitHub con el comando oficial de Gemini Extensions:

```bash
gemini extensions install https://github.com/Joonghyun-Lee-Frieren/oh-my-gemini-cli
```

Verificación en modo interactivo:

```text
/extensions list
```

Verificación en modo terminal:

```bash
gemini extensions list
```

Prueba rápida (smoke test):

```text
/omg:status
```

Nota: los comandos de instalación/actualización de extensiones se ejecutan en modo terminal (`gemini extensions ...`), no en modo interactivo de comandos slash.

## Novedades en v0.5.0

- Se añadió hardening de prompt-ops derivado de Claude en las capas de orquestación de OmG:
  - reglas de delegación `critical-path` vs `sidecar` para paralelismo más seguro
  - política de `read-before-modify` y `minimal-diff` en etapas de planificación/ejecución
  - contrato de recuperación para herramientas/permisos denegados (sin reintentos ciegos)
  - umbrales de evidencia más estrictos en verifier/reviewer (disciplina `pass|fail|unknown`)
- Se actualizaron superficies principales de prompts:
  - `context/omg-core.md`
  - `agents/{director,planner,executor,reviewer,verifier}.md`
  - `commands/omg/{team-assemble,team,team-plan,team-exec,team-verify,team-fix,doctor}.toml`
  - `skills/{plan,execute}/SKILL.md`
- Se corrigió el diagnóstico de retained-skills para que `/omg:doctor` valide todas las deep-work skills actuales (incluyendo `$omg-plan` y `$deep-dive`)
- Se actualizó la versión del paquete/extensión a `0.5.0` y se renovaron README, README en coreano, docs de landing page e historial

## Resumen

| Elemento | Resumen |
| --- | --- |
| Modelo de entrega | Extensión oficial de Gemini CLI (`gemini-extension.json`) |
| Bloques principales | `GEMINI.md`, `agents/`, `commands/`, `skills/`, `context/` |
| Caso de uso principal | Tareas complejas que requieren bucles planificar -> ejecutar -> revisar |
| Superficie de control | Plano de control slash-command-first `/omg:*` + 8 `$skills` de deep-work (incluye alias `omg-plan`) + delegación a sub-agentes |
| Estrategia de modelo por defecto | Puertas de juicio/aceptación en `gemini-3.1-pro-preview`, implementación pesada en `gemini-3-flash-preview`, exploración amplia de bajo riesgo en `gemini-3.1-flash-lite-preview` |

## Por qué OmG

| Problema en flujo crudo de sesión única | Respuesta de OmG |
| --- | --- |
| El contexto se mezcla entre planificación y ejecución | Agentes separados por rol con responsabilidades enfocadas |
| Difícil mantener visibilidad del progreso en tareas largas | Etapas explícitas y comprobaciones por comando |
| Carriles paralelos o worktrees se desalinean | `workspace` + `taskboard` mantienen ownership de lane, IDs de tarea y estado de verificación en forma compacta y explícita |
| Llamadas de herramienta denegadas entran en bucles sin recuperación | Las acciones denegadas se convierten en eventos explícitos de aprobación/fallback con seguimiento de blockers |
| Entrevistas profundas se interrumpen con nudges automáticos | El hook de learn-signal suprime nudges con deep-interview lock activo y solo reanuda tras liberar el lock |
| Prompt engineering repetitivo para trabajos comunes | Comandos slash para control operativo + retained skills de deep-work (`$plan`, `$omg-plan`, `$execute`, `$research`) |
| Deriva entre "lo decidido" y "lo cambiado" | Roles de review y debugging dentro del mismo bucle de orquestación |

## Arquitectura

```mermaid
flowchart TD
    U["User Task"] --> CLI["Gemini CLI Session"]
    CLI --> ORCH["OmG Extension Orchestration"]

    CORE["GEMINI.md -> context/omg-core.md"] --> ORCH
    CMDS["commands/omg/*.toml"] --> ORCH
    AGENTS["agents/*.md (role prompts)"] --> ORCH
    SKILLS["skills/*/SKILL.md (retained deep-work skills)"] --> ORCH

    ORCH --> I["/omg:intent"]
    I --> W["/omg:workspace (+ audit when needed)"]
    W --> A["/omg:team-assemble (optional approval gate)"]
    A --> P["team-plan -> team-prd -> taskboard sync"]
    P --> E["team-exec"]
    E --> V["team-verify"]
    V --> D{"Done criteria met?"}
    D -- "No" --> F["team-fix"]
    F --> E
    D -- "Yes" --> O["Validated output + next actions"]

    W -. lane map .-> WS[".omg/state/workspace.json"]
    P -. seed/sync .-> TB[".omg/state/taskboard.md"]
    E -. slice updates .-> TB
    V -. verifier evidence .-> TB
    ORCH -. status/checkpoint/hooks/notify .-> ST[".omg/state/{workflow.md,hooks.json,notify.json,...}"]
```

## Flujo de trabajo del equipo

```mermaid
sequenceDiagram
    participant User
    participant Director as omg-director
    participant Workspace as workspace/taskboard state
    participant Planner as omg-planner
    participant Architect as omg-architect
    participant Product as omg-product
    participant Executor as omg-executor
    participant Reviewer as omg-reviewer
    participant Verifier as omg-verifier
    participant Debugger as omg-debugger
    participant Editor as omg-editor

    User->>Director: Request team execution
    Director->>Workspace: Check lane health + task readiness
    Workspace-->>Director: workspace/taskboard summary
    Director->>User: Propose dynamic team + approval gate
    User->>Director: Approve roster
    Director->>Planner: Run team-plan
    Planner->>Architect: Validate technical direction (when needed)
    Architect-->>Planner: Design feedback and risk flags
    Planner-->>Director: Task graph + lane assumptions
    Director->>Product: Run team-prd
    Product-->>Director: Acceptance criteria + non-goals

    loop team-exec -> team-verify -> team-fix until done/blocker
        Director->>Executor: Assign smallest ready slice
        Executor->>Workspace: Update taskboard with execution notes
        Director->>Reviewer: Review implementation slice
        Reviewer->>Verifier: Run acceptance + anti-slop gate
        Verifier-->>Director: Pass/fail + verified task IDs
        alt Verification fails
            Director->>Debugger: Trigger root-cause analysis
            Debugger-->>Executor: Patch plan and fix targets
        end
    end

    Director->>Editor: Package validated output
    Editor-->>User: Final validated deliverable
```

## Ensamblaje dinámico de equipo

Usa `team-assemble` cuando un roster fijo de ingeniería no sea suficiente.

- Divide la selección en:
  - especialistas de dominio (expertise del problema)
  - especialistas de formato (calidad de reporte/contenido/salida)
- Lanza carriles de exploración en paralelo (`omg-researcher` xN) para descubrimiento amplio.
- Enruta decisiones por un carril de juicio (`omg-consultant` o `omg-architect`).
- Asigna esfuerzo de razonamiento por carril usando perfil global + overrides por teammate.
- Mantén explícitos los bucles verify/fix (`omg-reviewer` -> `omg-verifier` -> `omg-debugger`).
- Ejecuta verificación anti-slop antes de la entrega final.
- Exige aprobación explícita antes de iniciar ejecución autónoma.

Flujo de ejemplo:

```text
/omg:team-assemble "Compara 3 competidores y genera un informe ejecutivo"
-> propone: researcher x3 + consultant + editor + director
-> pregunta: ¿Proceed with this team? (yes/no)
-> tras aprobar: team-plan -> team-prd -> taskboard -> team-exec -> team-verify -> team-fix
```

Nota de activación:
- OmG no requiere una configuración separada de research-preview.
- Si la extensión está cargada, `/omg:team-assemble` queda disponible de inmediato.

## Control de Workspace y Taskboard

Usa `workspace` y `taskboard` cuando el trabajo abarque múltiples raíces, múltiples lanes de implementación o ciclos largos de verify/fix.

- `/omg:workspace` mantiene la raíz principal y lanes opcionales worktree/path en `.omg/state/workspace.json`.
- `/omg:workspace audit` revisa limpieza de lanes, estado de confianza y preparación de handoff antes de ejecución paralela, review o automatización.
- `/omg:taskboard` mantiene IDs estables, owners, dependencias, estados (`todo`, `ready`, `in-progress`, `blocked`, `done`, `verified`), notas de salud de lane y punteros de evidencia en `.omg/state/taskboard.md`.
- `team-plan` siembra IDs estables y supuestos por lane, `team-exec` toma el slice listo más pequeño con contexto explícito de lane/subagent, y `team-verify` solo marca tareas como verificadas cuando hay evidencia y estado de lane seguro.
- `checkpoint` y `status` pueden referenciar estos archivos en lugar de re-reproducir todo el chat, mejorando estabilidad de caché y reduciendo gasto de tokens.
- `/omg:recall "<consulta>"` hace recuperación state-first y búsqueda de fallback acotada para recuperar razonamiento previo sin re-reproducir transcripciones completas.

Flujo de ejemplo:

```text
/omg:workspace set .
/omg:workspace audit
/omg:workspace add ../feature-auth omg-executor
/omg:taskboard sync
/omg:taskboard next
/omg:recall "why was auth lane blocked" scope=state
```

## Higiene de Workspace y simetría de Hooks

Usa estos controles cuando las sesiones largas empiezan a desviarse porque ya no está clara la propiedad de lanes, la ejecución delegada o el comportamiento de continuación de hooks.

- `/omg:workspace audit` muestra worktrees compartidos sucios, rutas de review no confiables y lanes handoff-ready vs handoff-blocked.
- `/omg:hooks` y `/omg:hooks-validate` ahora modelan resultados emparejados del ciclo de vida de agentes (`completed`, `blocked`, `stopped`) para que continuaciones bloqueadas reingresen una vez al safety lane antes de reanudar hooks downstream.
- `team-exec`, `team`, `team-verify`, `stop` y `cancel` mantienen compacto y explícito el contexto lane/subagent delegado, expandiendo detalle solo cuando la ejecución se detiene temprano o encuentra un blocker.

## Enrutamiento de notificaciones

Usa `notify` cuando una sesión OmG de larga duración necesita señales explícitas para aprobaciones, resultados de verificación, blockers o deriva por inactividad.

- Perfiles soportados:
  - `quiet`: solo interrupciones urgentes (`approval-needed`, `verify-failed`, `blocker-raised`, `session-stop`)
  - `balanced`: quiet + actualizaciones de checkpoint y team-approval
  - `watchdog`: balanced + alertas idle-watchdog para bucles desatendidos
- Canales soportados:
  - `desktop` (adaptador de notificación del host)
  - `terminal-bell`
  - `file`
  - `webhook` (bridge externo)
- Límite de seguridad:
  - OmG gestiona enrutamiento de eventos, plantillas y política persistida
  - la entrega real debe implementarse por hooks del host Gemini, adaptadores de shell o bridges webhook específicos del proyecto
  - las sesiones worker delegadas mantienen deshabilitado el dispatch externo salvo opt-in explícito del usuario

Flujo de ejemplo:

```text
/omg:notify profile watchdog
-> enables: approval-needed, verify-failed, blocker-raised, checkpoint-saved, idle-watchdog, session-stop
-> sugiere canales: terminal-bell + file por defecto
-> persiste política: .omg/state/notify.json
```

## Monitor automático de uso (AfterAgent Hook)

OmG ahora incluye un hook de extensión que imprime una línea compacta de uso de tokens después de cada turno de agente completado.

- Hook entrypoint: `hooks/hooks.json` (`AfterAgent` -> `omg-quota-watch-after-agent`)
- Script: `hooks/scripts/after-agent-usage.js`
- Artefacto de estado: `.omg/state/quota-watch.json` (contador de turnos, snapshot de uso más reciente y fingerprint de transcripción procesada por última vez)
- Override opcional de raíz de estado: `OMG_STATE_ROOT=<dir>` (ruta absoluta o relativa al `cwd` de la sesión)
- Salida silenciosa opcional del hook: `OMG_HOOKS_QUIET=1`

Muestra automáticamente:

- totales de tokens del último turno (input/output/cached/total)
- tokens acumulados de sesión
- tokens acumulados para el modelo activo más reciente

Límite:

- Este hook no puede leer por sí mismo la cuota restante autoritativa de la cuenta.
- Para cuota/límites reales restantes, ejecuta `/stats model(~0.37.2) or /model(^0.38.0)`.
- Si Gemini reintenta la misma transcripción, el hook la trata como ya entregada y suprime salidas duplicadas.

Ejemplo (silenciar salida del hook pero mantener snapshots de estado):

```bash
export OMG_HOOKS_QUIET=1
```

Ejemplo (guardar estado del monitor fuera de `.omg/state`):

```bash
export OMG_STATE_ROOT=.omg/state-local
```

Desactivar solo este hook:

```json
{
  "hooksConfig": {
    "disabled": ["omg-quota-watch-after-agent"]
  }
}
```

## Filtro de seguridad Learn-Signal (AfterAgent Hook)

OmG también incluye un hook de learn-signal endurecido para seguridad, de modo que los nudges de `/omg:learn` solo aparezcan cuando una sesión tiene intención de implementación accionable.

- Hook entrypoint: `hooks/hooks.json` (`AfterAgent` -> `omg-learn-signal-after-agent`)
- Script: `hooks/scripts/learn.js`
- Artefacto de estado: `.omg/state/learn-watch.json` (clave de evento deduplicada, seguimiento de sesión para prompt-once y estado saneado)
- Fuente de deep-interview lock (solo lectura): `.omg/state/deep-interview.json`
- Controles de runtime:
  - `OMG_STATE_ROOT=<dir>` para mover `learn-watch.json` junto al resto del estado OmG
  - `OMG_HOOKS_QUIET=1` para mantener silencio en salida preservando actualizaciones de estado

Comportamiento de seguridad:

- si el estado de deep-interview lock está activo, se suprimen nudges de learn para no interrumpir el flujo de entrevista
- las sesiones de consultas solo informativas se filtran antes de emitir
- reintentos repetidos sobre la misma transcripción se deduplican
- estado previo legado o malformado se sanea antes de reutilizarse, reduciendo colisiones de estado obsoleto

Desactivar solo este hook:

```json
{
  "hooksConfig": {
    "disabled": ["omg-learn-signal-after-agent"]
  }
}
```

## Notas de compatibilidad con Gemini CLI (Revisado: 2026-03-21)

- Runtime estable recomendado: Gemini CLI `v0.33.0+` para ciclo de vida de hooks estable, contexto de política de subagentes y manejo de dirty-worktree.
- Controles UX más nuevos desde Gemini CLI `v0.34.0-preview.0+`:
  - invocación directa de skills vía `/skill-name`
  - personalización de footer vía `/footer` (respaldado por `ui.footer.items`, `ui.footer.showLabels`, `ui.footer.hideCWD`, `ui.footer.hideSandboxStatus`, `ui.footer.hideModelInfo`)
- Compatibilidad OmG para invocación slash de skills:
  - usa `/omg-plan` (o `$omg-plan`) cuando quieras la skill de planning de OmG sin colisionar con `/plan` nativo.
- Migración de motor de políticas: si tus wrappers aún pasan `--allowed-tools`, migra a perfiles `--policy` (`--allowed-tools` quedó deprecado en Gemini CLI `v0.30.0`).
- El modo `/plan` nativo y los comandos de planificación OmG pueden coexistir:
  - nativo: `/plan`
  - flujo por etapas OmG: `/omg:team-plan`, `/omg:team-prd`
- Funciones solo preview (por ejemplo soporte de plan-directory en manifest de extensión o docs experimentales de model steering del canal preview) no son requeridas para OmG y están intencionalmente deshabilitadas por defecto.

## Mapa de interfaz

### Commands

| Comando | Propósito | Momento típico |
| --- | --- | --- |
| `/omg:status` | Resumir progreso, riesgos y próximos pasos | Inicio/fin de una sesión de trabajo |
| `/omg:doctor` | Ejecutar diagnóstico de preparación de extensión/equipo/workspace/hooks y plan de remediación | Antes de corridas autónomas largas o cuando la configuración parece rota |
| `/omg:hud` | Inspeccionar o cambiar perfil visual de HUD (`normal`, `compact`, `hidden`) | Antes de sesiones largas o cuando cambia la densidad del terminal |
| `/omg:hud-on` | Activar rápido el HUD en modo visual completo | Al volver a tableros completos de estado |
| `/omg:hud-compact` | Activar rápido el HUD en modo compacto | Durante bucles densos de implementación |
| `/omg:hud-off` | Activar rápido el HUD en modo oculto (secciones de estado planas) | Cuando los bloques visuales distraen |
| `/omg:hooks` | Inspeccionar/cambiar perfil del pipeline de hooks y política de disparo | Antes de bucles autónomos o cuando deriva el comportamiento de hooks |
| `/omg:hooks-init` | Bootstrap de configuración de hooks y scaffolding de contratos de plugin | Al iniciar proyecto o primera adopción de hooks |
| `/omg:hooks-validate` | Validar orden de hooks, simetría de ciclo de vida, seguridad y límites de presupuesto | Antes de habilitar flujos de alta autonomía |
| `/omg:hooks-test` | Dry-run de secuencia de eventos de hooks y estimación de eficiencia | Después de cambios de política o bloqueos repetidos en bucles |
| `/omg:notify` | Configurar enrutamiento de notificaciones para aprobaciones, blockers, resultados de verify, checkpoints y alertas de inactividad | Antes de corridas desatendidas de `autopilot`/`loop` o cuando hay que ajustar ruido de alertas |
| `/omg:intent` | Clasificar intención de la tarea y enrutar a la etapa/comando correctos | Antes de planificar o codificar cuando la intención del pedido es ambigua |
| `/omg:rules` | Activar paquetes de guardrails condicionados por tarea | Antes de implementar trabajo sensible de migración/seguridad/rendimiento |
| `/omg:memory` | Mantener índice MEMORY, archivos por tema y rule packs conscientes de rutas | Durante sesiones largas o cuando derivan decisiones/reglas |
| `/omg:workspace` | Inspeccionar, auditar o establecer raíz principal, lanes worktree/path y límites de colisión | Antes de implementación paralela o trabajo multi-root |
| `/omg:taskboard` | Mantener un ledger compacto de tareas con IDs estables y estado de cierre respaldado por verifier | Después de planificar y durante bucles largos de exec/verify |
| `/omg:recall` | Recuperar decisiones/evidencia previas con búsqueda state-first y fallback acotado de historial | Cuando necesitas rationale previo rápidamente sin re-reproducir transcripciones completas |
| `/omg:reasoning` | Configurar esfuerzo global de razonamiento y overrides por teammate (`low/medium/high/xhigh`) | Antes de bucles costosos de planning/review o cuando la profundidad depende del rol |
| `/omg:deep-init` | Construir mapa profundo del proyecto y baseline de validación para sesiones largas | En kickoff del proyecto o al incorporarte a codebases desconocidos |
| `/omg:team-assemble` | Componer dinámicamente un equipo ajustado a roles con gate de aprobación y mapa de razonamiento por lane | Antes de `/omg:team` en tareas cross-domain o no estándar |
| `/omg:team` | Ejecutar pipeline completo por etapas (`team-assemble? -> plan -> prd -> taskboard -> exec -> verify -> fix`) | Entrega de feature compleja o refactor |
| `/omg:team-plan` | Construir plan de ejecución consciente de dependencias | Antes de implementar |
| `/omg:team-prd` | Fijar criterios de aceptación medibles y restricciones | Después de planificar, antes de codificar |
| `/omg:team-exec` | Implementar un slice de entrega acotado con handoff explícito de lane/subagente | Bucle principal de implementación |
| `/omg:team-verify` | Validar criterios de aceptación, regresiones y puerta de calidad anti-slop | Después de cada slice de ejecución |
| `/omg:team-fix` | Corregir solo fallos verificados | Cuando falla la verificación |
| `/omg:loop` | Forzar ciclos repetidos `exec -> verify -> fix` hasta done/blocker | Mitad/final de entrega cuando quedan hallazgos sin resolver |
| `/omg:mode` | Inspeccionar o cambiar perfil operativo (`balanced/speed/deep/autopilot/ralph/ultrawork`) | Al iniciar sesión o cambiar de postura |
| `/omg:approval` | Inspeccionar o cambiar postura de aprobación (`suggest/auto/full-auto`) | Antes de bucles autónomos de entrega o cambios de política |
| `/omg:autopilot` | Ejecutar ciclos autónomos iterativos con checkpoints | Entrega autónoma compleja |
| `/omg:ralph` | Forzar orquestación estricta con puertas de calidad | Tareas críticas de release |
| `/omg:ultrawork` | Modo de throughput para tareas independientes por lotes | Backlogs grandes |
| `/omg:consensus` | Converger en una opción entre múltiples diseños | Momentos de alta carga de decisión |
| `/omg:launch` | Inicializar estado persistente de ciclo de vida para tareas largas | Inicio de sesiones largas |
| `/omg:checkpoint` | Guardar checkpoint compacto y pista de reanudación con referencias a taskboard/workspace | Handoff a mitad de sesión |
| `/omg:stop` | Detener de forma segura modo autónomo y preservar progreso | Pausa/interrupción |
| `/omg:cancel` | Alias de cancel estilo harness que detiene de forma segura y devuelve handoff de reanudación | Al interrumpir flujo autónomo/de equipo |
| `/omg:optimize` | Mejorar prompts/contexto para calidad y eficiencia de tokens | Después de una sesión ruidosa o costosa |
| `/omg:cache` | Inspeccionar comportamiento de cache/contexto y anclaje de estado compacto | Tareas largas con alto uso de contexto |

### Skills

Las retained skills están limitadas intencionalmente a un conjunto compacto de deep-work para que la extensión cargue menos metadata de discovery al inicio de sesión (con un alias de compatibilidad: `$omg-plan`).

| Skill | Enfoque | Estilo de salida |
| --- | --- | --- |
| `$plan` | Convertir objetivos en plan por fases | Hitos, riesgos y criterios de aceptación |
| `$omg-plan` | Alias de planificación amigable con slash, evita colisiones con `/plan` nativo | Mismo output de planificación que `$plan` |
| `$ralplan` | Planificación estricta por etapas con puntos de rollback | Mapa de ejecución quality-first |
| `$execute` | Implementar un slice acotado del plan | Resumen de cambios con notas de validación |
| `$prd` | Convertir solicitudes en criterios de aceptación medibles | Contrato de alcance estilo PRD |
| `$research` | Explorar opciones y tradeoffs | Comparación orientada a decisión |
| `$deep-dive` | Ejecutar descubrimiento trace-to-interview antes de planificar | Puntuación de claridad, ledger de supuestos y launch brief |
| `$context-optimize` | Mejorar estructura de contexto | Ajustes de compresión y señal/ruido |

### Sub-agents

| Agente | Responsabilidad principal | Perfil de modelo preferido |
| --- | --- | --- |
| `omg-architect` | Límites del sistema, interfaces, mantenibilidad a largo plazo | `gemini-3.1-pro-preview` |
| `omg-planner` | Descomposición y secuenciación de tareas | `gemini-3.1-pro-preview` |
| `omg-product` | Bloqueo de alcance, no-objetivos y criterios medibles | `gemini-3.1-pro-preview` |
| `omg-executor` | Ciclos rápidos de implementación | `gemini-3-flash-preview` |
| `omg-reviewer` | Revisión de corrección y riesgo de regresión | `gemini-3.1-pro-preview` |
| `omg-verifier` | Evidencia de aceptación y validación de release-readiness | `gemini-3.1-pro-preview` |
| `omg-debugger` | Análisis de causa raíz y estrategia de parche | `gemini-3.1-pro-preview` |
| `omg-consensus` | Scoring de opciones y convergencia de decisiones | `gemini-3.1-pro-preview` |
| `omg-researcher` | Análisis y síntesis de opciones externas | `gemini-3.1-pro-preview` |
| `omg-director` | Enrutamiento de mensajes del equipo, resolución de conflictos y orquestación de ciclo de vida | `gemini-3.1-pro-preview` |
| `omg-consultant` | Criterios de análisis estratégico y framing de recomendaciones | `gemini-3.1-pro-preview` |
| `omg-editor` | Estructura final de entregable, consistencia y ajuste a audiencia | `gemini-3-flash-preview` |
| `omg-quick` | Correcciones tácticas pequeñas | `gemini-3.1-flash-lite-preview` |

## Modelo de capas de contexto

| Capa | Fuente | Objetivo |
| --- | --- | --- |
| 1 | Restricciones del sistema/runtime | Mantener el comportamiento alineado con garantías de plataforma |
| 2 | Estándares del proyecto | Preservar convenciones del equipo e intención arquitectónica |
| 3 | `GEMINI.md` delgado, `MEMORY.md` y contexto compartido | Mantener memoria estable en sesiones largas sin cargar procedimiento pesado en cada turno |
| 4 | Brief de tarea activa + estado de workspace/taskboard | Mantener visible objetivo actual, lanes activos y criterios de aceptación |
| 5 | Trazas de ejecución más recientes | Alimentar iteración y review inmediatos sin re-reproducir historial crudo completo |

## Estructura del proyecto

```text
oh-my-gemini-cli/
|- GEMINI.md
|- gemini-extension.json
|- agents/
|- commands/
|  `- omg/
|- skills/
|- context/
|- docs/
`- LICENSE
```

## Solución de problemas

| Síntoma | Causa probable | Acción |
| --- | --- | --- |
| `settings.filter is not a function` durante instalación | Runtime de Gemini CLI desactualizado o metadata cacheada obsoleta | Actualiza Gemini CLI, desinstala la extensión y reinstala desde la URL del repositorio |
| No se encuentra `/omg:*` | La extensión no se cargó en la sesión actual | Ejecuta `gemini extensions list` y reinicia la sesión de Gemini CLI |
| `/plan` abre el modo nativo cuando querías la skill de planificación OmG | Colisión de nombre entre `/plan` nativo y slash invocation de skill | Usa `/omg-plan` (o `$omg-plan`) para la skill OmG, o `/omg:team-plan` para planificación por etapas |
| Una skill no se dispara | Solo se distribuyen retained deep-work skills, o metadata de extensión obsoleta | Revisa lista de retained skills en README y recarga extensión/sesión |
| Team assembly sigue proponiendo pero no ejecuta | Falta token de aprobación en la solicitud | Responde con aprobación explícita (`yes`, `approve`, `go`, o `run`) |
| La ejecución paralela colisiona o vuelve a planificar los mismos archivos | Los lanes de workspace no son explícitos | Ejecuta `/omg:workspace status` o fija ownership de lane/path con `/omg:workspace` |
| Review o automatización está por ejecutarse sobre lane sucio/no confiable | Higiene de worktree compartido no clara | Ejecuta `/omg:workspace audit`, aísla el lane si hace falta y luego continúa verify/review |
| El estado done deriva después de bucles largos | No hay fuente compacta de verdad o falta signoff del verifier | Ejecuta `/omg:taskboard sync` y vuelve a correr `/omg:team-verify` para cerrar IDs pendientes |
| No recuerdas por qué se tomó una decisión antes | El rationale previo quedó enterrado en historial largo | Ejecuta `/omg:recall "<keyword>" scope=state` y amplía a `scope=recent` solo si hace falta |
| Hooks parecen perder eventos terminales o dispararse dos veces tras continuation | Simetría de ciclo de vida de hooks no explícita | Ejecuta `/omg:hooks-validate` y corrige policy de lifecycle antes de reactivar bucles autónomos |
| La salida es verbosa, genérica o repetitiva | Postura de razonamiento/gate demasiado débil para el artefacto objetivo | Sube esfuerzo en `/omg:reasoning` (opcionalmente con overrides por teammate) y vuelve a ejecutar `/omg:team-verify` |
| Scripts de lanzamiento existentes usan `--allowed-tools` | Flag deprecado en Gemini CLI nuevo | Reemplaza por perfiles de policy con `--policy` y vuelve a ejecutar |
| Flujo autónomo confirma demasiado (o demasiado poco) | Postura de aprobación no alineada con riesgo de tarea | Ejecuta `/omg:approval suggest|auto|full-auto` y vuelve a revisar guardrails |
| No está clara la salud de setup antes de una corrida larga | Se acumuló deriva de estado/configuración | Ejecuta `/omg:doctor` (o `/omg:doctor team`) y aplica lista de remediación |

## Notas de migración

| Flujo legado | Flujo extension-first |
| --- | --- |
| Instalación global de paquete + proceso de copia `omg setup` | `gemini extensions install ...` |
| Runtime conectado mayormente por scripts CLI | Runtime conectado por primitivas de manifest de extensión |
| Scripts manuales de onboarding | Carga nativa de extensiones por Gemini CLI |

El comportamiento de la extensión está conducido por el manifest a través de primitivas de extensión de Gemini CLI.

## Inspiración

- [Gemini CLI](https://github.com/google-gemini/gemini-cli) - Agente de terminal AI open-source de Google
- [oh-my-codex](https://github.com/Yeachan-Heo/oh-my-codex) - Harness para Codex CLI
- [oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode) - Harness para Claude Code CLI
- [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode) - Harness para agente OpenCode
- [Claude Code Prompt Caching](https://news.hada.io/topic?id=26835) - Principios de ingeniería de contexto
- [everything-claude-code](https://github.com/affaan-m/everything-claude-code) - Harness para Claude Code CLI

## Docs

- [Guía de instalación](./guide/installation.md)
- [Guía de ingeniería de contexto](./guide/context-engineering.md)
- [Guía de ensamblaje de equipo de agentes](./guide/agent-team-assembly.md)
- [Guía de gestión de memoria](./guide/memory-management.md)
- [Guía de ingeniería de hooks](./guide/hook-engineering.md)
- [Historial](./history.md)

## Star History

[![Star History Chart](https://api.star-history.com/image?repos=Joonghyun-Lee-Frieren/oh-my-gemini-cli&type=date&legend=top-left)](https://www.star-history.com/?repos=Joonghyun-Lee-Frieren%2Foh-my-gemini-cli&type=date&legend=top-left)

## Licencia

MIT
