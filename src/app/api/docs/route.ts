import { NextResponse } from 'next/server';
import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'SatınalmaPRO API',
            version: '1.0.0',
            description: 'Satınalma Yönetim Sistemi API Dokümantasyonu',
            contact: {
                name: 'API Support',
                email: 'support@satinalmapro.com'
            }
        },
        servers: [
            {
                url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
                description: 'API Server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'string',
                            description: 'Error message'
                        },
                        code: {
                            type: 'string',
                            description: 'Error code'
                        }
                    }
                },
                Request: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        barcode: { type: 'string' },
                        subject: { type: 'string' },
                        description: { type: 'string' },
                        budget: { type: 'number' },
                        status: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                Order: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        barcode: { type: 'string' },
                        requestBarcode: { type: 'string' },
                        total: { type: 'number' },
                        status: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                DeliveryReceipt: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        code: { type: 'string' },
                        orderId: { type: 'string' },
                        date: { type: 'string', format: 'date' },
                        status: { type: 'string' }
                    }
                },
                Invoice: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        number: { type: 'string' },
                        orderNo: { type: 'string' },
                        amount: { type: 'number' },
                        dueDate: { type: 'string', format: 'date' },
                        status: { type: 'string' }
                    }
                },
                Contract: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        title: { type: 'string' },
                        startDate: { type: 'string', format: 'date' },
                        endDate: { type: 'string', format: 'date' },
                        amount: { type: 'number' }
                    }
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: ['./src/app/api/**/*.ts']
};

const swaggerSpec = swaggerJsdoc(options);

export async function GET() {
    return NextResponse.json(swaggerSpec);
}
