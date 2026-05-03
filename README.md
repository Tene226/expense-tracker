# Expense Tracker

PWA personnelle de suivi de dépenses en FCFA, avec intégration Mobile Money via SMS.

---

## Déploiement sur Oracle Cloud (gratuit, avec HTTPS)

### 1. Créer l'instance Oracle Cloud

1. Aller sur [oracle.com/cloud/free](https://oracle.com/cloud/free) → créer un compte
2. **Compute** → **Instances** → **Create Instance**
   - Shape : `VM.Standard.E2.1.Micro` (Always Free)
   - OS : **Ubuntu 22.04**
   - Télécharger la clé SSH
3. **Networking** → **Security List** : ouvrir les ports **80** et **443** (TCP ingress)
4. Se connecter via SSH : `ssh -i ta_cle.pem ubuntu@IP_DU_VPS`

### 2. Préparer le domaine

Pointer un domaine ou sous-domaine vers l'IP du VPS (record DNS type A).
Attendre propagation DNS (5-30 min) avant de lancer deploy.sh.

Options gratuites pour un domaine : [Freenom](https://freenom.com), sous-domaine via [DuckDNS](https://duckdns.org).

### 3. Installer Docker sur le VPS

```bash
# Sur le VPS Ubuntu
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu
sudo apt install -y apache2-utils git
# Se reconnecter pour appliquer le groupe docker
exit
ssh -i ta_cle.pem ubuntu@IP_DU_VPS
```

### 4. Déployer l'application

```bash
# Cloner le dépôt
git clone <repo_url> expense-tracker && cd expense-tracker

# Lancer le script de déploiement interactif
bash deploy.sh
```

Le script demande :
- **Domaine** : `depenses.tondomaine.com`
- **Email** : pour Let's Encrypt (notifications expiration)
- **Nom d'utilisateur** : pour le mot de passe d'accès à l'app

Il gère automatiquement : génération du secret, certificat SSL, build Docker, démarrage.

### 5. Accéder à l'app

`https://depenses.tondomaine.com` → saisir le mot de passe défini → installer comme PWA via Safari.

### Mise à jour après modification du code

```bash
git pull
docker compose up -d --build
```

---

## Tests manuels

```bash
# Health check
curl https://TON_DOMAINE/api/health

# Webhook — dépense détectée
curl -X POST https://TON_DOMAINE/api/pending/webhook \
  -H "Content-Type: application/json" \
  -d '{"secret":"TON_SECRET","sms_text":"Paiement de 2 500 F effectué chez Total. Nouveau solde: 45 000 F."}'
# → { success: true, amount: 2500, note: "Total" }

# Webhook — SMS ignoré (entrée d'argent)
curl -X POST https://TON_DOMAINE/api/pending/webhook \
  -H "Content-Type: application/json" \
  -d '{"secret":"TON_SECRET","sms_text":"Vous avez reçu 10 000 F de Jean. Nouveau solde: 55 000 F."}'
# → { ignored: true }

# Lister les pending (avec auth Basic)
curl -u utilisateur:motdepasse https://TON_DOMAINE/api/pending
```

---

## Guide iOS Raccourcis — Intégration Mobile Money

### Principe

iOS ne permet pas de lire les SMS automatiquement depuis une app web.
Solution : un Raccourci manuel lancé après avoir copié un SMS Mobile Money.

### Configuration du Raccourci

1. Ouvrir **Raccourcis** → **+** → nommer "Envoyer SMS Dépense"
2. Ajouter l'action : **Contenu du presse-papiers** → variable `smsTxt`
3. Ajouter l'action : **URL** → `https://TON_DOMAINE/api/pending/webhook`
4. Ajouter l'action : **Obtenir le contenu de l'URL**
   - Méthode : **POST**
   - Corps de la requête : **JSON**
   - Champs :
     - `secret` = `[WEBHOOK_SECRET depuis .env]`
     - `sms_text` = variable `smsTxt`
5. Ajouter l'action : **Si** (résultat contient `"ignored"`)
   - Alors : **Notification** "SMS ignoré"
   - Sinon : **Notification** "Dépense en attente créée ✓"
6. Ajouter le raccourci en **widget** sur l'écran d'accueil

### Utilisation quotidienne

1. Reçois le SMS Mobile Money
2. Appuie longuement sur le texte → **Tout sélectionner** → **Copier**
3. Lance le Raccourci (widget ou Siri : "Envoie SMS dépense")
4. Notification de confirmation en quelques secondes
5. Ouvre l'app → Historique → badge rouge → confirme avec catégorie + description

### Alternative : Paste SMS dans l'app

1. Copier le SMS reçu
2. Ouvrir l'app → onglet Ajouter
3. Dérouler "Importer depuis un SMS Mobile Money"
4. Coller le SMS → Analyser → Créer dépense en attente
5. Aller dans Historique → confirmer la dépense

---

## Commandes utiles

```bash
docker compose logs -f          # voir les logs en temps réel
docker compose restart nginx    # redémarrer nginx seul
docker compose down             # arrêter tout
docker compose up -d --build    # rebuild et redémarrer
docker compose exec backend sh  # shell dans le conteneur backend
```

---

## Structure

```
expense-tracker/
├── backend/           Express.js + SQLite (node:sqlite)
├── frontend/          React 18 + Vite + TailwindCSS (PWA)
├── nginx/
│   ├── nginx.conf     Config HTTPS production (modifier YOURDOMAIN.COM)
│   └── nginx-init.conf  Config HTTP temporaire (utilisée par deploy.sh)
├── certbot/           Certificats Let's Encrypt (généré par deploy.sh)
├── data/              SQLite DB (persisté, non versionné)
├── deploy.sh          Script de déploiement complet Oracle Cloud
└── docker-compose.yml
```
