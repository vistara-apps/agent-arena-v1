interface CreateBountyOptions {
    repo: string;
    issue: string;
    escrow: string;
    currency?: string;
}
declare function createBounty(options: CreateBountyOptions): Promise<void>;
declare function listBounties(): Promise<void>;
declare function showBounty(bountyId: string): Promise<void>;
export declare const bountyCommand: {
    create: typeof createBounty;
    list: typeof listBounties;
    show: typeof showBounty;
};
export {};
//# sourceMappingURL=bounty.d.ts.map