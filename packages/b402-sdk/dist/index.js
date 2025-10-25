"use strict";
// b402 SDK - x402 for BNB Chain
// Exports match x402 API exactly
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.B402_RELAYER_BSC_TESTNET = exports.B402_RELAYER_BSC = exports.USDT_BSC_TESTNET = exports.USDT_BSC = void 0;
__exportStar(require("./types"), exports);
__exportStar(require("./wallet"), exports);
__exportStar(require("./facilitator"), exports);
// Constants
exports.USDT_BSC = "0x55d398326f99059ff775485246999027b3197955";
exports.USDT_BSC_TESTNET = "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd";
exports.B402_RELAYER_BSC = process.env.B402_RELAYER_BSC || "";
exports.B402_RELAYER_BSC_TESTNET = process.env.B402_RELAYER_BSC_TESTNET || "";
//# sourceMappingURL=index.js.map