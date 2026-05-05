# Déploiement — Ubuntu VPS (accès internet)

> Testé sur Ubuntu 22.04 LTS. Fonctionne aussi sur 20.04 et 24.04.
> **Mode actuel : HTTP sur IP directe** (sans domaine). SSL ajouteable plus tard via certbot.

---

## 0. Prérequis

- VPS Ubuntu avec accès SSH root (ou sudo)
- IP publique du VPS (récupérable dans le panel Hetzner / OVH / DigitalOcean)
- Port 80 ouvert dans le pare-feu du provider VPS (panel du provider)

---

## 1. Connexion au VPS

```bash
ssh root@IP_DU_VPS
```

---

## 2. Installer Docker + Docker Compose

```bash
# Mise à jour système
apt update && apt upgrade -y

# Dépendances
apt install -y ca-certificates curl gnupg

# Clé GPG Docker
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Repo Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

# Installation
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Vérification
docker --version
docker compose version
```

---

## 3. Cloner le projet

```bash
cd /opt
git clone https://github.com/Tene226/expense-tracker.git
cd expense-tracker
```

---

## 4. Configurer les variables d'environnement

```bash
# Générer un secret aléatoire
SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "Ton WEBHOOK_SECRET : $SECRET"

# Créer le .env
cp .env.example .env
nano .env
```

Contenu du `.env` :
```env
PORT=3001
DB_PATH=/app/data/expenses.db
WEBHOOK_SECRET=COLLER_LE_SECRET_GENERE_CI_DESSUS
NODE_ENV=production
```

---

## 5. Créer le mot de passe Basic Auth (protection de l'app)

```bash
apt install -y apache2-utils
htpasswd -c nginx/.htpasswd TON_PRENOM
# → entrer un mot de passe solide
```

---

## 6. Créer le dossier de données SQLite

```bash
mkdir -p data
```

---

## 7. Nginx — rien à configurer

`nginx.conf` déjà configuré pour HTTP sur IP (`server_name _;`).
Rien à changer.

---

## 8. Lancer l'application

```bash
docker compose up -d --build
```

Vérifier que tout tourne :
```bash
docker compose ps
docker compose logs -f
```

Tous les services doivent être en état `Up`.

---

## 9. Ouvrir les ports (pare-feu Ubuntu)

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw enable
ufw status
```

---

## 10. Test depuis internet

Récupérer l'IP publique du VPS :
```bash
curl ifconfig.me
```

Tester depuis n'importe quelle machine :
```bash
# Santé de l'API
curl http://IP_DU_VPS/api/health
# → { "ok": true }

# Test webhook (dépense Mobile Money)
curl -X POST http://IP_DU_VPS/api/pending/webhook \
  -H "Content-Type: application/json" \
  -d '{"secret":"TON_WEBHOOK_SECRET","sms_text":"Paiement de 2500 F chez Total. Nouveau solde: 45000 F. Ref:OM123456."}'
# → { "success": true, "amount": 2500, "note": "Total" }
```

Ouvrir dans Safari iPhone :
```
http://IP_DU_VPS
```

Entrer login/mot de passe htpasswd → accès à l'app.

---

## 11. Ajouter à l'écran d'accueil iPhone (PWA)

> ⚠️ Sur HTTP (sans HTTPS), l'installation PWA est limitée sur iOS — l'app s'ouvre dans Safari,
> pas en plein écran. Pour le mode standalone complet, il faudra HTTPS + domaine plus tard.

1. Ouvrir Safari → `http://IP_DU_VPS`
2. Bouton partage → **"Sur l'écran d'accueil"**
3. Nommer "Dépenses" → **Ajouter**

---

## Commandes utiles après déploiement

```bash
# Voir les logs en temps réel
docker compose logs -f

# Redémarrer après mise à jour du code
git pull
docker compose up -d --build

# Arrêter
docker compose down

# Sauvegarder la base de données
cp data/expenses.db data/expenses.db.backup-$(date +%Y%m%d)

# Voir les dépenses en base (debug)
sqlite3 data/expenses.db "SELECT * FROM expenses ORDER BY created_at DESC LIMIT 10;"
```

---

## Récapitulatif architecture finale

```
iPhone (Safari)
       │
       │ HTTP :80
       ▼
   Nginx (Docker)
   ├── Auth Basic (htpasswd) sur toutes les routes
   ├── /api/pending/webhook → auth_basic OFF (secret en query param)
   ├── /api/* → proxy → Backend Express :3001
   └── /* → proxy → Frontend Vite/serve :4173
            │
            └── Backend Express
                └── SQLite (data/expenses.db sur volume host)
```

---

## Dépannage rapide

| Problème | Cause probable | Fix |
|---|---|---|
| `502 Bad Gateway` | Backend pas encore démarré | `docker compose logs backend` |
| `401 Unauthorized` | Mauvais mot de passe htpasswd | Re-créer avec `htpasswd nginx/.htpasswd user` |
| `curl: connection refused` | Port 80 bloqué | `ufw allow 80/tcp` + vérifier panel VPS |
| Webhook retourne `401` | Mauvais `WEBHOOK_SECRET` dans .env | Vérifier `.env` + `docker compose restart backend` |
| App pas en plein écran iPhone | HTTP sans HTTPS — limitation iOS PWA | Ajouter domaine + SSL plus tard |
