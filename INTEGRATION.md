# Integrate FunS Wallet into your dApp

Add **FunS Wallet** as a connect option in your dApp in one line.
`@funswallet/connect` wraps WalletConnect v2: on mobile it deep-links straight
into the FunS Wallet app, on desktop it shows a QR to scan. You get back a
standard **EIP-1193 provider**, so it drops into ethers, viem, web3.js, or
wagmi.

- npm: https://www.npmjs.com/package/@funswallet/connect
- No WalletGuide listing required — the SDK targets FunS Wallet's deep link
  (`funswallet://wc`) directly.

---

## Install

```bash
npm install @funswallet/connect
# yarn add @funswallet/connect  /  pnpm add @funswallet/connect
```

You also need a free **WalletConnect projectId** (one per dApp) from
<https://dashboard.reown.com>. Pass it in (see below).

---

## Quick start (the one-liner)

```js
import { connectFunsWallet } from "@funswallet/connect";

const provider = await connectFunsWallet({ projectId: "YOUR_WC_PROJECT_ID" });
const [address] = await provider.request({ method: "eth_requestAccounts" });
console.log("Connected:", address);
```

`provider` is an EIP-1193 provider. Mobile users are deep-linked into the FunS
Wallet app; desktop users get a WalletConnect QR.

---

## Use with your stack

### ethers v6

```js
import { connectFunsWallet } from "@funswallet/connect";
import { BrowserProvider } from "ethers";

const eip1193 = await connectFunsWallet({ projectId: "YOUR_WC_PROJECT_ID" });
const provider = new BrowserProvider(eip1193);
const signer = await provider.getSigner();
const address = await signer.getAddress();
```

### viem

```js
import { connectFunsWallet } from "@funswallet/connect";
import { createWalletClient, custom } from "viem";
import { bsc } from "viem/chains";

const eip1193 = await connectFunsWallet({ projectId: "YOUR_WC_PROJECT_ID" });
const client = createWalletClient({ chain: bsc, transport: custom(eip1193) });
const [address] = await client.getAddresses();
```

### wagmi (v2)

There's a dedicated connector at `@funswallet/connect/wagmi`:

```ts
import { createConfig, http } from "wagmi";
import { bsc, mainnet } from "wagmi/chains";
import { funsWallet } from "@funswallet/connect/wagmi";

export const config = createConfig({
  chains: [bsc, mainnet],
  connectors: [funsWallet({ projectId: "YOUR_WC_PROJECT_ID" })],
  transports: { [bsc.id]: http(), [mainnet.id]: http() },
});
```

Then use wagmi's `useConnect()` as usual — FunS Wallet shows up as a connector.

### Vanilla / no framework — ready-made button

```html
<div id="connect"></div>
<script type="module">
  import { renderFunsConnectButton } from "https://esm.sh/@funswallet/connect";
  renderFunsConnectButton(document.getElementById("connect"), {
    projectId: "YOUR_WC_PROJECT_ID",
    onConnect: (_provider, [address]) => alert("Connected: " + address),
    onError: (e) => console.error(e),
  });
</script>
```

### CDN / plain `<script>` (global)

```html
<script src="https://cdn.jsdelivr.net/npm/@funswallet/connect/dist/funs-connect.global.js"></script>
<script>
  document.querySelector("#btn").onclick = async () => {
    const provider = await FunsConnect.connectFunsWallet({
      projectId: "YOUR_WC_PROJECT_ID",
    });
    const [addr] = await provider.request({ method: "eth_requestAccounts" });
  };
</script>
```

(ESM via esm.sh is recommended — it resolves all sub-dependencies for you.)

---

## Accounts, chain, events

The provider follows EIP-1193:

```js
// current state
provider.accounts; // string[]
provider.chainId; // number

// requests
await provider.request({ method: "personal_sign", params: [msgHex, address] });
await provider.request({ method: "eth_sendTransaction", params: [tx] });
await provider.request({
  method: "wallet_switchEthereumChain",
  params: [{ chainId: "0x38" }],
});

// events
provider.on("accountsChanged", (accounts) => {
  /* ... */
});
provider.on("chainChanged", (chainId) => {
  /* ... */
});
provider.on("disconnect", () => {
  /* ... */
});

// end the session
await provider.disconnect();
```

---

## Options

`connectFunsWallet(options)` / `createFunsProvider(options)`:

| Option           | Type                           | Default                         | Notes                                  |
| ---------------- | ------------------------------ | ------------------------------- | -------------------------------------- |
| `projectId`      | `string`                       | FunS public id (shared)         | **Pass your own** for production.      |
| `chains`         | `number[]`                     | `[56, 1]`                       | Required chains (chain ids).           |
| `optionalChains` | `number[]`                     | —                               | Extra chains the wallet may approve.   |
| `rpcMap`         | `Record<number,string>`        | —                               | Custom RPC URL per chain id.           |
| `showQrModal`    | `boolean`                      | desktop `true` / mobile `false` | Desktop QR modal.                      |
| `deepLink`       | `boolean`                      | `true`                          | Mobile deep-link into FunS Wallet.     |
| `metadata`       | `{name,description,url,icons}` | page title / origin             | Shown on the wallet's approval screen. |

`createFunsProvider()` is the same but does **not** auto-connect — use it when
you want to wire the provider in manually (e.g. custom flows).

### Supported chains

```js
import { FUNS_CHAINS } from "@funswallet/connect";
// { ETHEREUM: 1, BSC: 56, BSC_TESTNET: 97, OPBNB: 204, SEPOLIA: 11155111 }

await connectFunsWallet({ chains: [FUNS_CHAINS.BSC], projectId: "..." });
```

---

## projectId

WalletConnect requires a projectId for its relay. The SDK ships with a public
fallback so you can try it instantly, **but that id shares FunS's metered
quota** — for production, create your own free id at
<https://dashboard.reown.com> and pass `projectId`.

---

## Desktop browser-extension users (no SDK needed)

If a visitor has the **FunS Wallet browser extension** installed, your dApp
discovers it automatically via **EIP-6963** — the same mechanism wagmi,
RainbowKit, and Reown AppKit already use. No code needed; FunS Wallet simply
appears alongside MetaMask in your connect list. This SDK is mainly for the
**mobile app** connection and for surfacing a dedicated "Connect FunS Wallet"
entry point.

---

## Troubleshooting

| Symptom                             | Fix                                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `projectId is empty` / relay errors | Pass your own `projectId` from dashboard.reown.com.                                                     |
| Mobile doesn't open the app         | Ensure FunS Wallet is installed; the SDK deep-links on `display_uri`. On desktop a QR is shown instead. |
| `connect()` hangs                   | The user must approve in the wallet (app or QR). It resolves after approval or rejects on cancel.       |
| Wrong chain on send                 | Request `wallet_switchEthereumChain` first; the wallet enforces that a tx matches the active chain.     |

---

## Support

- Issues / questions: `support@funswallet.world`
- Homepage: <https://funswallet.world>
- Package: <https://www.npmjs.com/package/@funswallet/connect>
