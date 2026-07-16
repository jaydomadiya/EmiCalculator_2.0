export type CryptoOption = {
  symbol: string;
  name: string;
};

// Curated names for the most commonly searched coins. Any symbol returned by
// the live price feed but missing here still works — it just falls back to
// showing its ticker as the display name (see getCryptoMeta below).
export const CRYPTO_CURRENCIES: CryptoOption[] = [
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'USDT', name: 'Tether' },
  { symbol: 'BNB', name: 'BNB' },
  { symbol: 'USDC', name: 'USD Coin' },
  { symbol: 'XRP', name: 'XRP' },
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'ADA', name: 'Cardano' },
  { symbol: 'DOGE', name: 'Dogecoin' },
  { symbol: 'TRX', name: 'TRON' },
  { symbol: 'TON', name: 'Toncoin' },
  { symbol: 'AVAX', name: 'Avalanche' },
  { symbol: 'SHIB', name: 'Shiba Inu' },
  { symbol: 'DOT', name: 'Polkadot' },
  { symbol: 'LINK', name: 'Chainlink' },
  { symbol: 'MATIC', name: 'Polygon' },
  { symbol: 'POL', name: 'Polygon Ecosystem Token' },
  { symbol: 'LTC', name: 'Litecoin' },
  { symbol: 'BCH', name: 'Bitcoin Cash' },
  { symbol: 'ICP', name: 'Internet Computer' },
  { symbol: 'UNI', name: 'Uniswap' },
  { symbol: 'ATOM', name: 'Cosmos' },
  { symbol: 'XLM', name: 'Stellar' },
  { symbol: 'ETC', name: 'Ethereum Classic' },
  { symbol: 'FIL', name: 'Filecoin' },
  { symbol: 'APT', name: 'Aptos' },
  { symbol: 'ARB', name: 'Arbitrum' },
  { symbol: 'OP', name: 'Optimism' },
  { symbol: 'NEAR', name: 'NEAR Protocol' },
  { symbol: 'VET', name: 'VeChain' },
  { symbol: 'HBAR', name: 'Hedera' },
  { symbol: 'MKR', name: 'Maker' },
  { symbol: 'GRT', name: 'The Graph' },
  { symbol: 'AAVE', name: 'Aave' },
  { symbol: 'ALGO', name: 'Algorand' },
  { symbol: 'EGLD', name: 'MultiversX' },
  { symbol: 'SAND', name: 'The Sandbox' },
  { symbol: 'MANA', name: 'Decentraland' },
  { symbol: 'XTZ', name: 'Tezos' },
  { symbol: 'EOS', name: 'EOS' },
  { symbol: 'THETA', name: 'Theta Network' },
  { symbol: 'AXS', name: 'Axie Infinity' },
  { symbol: 'FTM', name: 'Fantom' },
  { symbol: 'CHZ', name: 'Chiliz' },
  { symbol: 'ZEC', name: 'Zcash' },
  { symbol: 'DASH', name: 'Dash' },
  { symbol: 'KSM', name: 'Kusama' },
  { symbol: 'RUNE', name: 'THORChain' },
  { symbol: 'CRV', name: 'Curve DAO Token' },
  { symbol: 'COMP', name: 'Compound' },
  { symbol: 'ENJ', name: 'Enjin Coin' },
  { symbol: 'BAT', name: 'Basic Attention Token' },
  { symbol: 'ZIL', name: 'Zilliqa' },
  { symbol: 'WAVES', name: 'Waves' },
  { symbol: 'QTUM', name: 'Qtum' },
  { symbol: 'IOST', name: 'IOST' },
  { symbol: 'ANKR', name: 'Ankr' },
  { symbol: 'CELO', name: 'Celo' },
  { symbol: 'KAVA', name: 'Kava' },
  { symbol: 'SUSHI', name: 'SushiSwap' },
  { symbol: 'YFI', name: 'yearn.finance' },
  { symbol: 'SNX', name: 'Synthetix' },
  { symbol: 'REN', name: 'Ren' },
  { symbol: 'BAL', name: 'Balancer' },
  { symbol: 'UMA', name: 'UMA' },
  { symbol: 'GALA', name: 'Gala' },
  { symbol: 'IMX', name: 'Immutable' },
  { symbol: 'FLOW', name: 'Flow' },
  { symbol: 'KLAY', name: 'Klaytn' },
  { symbol: 'ROSE', name: 'Oasis Network' },
  { symbol: 'MINA', name: 'Mina' },
  { symbol: 'AR', name: 'Arweave' },
  { symbol: 'ASTR', name: 'Astar' },
  { symbol: 'INJ', name: 'Injective' },
  { symbol: 'SUI', name: 'Sui' },
  { symbol: 'SEI', name: 'Sei' },
  { symbol: 'TIA', name: 'Celestia' },
  { symbol: 'PYTH', name: 'Pyth Network' },
  { symbol: 'JUP', name: 'Jupiter' },
  { symbol: 'WIF', name: 'dogwifhat' },
  { symbol: 'PEPE', name: 'Pepe' },
  { symbol: 'FLOKI', name: 'Floki' },
  { symbol: 'BONK', name: 'Bonk' },
  { symbol: 'RNDR', name: 'Render' },
  { symbol: 'LDO', name: 'Lido DAO' },
  { symbol: 'STX', name: 'Stacks' },
  { symbol: 'CFX', name: 'Conflux' },
  { symbol: 'GMX', name: 'GMX' },
  { symbol: 'DYDX', name: 'dYdX' },
  { symbol: 'ENS', name: 'Ethereum Name Service' },
  { symbol: 'CAKE', name: 'PancakeSwap' },
  { symbol: 'TWT', name: 'Trust Wallet Token' },
  { symbol: 'ONE', name: 'Harmony' },
  { symbol: 'HOT', name: 'Holo' },
  { symbol: 'WOO', name: 'WOO Network' },
];

export const CRYPTO_LOOKUP: Record<string, CryptoOption> = CRYPTO_CURRENCIES.reduce(
  (map, coin) => {
    map[coin.symbol] = coin;
    return map;
  },
  {} as Record<string, CryptoOption>,
);

export function getCryptoMeta(symbol: string): CryptoOption {
  return CRYPTO_LOOKUP[symbol] ?? { symbol, name: symbol };
}

const BADGE_COLORS = [
  '#1E7A54',
  '#C98A3E',
  '#4C5A8F',
  '#B5657D',
  '#2E7D8C',
  '#7C6A9E',
  '#C9A24B',
  '#3E7CA6',
  '#C97552',
  '#8B6F9E',
];

export function getCryptoBadgeColor(symbol: string): string {
  let hash = 0;
  for (let i = 0; i < symbol.length; i += 1) {
    hash = (hash * 31 + symbol.charCodeAt(i)) % BADGE_COLORS.length;
  }
  return BADGE_COLORS[Math.abs(hash) % BADGE_COLORS.length];
}
