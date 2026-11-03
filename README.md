# EKEA

**L’administratif, en toute clarté.**

Assistant d’administration personnelle pour les personnes vivant en Suisse.
EKEA transforme des documents administratifs en actions claires : comprendre une
lettre, repérer une échéance, savoir quoi faire ensuite.

Progressive Web App (PWA) en React + TypeScript + Tailwind CSS, **local-first** :
les documents restent dans le navigateur de l’appareil.

---

## Démarrage

```bash
npm install
npm run dev      # développement
npm run build    # production → dist/
npm run preview  # prévisualiser le build
```

Node 18 ou supérieur.

## Déploiement sur GitHub Pages

1. Poussez le projet sur un dépôt GitHub.
2. `npm run build`
3. Publiez le contenu de `dist/` sur la branche `gh-pages`, ou utilisez une
   GitHub Action (`actions/deploy-pages`) avec `dist` comme dossier d’artefact.

Le constructeur Vite utilise `base: './'` et l’application s’appuie sur un
`HashRouter` : le site fonctionne dans un sous-dossier (`https://user.github.io/repo/`)
sans aucune configuration de réécriture côté serveur.

### Installer sur iPhone

Ouvrez le site dans Safari → Partager → **Sur l’écran d’accueil**.
L’application s’ouvre alors en plein écran, sans barre de navigateur, et les
notifications locales deviennent possibles.

---

## Structure du projet

```
public/
  manifest.webmanifest      Identité PWA (nom, icônes, couleur, raccourcis)
  sw.js                     Service worker — coquille applicative hors ligne
  icons/favicon.svg         Symbole EKEA
src/
  App.tsx                   Routage et coquille (verrou, navigation)
  main.tsx                  Point d’entrée
  index.css                 Jetons de design, composants de base
  types.ts                  Modèle de données du domaine
  components/
    icons.tsx               Jeu d’icônes dessiné à la main + symbole EKEA
    ui.tsx                  Boutons, champs, feuilles, dialogues, états
    document.tsx            Aperçus de documents, bandeau de pages
    BottomNav.tsx           Navigation basse à cinq destinations
    ScreenHeader.tsx        En-têtes d’écran et barre de recherche
    feedback.tsx            Notifications internes, verrou à code
  screens/                  Un fichier par écran (voir ci-dessous)
  store/StoreContext.tsx    État global, persistance, règles métier
  lib/
    constants.ts            Cantons, catégories, rappels, textes de confidentialité
    format.ts               CHF, dates DD.MM.YYYY, délais relatifs
    storage.ts              localStorage + IndexedDB (fichiers)
    analysis.ts             Point d’intégration OCR/IA (aucune clé côté client)
    factory.ts              Constructeurs d’objets, détection de doublons
    importFlow.ts           Aide au classement à l’import
    export.ts               Export JSON et liste d’étapes copiable
    demo.ts                 Exemples clairement identifiés
```

## Les écrans

| Route | Écran |
| --- | --- |
| `/` | Tableau de bord d’accueil |
| `/documents` | Coffre-fort : recherche, filtres, tri, favoris |
| `/documents/:id` | Fiche d’un document |
| `/ajouter` | Import : photo, PDF, galerie, pages multiples |
| `/analyse/:id` | Analyse : étapes de traitement et extraction |
| `/revue/:id` | Vérification et confirmation des informations |
| `/actions` · `/actions/:id` | Centre d’actions et détail d’une démarche |
| `/echeances` · `/echeances/:id` | Échéances : liste, calendrier, chronologie |
| `/profil` | Profil, notifications, sécurité, confidentialité |

---

## Principes appliqués

**Extrait ≠ suggéré.** Chaque information porte son origine (`extracted`,
`user`, `manual`), sa provenance (page, extrait brut) et un indice de fiabilité.
Les propositions d’EKEA portent la mention « Suggestion EKEA — à confirmer ».

**Rien n’est inventé.** Une valeur non extraite reste vide et s’affiche
« Non trouvé — à compléter ». Aucune donnée de remplissage n’est générée.

**Aucune démarche automatique.** EKEA ne signe, ne paie, ne valide et n’envoie
rien. Les actions restent des listes d’étapes que vous cochez vous-même.

**Rien n’est créé avant confirmation.** Une échéance ou une action officielle
n’apparaît qu’après « Confirmer les informations ».

**Aucun rappel en double.** La création d’une échéance est refusée si une
échéance ouverte existe déjà pour le même document, la même date et le même
intitulé. Modifier les rappels remplace la liste existante.

**Dates suisses.** Affichage `JJ.MM.AAAA`, saisie souple (`15.11.2026`,
`15/11/2026`, `2026-11-15`), montants en `CHF`.

**Pas d’affirmation non vérifiable.** Aucune obligation légale n’est présentée
comme certaine. Lorsqu’un délai est proche ou dépassé, EKEA invite à vérifier
auprès de l’organisation concernée.

---

## Analyse documentaire (OCR + extraction)

L’analyse fonctionne **uniquement si un point d’intégration serveur est
configuré**. Sans configuration, EKEA l’annonce clairement et passe en saisie
manuelle : échéances, actions, coffre-fort et rappels restent entièrement
fonctionnels. Aucun résultat n’est simulé.

Copiez `.env.example` en `.env.local` :

```bash
VITE_ANALYSIS_ENDPOINT=https://votre-fonction.example/analyse
VITE_ANALYSIS_PROVIDER=Cloud Vision + extraction structurée
```

Ces deux variables sont **publiques** : une URL et un libellé, jamais un secret.
La fonction serveur détient les clés du fournisseur.

Contrat attendu (`POST`, JSON) :

```jsonc
// requête
{
  "pages": [{ "mimeType": "image/jpeg", "base64": "..." }],
  "locale": "fr-CH",
  "expect": "structured_fields"
}

// réponse — tous les champs sont facultatifs
{
  "documentType": "Prime d’assurance maladie",
  "organization": "Helsana Assurances",
  "recipient": "Marie Dupont",
  "issueDate": "02.11.2026",
  "dueDate": "15.11.2026",
  "amount": 312.4,
  "currency": "CHF",
  "reference": "POL-88213-04",
  "contractDuration": "12 mois",
  "requiredDocuments": ["Justificatif de domicile"],
  "conditions": ["Paiement sous 30 jours"],
  "contact": "0844 22 33 44",
  "confidence": { "amount": "high", "dueDate": "medium" },
  "sources": { "amount": { "page": 1, "evidence": "Total à payer CHF 312.40" } }
}
```

Codes d’erreur traduits en messages clairs : `401`/`403` (authentification),
`413` (document trop volumineux), tout autre code (échec du service).

### Points d’intégration à prévoir côté serveur

- Détention des clés OCR/IA — jamais exposées au navigateur.
- Transmission temporaire des pages, sans publication ni indexation.
- Plafond de taille et de nombre de pages.
- Aucune soumission, signature ou paiement déclenché depuis ce service.
- Renvoyer une erreur explicite plutôt qu’une valeur devinée.

---

## Données, confidentialité, sécurité

- **Stockage** : métadonnées dans `localStorage`, fichiers (PDF/images) dans
  `IndexedDB`. Aucune transformation en base64 dans l’état applicatif.
- **Pas d’URL publique** : les fichiers sont lus via des URL d’objet créées à la
  volée et révoquées au démontage des composants.
- **Consentement explicite** avant tout envoi vers un service d’analyse.
- **Export** : profil (sans empreinte de code), documents, échéances et actions
  dans un fichier JSON lisible.
- **Suppression** : par document, et globale depuis le profil. Les fichiers
  correspondants sont effacés d’IndexedDB.
- **Verrou local** : code à 4–6 chiffres, conservé sous forme d’empreinte
  SHA-256 pour le contrôle d’accès local. Il protège l’accès à l’appareil, il ne
  remplace pas le verrouillage du téléphone.
- **Hébergement** : cette version n’envoie rien vers un serveur EKEA. Il serait
  donc faux d’affirmer que les données sont hébergées en Suisse — l’application
  le dit explicitement dans « À propos ».

---

## Accessibilité et performance

- Cibles tactiles de 44 px minimum, contrastes tenus sur fond ivoire.
- `prefers-reduced-motion` respecté : toutes les transitions sont neutralisées.
- Zones sûres iPhone (`env(safe-area-inset-*)`) sur l’en-tête et la navigation.
- Aucune bibliothèque d’interface externe : le paquet reste léger pour les
  appareils anciens. Seules les polices sont chargées à distance.

---

## Limites connues

- Les notifications en arrière-plan dépendent de l’autorisation du navigateur et,
  sur iPhone, d’une installation sur l’écran d’accueil. Aucune notification push
  serveur n’est implémentée.
- La langue d’interface est le français. L’allemand, l’italien et l’anglais sont
  présents dans les réglages mais désactivés.
- Il n’y a ni compte utilisateur, ni synchronisation entre appareils : la
  persistance est locale au navigateur utilisé.
- L’aperçu PDF intégré dépend du navigateur ; un lien de secours est fourni.
- Le service worker ne met en cache que la coquille applicative : un chargement à
  froid hors ligne après la première visite reste à vérifier sur appareil réel.

---

## Licence

MIT — voir le fichier `LICENSE`.

---

© EKEA — L’administratif, en toute clarté.
