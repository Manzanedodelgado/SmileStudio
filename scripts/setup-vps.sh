#!/bin/bash
# ─── SmileStudio — VPS Initial Setup ────────────────────
# Run as root on a fresh Ubuntu 22.04 VPS (Hostinger KVM 2)
# Usage: curl -sSL https://raw.githubusercontent.com/.../setup-vps.sh | sudo bash
#
# What this script does:
# 1. System updates + hardening
# 2. Create deploy user (no root SSH)
# 3. Install Docker + Docker Compose
# 4. Configure firewall (UFW)
# 5. Install Fail2ban
# 6. Install Certbot (Let's Encrypt)

set -euo pipefail

echo "🦷 SmileStudio VPS Setup"
echo "════════════════════════════════════════"

# ─── Variables ───────────────────────────────────────────
DEPLOY_USER="smilestudio"
APP_DIR="/opt/smilestudio"

# ─── 1. System Update ───────────────────────────────────
echo ""
echo "📦 [1/6] Updating system..."
apt update && apt upgrade -y
apt install -y \
  curl wget git unzip htop \
  ca-certificates gnupg lsb-release \
  ufw fail2ban \
  rsync gpg

# ─── 2. Create Deploy User ──────────────────────────────
echo ""
echo "👤 [2/6] Creating deploy user: $DEPLOY_USER..."
if ! id -u "$DEPLOY_USER" &>/dev/null; then
  adduser --disabled-password --gecos "" "$DEPLOY_USER"
  usermod -aG sudo "$DEPLOY_USER"
  # Allow sudo without password for deploy scripts
  echo "$DEPLOY_USER ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/$DEPLOY_USER
  
  # Copy SSH keys from root
  mkdir -p /home/$DEPLOY_USER/.ssh
  cp /root/.ssh/authorized_keys /home/$DEPLOY_USER/.ssh/ 2>/dev/null || true
  chown -R $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/.ssh
  chmod 700 /home/$DEPLOY_USER/.ssh
  chmod 600 /home/$DEPLOY_USER/.ssh/authorized_keys 2>/dev/null || true
  echo "  ✅ User $DEPLOY_USER created"
else
  echo "  ℹ️  User $DEPLOY_USER already exists"
fi

# ─── 3. Install Docker ──────────────────────────────────
echo ""
echo "🐳 [3/6] Installing Docker..."
if ! command -v docker &>/dev/null; then
  # Docker official install
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list
  apt update
  apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  
  # Add deploy user to docker group
  usermod -aG docker $DEPLOY_USER
  
  # Enable Docker on boot
  systemctl enable docker
  systemctl start docker
  echo "  ✅ Docker installed: $(docker --version)"
else
  echo "  ℹ️  Docker already installed: $(docker --version)"
fi

# ─── 4. Configure Firewall (UFW) ────────────────────────
echo ""
echo "🔒 [4/6] Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP (redirect to HTTPS)
ufw allow 443/tcp   # HTTPS
ufw --force enable
echo "  ✅ Firewall active (SSH + HTTP + HTTPS only)"

# ─── 5. Configure Fail2ban ──────────────────────────────
echo ""
echo "🛡️  [5/6] Configuring Fail2ban..."
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
backend = systemd

[sshd]
enabled = true
port = ssh
maxretry = 3
bantime = 86400

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
EOF

systemctl enable fail2ban
systemctl restart fail2ban
echo "  ✅ Fail2ban configured (SSH: 3 attempts → 24h ban)"

# ─── 6. Prepare App Directory ───────────────────────────
echo ""
echo "📁 [6/6] Preparing app directory..."
mkdir -p $APP_DIR
chown $DEPLOY_USER:$DEPLOY_USER $APP_DIR

# Create directories for volumes
mkdir -p $APP_DIR/data/postgres
mkdir -p $APP_DIR/data/redis
mkdir -p $APP_DIR/data/uploads
mkdir -p $APP_DIR/data/backups
mkdir -p $APP_DIR/logs

chown -R $DEPLOY_USER:$DEPLOY_USER $APP_DIR
echo "  ✅ Directory $APP_DIR ready"

# ─── SSH Hardening ───────────────────────────────────────
echo ""
echo "🔐 Hardening SSH..."
# Disable root login and password auth
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd
echo "  ✅ SSH hardened (root login disabled, password auth disabled)"

# ─── Summary ────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════"
echo "✅ VPS Setup Complete!"
echo ""
echo "  User:       $DEPLOY_USER"
echo "  App dir:    $APP_DIR"
echo "  Docker:     $(docker --version)"
echo "  Firewall:   UFW (22, 80, 443)"
echo "  Fail2ban:   Active"
echo ""
echo "⚠️  IMPORTANTE:"
echo "  1. SSH como root ya está DESHABILITADO"
echo "  2. Conéctate ahora con: ssh $DEPLOY_USER@<IP>"
echo "  3. Siguiente paso: ejecutar deploy.sh"
echo "════════════════════════════════════════"
