#!/bin/bash
# ─── SmileStudio — Deploy Script ────────────────────────
# Run as smilestudio user on the VPS
# Usage: ./deploy.sh [--first-run] [--ssl your-domain.com]
#
# --first-run: Initial deployment (clone, build, migrate, seed)
# --ssl:       Setup SSL with Let's Encrypt for the given domain

set -euo pipefail

# ─── Config ──────────────────────────────────────────────
APP_DIR="/opt/smilestudio"
REPO_URL="${REPO_URL:-https://github.com/YOUR_USER/smilestudio.git}"
BRANCH="${BRANCH:-main}"
COMPOSE_FILE="docker/docker-compose.yml"

echo "🦷 SmileStudio Deploy"
echo "════════════════════════════════════════"

# ─── Parse arguments ────────────────────────────────────
FIRST_RUN=false
SSL_DOMAIN=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --first-run) FIRST_RUN=true; shift ;;
    --ssl) SSL_DOMAIN="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

cd "$APP_DIR"

# ─── First Run: Clone & Setup ───────────────────────────
if [ "$FIRST_RUN" = true ]; then
  echo ""
  echo "🚀 First run — setting up..."
  
  # Clone repo
  if [ ! -d "$APP_DIR/.git" ]; then
    echo "  📥 Cloning repository..."
    git clone "$REPO_URL" .
  fi
  
  # Create .env from template
  if [ ! -f "$APP_DIR/.env" ]; then
    echo "  📝 Creating .env file..."
    cp .env.example .env
    
    # Generate secure secrets
    JWT_SECRET=$(openssl rand -hex 32)
    JWT_REFRESH_SECRET=$(openssl rand -hex 32)
    DB_PASSWORD=$(openssl rand -hex 16)
    
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
    sed -i "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET|" .env
    sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=$DB_PASSWORD|" .env
    sed -i "s|smilestudio_secret|$DB_PASSWORD|g" .env
    sed -i "s|NODE_ENV=development|NODE_ENV=production|" .env
    
    echo "  ✅ .env created with secure random secrets"
    echo ""
    echo "  ⚠️  EDITA .env para configurar:"
    echo "     - CORS_ORIGIN (tu dominio)"
    echo "     - GEMINI_API_KEY"
    echo "     - EVOLUTION_API_KEY"
    echo ""
  fi
  
  # Generate self-signed SSL for initial setup
  echo "  🔒 Generating self-signed SSL (temporal)..."
  mkdir -p docker/nginx/ssl
  openssl req -x509 -nodes -days 365 \
    -newkey rsa:2048 \
    -keyout docker/nginx/ssl/self-signed.key \
    -out docker/nginx/ssl/self-signed.crt \
    -subj "/C=ES/ST=Madrid/L=Madrid/O=SmileStudio/CN=localhost" \
    2>/dev/null
  echo "  ✅ Self-signed SSL generated"
fi

# ─── Pull latest code ───────────────────────────────────
echo ""
echo "📥 Pulling latest code..."
git pull origin "$BRANCH" 2>/dev/null || echo "  ℹ️  Not a git repo or no remote"

# ─── Build & Start ──────────────────────────────────────
echo ""
echo "🐳 Building and starting containers..."
docker compose -f "$COMPOSE_FILE" build --no-cache backend
docker compose -f "$COMPOSE_FILE" up -d

# Wait for database
echo "  ⏳ Waiting for PostgreSQL..."
sleep 5

# Check health
for i in {1..30}; do
  if docker exec smilestudio-db pg_isready -U smilestudio &>/dev/null; then
    echo "  ✅ PostgreSQL ready"
    break
  fi
  sleep 1
  if [ $i -eq 30 ]; then
    echo "  ❌ PostgreSQL not ready after 30s"
    exit 1
  fi
done

# ─── First Run: Migrate & Seed ──────────────────────────
if [ "$FIRST_RUN" = true ]; then
  echo ""
  echo "🗄️  Running database migrations..."
  docker exec smilestudio-api npx prisma migrate deploy
  
  echo ""
  echo "🌱 Seeding database..."
  docker exec smilestudio-api npx tsx prisma/seed.ts
fi

# ─── SSL Setup (Let's Encrypt) ──────────────────────────
if [ -n "$SSL_DOMAIN" ]; then
  echo ""
  echo "🔒 Setting up SSL for: $SSL_DOMAIN"
  
  # Install certbot
  sudo apt install -y certbot 2>/dev/null || true
  
  # Stop nginx temporarily for standalone verification
  docker compose -f "$COMPOSE_FILE" stop nginx
  
  # Get certificate
  sudo certbot certonly --standalone \
    -d "$SSL_DOMAIN" \
    --non-interactive \
    --agree-tos \
    --email "admin@${SSL_DOMAIN}" \
    --no-eff-email
  
  # Update nginx config to use real certificate
  NGINX_CONF="docker/nginx/nginx.conf"
  sed -i "s|# ssl_certificate /etc/letsencrypt|ssl_certificate /etc/letsencrypt|g" "$NGINX_CONF"
  sed -i "s|# ssl_certificate_key /etc/letsencrypt|ssl_certificate_key /etc/letsencrypt|g" "$NGINX_CONF"
  sed -i "s|# ssl_protocols|ssl_protocols|g" "$NGINX_CONF"
  sed -i "s|# ssl_ciphers|ssl_ciphers|g" "$NGINX_CONF"
  sed -i "s|ssl_certificate /etc/nginx/ssl/self-signed|# ssl_certificate /etc/nginx/ssl/self-signed|g" "$NGINX_CONF"
  sed -i "s|ssl_certificate_key /etc/nginx/ssl/self-signed|# ssl_certificate_key /etc/nginx/ssl/self-signed|g" "$NGINX_CONF"
  sed -i "s|your-domain|$SSL_DOMAIN|g" "$NGINX_CONF"
  
  # Restart nginx with real cert
  docker compose -f "$COMPOSE_FILE" up -d nginx
  
  # Setup auto-renewal cron
  (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --deploy-hook 'docker restart smilestudio-proxy'") | sort -u | crontab -
  
  echo "  ✅ SSL configurado para $SSL_DOMAIN"
  echo "  ✅ Auto-renovación configurada (cron cada noche)"
fi

# ─── Health Check ────────────────────────────────────────
echo ""
echo "🏥 Health check..."
sleep 3

HEALTH=$(curl -sk https://localhost/api/health 2>/dev/null || curl -sk http://localhost:3000/api/health 2>/dev/null || echo '{"error": true}')
echo "  Response: $HEALTH"

# ─── Status ─────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════"
echo "📊 Container status:"
docker compose -f "$COMPOSE_FILE" ps
echo ""
echo "════════════════════════════════════════"
echo "✅ Deploy complete!"
echo ""
if [ -n "$SSL_DOMAIN" ]; then
  echo "  🌐 API: https://$SSL_DOMAIN/api/health"
else
  echo "  🌐 API: http://<VPS_IP>/api/health"
fi
echo "  📊 Logs: docker compose -f $COMPOSE_FILE logs -f"
echo "════════════════════════════════════════"
