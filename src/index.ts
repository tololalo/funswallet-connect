import { EthereumProvider } from '@walletconnect/ethereum-provider';
import {
  DEFAULT_CHAINS,
  FUNS_DEFAULT_PROJECT_ID,
  FUNS_HOMEPAGE,
  FUNS_WALLET_ICON,
  FUNS_WALLET_NAME,
} from './constants';
import { isMobile, openFunsWallet } from './utils';

export * from './constants';
export { isMobile, isAndroid, openFunsWallet } from './utils';

/** The EIP-1193 provider returned by the SDK (WalletConnect v2). */
export type FunsProvider = Awaited<ReturnType<typeof EthereumProvider.init>>;

export interface FunsConnectOptions {
  /**
   * WalletConnect projectId. Optional — falls back to FunS's public id, but
   * production dApps should pass their own (free at dashboard.reown.com).
   */
  projectId?: string;
  /** Required chains (chain ids). Default: [56, 1] (BSC, Ethereum). */
  chains?: number[];
  /** Optional chains the wallet may also approve. */
  optionalChains?: number[];
  /** Custom RPC URLs per chain id. */
  rpcMap?: Record<number, string>;
  /**
   * Desktop: show the WalletConnect QR modal.
   * Default: true on desktop, false on mobile (deep-link instead).
   */
  showQrModal?: boolean;
  /**
   * Mobile: deep-link straight into the FunS Wallet app on `display_uri`.
   * Default: true (only takes effect on mobile).
   */
  deepLink?: boolean;
  /** dApp metadata shown in the wallet approval screen. */
  metadata?: {
    name: string;
    description: string;
    url: string;
    icons: string[];
  };
}

function defaultMetadata(): NonNullable<FunsConnectOptions['metadata']> {
  const url =
    typeof window !== 'undefined' && window.location
      ? window.location.origin
      : FUNS_HOMEPAGE;
  const name =
    typeof document !== 'undefined' && document.title ? document.title : 'dApp';
  return { name, description: name, url, icons: [FUNS_WALLET_ICON] };
}

/**
 * Create a FunS Wallet EIP-1193 provider WITHOUT connecting.
 * Useful for advanced flows (e.g. wiring into wagmi). Most apps should just
 * call {@link connectFunsWallet}.
 */
export async function createFunsProvider(
  options: FunsConnectOptions = {},
): Promise<FunsProvider> {
  const projectId = options.projectId ?? FUNS_DEFAULT_PROJECT_ID;
  if (!options.projectId && typeof console !== 'undefined') {
    console.warn(
      '[funs-connect] No projectId provided — using FunS public projectId. ' +
        'For production, pass your own WalletConnect projectId ' +
        '(free at https://dashboard.reown.com).',
    );
  }

  const mobile = isMobile();
  const showQrModal = options.showQrModal ?? !mobile;

  // Build init options without explicit `undefined` keys — WalletConnect's
  // `EthereumProviderOptions` uses a strict `ArrayOneOrMore` union that rejects
  // `optionalChains: undefined`.
  type InitOptions = Parameters<typeof EthereumProvider.init>[0];
  const initOptions = {
    projectId,
    chains: options.chains ?? DEFAULT_CHAINS,
    showQrModal,
    metadata: options.metadata ?? defaultMetadata(),
    ...(options.optionalChains && options.optionalChains.length > 0
      ? { optionalChains: options.optionalChains }
      : {}),
    ...(options.rpcMap ? { rpcMap: options.rpcMap } : {}),
  } as unknown as InitOptions;

  const provider = await EthereumProvider.init(initOptions);

  const useDeepLink = (options.deepLink ?? true) && mobile;
  if (useDeepLink) {
    // On mobile, jump straight into the FunS Wallet app instead of showing a QR.
    provider.on('display_uri', (uri: string) => {
      openFunsWallet(uri);
    });
  }

  return provider;
}

/**
 * Connect to FunS Wallet in one line.
 *
 * - Mobile: deep-links straight into the FunS Wallet app.
 * - Desktop: shows a WalletConnect QR to scan with FunS Wallet.
 *
 * @example
 * const provider = await connectFunsWallet({ projectId: 'YOUR_WC_ID' });
 * const [address] = await provider.request({ method: 'eth_requestAccounts' });
 *
 * @returns a connected EIP-1193 provider.
 */
export async function connectFunsWallet(
  options: FunsConnectOptions = {},
): Promise<FunsProvider> {
  const provider = await createFunsProvider(options);
  await provider.enable();
  return provider;
}

export interface FunsButtonOptions extends FunsConnectOptions {
  /** Called after a successful connection. */
  onConnect?: (provider: FunsProvider, accounts: string[]) => void;
  /** Called on connect failure / user rejection. */
  onError?: (error: unknown) => void;
  /** Button label. Default: "Connect FunS Wallet". */
  label?: string;
}

/**
 * Render a ready-made, branded "Connect FunS Wallet" button into a container.
 * Pure DOM — no framework required.
 *
 * @example
 * renderFunsConnectButton(document.getElementById('app'), {
 *   projectId: 'YOUR_WC_ID',
 *   onConnect: (_p, [addr]) => console.log('connected', addr),
 * });
 */
export function renderFunsConnectButton(
  container: HTMLElement,
  options: FunsButtonOptions = {},
): HTMLButtonElement {
  const { onConnect, onError, label, ...connectOptions } = options;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.style.cssText = [
    'display:inline-flex',
    'align-items:center',
    'gap:8px',
    'padding:10px 18px',
    'border:none',
    'border-radius:12px',
    'background:#FF6B35',
    'color:#fff',
    'font-weight:600',
    'font-size:15px',
    'cursor:pointer',
  ].join(';');

  const icon = document.createElement('img');
  icon.src = FUNS_WALLET_ICON;
  icon.alt = FUNS_WALLET_NAME;
  icon.width = 20;
  icon.height = 20;
  icon.style.cssText = 'border-radius:6px';

  const text = document.createElement('span');
  text.textContent = label ?? `Connect ${FUNS_WALLET_NAME}`;

  btn.appendChild(icon);
  btn.appendChild(text);

  btn.addEventListener('click', () => {
    btn.disabled = true;
    void (async () => {
      try {
        const provider = await connectFunsWallet(connectOptions);
        const accounts = (provider.accounts as string[]) ?? [];
        onConnect?.(provider, accounts);
      } catch (error) {
        onError?.(error);
      } finally {
        btn.disabled = false;
      }
    })();
  });

  container.appendChild(btn);
  return btn;
}
