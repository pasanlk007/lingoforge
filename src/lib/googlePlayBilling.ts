'use client';

import { Capacitor } from '@capacitor/core';
import Purchases, { LOG_LEVEL, PurchasesStoreProduct, PurchasesError, PURCHASES_ERROR_CODE } from '@revenuecat/purchases-capacitor';

/**
 * Initializes the RevenueCat SDK.
 */
export async function initializeBilling(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
      return false;
  }
  try {
    // The SDK is configured in RevenueCatProvider, this just confirms it's ready.
    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    return true;
  } catch (e) {
    console.error('RevenueCat initialization check failed:', e);
    return false;
  }
}

/**
 * Fetches product details from the App Store / Play Store.
 */
export async function getProducts(productIds: string[]): Promise<PurchasesStoreProduct[]> {
  if (!Capacitor.isNativePlatform()) {
    return [];
  }
  try {
    const { products } = await Purchases.getProducts({ productIdentifiers: productIds });
    return products;
  } catch (e) {
    console.error('Error getting RevenueCat products:', e);
    return [];
  }
}

/**
 * Initiates a purchase flow for a given product SKU.
 * Assumes the user is already logged in to RevenueCat via the Provider.
 */
export async function purchase(sku: string, appUserID: string) {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Purchases can only be made on a native device.');
  }
  
  try {
    const { products } = await Purchases.getProducts({ productIdentifiers: [sku] });
    const productToPurchase = products[0];

    if (!productToPurchase) {
      throw new Error(`Product with SKU ${sku} not found.`);
    }

    const { purchaserInfo } = await Purchases.purchaseStoreProduct({ product: productToPurchase });

    // 'premium' is the entitlement ID used in the provider.
    const isPremium = typeof purchaserInfo.entitlements.active['premium'] !== 'undefined';
    
    return { isAcknowledged: isPremium, purchaserInfo };

  } catch (e) {
    const error = e as PurchasesError;
    if (error.code !== PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      console.error('RevenueCat purchase error:', error);
      throw error;
    }
    return { isAcknowledged: false, purchaserInfo: null };
  }
}
