import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter } from '@/lib/rateLimiter';
import { jsonError } from '@/lib/apiError';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, success } = body;

    if (!identifier) {
      return jsonError(400, 'invalid_payload', { message: 'Identifier is required' });
    }

    // Check if currently blocked
    if (rateLimiter.isBlocked(identifier)) {
      const blockTimeRemaining = rateLimiter.getBlockTimeRemaining(identifier);
      return NextResponse.json({
        blocked: true,
        remainingAttempts: 0,
        blockTimeRemaining
      });
    }

    // If this is just a check (no success parameter), return current status
    if (success === undefined) {
      const remainingAttempts = rateLimiter.getRemainingAttempts(identifier);
      return NextResponse.json({
        blocked: false,
        remainingAttempts
      });
    }

    // Record the attempt
    const result = rateLimiter.recordAttempt(identifier, success === true);
    
    return NextResponse.json({
      blocked: result.blocked,
      remainingAttempts: result.remainingAttempts,
      blockDuration: result.blockDuration
    });

  } catch (error) {
    console.error('Rate limit API error:', error);
    return jsonError(500, 'server_error');
  }
}