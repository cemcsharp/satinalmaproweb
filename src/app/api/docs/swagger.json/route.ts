import { NextResponse } from 'next/server';
import { swaggerSpec } from '@/lib/swagger';

/**
 * @swagger
 * /api/docs/swagger.json:
 *   get:
 *     summary: Get OpenAPI specification
 *     description: Returns the full OpenAPI 3.0 specification for this API
 *     tags:
 *       - Documentation
 *     responses:
 *       200:
 *         description: OpenAPI specification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
export async function GET() {
    return NextResponse.json(swaggerSpec);
}
