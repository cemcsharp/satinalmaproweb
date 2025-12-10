export type Request = {
    id: string;
    barcode: string;
    date: string; // ISO
    subject: string;
    budget: number;
    unit: string;
    status: string;
    currency: string;
};

export type RequestDetail = {
    id: string;
    barcode: string;
    subject: string;
    budget: number;
    unit?: string;
    status?: string;
    currency?: string;
    date?: string | null;
    relatedPerson?: string | null;
    unitEmail?: string | null;
    owner?: string | null;
    responsible?: string | null;
    items?: Array<{ id: string; name: string; quantity: number; unit: string | null; unitPrice?: number }>;
    comments?: Array<{ id: string; text: string; author: string | null; createdAt: string | null }>;
    // IDs for editing
    unitId?: string;
    statusId?: string;
    currencyId?: string;
    relatedPersonId?: string;
    ownerUserId?: string;
    responsibleUserId?: string;
};
