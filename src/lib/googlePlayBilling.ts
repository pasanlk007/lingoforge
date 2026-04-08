'use client';
import { Billing } from '@capgo/capacitor-community-billing';
import type { Product, Purchase } from '@capgo/capacitor-community-billing';

export const initializeBilling = async (): Promise<boolean> => {
  try {
    await Billing.initialize();
    console.log('Billing initialized');
    return true;
  } catch (error) {
    console.error('Failed to initialize billing:', error);
    return false;
  }
};

export const getProducts = async (skus: string[]): Promise<Product[]> => {
  try {
    const { products } = await Billing.getProducts({ skus });
    console.log('Fetched products:', products);
    return products;
  } catch (error) {
    console.error('Failed to get products:', error);
    return [];
  }
};

export const purchase = async (sku: string, userId: string): Promise<Purchase | null> => {
  try {
    const { purchase } = await Billing.purchase({ 
      sku,
      obfuscatedAccountId: userId, // Link the purchase to the Firebase user
    });
    console.log('Purchase successful:', purchase);
    return purchase;
  } catch (error) {
    console.error(`Failed to purchase ${sku}:`, error);
    return null;
  }
};

export const getLatestPurchase = async(sku: string): Promise<Purchase | null> => {
  try {
    const result = await Billing.getLatestPurchase({sku});
    return result.purchase;
  } catch (error) {
    console.error('Failed to get latest purchase', error);
    return null;
  }
}
