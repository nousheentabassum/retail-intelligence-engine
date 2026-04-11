# Retail Intelligence Engine - Production Deployment Guide

## Overview
This guide covers deploying the Retail Intelligence Engine to production using Docker and Docker Compose.

## Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- At least 4GB RAM
- 20GB+ disk space

## Quick Start

### 1. Clone and Prepare
```bash
git clone <your-repo-url>
cd retail-intelligence-engine
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with production values
```

### 3. Deploy
```bash
./deploy.sh
```

## Environment Configuration

### Required Environment Variables
```bash
# Application
NODE_ENV=production
BACKEND_PORT=4000

# Database (CHANGE THESE!)
POSTGRES_USER=retail_user
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=retail_intelligence

# Authentication (CHANGE THIS!)
JWT_SECRET=your_super_secure_jwt_secret_here
BCRYPT_ROUNDS=12

# Frontend
NEXT_PUBLIC_BACKEND_URL=https://your-domain.com/api
```

### Security Configuration
1. **Database Password**: Use a strong, unique password
2. **JWT Secret**: Generate a secure random string (64+ characters)
3. **SSL/TLS**: Configure HTTPS in production
4. **Firewall**: Only expose necessary ports (80, 443)

## SSL/TLS Configuration

### Option 1: Let's Encrypt (Recommended)
```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d your-domain.com

# Update nginx.conf to use SSL
```

### Option 2: Self-Signed Certificate
```bash
# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem

# Uncomment HTTPS section in nginx/nginx.conf
```

## Production Architecture

```
Internet
    ↓
[Nginx Load Balancer]
    ↓ (HTTPS/HTTP)
[Frontend (Next.js)] [Backend API (Node.js)]
    ↓                     ↓
                    [AI Engine (Python)]
    ↓                     ↓
[PostgreSQL Database] [Redis Cache]
```

## Monitoring and Logging

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Health Checks
```bash
# Backend
curl http://localhost:4000/health

# AI Engine
curl http://localhost:8000/health

# Frontend
curl http://localhost:3000
```

## Performance Optimization

### Database Optimization
- Connection pooling configured (max 20 connections)
- Indexes on frequently queried columns
- Regular vacuum and analyze operations

### Caching Strategy
- Redis for forecast caching (1 hour TTL)
- Nginx for static file caching (1 year)
- Application-level caching for analytics

### Load Balancing
- Nginx handles HTTP load balancing
- Rate limiting prevents abuse
- Health checks ensure service availability

## Backup and Recovery

### Database Backup
```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec db pg_dump -U retail_user retail_intelligence > backup.sql

# Restore backup
docker-compose -f docker-compose.prod.yml exec -T db psql -U retail_user retail_intelligence < backup.sql
```

### Volume Backup
```bash
# Backup volumes
docker run --rm -v retail-intelligence-engine_postgres_data:/data -v $(pwd):/backup ubuntu tar cvf /backup/postgres-backup.tar /data
```

## Scaling Considerations

### Horizontal Scaling
- Multiple backend instances behind load balancer
- Database read replicas for analytics queries
- Redis cluster for caching

### Vertical Scaling
- Increase container memory limits
- Optimize database connections
- Monitor resource usage

## Security Best Practices

1. **Network Security**
   - Use private networks for inter-service communication
   - Expose only necessary ports
   - Implement Web Application Firewall (WAF)

2. **Application Security**
   - Regular security updates
   - Input validation and sanitization
   - SQL injection prevention
   - XSS protection

3. **Data Protection**
   - Encrypt sensitive data at rest
   - Use HTTPS in transit
   - Implement access controls
   - Regular security audits

## Troubleshooting

### Common Issues

1. **Services Not Starting**
   ```bash
   # Check logs
   docker-compose -f docker-compose.prod.yml logs
   
   # Check resource usage
   docker stats
   ```

2. **Database Connection Issues**
   ```bash
   # Check database health
   docker-compose -f docker-compose.prod.yml exec db pg_isready -U retail_user
   
   # Verify network connectivity
   docker-compose -f docker-compose.prod.yml exec backend ping db
   ```

3. **High Memory Usage**
   ```bash
   # Monitor memory usage
   docker stats --no-stream
   
   # Optimize container limits
   # Update docker-compose.prod.yml with resource limits
   ```

### Performance Issues
1. Check database query performance
2. Monitor Redis cache hit rates
3. Analyze Nginx access logs
4. Profile application performance

## Maintenance

### Regular Tasks
- Update container images monthly
- Rotate secrets quarterly
- Backup database daily
- Monitor disk usage weekly
- Review logs for anomalies

### Update Process
```bash
# Pull latest images
docker-compose -f docker-compose.prod.yml pull

# Restart services with zero downtime
docker-compose -f docker-compose.prod.yml up -d --no-deps backend
docker-compose -f docker-compose.prod.yml up -d --no-deps frontend
docker-compose -f docker-compose.prod.yml up -d --no-deps ai-engine
```

## Support

For production issues:
1. Check logs first
2. Review this troubleshooting guide
3. Monitor system resources
4. Contact support with detailed error information
