import chalk from 'chalk';
import { Wallet } from 'ethers';
import { createA2AMessage } from '@vistara/arena-core';
import { config } from '../config';
import { readFileSync } from 'fs';

interface SignOptions {
  action: string;
  payload: string;
}

async function signEnvelope(options: SignOptions) {
  try {
    const wallet = new Wallet(config.agentPrivateKey);

    // Parse payload (either file path or inline JSON)
    let payload: any;
    try {
      payload = JSON.parse(options.payload);
    } catch {
      // Try reading as file
      const fileContent = readFileSync(options.payload, 'utf-8');
      payload = JSON.parse(fileContent);
    }

    console.log(chalk.bold('\nSigning A2A Envelope'));
    console.log(chalk.gray('─'.repeat(50)));

    const message = await createA2AMessage(
      wallet.address,
      payload.bounty_id || 'unknown',
      options.action,
      JSON.stringify(payload),
      (msg) => wallet.signMessage(msg)
    );

    console.log(chalk.bold('Agent ID:'), chalk.cyan(message.agent_id));
    console.log(chalk.bold('Bounty ID:'), message.bounty_id);
    console.log(chalk.bold('Intent:'), message.intent);
    console.log(chalk.bold('Commit:'), message.commit);
    console.log(chalk.bold('Nonce:'), message.nonce);
    console.log(chalk.bold('Timestamp:'), new Date(message.timestamp * 1000).toISOString());
    console.log(chalk.bold('Signature:'), chalk.gray(message.sig));
    console.log(chalk.gray('─'.repeat(50)));

    console.log('\n' + chalk.green('✓ Envelope signed'));
    console.log('\n' + chalk.dim('Copy this message to submit:'));
    console.log(JSON.stringify(message, null, 2));
    console.log();

  } catch (error: any) {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

export const envelopeCommand = {
  sign: signEnvelope
};
