import { describe, it, expect } from 'vitest';
import { AppError, ValidationError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError } from '../src/lib/errors';

describe('AppError', () => {
    it('should create error with status code and message', () => {
        const error = new AppError(500, 'Test error', 'TEST_CODE');
        expect(error.statusCode).toBe(500);
        expect(error.message).toBe('Test error');
        expect(error.code).toBe('TEST_CODE');
        expect(error.name).toBe('AppError');
    });
});

describe('ValidationError', () => {
    it('should create 400 error', () => {
        const error = new ValidationError('Invalid input');
        expect(error.statusCode).toBe(400);
        expect(error.message).toBe('Invalid input');
        expect(error.code).toBe('VALIDATION_ERROR');
    });
});

describe('UnauthorizedError', () => {
    it('should create 401 error', () => {
        const error = new UnauthorizedError();
        expect(error.statusCode).toBe(401);
        expect(error.code).toBe('UNAUTHORIZED');
    });
});

describe('ForbiddenError', () => {
    it('should create 403 error', () => {
        const error = new ForbiddenError('Access denied');
        expect(error.statusCode).toBe(403);
        expect(error.message).toBe('Access denied');
    });
});

describe('NotFoundError', () => {
    it('should create 404 error', () => {
        const error = new NotFoundError('Resource not found');
        expect(error.statusCode).toBe(404);
        expect(error.message).toBe('Resource not found');
    });
});

describe('ConflictError', () => {
    it('should create 409 error', () => {
        const error = new ConflictError('Duplicate entry');
        expect(error.statusCode).toBe(409);
        expect(error.code).toBe('CONFLICT');
    });
});
