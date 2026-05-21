# @funswallet/connect

One-line **FunS Wallet** connection for any dApp.
Built on WalletConnect v2 — on mobile it deep-links straight into the FunS
Wallet app, on desktop it shows a QR to scan. Returns a standard EIP-1193
provider, so it works with ethers, viem, web3.js, or raw `request()`.

> No WalletGuide listing required — the SDK targets the FunS Wallet deep link
> (`funswallet://wc?uri=`) directly.

---

## Install

```bash
npm install @funswallet/connect
# or: yarn add @funswallet/connect / pnpm add @funswallet/connect
```

## Quick start (the one-liner)

```js
import { connectFunsWallet } from '@funswallet/connect';

const provider = await connectFunsWallet({ projectId: 'YOUR_WC_PROJECT_ID' });
const [address] = await provider.request({ method: 'eth_requestAccounts' });
console.log('Connected:', address);
```

That's it. `provider` is an EIP-1193 provider:

```js
import { BrowserProvider } from 'ethers'; // ethers v6
const ethersProvider = new BrowserProvider(provider);
const signer = await ethersProvider.getSigner();
```

## Ready-made button (no framework)

```html
<div id="connect"></div>
<script type="module">
  import { renderFunsConnectButton } from 'https://esm.sh/@funswallet/connect';
  renderFunsConnectButton(document.getElementById('connect'), {
    projectId: 'YOUR_WC_PROJECT_ID',
    onConnect: (_provider, [address]) => alert('Connected: ' + address),
  });
</script>
```

## wagmi

There's a dedicated wagmi v2 connector at `@funswallet/connect/wagmi`. Add it to
your `connectors` array — one line:

```ts
import { createConfig, http } from 'wagmi';
import { bsc, mainnet } from 'wagmi/chains';
import { funsWallet } from '@funswallet/connect/wagmi';

export const config = createConfig({
  chains: [bsc, mainnet],
  connectors: [funsWallet({ projectId: 'YOUR_WC_PROJECT_ID' })],
  transports: { [bsc.id]: http(), [mainnet.id]: http() },
});
```

It reuses the same deep-link-aware provider, so mobile users jump straight into
the FunS Wallet app. Requires `wagmi`/`viem` (peer deps you already have in a
wagmi app).

## CDN / plain `<script>`

Modern (ESM, recommended — handles all polyfills):

```html
<script type="module">
  import { connectFunsWallet } from 'https://esm.sh/@funswallet/connect';
  document.querySelector('#btn').onclick = () =>
    connectFunsWallet({ projectId: 'YOUR_WC_PROJECT_ID' });
</script>
```

Classic global (`window.FunsConnect`):

```html
<script src="https://cdn.jsdelivr.net/npm/@funswallet/connect/dist/funs-connect.global.js"></script>
<script>
  document.querySelector('#btn').onclick = () =>
    FunsConnect.connectFunsWallet({ projectId: 'YOUR_WC_PROJECT_ID' });
</script>
```

---

## API

### `connectFunsWallet(options?) => Promise<FunsProvider>`

Creates a provider and connects (mobile: deep-link, desktop: QR).

### `createFunsProvider(options?) => Promise<FunsProvider>`

Same setup but does **not** connect — for advanced flows (e.g. wagmi).

### `renderFunsConnectButton(container, options?) => HTMLButtonElement`

Injects a branded "Connect FunS Wallet" button.

### Options

| Option          | Type                       | Default                  | Notes                                            |
| --------------- | -------------------------- | ------------------------ | ------------------------------------------------ |
| `projectId`     | `string`                   | FunS public id           | **Pass your own** for production (reown.com).     |
| `chains`        | `number[]`                 | `[56, 1]`                | Required chains (chain ids).                      |
| `optionalChains`| `number[]`                 | —                        | Extra chains the wallet may approve.              |
| `rpcMap`        | `Record<number,string>`    | —                        | Custom RPC per chain id.                          |
| `showQrModal`   | `boolean`                  | desktop `true`/mobile `false` | Desktop QR modal.                          |
| `deepLink`      | `boolean`                  | `true`                   | Mobile deep-link into FunS Wallet.                |
| `metadata`      | `{name,description,url,icons}` | page title/origin    | Shown in the wallet approval screen.              |

### Supported chains

`FUNS_CHAINS` = `{ ETHEREUM: 1, BSC: 56, BSC_TESTNET: 97, OPBNB: 204, SEPOLIA: 11155111 }`

```js
import { connectFunsWallet, FUNS_CHAINS } from '@funswallet/connect';
await connectFunsWallet({ chains: [FUNS_CHAINS.BSC], projectId: '...' });
```

---

## Notes

- **projectId**: WalletConnect requires one for the relay. The fallback lets you
  try the SDK instantly, but it shares FunS's metered quota — get your own free
  id at <https://dashboard.reown.com> for production.
- This SDK targets **FunS Wallet specifically** via its deep link, so it works
  even though FunS isn't yet listed in the WalletConnect WalletGuide registry.
- For desktop browser users with the **FunS Wallet extension** installed, you
  don't need this SDK at all — the extension is auto-discovered via EIP-6963 by
  wagmi / RainbowKit / Reown AppKit.

## License

MIT
