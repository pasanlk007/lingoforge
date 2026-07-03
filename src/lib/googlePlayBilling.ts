'use client';

/**
 * Cross-platform billing utility using RevenueCat.
 * Handles both subscriptions and one-time purchases (IAPs) for Google Play.
 */

export async function initializeBilling(): Promise<boolean> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return false;
    
    const { Purchases, LOG_LEVEL } = await import('@revenuecat/purchases-capacitor');
    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    
    // Configuration is usually handled in RevenueCatProvider.tsx
    return true;
  } catch (e) {
    console.error('RevenueCat initialization check failed:', e);
    return false;
  }
}

/**
 * Fetches product details from the store. 
 * Attempts to find products in both subscription and non-subscription categories.
 */
export async function getProducts(productIds: string[]) {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return [];
    
    const { Purchases } = await import('@revenuecat/purchases-capacitor');

    let allProducts: any[] = [];

    // Try fetching as subscriptions first
    try {
      const { products: subsProducts } = await Purchases.getProducts({ 
        productIdentifiers: productIds,
        type: 'SUBSCRIPTION' as any,
      });
      allProducts = [...allProducts, ...subsProducts];
    } catch (e) {
      console.warn('Could not fetch subscription products:', e);
    }

    // Try fetching as non-subscriptions (IAPs)
    try {
      const { products: iapProducts } = await Purchases.getProducts({ 
        productIdentifiers: productIds,
        type: 'NON_SUBSCRIPTION' as any,
      });
      allProducts = [...allProducts, ...iapProducts];
    } catch (e) {
      console.warn('Could not fetch non-subscription products:', e);
    }

    // If both failed or returned empty, try the generic fetch as a fallback
    if (allProducts.length === 0) {
      const { products } = await Purchases.getProducts({ productIdentifiers: productIds });
      allProducts = products;
    }

    console.log('RevenueCat products fetched:', allProducts.map((p: any) => p.identifier));
    return allProducts;
  } catch (error) {
    console.error('Error getting RevenueCat products:', error);
    return [];
  }
}

/**
 * Initiates a purchase for a specific SKU.
 * Returns the purchase result and whether the entitlement is active.
 */
export async function purchase(sku: string, appUserID: string, entitlementId: string = 'premium') {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) {
      throw new Error('Purchases can only be made on a native device.');
    }

    const { Purchases, PURCHASES_ERROR_CODE } = await import('@revenuecat/purchases-capacitor');

    // First, find the product object
    let productToPurchase: any = null;

    // Check IAPs first
    try {
      const { products } = await Purchases.getProducts({ 
        productIdentifiers: [sku],
        type: 'NON_SUBSCRIPTION' as any,
      });
      if (products.length > 0) productToPurchase = products[0];
    } catch (e) {}

    // If not found, check Subscriptions
    if (!productToPurchase) {
      try {
        const { products } = await Purchases.getProducts({ 
          productIdentifiers: [sku],
          type: 'SUBSCRIPTION' as any,
        });
        if (products.length > 0) productToPurchase = products[0];
      } catch (e) {}
    }

    // Final fallback: generic lookup
    if (!productToPurchase) {
      const { products } = await Purchases.getProducts({ productIdentifiers: [sku] });
      productToPurchase = products[0];
    }

    if (!productToPurchase) {
      throw new Error(`Product with SKU ${sku} not found on this device/store.`);
    }

    console.log(`Initiating purchase for: ${productToPurchase.identifier} (${productToPurchase.productType})`);

    // Execute the purchase
    const { purchaserInfo } = await Purchases.purchaseStoreProduct({ product: productToPurchase });
    
    // Check if the specific entitlement was granted
    const isEntitled = typeof purchaserInfo.entitlements.active[entitlementId] !== 'undefined';
    
    return { isAcknowledged: isEntitled, purchaserInfo };
  } catch (error: any) {
    const { PURCHASES_ERROR_CODE } = await import('@revenuecat/purchases-capacitor');
    
    // Don't log or throw if the user simply cancelled the flow
    if (error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      console.log('Purchase cancelled by user');
      return { isAcknowledged: false, purchaserInfo: null };
    }
    
    console.error('RevenueCat purchase error:', error);
    throw error;
  }
}
