import { describe, it, expect } from 'vitest';
import { hasPermission, hasAllPermissions, PERMISSION_CATEGORIES } from '@/lib/permissions';

describe('Permission System', () => {
    describe('hasPermission', () => {
        it('should return true for admin regardless of permissions', () => {
            const result = hasPermission([], 'talep:delete', 'admin');
            expect(result).toBe(true);
        });

        it('should return false when user has no permissions', () => {
            const result = hasPermission([], 'talep:read', 'user');
            expect(result).toBe(false);
        });

        it('should return false when permissions array is null', () => {
            const result = hasPermission(null, 'talep:read', 'user');
            expect(result).toBe(false);
        });

        it('should return true when user has the required permission', () => {
            const result = hasPermission(['talep:read', 'talep:create'], 'talep:read', 'user');
            expect(result).toBe(true);
        });

        it('should return false when user lacks the required permission', () => {
            const result = hasPermission(['talep:read'], 'talep:delete', 'user');
            expect(result).toBe(false);
        });

        it('should handle array of required permissions (OR logic)', () => {
            const result = hasPermission(
                ['talep:read'],
                ['talep:delete', 'talep:read'],
                'user'
            );
            expect(result).toBe(true);
        });

        it('should return false when user has none of the required permissions', () => {
            const result = hasPermission(
                ['siparis:read'],
                ['talep:delete', 'talep:create'],
                'user'
            );
            expect(result).toBe(false);
        });
    });

    describe('hasAllPermissions', () => {
        it('should return true for admin', () => {
            const result = hasAllPermissions([], ['talep:read', 'talep:delete'], 'admin');
            expect(result).toBe(true);
        });

        it('should return false when user has no permissions', () => {
            const result = hasAllPermissions([], ['talep:read'], 'user');
            expect(result).toBe(false);
        });

        it('should return true when user has all required permissions', () => {
            const result = hasAllPermissions(
                ['talep:read', 'talep:create', 'talep:delete'],
                ['talep:read', 'talep:create'],
                'user'
            );
            expect(result).toBe(true);
        });

        it('should return false when user is missing any required permission', () => {
            const result = hasAllPermissions(
                ['talep:read', 'talep:create'],
                ['talep:read', 'talep:delete'],
                'user'
            );
            expect(result).toBe(false);
        });
    });

    describe('PERMISSION_CATEGORIES', () => {
        it('should define all expected categories', () => {
            expect(PERMISSION_CATEGORIES).toHaveProperty('talep');
            expect(PERMISSION_CATEGORIES).toHaveProperty('siparis');
            expect(PERMISSION_CATEGORIES).toHaveProperty('fatura');
            expect(PERMISSION_CATEGORIES).toHaveProperty('sozlesme');
            expect(PERMISSION_CATEGORIES).toHaveProperty('tedarikci');
            expect(PERMISSION_CATEGORIES).toHaveProperty('rapor');
            expect(PERMISSION_CATEGORIES).toHaveProperty('ayarlar');
        });

        it('should have standard CRUD permissions for talep', () => {
            const talepPerms = PERMISSION_CATEGORIES.talep.permissions.map(p => p.key);
            expect(talepPerms).toContain('talep:read');
            expect(talepPerms).toContain('talep:create');
            expect(talepPerms).toContain('talep:edit');
            expect(talepPerms).toContain('talep:delete');
        });
    });
});
