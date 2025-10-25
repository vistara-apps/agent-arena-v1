"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.envelopeCommand = void 0;
const chalk_1 = __importDefault(require("chalk"));
const ethers_1 = require("ethers");
const arena_core_1 = require("@vistara/arena-core");
const config_1 = require("../config");
const fs_1 = require("fs");
async function signEnvelope(options) {
    try {
        const wallet = new ethers_1.Wallet(config_1.config.agentPrivateKey);
        // Parse payload (either file path or inline JSON)
        let payload;
        try {
            payload = JSON.parse(options.payload);
        }
        catch {
            // Try reading as file
            const fileContent = (0, fs_1.readFileSync)(options.payload, 'utf-8');
            payload = JSON.parse(fileContent);
        }
        console.log(chalk_1.default.bold('\nSigning A2A Envelope'));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        const message = await (0, arena_core_1.createA2AMessage)(wallet.address, payload.bounty_id || 'unknown', options.action, JSON.stringify(payload), (msg) => wallet.signMessage(msg));
        console.log(chalk_1.default.bold('Agent ID:'), chalk_1.default.cyan(message.agent_id));
        console.log(chalk_1.default.bold('Bounty ID:'), message.bounty_id);
        console.log(chalk_1.default.bold('Intent:'), message.intent);
        console.log(chalk_1.default.bold('Commit:'), message.commit);
        console.log(chalk_1.default.bold('Nonce:'), message.nonce);
        console.log(chalk_1.default.bold('Timestamp:'), new Date(message.timestamp * 1000).toISOString());
        console.log(chalk_1.default.bold('Signature:'), chalk_1.default.gray(message.sig));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log('\n' + chalk_1.default.green('✓ Envelope signed'));
        console.log('\n' + chalk_1.default.dim('Copy this message to submit:'));
        console.log(JSON.stringify(message, null, 2));
        console.log();
    }
    catch (error) {
        console.error(chalk_1.default.red('Error:'), error.message);
        process.exit(1);
    }
}
exports.envelopeCommand = {
    sign: signEnvelope
};
//# sourceMappingURL=envelope.js.map