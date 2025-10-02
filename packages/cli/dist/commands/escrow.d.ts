interface ReleaseOptions {
    bounty: string;
    attestation: string;
}
declare function releaseEscrow(options: ReleaseOptions): Promise<void>;
declare function checkEscrowStatus(bountyId: string): Promise<void>;
export declare const escrowCommand: {
    release: typeof releaseEscrow;
    status: typeof checkEscrowStatus;
};
export {};
//# sourceMappingURL=escrow.d.ts.map