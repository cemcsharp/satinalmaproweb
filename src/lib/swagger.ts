import swaggerJSDoc from 'swagger-jsdoc';

const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'satinalma.app API',
        version: '1.0.0',
        description: 'Kurumsal Satınalma Yönetim Sistemi REST API Documentation',
        contact: {
            name: 'API Support',
            email: 'destek@satinalma.app'
        }
    },
    servers: [
        {
            url: 'http://localhost:3000',
            description: 'Development server'
        },
        {
            url: 'https://api.satinalma.app',
            description: 'Production server'
        }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            },
            cookieAuth: {
                type: 'apiKey',
                in: 'cookie',
                name: 'next-auth.session-token'
            }
        },
        schemas: {
            Error: {
                type: 'object',
                properties: {
                    error: {
                        type: 'string',
                        description: 'Error code or message'
                    },
                    message: {
                        type: 'string',
                        description: 'Detailed error message'
                    }
                }
            },
            User: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    username: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    role: { type: 'string', enum: ['admin', 'manager', 'user'] },
                    roleName: { type: 'string' },
                    permissions: { type: 'array', items: { type: 'string' } },
                    isAdmin: { type: 'boolean' },
                    createdAt: { type: 'string', format: 'date-time' }
                }
            },
            Request: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    statusId: { type: 'string' },
                    ownerId: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                }
            }
        }
    },
    security: [
        {
            cookieAuth: []
        }
    ]
};

const options = {
    swaggerDefinition,
    apis: [
        './src/app/api/**/*.ts',
        './src/app/api/**/*.tsx'
    ]
};

export const swaggerSpec = swaggerJSDoc(options);
