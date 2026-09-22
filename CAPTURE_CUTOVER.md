# Livraisons du moteur — CaptureAtom, stockage opaque et Π

## Livraison courante — Π exact (2026-09-22)

Core embarqué : `5db636606a63b9f36f4b343e8f55c2a541b3baa0`.
CI du core : [35764857667](https://github.com/dacasine/rulixcalc/actions/runs/35764857667), succès.
Le bundle a été reconstruit après ce verdict, depuis le checkout propre de
ce SHA exact, sans modification du moteur pendant les gates.

SHA-256 de `dist/server.js` :
`4f07070394844d62f3823bdd9dd8f8623a831b3db0242cabc63cf63c08645c4c`.

Π est désormais embarqué. La racine historique
`(90° in rad) - (pi/2)*1 rad` donne zéro exact, y compris après multiplication
par `1e40`, via variable et via `line(1)`. Son inverse refuse avec
`division-by-zero`. Les identités trigonométriques et les annulations avec
`tau` et le rapport radian/degré sont vérifiées sans confondre des dimensions
physiques incompatibles. Le cutover causal et le stockage opaque sont
conservés ; AJ1 reste en place et le compteur reste à 0/3.

Portes locales : 134 tests ciblés, 34 ratchets, trois typechecks sans
diagnostic (baseline globale 0/0), normale 4036 verts et deep final 4035 verts,
zéro échec (12 min 32 s). Tous les catalogues sont verts ; E0 couvre
2821 feuilles, 16827 occurrences et 5065 écarts locaux classés, sans nouvelle
divergence publique non arbitrée. Les baselines sémantiques sont inchangées.
Deux dépassements d'horloge pendant les catalogues, causés par des mises en
veille manuelles constatées, ont nécessité uniquement la reprise du test
concerné ; aucun deep ×3 ni réduction de corpus. Le deep final a passé d'un
seul tenant. La CI distante confirme tests, conformité, sweep et builds.

`npm run smoke:pi` : 17/17 appels JSON-RPC réels verts contre le bundle,
taux réseau désactivés. Les attentes numériques non triviales utilisent un
oracle Decimal indépendant à 360 chiffres. Le script accepte aussi le
chemin d'un serveur installé pour vérifier exactement le fichier livré.
Le plugin déjà chargé conserve son ancien processus jusqu'au prochain
rechargement ou à la prochaine session.

## Livraison précédente — stockage opaque obligatoire (2026-09-22)

Core runtime validé : `d23842718d56bfab86bcba1a0c9772fa665762a0`.
CI du core : [35663971841](https://github.com/dacasine/rulixcalc/actions/runs/35663971841), succès.
Le checkout de construction est `33330f5891aa5296bbd5f50a7315269947371b15` :
seuls la documentation et le budget d'un test de conformité y diffèrent.
Les arbres Git de `packages/engine`, `packages/rates` et
`packages/holidays-ch` sont strictement identiques au core vert d238427.
La CI de ce suivi test-only est encore en cours lors de la livraison ;
elle n'est pas présentée comme déjà verte.

SHA-256 de `dist/server.js` :
`ff8cfb66ecbd0daacde16b7f0616ce03d3b24201bfbff483f4305c2b6efce1ba`.

Le stockage RT/Env/cache possède désormais sa capsule opaque obligatoire.
Le cutover causal accepté reste l'autorité de production ; AJ1 est conservé.
Π n'est pas embarqué et le compteur reste à 0/3.

Validation du jalon : un deep complet, tous les catalogues FULL verts
(E0 : 2821 feuilles, 16650 occurrences, 4903 écarts classés), 3903 tests
verts et trois dépassements de budget. Reprises ciblées seulement : fuzz
pathologique et API/observateur verts sans changement ; 20000 chaînes
financières vertes en 40,3 s avec le budget deep de 120 s du harnais, sans
réduire le volume ni les assertions. Trois typechecks à zéro, baseline vide.

Bundle reconstruit après la CI verte du runtime, puis 15 appels JSON-RPC
réels comparés au core frais : réponse publique complète (valeur, affichage,
diagnostics, références), avec assertions de valeurs et erreurs ciblées.
Taux réseau désactivés. Résultat : 15/15 verts. Les cas couvrent notamment
les fractions, la réserve financière, l'annulation corrélée, les alias et
références, abs(-bb), AJ2, les unités, pourcentages, fonctions et refus FX.

## Livraison corrective précédente — fractions et TypeScript strict

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
