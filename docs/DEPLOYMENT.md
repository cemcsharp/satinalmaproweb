# Deployment Prosedürü

## 📋 Önkoşullar

- Node.js 18+
- PostgreSQL 14+
- SMTP sunucusu (e-posta için)
- Domain + SSL sertifikası

---

## 🚀 Production Deployment

### 1. Ortam Değişkenleri

`.env.production` dosyasını oluştur:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/satinalmapro"

# NextAuth
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="generate-a-secure-random-string-here"

# Node Environment
NODE_ENV="production"

# SMTP (Opsiyonel)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-email@example.com"
SMTP_PASS="your-password"
SMTP_FROM="noreply@satinalma.app"
```

### 2. Veritabanı Hazırlığı

```bash
# Prisma migration
npx prisma migrate deploy

# Seed data (opsiyonel)
npx prisma db seed
```

### 3. Build & Start

```bash
# Production build
npm run build

# Start server
npm start
```

---

## 🐳 Docker Deployment

### Dockerfile (örnek)

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### docker-compose.yml

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/satinalma
      - NEXTAUTH_URL=https://yourdomain.com
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    depends_on:
      - db

  db:
    image: postgres:14
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=satinalma

volumes:
  pgdata:
```

---

## ☁️ Vercel Deployment

1. GitHub'a push et
2. Vercel'de import et
3. Environment variables ekle
4. Deploy

---

## 🔒 Güvenlik Kontrol Listesi

- [ ] NEXTAUTH_SECRET güçlü ve unique
- [ ] DATABASE_URL şifreli bağlantı
- [ ] HTTPS aktif
- [ ] Rate limiting açık
- [ ] CORS doğru yapılandırılmış
- [ ] Backup planı hazır

---

## 📊 Monitoring

### Önerilen Araçlar
- **Sentry**: Error tracking
- **Vercel Analytics**: Performance
- **Uptime Robot**: Availability

---

## 🔄 Backup Prosedürü

```bash
# PostgreSQL backup
pg_dump -U postgres satinalma > backup_$(date +%Y%m%d).sql

# Restore
psql -U postgres satinalma < backup_20260119.sql
```

### Otomatik Backup (cron)

```bash
# Her gece 02:00'de backup
0 2 * * * pg_dump -U postgres satinalma | gzip > /backups/satinalma_$(date +\%Y\%m\%d).sql.gz
```

---

## 🆘 Sorun Giderme

| Sorun | Çözüm |
|-------|-------|
| Build hatası | `rm -rf .next && npm run build` |
| DB bağlantı sorunu | `DATABASE_URL` kontrol et |
| Auth çalışmıyor | `NEXTAUTH_SECRET` ve `NEXTAUTH_URL` doğrula |
| E-posta gitmiyor | SMTP ayarlarını test et |
