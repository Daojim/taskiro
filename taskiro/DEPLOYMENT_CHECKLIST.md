# Taskiro Deployment Checklist

## Pre-Deployment

- [ ] **Environment Variables Set**
  - [ ] `JWT_SECRET` (32+ characters)
  - [ ] `JWT_REFRESH_SECRET` (32+ characters)
  - [ ] `POSTGRES_PASSWORD` (8+ characters)
  - [ ] `FRONTEND_URL` (https://your-domain.com)
  - [ ] `GOOGLE_CLIENT_ID`
  - [ ] `GOOGLE_CLIENT_SECRET`
  - [ ] `GOOGLE_REDIRECT_URI`

- [ ] **Google Cloud Console Setup**
  - [ ] OAuth 2.0 credentials created
  - [ ] Authorized redirect URIs configured
  - [ ] Google Calendar API enabled

- [ ] **SSL Certificates** (for HTTPS)
  - [ ] SSL certificates obtained (Let's Encrypt recommended)
  - [ ] Certificates placed in `nginx/ssl/` directory
  - [ ] HTTPS server block uncommented in `nginx/nginx.conf`

- [ ] **Domain Configuration**
  - [ ] Domain DNS pointing to server
  - [ ] Firewall rules configured (ports 80, 443)

## Deployment Steps

- [ ] **Validate Environment**

  ```bash
  node scripts/validate-env.js
  ```

- [ ] **Build Application**

  ```bash
  npm run build:prod
  ```

- [ ] **Deploy with Docker**

  ```bash
  # Linux/macOS
  ./scripts/deploy.sh

  # Windows
  .\scripts\deploy.ps1
  ```

- [ ] **Verify Deployment**
  - [ ] Health check passes: `curl http://localhost:3001/health`
  - [ ] Frontend loads: `http://localhost` or `https://your-domain.com`
  - [ ] Database migrations applied
  - [ ] Google Calendar integration works

## Post-Deployment

- [ ] **Security**
  - [ ] Rate limiting active
  - [ ] HTTPS enforced
  - [ ] Security headers present
  - [ ] Database access restricted

- [ ] **Monitoring**
  - [ ] Health checks configured
  - [ ] Log monitoring set up
  - [ ] Database backups scheduled
  - [ ] SSL certificate renewal automated

- [ ] **Testing**
  - [ ] User registration works
  - [ ] Task creation works
  - [ ] Calendar sync works
  - [ ] Mobile responsiveness verified

## Troubleshooting

If deployment fails:

1. **Check logs**: `docker-compose -f docker-compose.prod.yml logs`
2. **Verify environment**: `node scripts/validate-env.js`
3. **Test health**: `node scripts/health-check.js`
4. **Check database**: `docker-compose -f docker-compose.prod.yml exec postgres pg_isready`

## Rollback Plan

If issues occur:

```bash
# Stop current deployment
docker-compose -f docker-compose.prod.yml down

# Restore from backup (if needed)
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U taskiro_user taskiro_db < backup.sql

# Deploy previous version
git checkout previous-tag
./scripts/deploy.sh
```
