"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// b402 Facilitator Service - Matches x402.org API
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const ethers_1 = require("ethers");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Configuration
const BSC_RPC = process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org';
const BSC_TESTNET_RPC = process.env.BSC_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545';
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY;
const B402_RELAYER_ADDRESS = process.env.B402_RELAYER_ADDRESS;
if (!RELAYER_PRIVATE_KEY || !B402_RELAYER_ADDRESS) {
    console.error('❌ Missing required env vars: RELAYER_PRIVATE_KEY, B402_RELAYER_ADDRESS');
    process.exit(1);
}
// Provider and wallet
const provider = new ethers_1.ethers.JsonRpcProvider(BSC_RPC);
const testnetProvider = new ethers_1.ethers.JsonRpcProvider(BSC_TESTNET_RPC);
const relayerWallet = new ethers_1.Wallet(RELAYER_PRIVATE_KEY);
// B402Relayer ABI
const B402_ABI = [
    "function transferWithAuthorization(address token, address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s) external",
    "function authorizationState(address authorizer, bytes32 nonce) external view returns (bool)",
];
/**
 * POST /verify
 * Verify payment signature (matches x402 API)
 */
app.post('/verify', async (req, res) => {
    try {
        const { paymentPayload, paymentRequirements } = req.body;
        if (!paymentPayload || !paymentRequirements) {
            return res.status(400).json({
                isValid: false,
                invalidReason: 'Missing paymentPayload or paymentRequirements',
            });
        }
        const { authorization, signature } = paymentPayload.payload;
        const network = paymentRequirements.network || 'bsc';
        // Select provider
        const selectedProvider = network === 'bsc-testnet' ? testnetProvider : provider;
        const relayer = new ethers_1.Contract(paymentRequirements.relayerContract, B402_ABI, selectedProvider);
        // Verify signature locally (EIP-712)
        const domain = {
            name: "B402",
            version: "1",
            chainId: network === 'bsc' ? 56 : 97,
            verifyingContract: paymentRequirements.relayerContract,
        };
        const types = {
            TransferWithAuthorization: [
                { name: "from", type: "address" },
                { name: "to", type: "address" },
                { name: "value", type: "uint256" },
                { name: "validAfter", type: "uint256" },
                { name: "validBefore", type: "uint256" },
                { name: "nonce", type: "bytes32" },
            ],
        };
        const recovered = ethers_1.ethers.verifyTypedData(domain, types, authorization, signature);
        if (recovered.toLowerCase() !== authorization.from.toLowerCase()) {
            return res.json({
                isValid: false,
                invalidReason: "Invalid signature",
            });
        }
        // Check nonce not used
        const isUsed = await relayer.authorizationState(authorization.from, authorization.nonce);
        if (isUsed) {
            return res.json({
                isValid: false,
                invalidReason: "Nonce already used",
            });
        }
        // Check timing
        const now = Math.floor(Date.now() / 1000);
        if (now < authorization.validAfter) {
            return res.json({
                isValid: false,
                invalidReason: "Authorization not yet valid",
            });
        }
        if (now >= authorization.validBefore) {
            return res.json({
                isValid: false,
                invalidReason: "Authorization expired",
            });
        }
        res.json({
            isValid: true,
            payer: authorization.from,
        });
    }
    catch (error) {
        console.error('Verify error:', error);
        res.status(500).json({
            isValid: false,
            invalidReason: error.message,
        });
    }
});
/**
 * POST /settle
 * Execute payment on-chain (matches x402 API)
 */
app.post('/settle', async (req, res) => {
    try {
        const { paymentPayload, paymentRequirements } = req.body;
        if (!paymentPayload || !paymentRequirements) {
            return res.status(400).json({
                success: false,
                network: 'bsc',
                errorReason: 'Missing paymentPayload or paymentRequirements',
            });
        }
        const { authorization, signature } = paymentPayload.payload;
        const network = paymentRequirements.network || 'bsc';
        // Select provider
        const selectedProvider = network === 'bsc-testnet' ? testnetProvider : provider;
        const signer = relayerWallet.connect(selectedProvider);
        const relayer = new ethers_1.Contract(paymentRequirements.relayerContract, B402_ABI, signer);
        // Split signature
        const sig = ethers_1.ethers.Signature.from(signature);
        // Execute transferWithAuthorization
        console.log(`Settling payment: ${authorization.from} → ${authorization.to} (${authorization.value})`);
        const tx = await relayer.transferWithAuthorization(paymentPayload.token, // USDT address
        authorization.from, authorization.to, authorization.value, authorization.validAfter, authorization.validBefore, authorization.nonce, sig.v, sig.r, sig.s, {
            gasLimit: 200000 // Sufficient for transferFrom
        });
        console.log(`Transaction sent: ${tx.hash}`);
        const receipt = await tx.wait();
        console.log(`✅ Payment settled at block ${receipt.blockNumber}`);
        res.json({
            success: true,
            transaction: receipt.hash,
            network,
            payer: authorization.from,
            blockNumber: receipt.blockNumber,
        });
    }
    catch (error) {
        console.error('Settle error:', error);
        res.status(500).json({
            success: false,
            network: req.body.paymentRequirements?.network || 'bsc',
            errorReason: error.message,
        });
    }
});
/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'b402-facilitator',
        network: 'bsc',
        relayer: relayerWallet.address,
    });
});
const PORT = process.env.PORT || 3402;
app.listen(PORT, () => {
    console.log('🔥 b402 Facilitator Service');
    console.log(`📡 Listening on http://localhost:${PORT}`);
    console.log(`🔑 Relayer: ${relayerWallet.address}`);
    console.log(`📝 Contract: ${B402_RELAYER_ADDRESS}`);
    console.log('');
    console.log('Ready to process BNB Chain payments! 🚀');
});
