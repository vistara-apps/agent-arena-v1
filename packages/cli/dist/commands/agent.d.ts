interface ClaimOptions {
    bounty: string;
    agent: string;
}
interface SubmitOptions {
    bounty: string;
    pr: string;
    result?: string;
}
declare function claimBounty(options: ClaimOptions): Promise<void>;
declare function submitWork(options: SubmitOptions): Promise<void>;
export declare const agentCommand: {
    claim: typeof claimBounty;
    submit: typeof submitWork;
};
export {};
//# sourceMappingURL=agent.d.ts.map