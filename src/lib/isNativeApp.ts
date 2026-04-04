export function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  if (!!(window as any).Capacitor?.isNativePlatform?.()) return true;
  if (window.location.search.includes('app=1')) return true;
  const ua = navigator.userAgent || '';
  return ua.includes('wv') && ua.includes('Android');
}
