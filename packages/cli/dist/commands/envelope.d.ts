interface SignOptions {
    action: string;
    payload: string;
}
declare function signEnvelope(options: SignOptions): Promise<void>;
export declare const envelopeCommand: {
    sign: typeof signEnvelope;
};
export {};
//# sourceMappingURL=envelope.d.ts.map