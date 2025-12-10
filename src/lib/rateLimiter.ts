// Rate limiting for login attempts
interface LoginAttempt {
  count: number;
  lastAttempt: number;
  blockedUntil?: number;
}

class RateLimiter {
  private attempts: Map<string, LoginAttempt> = new Map();
  private readonly maxAttempts = 5;
  private readonly windowMs = 15 * 60 * 1000; // 15 minutes
  private readonly blockDurationMs = 30 * 60 * 1000; // 30 minutes

  isBlocked(identifier: string): boolean {
    const attempt = this.attempts.get(identifier);
    if (!attempt) return false;

    // Check if still blocked
    if (attempt.blockedUntil && Date.now() < attempt.blockedUntil) {
      return true;
    }

    // Reset if block period has passed
    if (attempt.blockedUntil && Date.now() >= attempt.blockedUntil) {
      this.attempts.delete(identifier);
      return false;
    }

    return false;
  }

  recordAttempt(identifier: string, success: boolean): { blocked: boolean; remainingAttempts: number; blockDuration?: number } {
    const now = Date.now();
    let attempt = this.attempts.get(identifier);

    if (!attempt) {
      attempt = { count: 0, lastAttempt: now };
    }

    // Reset counter if window has passed
    if (now - attempt.lastAttempt > this.windowMs) {
      attempt.count = 0;
    }

    if (success) {
      // Reset on successful login
      this.attempts.delete(identifier);
      return { blocked: false, remainingAttempts: this.maxAttempts };
    }

    // Increment failed attempts
    attempt.count++;
    attempt.lastAttempt = now;

    if (attempt.count >= this.maxAttempts) {
      attempt.blockedUntil = now + this.blockDurationMs;
      this.attempts.set(identifier, attempt);
      return { 
        blocked: true, 
        remainingAttempts: 0, 
        blockDuration: this.blockDurationMs 
      };
    }

    this.attempts.set(identifier, attempt);
    return { 
      blocked: false, 
      remainingAttempts: this.maxAttempts - attempt.count 
    };
  }

  getRemainingAttempts(identifier: string): number {
    const attempt = this.attempts.get(identifier);
    if (!attempt) return this.maxAttempts;

    const now = Date.now();
    
    // Reset if window has passed
    if (now - attempt.lastAttempt > this.windowMs) {
      return this.maxAttempts;
    }

    return Math.max(0, this.maxAttempts - attempt.count);
  }

  getBlockTimeRemaining(identifier: string): number {
    const attempt = this.attempts.get(identifier);
    if (!attempt || !attempt.blockedUntil) return 0;

    const remaining = attempt.blockedUntil - Date.now();
    return Math.max(0, remaining);
  }
}

export const rateLimiter = new RateLimiter();