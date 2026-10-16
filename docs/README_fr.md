# oh-my-antigravity (OmA)

[![Version](https://img.shields.io/badge/version-1.1.0-0d8a83)](history.md)
[![Checks](https://img.shields.io/github/actions/workflow/status/Joonghyun-Lee-Frieren/oh-my-antigravity/version-check.yml?branch=main&label=checks)](https://github.com/Joonghyun-Lee-Frieren/oh-my-antigravity/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](../LICENSE)

[Website](https://joonghyun-lee-frieren.github.io/oh-my-antigravity/) · [History](history.md) · [English](../README.md) · [한국어](README_ko.md) · [日本語](README_ja.md) · [Français](README_fr.md) · [中文](README_zh.md) · [Español](README_es.md)

Un **plugin natif pour Antigravity CLI** destiné aux travaux d’ingénierie, avec des tours de conception
séparés, des agents documentaires en lecture seule, des contrôles avant modification, des preuves de
vérification réelles et des revues de petite taille.

<p align="center"><img src="../resources/image/oma_logo_02.png" alt="OmA" width="360"></p>

## Installation

Nécessite une version récente d’Antigravity CLI et Node.js 20 ou ultérieur.

```bash
agy plugin install https://github.com/Joonghyun-Lee-Frieren/oh-my-antigravity
agy plugin list
```

Dans la CLI, consultez `/plugin list` et `/hooks`, puis commencez par :

```text
/oma-team-plan Décrivez la modification et ses critères d’acceptation
```

L’agent documentaire fournit un résumé concis. Rédigez un Scope Brief, figez le périmètre des fichiers
et les vérifications, puis demandez un Design Check indépendant. Une fois celui-ci validé,
**terminez le tour de conception**. Au tour suivant :

```text
/oma-team-exec Implémentez le plan figé
```

Exécutez `/oma-team-verify` pour recueillir les revues de sections restantes. Le hook Stop planifie
des lots de corrections lorsque des vérifications ou des revues échouent. L’absence de services,
d’autorisations ou de preuves peut aboutir à `blocked` ou `unknown` ; une réponse positive n’est jamais imposée.

Consultez le [guide du workflow protégé](guide/guarded-workflow.md) pour les commandes exactes du
contrôleur, les exemples JSON, la récupération et les limites des protections.

## Nouveautés de la v1.1.0

| Fonctionnalité | Comportement |
| --- | --- |
| **Scope Brief** | Consigne l’objectif, les contraintes, les exclusions, les responsables des décisions et les contradictions entre sources ; les points non résolus empêchent de figer le plan |
| **Design Check** | Un auditeur en lecture seule examine le plan exact avant la fin du tour de conception ; toute modification du plan invalide la revue précédente |
| **Evidence Window** | Lit des extraits de journaux dont l’intégrité est vérifiée, avec un curseur borné en octets UTF-8 ; la sortie complète reste sur disque |
| **Session Trail** | Des points de contrôle JSON/Markdown immuables conservent l’intention actuelle et la prochaine action ; la reprise détecte les changements des sources ou du plan |
| **Reçus de revue natifs** | Le réviseur soumet lui-même son résultat depuis une autre conversation ; la conversation parente ne peut ni rédiger un PASS ni orienter la revue |
| **Profils Care** | Les périmètres routine/elevated/critical utilisent des sections de 120/90/60 lignes et des lots de 3/2/1 unités, tout en conservant toutes les vérifications et tous les verrous |

Les chemins sensibles ne peuvent qu’augmenter le niveau de vigilance. Des résumés compacts de l’état
et du contexte évitent d’inclure les journaux complets et les tickets de reçu dans le contexte courant
du modèle. Les vérifications restent exécutées et toute preuve manquante laisse le résultat à unknown.
Consultez les [schémas et exemples](guide/session-continuity.md).

## Modèles

Les recommandations proviennent de [config/models.json](../config/models.json), confronté à la
[disponibilité officielle des modèles](https://antigravity.google/docs/models) le 2026-10-16.

| Rôle | Profil Balanced | Profil Flash |
| --- | --- | --- |
| Conception et planification | `gemini-4-argon-high` | `gemini-3.8-flash-high` |
| Implémentation | `gemini-3.8-flash-medium` | `gemini-3.8-flash-medium` |
| Tâches rapides | `gemini-3.8-flash-low` | `gemini-3.8-flash-low` |
| Revue et vérification | `gemini-4-argon-high` | `gemini-3.8-flash-high` |

Consultez `agy models` pour votre compte et choisissez avec `agy --model <id>` ou le sélecteur du
runtime. Les sous-agents utilisent `model: inherit`. `/oma-model` explique les profils ; `auto`
conserve le modèle sélectionné dans le runtime et `custom` exige de définir les quatre rôles.
Les profils sont des recommandations, sans changement automatique de modèle : le contrat des hooks
natifs ne prévoit aucune sortie permettant de remplacer le modèle. Si Argon est indisponible,
choisissez explicitement le profil Flash. D’anciens modèles d’entreprise peuvent rester disponibles,
mais ils ne figurent pas dans les valeurs par défaut distribuées.

## Workflows et rôles

Le plugin propose 60 skills courts, dont 49 points d’entrée de commande `/oma-<name>`, et 16 agents
aux capacités limitées. N’utilisez que les procédures utiles à la tâche en cours.

| Commande | Objectif |
| --- | --- |
| `/oma-team-plan`, `/oma-team-prd` | Transmission documentaire, périmètre, critères d’acceptation et conception |
| `/oma-brief` | Objectif, contraintes, responsabilité des décisions et contradictions entre sources |
| `/oma-design-check` | Examen indépendant du plan figé exact |
| `/oma-evidence` | Extraits bornés des journaux des validateurs, avec vérification d’intégrité |
| `/oma-checkpoint`, `/oma-resume` | Transmission immuable et inspection de la continuité en lecture seule |
| `/oma-team-exec` | Implémentation du périmètre figé au prochain tour utilisateur |
| `/oma-team-verify` | Vérifications réelles et transmission des revues section par section |
| `/oma-team-fix` | Lot sélectionné par Stop, limité à trois unités de correction |
| `/oma-goal`, `/oma-ultragoal` | Suivi de la livraison avec les mêmes contrôles de tours et de preuves |
| `/oma-status`, `/oma-doctor` | Phase, propriété, preuves manquantes, verrous et blocages |
| `/oma-model` | Recommandations actuelles de modèles et sélection dans le runtime |
| `/oma-hooks`, `/oma-hooks-validate` | Inspection des hooks natifs et diagnostics de sécurité |
| `/oma-stop`, `/oma-cancel` | Arrêt en conservant les preuves et les verrous |

`oma-doc-reader` lit les spécifications. `oma-planner` et `oma-architect` aident à concevoir.
`oma-executor` propose des correctifs ; seule la conversation principale propriétaire les applique.
`oma-design-auditor` examine le plan figé. `oma-reviewer` inspecte une seule section de taille limitée ;
`oma-verifier` examine les preuves d’acceptation. Tous les agents de travail distribués excluent les
outils d’écriture, de shell, de MCP et de délégation.

L’état de référence du workflow est `.omg/state/guard.json` ; les journaux d’exécution sont dans
`.omg/evidence/`. Les agents utilisent `.omg/drafts/` pour les demandes et les notes auxiliaires.
Seul le contrôleur possède l’état de protection, les preuves et les points de contrôle. Le hook
capture les messages des réviseurs indépendants avec l’identité réelle de l’expéditeur. Un seul
espace de travail et un seul rédacteur sont autorisés par workflow ; utilisez des workflows séparés
pour des worktrees isolés.

## Migration depuis la v1.0 ou Gemini CLI

Réinstallez le plugin natif avec `agy plugin install`. Les nouveaux plans nécessitent un Scope Brief
résolu et un Design Check natif. Les rôles indépendants nécessitent des hooks send_message natifs
avec l’identifiant réel de la conversation enfant ; sans prise en charge du runtime, le résultat
reste unknown. Un état v1.0 déjà figé peut être terminé via son ancien mécanisme de reçus, mais les
nouveaux plans suivent toujours le mécanisme natif. Session Trail inspecte l’état actuel sans
restaurer d’anciens droits de propriété, approbations ou verrous.

Les commandes natives utilisent `/oma-team-exec` à la place de `/oma:team-exec`. Les anciennes
sources de protocoles TOML se trouvent dans `protocols/oma/` et génèrent les enveloppes des skills
natifs ; elles restent en dehors de l’ancien répertoire de découverte `commands/` du runtime pour
éviter les enregistrements en double.

`gemini-extension.json` reste un marqueur de migration. Supprimez les anciens hooks copiés
manuellement. Le routeur Gemini `BeforeModel`, ses options de traçage et le rappel d’apprentissage
`AfterAgent` ont été supprimés. Utilisez explicitement `/oma-learn` et sélectionnez les modèles via la CLI.

Les fichiers validés restent verrouillés, y compris dans les workflows suivants. Rouvrir un verrou,
modifier le périmètre figé ou récupérer un état bloqué ou détenu par une autre conversation exige une
action explicite de l’opérateur en dehors de l’agent protégé. Conservez les preuves précédentes lors
de la récupération.

Le harnais limite les outils des agents ; ce n’est pas un bac à sable du système d’exploitation.
Les validateurs sont du code de confiance du projet. Les vérifications comportementales et les
réviseurs doivent encore détecter les fabrications sémantiques. Une unité de correction correspond
à un validateur en échec ou à une section non validée, pouvant contenir plusieurs diagnostics.
Consultez le [contrat complet](guide/guarded-workflow.md).

## Développement

```bash
npm test
npm run test:skills
npm run test:generated
npm run test:version
agy plugin validate .
```

Modifiez les procédures de commande dans `protocols/oma/`, puis exécutez `npm run build:skills`.
Les procédures des skills principaux se trouvent dans `references/`, à côté de leurs points d’entrée.
Les tests couvrent les limites entre tours, les contournements par shell ou chemins, la propriété,
les vérifications en échec ou manquantes, la couverture des revues, les preuves périmées, les verrous,
les limites de correction, l’annulation et les limites de nouvelle tentative. La v1.1 couvre aussi
les contradictions entre sources, l’invalidation des reçus de conception, l’usurpation d’identité,
le rejeu, l’augmentation de la vigilance, la pagination des journaux UTF-8, la corruption des points
de contrôle et les changements de sources lors de la reprise.

## Remerciements particuliers

**Un grand merci à [@hyunuk.lim](https://www.threads.com/@hyunuk.lim) (threads).** Ses fils de discussion
et ses publications ont beaucoup aidé à orienter cette refonte : des skills plus courts, des contraintes
physiques sur les outils, des échecs honnêtes, des corrections limitées et des revues ciblées.

Le projet s’est également développé à partir de l’observation de Jeongkyu Shin : le harnais
d’ingénierie qui entoure un modèle compte autant que le modèle lui-même.

[MIT License](../LICENSE) · [Sponsor](https://github.com/sponsors/Joonghyun-Lee-Frieren)
