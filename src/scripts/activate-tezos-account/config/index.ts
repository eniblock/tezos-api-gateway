import { parseInt } from '../../../utils/parse-int';

export const tezosPrivateKey =
  process.env.TEZOS_PRIVATE_KEY ||
  'edskRp4HS1SHZAi7hyj3PtwXHZWzf5Hb3XqrTPRzfX5JtjM5YvMiPsRRzzyc15pTmJRdE9t8p4NLu4agQ3izTRjuoy2HMZmWSL';

export const vaultKeys = (process.env.VAULT_KEYS || 'dsp').split(',');
export const transferAmount = parseInt(100, process.env.TRANSFER_AMOUNT);
