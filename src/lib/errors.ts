export class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public code?: string
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export class ValidationError extends AppError {
    constructor(message: string, code = 'VALIDATION_ERROR') {
        super(400, message, code);
    }
}

export class BadRequestError extends AppError {
    constructor(message = 'Geçersiz istek') {
        super(400, message, 'BAD_REQUEST');
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Oturum açmanız gerekiyor') {
        super(401, message, 'UNAUTHORIZED');
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'Bu işlem için yetkiniz yok') {
        super(403, message, 'FORBIDDEN');
    }
}

export class NotFoundError extends AppError {
    constructor(message = 'Kayıt bulunamadı') {
        super(404, message, 'NOT_FOUND');
    }
}

export class ConflictError extends AppError {
    constructor(message: string, code = 'CONFLICT') {
        super(409, message, code);
    }
}

export class RateLimitError extends AppError {
    constructor(message = 'Çok fazla istek gönderdiniz. Lütfen bekleyin.') {
        super(429, message, 'RATE_LIMIT_EXCEEDED');
    }
}

export class InternalError extends AppError {
    constructor(message = 'Sunucu hatası oluştu') {
        super(500, message, 'INTERNAL_ERROR');
    }
}
