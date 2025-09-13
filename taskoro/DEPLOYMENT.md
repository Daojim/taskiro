# Taskoro Deployment Guide

This guide covers deploying Taskoro to production environments using Docker containers.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local builds)
- PostgreSQL 15+ (if not using Docker)
- SSL certificates (for HTTPS in production)

## Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# Database
POSTGRES_PASSWORD=your-secure-database-password

# JWT Secrets (generate strong random strings)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_REFRESH_SECRET=your-super-secret-refresh-key-minimum-32-characters

# Application URLs
FRONTEND_URL=https://your-domain.com
GOOGLE_REDIRECT_URI=https://your-domain.com/calendar/callback

# Google Calendar Integration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Generating Secure Secrets

Use these commands to generate secure secrets:

```bash
# For JWT secrets (Linux/macOS)
openssl rand -base64 32

# For JWT secrets (Windows PowerShell)
[System.Web.Security.Membership]::GeneratePassword(32, 0)

# For database password
openssl rand -base64 16
```

## Quick Deployment

### Using Deployment Scripts

**Linux/macOS:**

```bash
# Set environment variables
export JWT_SECRET="your-jwt-secret"
export JWT_REFRESH_SECRET="your-refresh-secret"
export POSTGRES_PASSWORD="your-db-password"
export FRONTEND_URL="https://your-domain.com"
export GOOGLE_CLIENT_ID="your-google-client-id"
export GOOGLE_CLIENT_SECRET="your-google-client-secret"
export GOOGLE_REDIRECT_URI="https://your-domain.com/calendar/callback"

# Run deployment
./scripts/deploy.sh
```

**Windows PowerShell:**

```powershell
# Set environment variables
$env:JWT_SECRET="your-jwt-secret"
$env:JWT_REFRESH_SECRET="your-refresh-secret"
$env:POSTGRES_PASSWORD="your-db-password"
$env:FRONTEND_URL="https://your-domain.com"
$env:GOOGLE_CLIENT_ID="your-google-client-id"
$env:GOOGLE_CLIENT_SECRET="your-google-client-secret"
$env:GOOGLE_REDIRECT_URI="https://your-domain.com/calendar/callback"

# Run deployment
.\scripts\deploy.ps1
```

## Manual Deployment

### 1. Build the Application

```bash
# Install dependencies
npm ci

# Run tests and build
npm run build:prod

# Or skip tests for faster deployment
npm run build
npm run server:build
```

### 2. Build Docker Image

```bash
docker build -t taskoro:latest .
```

### 3. Deploy with Docker Compose

```bash
# Start services
docker-compose -f docker-compose.prod.yml up -d

# Run database migrations
docker-compose -f docker-compose.prod.yml exec app npm run db:migrate:prod

# Check status
docker-compose -f docker-compose.prod.yml ps
```

## SSL/HTTPS Configuration

### 1. Obtain SSL Certificates

**Using Let's Encrypt (recommended):**

```bash
# Install certbot
sudo apt-get install certbot

# Obtain certificates
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates to nginx directory
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./nginx/ssl/key.pem
```

### 2. Enable HTTPS in Nginx

Edit `nginx/nginx.conf` and uncomment the HTTPS server block, then update your domain name.

### 3. Update Environment Variables

```bash
FRONTEND_URL=https://your-domain.com
GOOGLE_REDIRECT_URI=https://your-domain.com/calendar/callback
```

## Database Management

### Migrations

```bash
# Run migrations in production
docker-compose -f docker-compose.prod.yml exec app npm run db:migrate:prod

# View migration status
docker-compose -f docker-compose.prod.yml exec app npx prisma migrate status
```

### Backups

```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U taskoro_user taskoro_db > backup.sql

# Restore backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U taskoro_user taskoro_db < backup.sql
```

## Monitoring and Logs

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs

# Specific service
docker-compose -f docker-compose.prod.yml logs app
docker-compose -f docker-compose.prod.yml logs postgres
docker-compose -f docker-compose.prod.yml logs nginx

# Follow logs
docker-compose -f docker-compose.prod.yml logs -f app
```

### Health Checks

```bash
# Application health
curl http://localhost:3001/health

# Database health
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U taskoro_user
```

## Scaling and Performance

### Resource Limits

Update `docker-compose.prod.yml` to add resource limits:

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Load Balancing

For multiple app instances:

```yaml
services:
  app:
    scale: 3
    deploy:
      replicas: 3
```

## Security Checklist

- [ ] Strong JWT secrets (32+ characters)
- [ ] Secure database password
- [ ] HTTPS enabled with valid SSL certificates
- [ ] Rate limiting configured in Nginx
- [ ] Security headers enabled
- [ ] Non-root user in Docker containers
- [ ] Regular security updates
- [ ] Database backups scheduled
- [ ] Log monitoring configured

## Troubleshooting

### Common Issues

**1. Database Connection Failed**

```bash
# Check database status
docker-compose -f docker-compose.prod.yml exec postgres pg_isready

# Check connection string
docker-compose -f docker-compose.prod.yml exec app env | grep DATABASE_URL
```

**2. JWT Token Issues**

```bash
# Verify JWT secrets are set
docker-compose -f docker-compose.prod.yml exec app env | grep JWT_SECRET
```

**3. Google Calendar Integration**

```bash
# Check Google OAuth configuration
docker-compose -f docker-compose.prod.yml exec app env | grep GOOGLE_
```

**4. Frontend Not Loading**

```bash
# Check Nginx configuration
docker-compose -f docker-compose.prod.yml exec nginx nginx -t

# Check if frontend files exist
docker-compose -f docker-compose.prod.yml exec nginx ls -la /usr/share/nginx/html/
```

### Performance Issues

**1. Slow Database Queries**

```bash
# Enable query logging
docker-compose -f docker-compose.prod.yml exec postgres psql -U taskoro_user -d taskoro_db -c "ALTER SYSTEM SET log_statement = 'all';"
```

**2. High Memory Usage**

```bash
# Check container resource usage
docker stats
```

## Maintenance

### Updates

```bash
# Pull latest code
git pull origin main

# Rebuild and redeploy
./scripts/deploy.sh
```

### Database Maintenance

```bash
# Vacuum database
docker-compose -f docker-compose.prod.yml exec postgres psql -U taskoro_user -d taskoro_db -c "VACUUM ANALYZE;"

# Check database size
docker-compose -f docker-compose.prod.yml exec postgres psql -U taskoro_user -d taskoro_db -c "SELECT pg_size_pretty(pg_database_size('taskoro_db'));"
```

## Support

For deployment issues:

1. Check the logs using the commands above
2. Verify all environment variables are set correctly
3. Ensure Docker and Docker Compose are up to date
4. Check firewall settings for ports 80, 443, and 3001
