import '@testing-library/dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
    cleanup();
});

// Mock next/navigation
const mockRouter = {
    push: () => { },
    replace: () => { },
    prefetch: () => { },
    back: () => { },
    forward: () => { },
};

// @ts-ignore
global.useRouter = () => mockRouter;
