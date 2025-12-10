export type Contract = {
    id: string;
    number: string;
    title: string;
    status: string;
    createdAt: string;
    startDate?: string | Date | null;
    endDate?: string | Date | null;
};

export type ContractDetail = {
    id: string;
    number: string;
    title: string;
    status: string;
    startDate?: string | Date | null;
    endDate?: string | Date | null;
    version?: number | null;
    parties?: string | null;
    createdAt?: string | Date | null;
};
