# Livraison CaptureAtom causal — 2026-09-15

## Livraison corrective courante — fractions et TypeScript strict

Core embarqué : `4a35b377c8335a4d2c4936d148ddfee67ecb29b9`.
CI du core : [34969195642](https://github.com/dacasine/rulixcalc/actions/runs/34969195642), succès.
Reconstruction effectuée seulement après ce verdict, depuis le checkout propre
du SHA vert. SHA-256 de `dist/server.js` :
`ea44c939f86f95209bd228b686168741422567fc29a2a298d83ab0ca8602e66f`.

Le nettoyage 57db539 supprime les clés lexicales dupliquées sans changer les
tables effectives ; la re-lexicalisation NFKC précise la grammaire ch.
Le correctif 4a35b37 ferme les deux lectures de fractions dans capCoarse9 et
la réserve binaire : numRat lit n/d, jamais les slots décimaux absents.
Le moteur compile désormais sans diagnostic avec ses options strictes
conservées ; la baseline d'exceptions est vide et épinglée.

Build du bundle sans avertissement de clés dupliquées. Les 15 smokes JSON-RPC
décrits ci-dessous repassent contre le core frais : valeurs, affichages,
diagnostics et références identiques, taux réseau désactivés. Le diff généré
contient uniquement les deux lectures corrigées, la suppression des doublons
et l'argument de grammaire explicite. Aucun nouveau FULL, catalogue ou deep
local n'est lancé pour cette livraison corrective. AJ1, Π et compteur 0/3
restent inchangés.

## Historique — cutover initial

Core initial embarqué : `77718cd751553c1ea7a714eaeb6c5825d906cc05`.
CI du core : [34956274628](https://github.com/dacasine/rulixcalc/actions/runs/34956274628), succès.
Le bundle a été reconstruit seulement après ce verdict.

SHA-256 de `dist/server.js` :
`c3a62f45de4ae271c5ae14f78fdf83a4cfd7ff3f9c99b233ace3c5b599722cef`.

### Portes du core au cutover initial

- Candidat causal en production, décision et matérialisation uniques ; aucun
  fallback candidat vers legacy. Le legacy causal reste sous observateur.
- Catalogue post-cutover séquentiel vert : 2821 feuilles, 16650 occurrences,
  4903 écarts locaux classés ; aucune divergence publique non arbitrée ni
  perte causale silencieuse. Les reçus parents restent intacts.
- Un deep post-cutover, sans répétition : 3805 tests verts, zéro échec,
  2 skipped et 1 todo ; 1384.28 secondes. Sessions et observation couvertes.
- Normale, conformité, trois typechecks, sweep, builds et smoke CLI verts.
- AJ1, Π et compteur 0/3 inchangés. Ce jalon clôt le cutover CaptureAtom,
  pas l'ensemble du chantier d'opacité.

## Smokes du bundle

15 appels JSON-RPC réels, taux réseau désactivés, réponses structurées
comparées au core frais (valeur, affichage, diagnostics, références) : AZ1,
AJ2, chaîne de pourcentages inline et par variable, normalisation pourcentage,
mode financier, source causale répétée, annulation, composition multi-lignes,
unités exactes, fraction, valeur absolue, factorielle, division par zéro et
absence de provider. Tous verts, avec assertions explicites des régressions.

AZ1 accepté : 0.5% remplace 0.005%, refus final inexact inchangé.
AJ2 conserve le refus causal accepté, jamais une restauration en division-by-zero.

## Backlog non bloquant

Les avertissements de clés dupliquées signalés au cutover initial sont clos
par le nettoyage 57db539, embarqué dans la livraison corrective ci-dessus.
Le coût restant des harnais FULL reste également hors de cette livraison.
