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

    let allProducts: any[] = [];

    // Try getOfferings first — RevenueCat's recommended way for subscriptions
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings?.current?.availablePackages) {
        const offeringProducts = offerings.current.availablePackages
          .map((pkg: any) => pkg.product)
          .filter((p: any) => productIds.some((id: string) => p.identifier.includes(id) || id.includes(p.identifier)));
        if (offeringProducts.length > 0) {
          allProducts = [...allProducts, ...offeringProducts];
          console.log('Products from offerings:', offeringProducts.map((p: any) => p.identifier));
        }
      }
    } catch (e) {
      console.warn('getOfferings failed:', e);
    }

    // Fetch one-time products
    try {
      const { products } = await Purchases.getProducts({
        productIdentifiers: productIds,
        type: 'NON_SUBSCRIPTION' as any,
      });
      const existingIds = new Set(allProducts.map((p: any) => p.identifier));
      allProducts = [...allProducts, ...products.filter((p: any) => !existingIds.has(p.identifier))];
    } catch (e) {
      console.warn('NON_SUBSCRIPTION fetch failed:', e);
    }

    // Fallback subscription fetch
    try {
      const { products } = await Purchases.getProducts({
        productIdentifiers: productIds,
        type: 'SUBSCRIPTION' as any,
      });
      const existingIds = new Set(allProducts.map((p: any) => p.identifier));
      allProducts = [...allProducts, ...products.filter((p: any) => !existingIds.has(p.identifier))];
    } catch (e) {
      console.warn('SUBSCRIPTION fetch failed:', e);
    }

    console.log('All products:', allProducts.map((p: any) => p.identifier));
    return allProducts;
  } catch (e) {
    console.error('Error getting products:', e);
    return [];
  }
}

export async function purchase(sku: string, appUserID: string, entitlementId: string = 'premium') {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) {
      throw new Error('Purchases can only be made on a native device.');
    }
    const { Purchases, PURCHASES_ERROR_CODE } = await import('@revenuecat/purchases-capacitor');

    let productToPurchase: any = null;

    // For subscriptions, try getOfferings first
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings?.current?.availablePackages) {
        const pkg = offerings.current.availablePackages.find(
          (p: any) => p.product.identifier === sku || p.product.identifier.includes(sku)
        );
        if (pkg) productToPurchase = pkg.product;
      }
    } catch (e) {}

    // Try non-subscription
    if (!productToPurchase) {
      try {
        const { products } = await Purchases.getProducts({
          productIdentifiers: [sku],
          type: 'NON_SUBSCRIPTION' as any,
        });
        if (products.length > 0) productToPurchase = products[0];
      } catch (e) {}
    }

    // Try subscription
    if (!productToPurchase) {
      try {
        const { products } = await Purchases.getProducts({
          productIdentifiers: [sku],
          type: 'SUBSCRIPTION' as any,
        });
        if (products.length > 0) productToPurchase = products[0];
      } catch (e) {}
    }

    // Final fallback
    if (!productToPurchase) {
      const { products } = await Purchases.getProducts({ productIdentifiers: [sku] });
      productToPurchase = products[0];
    }

    if (!productToPurchase) throw new Error('Product with SKU ' + sku + ' not found.');
    console.log('Purchasing:', productToPurchase.identifier, productToPurchase.productType);

    const { purchaserInfo } = await Purchases.purchaseStoreProduct({ product: productToPurchase });
    const isEntitled = typeof purchaserInfo.entitlements.active[entitlementId] !== 'undefined';
    return { isAcknowledged: isEntitled, purchaserInfo };
  } catch (e: any) {
    const { PURCHASES_ERROR_CODE } = await import('@revenuecat/purchases-capacitor');
    if (e.code !== PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      console.error('Purchase error:', e);
      throw e;
    }
    return { isAcknowledged: false, purchaserInfo: null };
  }
}