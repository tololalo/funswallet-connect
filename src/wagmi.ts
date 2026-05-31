import {
  ChainNotConfiguredError,
  type CreateConnectorFn,
  createConnector,
} from '@wagmi/core';
import {
  type Address,
  SwitchChainError,
  UserRejectedRequestError,
  getAddress,
  numberToHex,
} from 'viem';
import {
  createFunsProvider,
  type FunsConnectOptions,
  type FunsProvider,
} from './index';

/** Options for the wagmi connector — same as the core SDK. */
export type FunsWalletParameters = FunsConnectOptions;

funsWallet.type = 'funsWallet' as const;

/**
 * wagmi v2 connector for FunS Wallet.
 *
 * @example
 * import { createConfig, http } from 'wagmi';
 * import { bsc, mainnet } from 'wagmi/chains';
 * import { funsWallet } from '@funswallet/connect/wagmi';
 *
 * export const config = createConfig({
 *   chains: [bsc, mainnet],
 *   connectors: [funsWallet({ projectId: 'YOUR_WC_ID' })],
 *   transports: { [bsc.id]: http(), [mainnet.id]: http() },
 * });
 */
export function funsWallet(
  parameters: FunsWalletParameters = {},
): CreateConnectorFn {
  let walletProvider: FunsProvider | undefined;
  // Single-flight guard: two overlapping connect()/getProvider() calls must
  // not each create a provider (that would leave listeners attached to an
  // orphaned instance). Memoize the in-flight creation promise.
  let providerPromise: Promise<FunsProvider> | undefined;

  let accountsChanged: ((accounts: string[]) => void) | undefined;
  let chainChanged: ((chainId: string | number) => void) | undefined;
  let disconnectListener: (() => void) | undefined;

  return createConnector((config) => {
    async function getProvider(): Promise<FunsProvider> {
      if (walletProvider) return walletProvider;
      if (!providerPromise) {
        providerPromise = createFunsProvider(parameters).then((p) => {
          walletProvider = p;
          return p;
        });
        // If creation fails, clear the cached promise so a later call retries.
        providerPromise.catch(() => {
          providerPromise = undefined;
        });
      }
      return providerPromise;
    }

    function onAccountsChanged(accounts: string[]): void {
      if (accounts.length === 0) {
        void onDisconnect();
      } else {
        config.emitter.emit('change', {
          accounts: accounts.map((a) => getAddress(a)),
        });
      }
    }

    function onChainChanged(chain: string | number): void {
      config.emitter.emit('change', { chainId: Number(chain) });
    }

    async function onDisconnect(): Promise<void> {
      config.emitter.emit('disconnect');
      if (walletProvider) removeListeners(walletProvider);
    }

    function setupListeners(provider: FunsProvider): void {
      if (!accountsChanged) {
        accountsChanged = onAccountsChanged;
        provider.on('accountsChanged', accountsChanged);
      }
      if (!chainChanged) {
        chainChanged = onChainChanged;
        provider.on('chainChanged', chainChanged);
      }
      if (!disconnectListener) {
        disconnectListener = () => {
          void onDisconnect();
        };
        provider.on('disconnect', disconnectListener);
      }
    }

    function removeListeners(provider: FunsProvider): void {
      if (accountsChanged) {
        provider.removeListener('accountsChanged', accountsChanged);
        accountsChanged = undefined;
      }
      if (chainChanged) {
        provider.removeListener('chainChanged', chainChanged);
        chainChanged = undefined;
      }
      if (disconnectListener) {
        provider.removeListener('disconnect', disconnectListener);
        disconnectListener = undefined;
      }
    }

    async function switchChain({ chainId }: { chainId: number }) {
      const provider = await getProvider();
      const chain = config.chains.find((c) => c.id === chainId);
      if (!chain) {
        throw new SwitchChainError(new ChainNotConfiguredError());
      }
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: numberToHex(chainId) }],
      });
      return chain;
    }

    return {
      id: 'funsWallet',
      name: 'FunS Wallet',
      type: funsWallet.type,

      async connect<withCapabilities extends boolean = false>(
        parameters: {
          chainId?: number;
          isReconnecting?: boolean;
          withCapabilities?: withCapabilities | boolean;
        } = {},
      ): Promise<{
        accounts: withCapabilities extends true
          ? readonly { address: Address; capabilities: Record<string, unknown> }[]
          : readonly Address[];
        chainId: number;
      }> {
        try {
          const provider = await getProvider();
          setupListeners(provider);

          const requested = await provider.enable();
          const accounts = requested.map((a) => getAddress(a));

          let currentChainId = provider.chainId;
          if (parameters.chainId && currentChainId !== parameters.chainId) {
            // Attempt to land on the requested chain. Re-throw a user
            // rejection so the dApp learns the connect didn't reach the
            // target chain; only swallow benign "chain not added / not
            // supported by wallet" cases and stay on the current chain.
            try {
              const chain = await switchChain({ chainId: parameters.chainId });
              currentChainId = chain.id;
            } catch (switchError) {
              const m = (switchError as Error)?.message ?? '';
              if (/user rejected|user disapproved|reject/i.test(m)) {
                throw new UserRejectedRequestError(switchError as Error);
              }
              // else: keep currentChainId (wallet stays on its current chain)
            }
          }

          return { accounts, chainId: currentChainId } as unknown as {
            accounts: withCapabilities extends true
              ? readonly {
                  address: Address;
                  capabilities: Record<string, unknown>;
                }[]
              : readonly Address[];
            chainId: number;
          };
        } catch (error) {
          const message = (error as Error)?.message ?? '';
          if (/user rejected|user disapproved|reject/i.test(message)) {
            throw new UserRejectedRequestError(error as Error);
          }
          throw error;
        }
      },

      async disconnect() {
        const provider = await getProvider();
        try {
          await provider.disconnect();
        } catch {
          // already disconnected — ignore
        }
        removeListeners(provider);
      },

      async getAccounts() {
        const provider = await getProvider();
        return provider.accounts.map((a) => getAddress(a)) as readonly Address[];
      },

      async getChainId() {
        const provider = await getProvider();
        return provider.chainId;
      },

      getProvider,

      async isAuthorized() {
        try {
          const provider = await getProvider();
          return Boolean(provider.session) && provider.accounts.length > 0;
        } catch {
          return false;
        }
      },

      switchChain,
      onAccountsChanged,
      onChainChanged,
      onDisconnect,
    };
  });
}
