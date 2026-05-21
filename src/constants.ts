/**
 * FunS Wallet deep-link + branding constants.
 */

/** Custom URL scheme handled by the FunS Wallet mobile app. */
export const FUNS_DEEP_LINK_BASE = 'funswallet://wc';

/** Universal/App link fallback (also handled by the app). */
export const FUNS_UNIVERSAL_LINK_BASE = 'https://funswallet.world/wc';

export const FUNS_WALLET_NAME = 'FunS Wallet';
export const FUNS_WALLET_ICON = 'https://funswallet.world/icons/funs-nugi.png';
export const FUNS_HOMEPAGE = 'https://funswallet.world';
export const FUNS_PLAY_STORE =
  'https://play.google.com/store/apps/details?id=world.funs.wallet';

/**
 * Public WalletConnect projectId used as a fallback when the integrator does
 * not provide one. WalletConnect projectIds are public by design, but relay
 * usage is metered per id — production dApps SHOULD pass their own projectId
 * (free at https://dashboard.reown.com) so they don't share FunS's quota.
 */
export const FUNS_DEFAULT_PROJECT_ID = '69743e36f0ab8b45af2a1c5af8b60cf8';

/** Chain ids FunS Wallet supports. */
export const FUNS_CHAINS = {
  ETHEREUM: 1,
  BSC: 56,
  BSC_TESTNET: 97,
  OPBNB: 204,
  SEPOLIA: 11155111,
} as const;

/** Default required chains when the integrator doesn't specify any. */
export const DEFAULT_CHAINS: number[] = [FUNS_CHAINS.BSC, FUNS_CHAINS.ETHEREUM];
