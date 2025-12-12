# SatınalmaPRO - Kurulum Kılavuzu

## Hızlı Kurulum (Önerilen)

### Linux/macOS
```bash
# Projeyi klonla
git clone https://github.com/cemcsharp/satinalmaproweb.git
cd satinalmaproweb

# İnteraktif kurulum sihirbazını çalıştır
chmod +x scripts/install.sh
./scripts/install.sh
```

### Kurulum Sihirbazı Ne Sorar?

1. **Domain Ayarları**
   - Domain adı (örn: satinalma.sirket.com)
   - Port numarası
   - SSL seçimi (HTTPS/HTTP)

2. **Veritabanı Ayarları**
   - Veritabanı türü (PostgreSQL/MySQL/SQLite)
   - Sunucu adresi, port
   - Veritabanı adı, kullanıcı, şifre

3. **Admin Kullanıcısı**
   - Kullanıcı adı
   - E-posta
   - Şifre

4. **E-posta Ayarları (Opsiyonel)**
   - SMTP sunucu bilgileri

---

## Manuel Kurulum

### Gereksinimler
- Node.js 18+
- PostgreSQL 14+ (veya MySQL 8+)
- npm veya yarn

### Adımlar

1. **Projeyi klonla**
```bash
git clone https://github.com/cemcsharp/satinalmaproweb.git
cd satinalmaproweb
```

2. **.env dosyası oluştur**
```bash
cp .env.example .env.local
nano .env.local
```

3. **Gerekli değişkenleri düzenle**
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/satinalmapro"
NEXTAUTH_URL="https://satinalma.sirket.com"
NEXTAUTH_SECRET="rastgele-guclu-sifre"
ADMIN_EMAIL="admin@sirket.com"
ADMIN_PASSWORD="guclu-sifre-123"
```

4. **Bağımlılıkları yükle**
```bash
npm ci
```

5. **Veritabanını kur**
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

6. **Uygulamayı derle**
```bash
npm run build
```

7. **Başlat**
```bash
# Geliştirme
npm run dev

# Production
npm start

# PM2 ile (önerilen)
pm2 start npm --name "satinalmapro" -- start
```

---

## Docker ile Kurulum

```bash
# Docker compose ile
docker-compose up -d

# Veya manuel
docker build -t satinalmapro .
docker run -d -p 3000:3000 --env-file .env.local satinalmapro
```

---

## Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name satinalma.sirket.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name satinalma.sirket.com;

    ssl_certificate /etc/letsencrypt/live/satinalma.sirket.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/satinalma.sirket.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## SSL Sertifikası (Let's Encrypt)

```bash
# Certbot kur
sudo apt install certbot python3-certbot-nginx

# Sertifika al
sudo certbot --nginx -d satinalma.sirket.com
```

---

## Güncelleme

```bash
cd satinalmaproweb
git pull origin main
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart satinalmapro
```

---

## Sorun Giderme

### Port kullanımda
```bash
# Portu kullanan işlemi bul
lsof -i :3000
# veya
netstat -tulpn | grep 3000
```

### Veritabanı bağlantı hatası
```bash
# PostgreSQL durumunu kontrol et
sudo systemctl status postgresql

# Bağlantıyı test et
psql -U postgres -h localhost -d satinalmapro
```

### Logları görüntüle
```bash
pm2 logs satinalmapro
```
