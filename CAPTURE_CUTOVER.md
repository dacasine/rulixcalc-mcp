# Livraison CaptureAtom causal — 2026-09-15

Core embarqué : `77718cd751553c1ea7a714eaeb6c5825d906cc05`.
CI du core : [34956274628](https://github.com/dacasine/rulixcalc/actions/runs/34956274628), succès.
Le bundle a été reconstruit seulement après ce verdict.

SHA-256 de `dist/server.js` :
`c3a62f45de4ae271c5ae14f78fdf83a4cfd7ff3f9c99b233ace3c5b599722cef`.

## Portes du core

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

Le build réussit avec des avertissements de clés dupliquées dans les tables
de lexer/lexsafe du core. Leur nettoyage éventuel est hors de ce jalon ;
aucune nouvelle tranche de durcissement ni modification sémantique ici.
Le coût restant des harnais FULL reste également hors de cette livraison.
