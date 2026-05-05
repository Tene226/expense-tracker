#!/bin/bash
set -e

# =============================================================================
# deploy.sh — Installation complète sur Oracle Cloud Ubuntu
# Usage: bash deploy.sh
# =============================================================================

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# --- 1. Prérequis ---
info "Vérification des prérequis..."
command -v docker        >/dev/null 2>&1 || error "Docker non installé. Voir : https://docs.docker.com/engine/install/ubuntu/"
command -v docker        >/dev/null 2>&1 && docker compose version >/dev/null 2>&1 || error "Docker Compose plugin manquant."
command -v htpasswd      >/dev/null 2>&1 || error "htpasswd manquant. Installer : sudo apt install apache2-utils"

# --- 2. Domaine ---
echo ""
read -p "Domaine (ex: depenses.tondomaine.com) : " DOMAIN
[ -z "$DOMAIN" ] && error "Domaine requis."

read -p "Email Let's Encrypt : " EMAIL
[ -z "$EMAIL" ] && error "Email requis pour Let's Encrypt."

# --- 3. .env ---
if [ ! -f .env ]; then
    info "Création du fichier .env..."
    cp .env.example .env
    SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    sed -i "s/remplacer_par_une_chaine_aleatoire_longue/$SECRET/" .env
    sed -i "s/depenses.tondomaine.com/$DOMAIN/" .env
    info "WEBHOOK_SECRET généré automatiquement."
else
    warn ".env déjà existant — conservé."
fi

# --- 4. htpasswd ---
if [ ! -f nginx/.htpasswd ]; then
    info "Création du fichier htpasswd..."
    read -p "Nom d'utilisateur pour l'accès web : " HTUSER
    htpasswd -c nginx/.htpasswd "$HTUSER"
else
    warn "nginx/.htpasswd déjà existant — conservé."
fi

# --- 5. Dossiers ---
mkdir -p data certbot/conf certbot/www

# --- 6. Remplacer YOURDOMAIN.COM dans nginx.conf ---
info "Configuration nginx pour $DOMAIN..."
sed -i "s/YOURDOMAIN.COM/$DOMAIN/g" nginx/nginx.conf

# --- 7. Acquisition certificat Let's Encrypt (phase 1 : HTTP only) ---
info "Phase 1 : démarrage nginx HTTP-only pour validation Let's Encrypt..."
cp nginx/nginx.conf nginx/nginx.conf.bak
cp nginx/nginx-init.conf nginx/nginx.conf

docker compose up -d nginx

info "Acquisition du certificat Let's Encrypt..."
docker compose run --rm --entrypoint certbot certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN"

# --- 8. Switch vers config HTTPS ---
info "Phase 2 : activation HTTPS..."
cp nginx/nginx.conf.bak nginx/nginx.conf
rm nginx/nginx.conf.bak

# --- 9. Démarrage complet ---
info "Build et démarrage de l'application complète..."
docker compose up -d --build

info "Attente démarrage (10s)..."
sleep 10

# --- 10. Test de santé ---
info "Test de santé..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://$DOMAIN/api/health" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ]; then
    info "✓ Application accessible sur https://$DOMAIN"
else
    warn "Health check HTTP $HTTP_CODE — vérifier : docker compose logs"
fi

echo ""
echo "========================================"
echo " Déploiement terminé !"
echo "========================================"
echo " URL      : https://$DOMAIN"
echo " Logs     : docker compose logs -f"
echo " Stop     : docker compose down"
echo " Restart  : docker compose restart"
echo ""
echo " Test webhook :"
WSECRET=$(grep WEBHOOK_SECRET .env | cut -d= -f2)
echo " curl -X POST https://$DOMAIN/api/pending/webhook \\"
echo "   -H 'Content-Type: application/json' \\"
echo "   -d '{\"secret\":\"$WSECRET\",\"sms_text\":\"Paiement de 2500 F chez Total. Solde: 45000 F.\"}'"
echo "========================================"
