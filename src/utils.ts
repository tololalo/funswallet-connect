import { FUNS_DEEP_LINK_BASE } from './constants';

/** Best-effort mobile detection (browser only). */
export function isMobile(): boolean {
  if (typeof navigator === 'undefined' || !navigator.userAgent) return false;
  return /android|iphone|ipad|ipod/i.test(navigator.userAgent);
}

/** True on Android specifically. */
export function isAndroid(): boolean {
  if (typeof navigator === 'undefined' || !navigator.userAgent) return false;
  return /android/i.test(navigator.userAgent);
}

/**
 * Open the FunS Wallet app with a WalletConnect pairing URI.
 * No-op outside a browser environment.
 */
export function openFunsWallet(wcUri: string): void {
  if (typeof window === 'undefined') return;
  const href = `${FUNS_DEEP_LINK_BASE}?uri=${encodeURIComponent(wcUri)}`;
  window.location.href = href;
}
