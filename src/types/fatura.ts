export type Invoice = {
    id: string;
    number: string;
    orderNo: string;
    status: string;
    amount: number;
    createdAt: string;
    dueDate?: string | null;
    currency?: string; // Added for consistency if needed
};

export type InvoiceDetail = {
    id: string;
    number: string;
    orderNo: string;
    status: string;
    amount: number;
    createdAt: string;
    dueDate?: string | null;
    bank?: string | null;
    vatRate?: number | null;
    withholdingCode?: string | null;
    items?: Array<{
        id: string;
        name: string;
        quantity: number;
        unitPrice: number;
        taxRate?: number | null;
    }>;
    order?: {
        supplier?: {
            name?: string;
            taxId?: string | null;
        };
        company?: {
            name?: string;
            taxId?: string | null;
            address?: string | null;
        };
    };
};
