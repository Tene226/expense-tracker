# CLAUDE.md — Expense Tracker (VPS)

## Contexte du projet

Application web personnelle de suivi de dépenses, hébergée sur un VPS, accessible depuis iPhone via navigateur mobile. L'interface doit fonctionner comme une PWA (Progressive Web App) : ajout à l'écran d'accueil, interface plein écran, responsive mobile-first.

**Fonctionnalité clé** : intégration Mobile Money semi-automatique. iOS ne permet pas à une app web de lire les SMS nativement — la solution repose sur deux canaux complémentaires :
1. **iOS Raccourcis (Shortcuts)** → webhook POST vers le backend quand l'utilisateur copie un SMS Mobile Money
2. **Paste SMS** → l'utilisateur colle le texte du SMS directement dans l'app

Dans les deux cas, une **dépense en attente** est créée. L'utilisateur ouvre l'app, voit le badge, ajoute une description, choisit la catégorie, et confirme.

---

## Stack technique

| Couche | Technologie | Raison |
|---|---|---|
| Frontend | React 18 + Vite | Build rapide, composants réutilisables |
| Styles | TailwindCSS v3 | Utility-first, mobile-first natif |
| Backend | Express.js (Node 20) | Léger, suffisant pour usage personnel |
| Base de données | node:sqlite (DatabaseSync) | Built-in Node 22+, zéro dépendance, synchrone |
| Reverse proxy | Nginx | Sert le frontend build + proxy vers l'API |
| Déploiement | Docker Compose | Isolation, reproductible |
| Auth | HTTP Basic Auth (Nginx) | Protection simple, pas besoin de sessions |

---

## Structure du projet

```
expense-tracker/
├── CLAUDE.md
├── docker-compose.yml
├── .env.example
├── .gitignore
├── nginx/
│   ├── nginx.conf
│   └── .htpasswd                    # généré avec htpasswd
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   ├── db.js                        # init SQLite (4 tables + migrations)
│   ├── lib/
│   │   └── smsParser.js             # parsing regex SMS Mobile Money
│   └── routes/
│       ├── expenses.js              # CRUD dépenses confirmées
│       ├── pending.js               # webhook + paste + confirm + reject
│       └── accounts.js              # CRUD comptes + virements
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── public/
│   │   ├── manifest.json
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── lib/
│       │   └── api.js
│       ├── hooks/
│       │   ├── useExpenses.js
│       │   ├── usePending.js
│       │   └── useAccounts.js
│       └── components/
│           ├── TabBar.jsx           # 4 onglets : Ajouter | Comptes | Historique | Résumé
│           ├── AddExpense.jsx       # prop accounts[] → sélecteur compte optionnel
│           ├── Accounts.jsx         # gestion comptes + virements
│           ├── PasteSMS.jsx         # textarea coller SMS + aperçu parsé
│           ├── PendingList.jsx      # section "en attente" dans Historique
│           ├── PendingCard.jsx      # card individuelle confirm/reject
│           ├── History.jsx
│           └── Summary.jsx
```

---

## API Backend — Endpoints complets

Base URL : `/api`

### Dépenses confirmées
```
GET    /api/expenses             # liste, param: ?month=YYYY-MM
POST   /api/expenses             # créer { amount, category, note, date, account_id? }
DELETE /api/expenses/:id         # supprimer
GET    /api/expenses/summary     # totaux par catégorie, param: ?month=YYYY-MM
GET    /api/health               # { ok: true }
```

### Dépenses en attente (Mobile Money)
```
GET    /api/pending              # liste toutes les pending non confirmées
POST   /api/pending/webhook      # reçoit SMS brut depuis iOS Shortcuts (sans auth Basic)
POST   /api/pending/paste        # reçoit SMS brut collé depuis l'app (avec auth Basic)
POST   /api/pending/:id/confirm  # confirme avec { category, note, account_id? } → move vers expenses
DELETE /api/pending/:id          # rejette/supprime une pending
```

**Important** : `/api/pending/webhook` est exclu de l'auth Basic Nginx car iOS Shortcuts
ne gère pas facilement les headers d'auth. Sécurisé par `?secret=WEBHOOK_SECRET` en query param.

### Comptes & Virements
```
GET    /api/accounts             # liste comptes avec solde calculé dynamiquement
POST   /api/accounts             # créer { name, type, balance_initial, color }
PUT    /api/accounts/:id         # modifier un compte
DELETE /api/accounts/:id         # supprimer (refus si dépenses/virements liés)

GET    /api/accounts/transfers   # liste virements (avec noms des comptes)
POST   /api/accounts/transfers   # créer { from_account_id, to_account_id, amount, note, date }
DELETE /api/accounts/transfers/:id  # supprimer un virement
```

Types de compte valides : `bank` | `mobile_money` | `cash` | `other`

**Solde calculé** : `balance_initial - SUM(expenses) - SUM(transfers_out) + SUM(transfers_in)`

---

## Schémas SQLite — `backend/db.js`

**Driver** : `node:sqlite` (DatabaseSync — built-in Node 22+, API synchrone, zéro dépendance externe).
WAL mode activé. Migrations via `ALTER TABLE … ADD COLUMN` dans un `try/catch` silencieux.

```sql
CREATE TABLE IF NOT EXISTS accounts (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT    NOT NULL,
  type            TEXT    NOT NULL DEFAULT 'other',  -- bank|mobile_money|cash|other
  balance_initial REAL    NOT NULL DEFAULT 0,
  color           TEXT    NOT NULL DEFAULT '#5F5E5A',
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS expenses (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  amount     REAL    NOT NULL,
  category   TEXT    NOT NULL,
  note       TEXT    DEFAULT '',
  date       TEXT    NOT NULL,
  account_id INTEGER REFERENCES accounts(id),
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pending_expenses (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  amount        REAL    NOT NULL,
  raw_sms       TEXT    NOT NULL,
  parsed_note   TEXT    DEFAULT '',
  provider      TEXT    DEFAULT 'unknown',
  source        TEXT    DEFAULT 'webhook',
  account_id    INTEGER REFERENCES accounts(id),
  date          TEXT    NOT NULL,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS transfers (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  from_account_id INTEGER NOT NULL REFERENCES accounts(id),
  to_account_id   INTEGER NOT NULL REFERENCES accounts(id),
  amount          REAL    NOT NULL,
  note            TEXT    DEFAULT '',
  date            TEXT    NOT NULL,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

---

## Module SMS Parser — `backend/lib/smsParser.js`

Aucune dépendance externe. Regex pures uniquement.

### Principe de base

Seuls les SMS représentant de l'**argent qui sort** sont créés en dépense.
Les SMS d'entrée d'argent, OTP, solde seul, pub → ignorés silencieusement.

```js
// Argent sortant → dépense
const EXPENSE_KEYWORDS = [
  'envoyé', 'envoye', 'paiement', 'payé', 'paye',
  'retrait', 'débité', 'debite', 'achat', 'transfert'
];

// Argent entrant → ignorer
const INCOME_KEYWORDS = [
  'reçu', 'recu', 'vous avez recu', 'vous avez reçu',
  'crédit', 'credit', 'rechargement', 'dépôt', 'depot', 'recharge'
];

// Autres → ignorer
const IGNORE_KEYWORDS = [
  'code', 'otp', 'mot de passe', 'pin', 'expire', 'bienvenue'
];
```

### Extraction du montant

```js
function extractAmount(text) {
  const patterns = [
    /[Pp]aiement\s+de\s+([\d][\d\s]*)\s*(?:F\b|FCFA|XOF)/,
    /[Ee]nvoy[eé]\s+([\d][\d\s]*)\s*(?:F\b|FCFA|XOF)/,
    /[Rr]etrait\s+de\s+([\d][\d\s]*)\s*(?:F\b|FCFA|XOF)/,
    /([\d][\d\s]*)\s*(?:F\b|FCFA|XOF)\s+[Dd][eé]bit/,
    /[Mm]ontant\s*(?:de|:)?\s*([\d][\d\s]*)\s*(?:F\b|FCFA|XOF)/,
    /([\d][\d\s]{1,9})\s*(?:F\b|FCFA|XOF)/,   // fallback générique
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseFloat(match[1].replace(/\s/g, ''));
      if (!isNaN(amount) && amount > 0 && amount < 10_000_000) return amount;
    }
  }
  return null;
}
```

### Extraction du marchand / destinataire

```js
function extractNote(text) {
  const patterns = [
    /chez\s+([A-Za-zÀ-ÿ][^\.]{2,40})/i,
    /(?:envoy[eé]\s+[\d\s]+\s*(?:F\b|FCFA|XOF)\s+[àa]\s+)([^\.]{3,40})/i,
    /pour\s+([A-Za-zÀ-ÿ][^\.]{2,40})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim().substring(0, 60);
  }
  return '';
}
```

### Détection du provider

```js
function detectProvider(text) {
  const t = text.toLowerCase();
  if (t.includes('orange money') || t.includes('orangemoney')) return 'orange_money';
  if (t.includes('wave')) return 'wave';
  if (t.includes('moov') || t.includes('mobicash')) return 'moov';
  if (t.includes('coris')) return 'coris';
  return 'unknown';
}
```

### Fonction principale

```js
/**
 * @param {string} rawText
 * @returns {{ amount: number, parsedNote: string, provider: string } | null}
 */
function parseSMS(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;
  const text = rawText.trim();
  const low = text.toLowerCase();

  if (IGNORE_KEYWORDS.some(kw => low.includes(kw))) return null;
  if (INCOME_KEYWORDS.some(kw => low.includes(kw))) return null;
  if (!EXPENSE_KEYWORDS.some(kw => low.includes(kw))) return null;

  const amount = extractAmount(text);
  if (!amount) return null;

  return {
    amount,
    parsedNote: extractNote(text),
    provider: detectProvider(text),
  };
}

module.exports = { parseSMS };
```

---

## Route — `backend/routes/pending.js`

### POST /api/pending/webhook (sans auth Basic)

```js
router.post('/webhook', (req, res) => {
  const { secret, sms_text } = req.body;

  if (secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Secret invalide' });
  }
  if (!sms_text) return res.status(400).json({ error: 'sms_text requis' });

  const parsed = parseSMS(sms_text);
  if (!parsed) return res.json({ ignored: true, reason: 'Pas une dépense détectée' });

  db.prepare(`
    INSERT INTO pending_expenses (amount, raw_sms, parsed_note, provider, source, date)
    VALUES (?, ?, ?, ?, 'webhook', ?)
  `).run(parsed.amount, sms_text, parsed.parsedNote, parsed.provider, new Date().toISOString());

  return res.json({ success: true, amount: parsed.amount, note: parsed.parsedNote });
});
```

### POST /api/pending/paste (avec auth Basic via Nginx)

```js
router.post('/paste', (req, res) => {
  const { sms_text } = req.body;
  if (!sms_text) return res.status(400).json({ error: 'sms_text requis' });

  const parsed = parseSMS(sms_text);
  if (!parsed) {
    return res.status(422).json({ error: 'Aucune dépense détectable dans ce SMS', ignored: true });
  }

  db.prepare(`
    INSERT INTO pending_expenses (amount, raw_sms, parsed_note, provider, source, date)
    VALUES (?, ?, ?, ?, 'paste', ?)
  `).run(parsed.amount, sms_text, parsed.parsedNote, parsed.provider, new Date().toISOString());

  return res.json({ success: true, amount: parsed.amount, note: parsed.parsedNote, provider: parsed.provider });
});
```

### POST /api/pending/:id/confirm

```js
router.post('/:id/confirm', (req, res) => {
  const { category, note } = req.body;
  if (!category) return res.status(400).json({ error: 'category requise' });

  const pending = db.prepare('SELECT * FROM pending_expenses WHERE id = ?').get(req.params.id);
  if (!pending) return res.status(404).json({ error: 'Pending non trouvé' });

  db.prepare(
    'INSERT INTO expenses (amount, category, note, date) VALUES (?, ?, ?, ?)'
  ).run(pending.amount, category, note || pending.parsedNote, pending.date);

  db.prepare('DELETE FROM pending_expenses WHERE id = ?').run(req.params.id);

  return res.json({ success: true });
});
```

---

## Frontend — Composant PasteSMS

Section dans l'onglet Ajouter, sous le formulaire manuel, masquée par défaut derrière un toggle.

**UX attendue :**
```
[▼ Importer depuis un SMS Mobile Money]

  ┌──────────────────────────────────────┐
  │ Collez ici le SMS reçu...            │
  │                                      │
  │ ex: "Paiement de 2 500 F chez        │
  │ Total. Nouveau solde: 45 000 F."     │
  └──────────────────────────────────────┘

  [Analyser le SMS]

  ─── Si détecté ───
  Montant :  2 500 FCFA
  Marchand : Total
  Provider : Orange Money

  [Créer dépense en attente →]

  ─── Si non détecté ───
  ⚠ Ce SMS ne semble pas être une dépense Mobile Money.
```

- Appel : POST /api/pending/paste
- En cas de succès : afficher confirmation + naviguer vers onglet Historique

---

## Frontend — PendingCard

Badge rouge avec compteur sur l'onglet Historique si `pending.length > 0`.
Section "En attente" affichée en haut de l'onglet Historique avant les dépenses confirmées.

```
┌─────────────────────────────────────────┐  ← fond #FFFBEB (jaune très pâle)
│ En attente · Orange Money · il y a 5min │
│                                         │
│  2 500 FCFA                             │
│  "Total"                                │
│                                         │
│  Catégorie : [Alimentation       ▼]     │
│  Description: [Total - carburant  ]     │
│                                         │
│  [✓ Confirmer]        [✕ Rejeter]       │
└─────────────────────────────────────────┘
```

- Select catégorie pré-sélectionné sur "autres" par défaut
- Input description pré-rempli avec `parsedNote`
- Confirmer → POST /api/pending/:id/confirm → refresh pending + expenses
- Rejeter → DELETE /api/pending/:id avec window.confirm() → refresh pending

---

## Nginx — Exclusion webhook de l'auth Basic

```nginx
server {
    listen 80;

    # Webhook Mobile Money : pas d'auth Basic (sécurisé par WEBHOOK_SECRET)
    location = /api/pending/webhook {
        auth_basic off;
        proxy_pass http://backend:3001/api/pending/webhook;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Tout le reste avec auth Basic
    auth_basic "Accès restreint";
    auth_basic_user_file /etc/nginx/.htpasswd;

    location /api/ {
        proxy_pass http://backend:3001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        proxy_pass http://frontend:4173;
        proxy_set_header Host $host;
    }
}
```

---

## Variables d'environnement — `.env.example`

```env
PORT=3001
DB_PATH=/app/data/expenses.db
WEBHOOK_SECRET=remplacer_par_une_chaine_aleatoire_longue
NODE_ENV=production
```

Générer un secret sur le VPS :
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Guide iOS Raccourcis — à inclure dans README.md

### Principe
iOS ne permet pas de lire les SMS automatiquement depuis une app web ou tierce.
La solution : un Raccourci manuel que tu lances après avoir copié un SMS.

### Étapes de configuration

1. Ouvrir **Raccourcis** → **+** → nommer "Envoyer SMS Dépense"
2. Ajouter l'action : **Contenu du presse-papiers** → variable `smsTxt`
3. Ajouter l'action : **URL** → `https://[IP-VPS]/api/pending/webhook`
4. Ajouter l'action : **Obtenir le contenu de l'URL**
   - Méthode : **POST**
   - Corps de la requête : **JSON**
   - Champs : `secret` = `[WEBHOOK_SECRET]` · `sms_text` = variable `smsTxt`
5. Ajouter l'action : **Si** (résultat contient "ignored")
   - Alors : **Notification** "SMS ignoré"
   - Sinon : **Notification** "Dépense en attente créée ✓"
6. Ajouter le raccourci en **widget** sur l'écran d'accueil

### Utilisation quotidienne

1. Reçois le SMS Mobile Money
2. Appuie longuement sur le texte → **Tout sélectionner** → **Copier**
3. Lance le Raccourci (widget ou Siri : "Envoie SMS dépense")
4. Notification de confirmation en quelques secondes
5. Ouvre l'app → Historique → badge rouge → confirme avec catégorie + description

---

## Catégories

```js
export const CATEGORIES = [
  { id: "alimentation", label: "Alimentation", color: "#1D9E75" },
  { id: "transport",    label: "Transport",    color: "#378ADD" },
  { id: "sortie",       label: "Sortie",       color: "#D4537E" },
  { id: "shopping",     label: "Shopping",     color: "#D85A30" },
  { id: "sante",        label: "Santé",        color: "#3B6D11" },
  { id: "factures",     label: "Factures",     color: "#534AB7" },
  { id: "autres",       label: "Autres",       color: "#5F5E5A" },
];
```

---

## Design — Règles UI

- **Mobile-first** : breakpoint unique à 430px (iPhone 15 Pro Max)
- **Monnaie** : toujours en FCFA, format `toLocaleString("fr-FR")`
- **Police** : Inter (Google Fonts) pour les chiffres ; system-ui pour le reste
- **Palette** : fond blanc ou gris très clair (#F8F8F7), texte #1A1A1A
- **Tap targets** : hauteur minimale 44px (Apple HIG)
- **Bottom nav** : barre fixée en bas (Ajouter | Comptes | Historique | Résumé)
- **Safe area** : `env(safe-area-inset-bottom)` pour le padding bas
- **Badge pending** : pastille rouge avec compteur sur l'onglet Historique
- **PendingCard** : fond #FFFBEB pour distinguer visuellement les pending
- **Animations** : 150ms ease sur les onglets et boutons uniquement

---

## PWA

```json
{
  "name": "Mes Dépenses",
  "short_name": "Dépenses",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1A1A1A",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

```html
<link rel="manifest" href="/manifest.json">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Dépenses">
<meta name="theme-color" content="#1A1A1A">
```

---

## Docker Compose

```yaml
services:
  backend:
    build: ./backend
    restart: unless-stopped
    volumes:
      - ./data:/app/data
    environment:
      - PORT=3001
      - DB_PATH=/app/data/expenses.db
      - WEBHOOK_SECRET=${WEBHOOK_SECRET}
      - NODE_ENV=production

  frontend:
    build: ./frontend
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf
      - ./nginx/.htpasswd:/etc/nginx/.htpasswd
    depends_on:
      - backend
      - frontend
```

## Dockerfiles

### backend/Dockerfile
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN mkdir -p /app/data
EXPOSE 3001
CMD ["node", "server.js"]
```

### frontend/Dockerfile
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
EXPOSE 4173
CMD ["serve", "-s", "dist", "-l", "4173"]
```

---

## Contraintes de développement

- Pas de TypeScript — JS uniquement
- Pas d'ORM — SQL direct avec `node:sqlite` DatabaseSync (synchrone, built-in)
- Pas de state manager — useState/useEffect suffisent
- `smsParser.js` : zéro dépendance externe, regex pures
- `WEBHOOK_SECRET` : toujours depuis `process.env`, jamais hardcodé
- CORS : uniquement en `NODE_ENV=development`
- Erreurs : `{ error: "message lisible" }` + bon status HTTP
- Dates : ISO 8601 UTC en base, formatées fr-FR côté frontend

---

## Ordre de build pour Claude Code

1. Scaffold complet des fichiers et dossiers
2. `backend/db.js` — 4 tables SQLite + migrations
3. `backend/lib/smsParser.js` — avec tests inline commentés pour les cas Orange Money / Wave / Moov
4. `backend/routes/expenses.js` — CRUD confirmé
5. `backend/routes/pending.js` — webhook + paste + confirm + delete
6. `backend/routes/accounts.js` — CRUD comptes + virements
7. `backend/server.js` — monter les routes
8. `frontend/src/lib/api.js` — tous les appels fetch
9. `frontend/src/hooks/useExpenses.js` + `usePending.js` + `useAccounts.js`
10. Composants : AddExpense → Accounts → PasteSMS → PendingCard → PendingList → History → Summary → TabBar → App
11. `nginx/nginx.conf` — avec location exact pour webhook
12. `docker-compose.yml` + `.env.example` + `.gitignore`
13. `README.md` — guide Raccourcis iOS intégré
14. Test `docker compose up --build`

---

## Commandes de déploiement

```bash
git clone <repo_url> expense-tracker && cd expense-tracker
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # → WEBHOOK_SECRET
cp .env.example .env   # puis éditer avec le secret généré
htpasswd -c nginx/.htpasswd arnold
mkdir -p data
docker compose up -d --build
docker compose logs -f
```

## Tests manuels après déploiement

```bash
# Health
curl http://IP-VPS/api/health

# Webhook — dépense détectée
curl -X POST http://IP-VPS/api/pending/webhook \
  -H "Content-Type: application/json" \
  -d '{"secret":"TON_SECRET","sms_text":"Paiement de 2 500 F effectué chez Total. Nouveau solde: 45 000 F. Ref:OM123456."}'
# → { success: true, amount: 2500, note: "Total" }

# Webhook — SMS ignoré (entrée d'argent)
curl -X POST http://IP-VPS/api/pending/webhook \
  -H "Content-Type: application/json" \
  -d '{"secret":"TON_SECRET","sms_text":"Vous avez reçu 10 000 F de Jean. Nouveau solde: 55 000 F."}'
# → { ignored: true }

# Lister les pending (avec auth Basic)
curl -u arnold:motdepasse http://IP-VPS/api/pending
```
