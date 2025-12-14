'use client';

import { useEffect, useState } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function ApiDocsPage() {
    const [spec, setSpec] = useState(null);

    useEffect(() => {
        fetch('/api/docs/swagger.json')
            .then(res => res.json())
            .then(data => setSpec(data))
            .catch(err => console.error('Failed to load API spec:', err));
    }, []);

    if (!spec) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading API Documentation...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white p-6">
                <h1 className="text-3xl font-bold">SatınalmaPRO API</h1>
                <p className="text-blue-100 mt-2">REST API Documentation v1.0.0</p>
            </div>
            <SwaggerUI spec={spec} />
        </div>
    );
}
