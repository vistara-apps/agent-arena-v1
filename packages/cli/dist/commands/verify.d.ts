interface VerifyOptions {
    bounty: string;
    adapter: string;
}
declare function verifyWork(options: VerifyOptions): Promise<void>;
export declare const verifyCommand: {
    verify: typeof verifyWork;
};
export {};
//# sourceMappingURL=verify.d.ts.map