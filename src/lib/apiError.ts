import { NextResponse } from "next/server";

type ErrorOpts = {
  details?: any;
  message?: string;
};

/**
 * Kullanıcı dostu Türkçe hata mesajları
 */
const errorMessages: Record<string, string> = {
  // Auth & Permission Errors
  "forbidden": "Bu işlem için yetkiniz bulunmuyor.",
  "unauthorized": "Lütfen giriş yapın.",
  "session_expired": "Oturumunuz sona erdi. Lütfen tekrar giriş yapın.",
  "invalid_token": "Geçersiz veya süresi dolmuş token.",

  // Validation Errors
  "validation_failed": "Girilen bilgiler geçersiz.",
  "missing_fields": "Zorunlu alanlar eksik.",
  "invalid_email": "Geçersiz e-posta adresi.",
  "invalid_phone": "Geçersiz telefon numarası.",
  "invalid_date": "Geçersiz tarih formatı.",
  "name_required": "İsim alanı zorunludur.",

  // Resource Errors
  "not_found": "Kayıt bulunamadı.",
  "already_exists": "Bu kayıt zaten mevcut.",
  "duplicate": "Bu bilgilerle bir kayıt zaten var.",
  "duplicate_number": "Bu numara zaten kullanımda.",

  // Business Logic Errors
  "linked_records": "Bağlı kayıtlar nedeniyle bu işlem yapılamıyor.",
  "status_conflict": "Mevcut durum bu işleme izin vermiyor.",
  "budget_exceeded": "Bütçe limiti aşıldı.",
  "deadline_passed": "Son tarih geçti.",

  // Server Errors
  "server_error": "Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.",
  "database_error": "Veritabanı hatası oluştu.",
  "network_error": "Bağlantı hatası. İnternet bağlantınızı kontrol edin.",

  // AI/External Service Errors
  "ai_error": "AI servisi şu an kullanılamıyor.",
  "external_service_error": "Dış servis hatası oluştu.",
};

/**
 * Standart JSON hata yanıtı oluşturur
 */
export function jsonError(status: number, code: string, opts: ErrorOpts = {}) {
  const payload: Record<string, any> = {
    error: code,
    code,
    message: opts.message || errorMessages[code] || "Bir hata oluştu.",
  };
  if (typeof opts.details !== "undefined") payload.details = opts.details;
  return NextResponse.json(payload, { status });
}

/**
 * Hata kodundan kullanıcı dostu mesaj döndürür
 */
export function getErrorMessage(code: string): string {
  return errorMessages[code] || "Bir hata oluştu.";
}