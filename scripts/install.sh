#!/bin/bash

#############################################
#  SatınalmaPRO - Interaktif Kurulum Script
#  Versiyon: 1.0.0
#############################################

set -e

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logo
echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║           SatınalmaPRO - Kurulum Sihirbazı               ║"
echo "║           Kurumsal Satın Alma Yönetim Sistemi            ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Fonksiyonlar
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }

# Gereksinim kontrolü
check_requirements() {
    log_info "Sistem gereksinimleri kontrol ediliyor..."
    
    # Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        log_success "Node.js bulundu: $NODE_VERSION"
    else
        log_error "Node.js bulunamadı! Lütfen Node.js 18+ kurun."
        exit 1
    fi
    
    # npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm -v)
        log_success "npm bulundu: $NPM_VERSION"
    else
        log_error "npm bulunamadı!"
        exit 1
    fi
    
    # Git
    if command -v git &> /dev/null; then
        log_success "Git bulundu"
    else
        log_warning "Git bulunamadı (opsiyonel)"
    fi
    
    echo ""
}

# Kullanıcı bilgilerini topla
collect_info() {
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  ADIM 1: Temel Ayarlar${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    
    # Domain
    read -p "$(echo -e ${YELLOW}"Domain adı (örn: satinalma.sirket.com): "${NC})" DOMAIN
    if [ -z "$DOMAIN" ]; then
        DOMAIN="localhost:3000"
        log_warning "Domain boş bırakıldı, varsayılan: $DOMAIN"
    fi
    
    # Port
    read -p "$(echo -e ${YELLOW}"Port numarası [3000]: "${NC})" PORT
    PORT=${PORT:-3000}
    
    # Protokol
    echo ""
    echo "SSL Sertifikası:"
    echo "  1) HTTPS (Önerilen - Let's Encrypt)"
    echo "  2) HTTP (Sadece test için)"
    read -p "$(echo -e ${YELLOW}"Seçiminiz [1]: "${NC})" SSL_CHOICE
    SSL_CHOICE=${SSL_CHOICE:-1}
    
    if [ "$SSL_CHOICE" = "1" ]; then
        PROTOCOL="https"
    else
        PROTOCOL="http"
    fi
    
    NEXTAUTH_URL="${PROTOCOL}://${DOMAIN}"
    log_success "URL: $NEXTAUTH_URL"
    
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  ADIM 2: Veritabanı Ayarları${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    
    echo "Veritabanı türü:"
    echo "  1) PostgreSQL (Önerilen)"
    echo "  2) MySQL"
    echo "  3) SQLite (Sadece test için)"
    read -p "$(echo -e ${YELLOW}"Seçiminiz [1]: "${NC})" DB_TYPE
    DB_TYPE=${DB_TYPE:-1}
    
    if [ "$DB_TYPE" = "3" ]; then
        DATABASE_URL="file:./dev.db"
        log_success "SQLite seçildi"
    else
        read -p "$(echo -e ${YELLOW}"Veritabanı sunucu adresi [localhost]: "${NC})" DB_HOST
        DB_HOST=${DB_HOST:-localhost}
        
        read -p "$(echo -e ${YELLOW}"Veritabanı portu [5432]: "${NC})" DB_PORT
        DB_PORT=${DB_PORT:-5432}
        
        read -p "$(echo -e ${YELLOW}"Veritabanı adı [satinalmapro]: "${NC})" DB_NAME
        DB_NAME=${DB_NAME:-satinalmapro}
        
        read -p "$(echo -e ${YELLOW}"Veritabanı kullanıcısı [postgres]: "${NC})" DB_USER
        DB_USER=${DB_USER:-postgres}
        
        read -sp "$(echo -e ${YELLOW}"Veritabanı şifresi: "${NC})" DB_PASSWORD
        echo ""
        
        if [ "$DB_TYPE" = "1" ]; then
            DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"
        else
            DATABASE_URL="mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
        fi
        log_success "Veritabanı bağlantısı yapılandırıldı"
    fi
    
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  ADIM 3: Admin Kullanıcısı${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    
    read -p "$(echo -e ${YELLOW}"Admin kullanıcı adı [admin]: "${NC})" ADMIN_USERNAME
    ADMIN_USERNAME=${ADMIN_USERNAME:-admin}
    
    read -p "$(echo -e ${YELLOW}"Admin e-posta: "${NC})" ADMIN_EMAIL
    while [ -z "$ADMIN_EMAIL" ]; do
        log_error "E-posta adresi zorunludur!"
        read -p "$(echo -e ${YELLOW}"Admin e-posta: "${NC})" ADMIN_EMAIL
    done
    
    read -sp "$(echo -e ${YELLOW}"Admin şifresi (min 8 karakter): "${NC})" ADMIN_PASSWORD
    echo ""
    while [ ${#ADMIN_PASSWORD} -lt 8 ]; do
        log_error "Şifre en az 8 karakter olmalıdır!"
        read -sp "$(echo -e ${YELLOW}"Admin şifresi: "${NC})" ADMIN_PASSWORD
        echo ""
    done
    
    read -sp "$(echo -e ${YELLOW}"Şifreyi tekrarlayın: "${NC})" ADMIN_PASSWORD_CONFIRM
    echo ""
    while [ "$ADMIN_PASSWORD" != "$ADMIN_PASSWORD_CONFIRM" ]; do
        log_error "Şifreler eşleşmiyor!"
        read -sp "$(echo -e ${YELLOW}"Admin şifresi: "${NC})" ADMIN_PASSWORD
        echo ""
        read -sp "$(echo -e ${YELLOW}"Şifreyi tekrarlayın: "${NC})" ADMIN_PASSWORD_CONFIRM
        echo ""
    done
    
    log_success "Admin kullanıcısı yapılandırıldı"
    
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  ADIM 4: E-posta Ayarları (Opsiyonel)${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    
    read -p "$(echo -e ${YELLOW}"E-posta ayarlarını yapılandırmak ister misiniz? (e/h) [h]: "${NC})" SETUP_EMAIL
    SETUP_EMAIL=${SETUP_EMAIL:-h}
    
    if [ "$SETUP_EMAIL" = "e" ] || [ "$SETUP_EMAIL" = "E" ]; then
        read -p "$(echo -e ${YELLOW}"SMTP sunucu adresi: "${NC})" SMTP_HOST
        read -p "$(echo -e ${YELLOW}"SMTP port [587]: "${NC})" SMTP_PORT
        SMTP_PORT=${SMTP_PORT:-587}
        read -p "$(echo -e ${YELLOW}"SMTP kullanıcı adı: "${NC})" SMTP_USER
        read -sp "$(echo -e ${YELLOW}"SMTP şifresi: "${NC})" SMTP_PASSWORD
        echo ""
        read -p "$(echo -e ${YELLOW}"Gönderen e-posta: "${NC})" SMTP_FROM
        log_success "E-posta ayarları yapılandırıldı"
    else
        SMTP_HOST=""
        SMTP_PORT=""
        SMTP_USER=""
        SMTP_PASSWORD=""
        SMTP_FROM=""
        log_warning "E-posta ayarları atlandı (daha sonra Ayarlar'dan yapılandırabilirsiniz)"
    fi
    
    echo ""
}

# Önizleme göster
show_preview() {
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  KURULUM ÖNİZLEME${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  ${GREEN}Domain:${NC}        $DOMAIN"
    echo -e "  ${GREEN}URL:${NC}           $NEXTAUTH_URL"
    echo -e "  ${GREEN}Port:${NC}          $PORT"
    echo -e "  ${GREEN}Veritabanı:${NC}    ${DB_TYPE_NAME:-PostgreSQL}"
    echo -e "  ${GREEN}Admin E-posta:${NC} $ADMIN_EMAIL"
    echo ""
    
    read -p "$(echo -e ${YELLOW}"Bu ayarlarla devam etmek istiyor musunuz? (e/h) [e]: "${NC})" CONFIRM
    CONFIRM=${CONFIRM:-e}
    
    if [ "$CONFIRM" != "e" ] && [ "$CONFIRM" != "E" ]; then
        log_warning "Kurulum iptal edildi."
        exit 0
    fi
    
    echo ""
}

# .env dosyası oluştur
create_env_file() {
    log_info ".env dosyası oluşturuluyor..."
    
    # Güvenlik için rastgele secret oluştur
    NEXTAUTH_SECRET=$(openssl rand -base64 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
    
    cat > .env.local << EOF
# SatınalmaPRO - Otomatik oluşturuldu: $(date)
# =============================================

# Veritabanı
DATABASE_URL="${DATABASE_URL}"

# NextAuth
NEXTAUTH_URL="${NEXTAUTH_URL}"
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"

# Admin Kullanıcısı
ADMIN_EMAIL="${ADMIN_EMAIL}"
ADMIN_PASSWORD="${ADMIN_PASSWORD}"

# E-posta Ayarları
SMTP_HOST="${SMTP_HOST}"
SMTP_PORT="${SMTP_PORT}"
SMTP_USER="${SMTP_USER}"
SMTP_PASSWORD="${SMTP_PASSWORD}"
SMTP_FROM="${SMTP_FROM}"

# Sentry (Opsiyonel)
# NEXT_PUBLIC_SENTRY_DSN=

# Port
PORT=${PORT}
EOF

    log_success ".env.local dosyası oluşturuldu"
}

# Bağımlılıkları yükle
install_dependencies() {
    log_info "Bağımlılıklar yükleniyor..."
    npm ci --silent
    log_success "Bağımlılıklar yüklendi"
}

# Veritabanı kurulumu
setup_database() {
    log_info "Veritabanı yapılandırılıyor..."
    npx prisma generate
    npx prisma db push --accept-data-loss
    log_success "Veritabanı şeması oluşturuldu"
    
    log_info "Başlangıç verileri ekleniyor..."
    npx prisma db seed
    log_success "Başlangıç verileri eklendi"
}

# Uygulamayı derle
build_app() {
    log_info "Uygulama derleniyor..."
    npm run build
    log_success "Uygulama derlendi"
}

# PM2 ile başlat
start_with_pm2() {
    if command -v pm2 &> /dev/null; then
        log_info "PM2 ile başlatılıyor..."
        pm2 start npm --name "satinalmapro" -- start
        pm2 save
        log_success "Uygulama PM2 ile başlatıldı"
    else
        log_warning "PM2 bulunamadı. Manuel başlatmak için: npm start"
    fi
}

# Son bilgiler
show_final_info() {
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                           ║${NC}"
    echo -e "${GREEN}║           ✓ KURULUM BAŞARIYLA TAMAMLANDI!                ║${NC}"
    echo -e "${GREEN}║                                                           ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  ${CYAN}Uygulama Adresi:${NC}  $NEXTAUTH_URL"
    echo -e "  ${CYAN}Admin E-posta:${NC}    $ADMIN_EMAIL"
    echo -e "  ${CYAN}Admin Şifre:${NC}      (kurulum sırasında girdiğiniz şifre)"
    echo ""
    echo -e "  ${YELLOW}Önemli Komutlar:${NC}"
    echo -e "    Başlat:    ${GREEN}npm start${NC} veya ${GREEN}pm2 start satinalmapro${NC}"
    echo -e "    Durdur:    ${RED}pm2 stop satinalmapro${NC}"
    echo -e "    Loglar:    ${BLUE}pm2 logs satinalmapro${NC}"
    echo ""
    echo -e "  ${YELLOW}Dökümantasyon:${NC}"
    echo -e "    Kullanıcı Kılavuzu: docs/USER_GUIDE.md"
    echo -e "    API Dökümantasyonu: docs/API.md"
    echo ""
}

# Ana akış
main() {
    check_requirements
    collect_info
    show_preview
    create_env_file
    install_dependencies
    setup_database
    build_app
    start_with_pm2
    show_final_info
}

# Script'i çalıştır
main
