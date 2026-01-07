import { NextResponse } from 'next/server';
import { AppError } from './errors';
import { Prisma } from '@prisma/client';

// Türkçe hata mesajları
const ERROR_MESSAGES = {
    DUPLICATE_KEY: 'Bu kayıt zaten mevcut',
    NOT_FOUND: 'Kayıt bulunamadı',
    FOREIGN_KEY: 'Geçersiz referans',
    VALIDATION: 'Geçersiz veri gönderildi',
    INTERNAL: 'Sunucu hatası oluştu',
    RATE_LIMIT: 'Çok fazla istek gönderdiniz. Lütfen bekleyin.',
    UNAUTHORIZED: 'Oturum açmanız gerekiyor',
    FORBIDDEN: 'Bu işlem için yetkiniz yok',
};

/**
 * Standart API response formatı
 */
interface ApiErrorResponse {
    error: true;
    code: string;
    message: string;
    details?: Record<string, unknown>;
}

/**
 * Global error handler for API routes
 * Converts various error types into standardized JSON responses
 */
export function handleError(error: unknown): NextResponse<ApiErrorResponse> {
    // AppError - our custom errors
    if (error instanceof AppError) {
        return NextResponse.json(
            {
                error: true,
                code: error.code || 'APP_ERROR',
                message: error.message,
            },
            { status: error.statusCode }
        );
    }

    // Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Unique constraint violation
        if (error.code === 'P2002') {
            const fields = (error.meta?.target as string[])?.join(', ') || 'alan';
            return NextResponse.json(
                {
                    error: true,
                    code: 'DUPLICATE_KEY',
                    message: `${fields} alanı için bu değer zaten kullanılıyor`,
                    details: { fields: error.meta?.target }
                },
                { status: 409 }
            );
        }

        // Record not found
        if (error.code === 'P2025') {
            return NextResponse.json(
                {
                    error: true,
                    code: 'NOT_FOUND',
                    message: ERROR_MESSAGES.NOT_FOUND,
                },
                { status: 404 }
            );
        }

        // Foreign key constraint failed
        if (error.code === 'P2003') {
            return NextResponse.json(
                {
                    error: true,
                    code: 'FOREIGN_KEY_ERROR',
                    message: ERROR_MESSAGES.FOREIGN_KEY,
                },
                { status: 400 }
            );
        }
    }

    // Generic Prisma validation errors
    if (error instanceof Prisma.PrismaClientValidationError) {
        return NextResponse.json(
            {
                error: true,
                code: 'VALIDATION_ERROR',
                message: ERROR_MESSAGES.VALIDATION,
            },
            { status: 400 }
        );
    }

    // Generic error
    let errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL;
    const errorCode = 'INTERNAL_ERROR';

    // In production, log error to monitoring service (Sentry) and MASK the message
    if (process.env.NODE_ENV === 'production') {
        console.error('[API Error]', error);
        errorMessage = ERROR_MESSAGES.INTERNAL; // Mask specific error
    } else {
        // In development, log to console
        console.error('[API Error]', error);
    }

    return NextResponse.json(
        {
            error: true,
            code: errorCode,
            message: errorMessage,
        },
        { status: 500 }
    );
}

/**
 * Success response helper
 */
export function successResponse<T>(data: T, status = 200): NextResponse {
    return NextResponse.json(data, { status });
}

/**
 * Error response helper (for manual error creation)
 */
export function errorResponse(
    message: string,
    code: string,
    status: number,
    details?: Record<string, unknown>
): NextResponse<ApiErrorResponse> {
    return NextResponse.json(
        {
            error: true,
            code,
            message,
            ...(details && { details }),
        },
        { status }
    );
}

// ========================================
// Client-Side Error Handling
// ========================================

/**
 * Client-side API Error class
 * Used by useApiRequest hook
 */
export class ApiError extends Error {
    constructor(
        message: string,
        public statusCode?: number,
        public code?: string
    ) {
        super(message);
        this.name = "ApiError";
    }
}

/**
 * HTTP status code to Turkish message mapping (client-side)
 */
const HTTP_STATUS_MESSAGES: Record<number, string> = {
    400: "Geçersiz istek. Lütfen bilgileri kontrol edin.",
    401: "Oturum süresi doldu. Lütfen tekrar giriş yapın.",
    403: "Bu işlem için yetkiniz bulunmuyor.",
    404: "Aradığınız kaynak bulunamadı.",
    409: "Bu kayıt zaten mevcut.",
    422: "Gönderilen veriler geçersiz.",
    429: "Çok fazla istek gönderdiniz. Lütfen bekleyin.",
    500: "Sunucu hatası. Lütfen daha sonra tekrar deneyin.",
    502: "Sunucu geçici olarak kullanılamıyor.",
    503: "Servis geçici olarak kullanılamıyor.",
    504: "Sunucu yanıt vermedi. Lütfen tekrar deneyin.",
};

/**
 * Convert any error to ApiError with user-friendly message (client-side)
 */
export function handleApiError(error: unknown): ApiError {
    // Already an ApiError
    if (error instanceof ApiError) {
        return error;
    }

    // Network/fetch errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
        return new ApiError(
            "Bağlantı hatası. İnternet bağlantınızı kontrol edin.",
            0,
            "network_error"
        );
    }

    // Standard Error
    if (error instanceof Error) {
        const statusMatch = error.message.match(/(\d{3})/);
        const statusCode = statusMatch ? parseInt(statusMatch[1]) : undefined;

        if (statusCode && HTTP_STATUS_MESSAGES[statusCode]) {
            return new ApiError(
                HTTP_STATUS_MESSAGES[statusCode],
                statusCode
            );
        }

        return new ApiError(error.message);
    }

    // Unknown error
    return new ApiError("Bilinmeyen bir hata oluştu.");
}

/**
 * Get user-friendly message for HTTP status code (client-side)
 */
export function getHttpStatusMessage(statusCode: number): string {
    return HTTP_STATUS_MESSAGES[statusCode] || `Hata kodu: ${statusCode}`;
}

