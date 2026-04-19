'use client';

export async function initializeBilling(): Promise<boolean> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return false;
    const { Purchases, LOG_LEVEL } = await import('@revenuecat/purchases-capacitor');
    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    return true;
  } catch (e) {
    console.error('RevenueCat initialization check failed:', e);
    return false;
  }
}

export async function getProducts(productIds: string[]) {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return [];
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    const { products } = await Purchases.getProducts({ productIdentifiers: productIds });
    return products;
  } catch (e) {
    console.error('Error getting RevenueCat products:', e);
    return [];
  }
}

export async function purchase(sku: string, appUserID: string) {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) {
      throw new Error('Purchases can only be made on a native device.');
    }
    const { Purchases, PURCHASES_ERROR_CODE } = await import('@revenuecat/purchases-capacitor');
    const { products } = await Purchases.getProducts({ productIdentifiers: [sku] });
    const productToPurchase = products[0];
    if (!productToPurchase) throw new Error(`Product with SKU ${sku} not found.`);
    const { purchaserInfo } = await Purchases.purchaseStoreProduct({ product: productToPurchase });
    const isPremium = typeof purchaserInfo.entitlements.active['premium'] !== 'undefined';
    return { isAcknowledged: isPremium, purchaserInfo };
  } catch (e: any) {
    const { PURCHASES_ERROR_CODE } = await import('@revenuecat/purchases-capacitor');
    if (e.code !== PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      console.error('RevenueCat purchase error:', e);
      throw e;
    }
    return { isAcknowledged: false, purchaserInfo: null };
  }
}
