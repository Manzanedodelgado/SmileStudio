# 🦷 SmileStudio — Guía de Despliegue en VPS

## Requisitos previos

- VPS Hostinger KVM 2 con Ubuntu 22.04/24.04
- Acceso SSH como root (sólo para setup inicial)
- Dominio apuntando a la IP del VPS (DNS A record)
- Repositorio Git con el código de SmileStudio

## Pasos de despliegue

### Paso 1 — Setup inicial del VPS

Conéctate como root y ejecuta el script de setup:

```bash
ssh root@TU_IP_VPS
```

```bash
# Descargar y ejecutar el script
curl -sSL https://raw.githubusercontent.com/TU_USER/smilestudio/main/scripts/setup-vps.sh | bash
```

Esto instala Docker, configura el firewall, Fail2ban y crea el usuario `smilestudio`.

> ⚠️ **Después de este paso, root SSH se deshabilita.** Reconéctate con:
> ```bash
> ssh smilestudio@TU_IP_VPS
> ```

### Paso 2 — Primer despliegue

```bash
ssh smilestudio@TU_IP_VPS
cd /opt/smilestudio

# Clonar el repositorio
git clone https://github.com/TU_USER/smilestudio.git .

# Ejecutar primer despliegue
./scripts/deploy.sh --first-run
```

Esto:
- Crea el archivo `.env` con secretos aleatorios seguros
- Genera SSL autofirmado temporal
- Construye los containers Docker
- Ejecuta las migraciones de Prisma
- Inserta los datos iniciales (seed)

### Paso 3 — Configurar el `.env`

```bash
nano /opt/smilestudio/.env
```

Edita:
- `CORS_ORIGIN=https://tu-dominio.com` (tu dominio de Cloudflare Pages)
- `GEMINI_API_KEY=tu-api-key`
- Revisa que los demás valores sean correctos

Reiniciar después de cambiar `.env`:
```bash
docker compose -f docker/docker-compose.yml up -d
```

### Paso 4 — Configurar SSL (Let's Encrypt)

```bash
./scripts/deploy.sh --ssl api.rubiogarcia.dental
```

> Asegúrate de que el DNS A record de `api.rubiogarcia.dental` apunte a la IP del VPS.

### Paso 5 — Configurar backups automáticos

```bash
./scripts/setup-backup-cron.sh
```

Backup diario a las 3:00 AM → `pg_dump` + GPG + rsync al NAS Buffalo.

### Paso 6 — CI/CD (opcional)

Configura estos secrets en GitHub → Settings → Secrets:

| Secret | Valor |
|--------|-------|
| `VPS_HOST` | IP de tu VPS |
| `VPS_USER` | `smilestudio` |
| `VPS_SSH_KEY` | Tu llave privada SSH |

Con esto, cada `git push` a `main` lanza automáticamente: test → deploy.

---

## Comandos útiles

```bash
# Ver logs en tiempo real
docker compose -f docker/docker-compose.yml logs -f

# Ver logs del backend
docker logs smilestudio-api -f

# Entrar al container del backend
docker exec -it smilestudio-api sh

# Ver estado de containers
docker compose -f docker/docker-compose.yml ps

# Reiniciar todo
docker compose -f docker/docker-compose.yml restart

# Ejecutar migraciones
docker exec smilestudio-api npx prisma migrate deploy

# Abrir Prisma Studio (dev)
docker exec -it smilestudio-api npx prisma studio

# Backup manual
./scripts/backup.sh

# Ver IPs baneadas por Fail2ban
sudo fail2ban-client status sshd
```

## Arquitectura en el VPS

```
┌─────────────────────────── VPS Hostinger KVM 2 ───────────────────────────┐
│                                                                           │
│  :80 ─────┐                                                               │
│  :443 ────┤                                                               │
│           ▼                                                               │
│  ┌─────────────┐     ┌──────────────┐     ┌──────────────┐               │
│  │    Nginx    │────▶│   Backend    │────▶│  PostgreSQL  │               │
│  │  (proxy)    │     │  (Node.js)   │     │   16-alpine   │              │
│  │  SSL/WAF    │     │   :3000      │     │    :5432      │              │
│  └─────────────┘     └──────┬───────┘     └──────────────┘               │
│                              │                                            │
│                              ▼                                            │
│                       ┌──────────────┐                                    │
│                       │    Redis     │                                    │
│                       │   7-alpine   │                                    │
│                       │    :6379     │                                    │
│                       └──────────────┘                                    │
│                                                                           │
│  UFW: 22/80/443 solamente                                                 │
│  Fail2ban: SSH (3 intentos → 24h ban)                                    │
└───────────────────────────────────────────────────────────────────────────┘
```
