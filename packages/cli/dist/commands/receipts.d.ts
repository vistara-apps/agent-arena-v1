interface ShowReceiptsOptions {
    bounty?: string;
    agent?: string;
}
declare function showReceipts(options: ShowReceiptsOptions): Promise<void>;
declare function verifyReceipt(receiptHash: string): Promise<void>;
export declare const receiptsCommand: {
    show: typeof showReceipts;
    verify: typeof verifyReceipt;
};
export {};
//# sourceMappingURL=receipts.d.ts.map