import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { plan, language, userId, userEmail, userName } = await req.json();

    const merchantId = process.env.PAYHERE_MERCHANT_ID!;
    const secret = process.env.PAYHERE_MERCHANT_SECRET!;

    // Prices in LKR
    const prices: Record<string, string> = {
      weekly: '1200.00',
      course: '11700.00',
      lifetime: '29700.00',
    };

    const amount = prices[plan];
    const currency = 'LKR';
    const orderId = `${plan}_${language}_${userId}`;

    // Generate hash
    const secretHash = crypto.createHash('md5').update(secret).digest('hex').toUpperCase();
    const hash = crypto.createHash('md5')
      .update(merchantId + orderId + amount + currency + secretHash)
      .digest('hex').toUpperCase();

    const checkoutData = {
      merchant_id: merchantId,
      return_url: 'https://lingoforge.app/dashboard',
      cancel_url: 'https://lingoforge.app/pricing',
      notify_url: 'https://lingoforge.app/api/payhere-webhook',
      order_id: orderId,
      items: `LingoForge ${plan} plan`,
      currency,
      amount,
      first_name: userName?.split(' ')[0] || 'User',
      last_name: userName?.split(' ')[1] || '',
      email: userEmail || '',
      phone: '',
      address: '',
      city: '',
      country: 'Sri Lanka',
      hash,
      sandbox: true, // Change to false for production
    };

    return NextResponse.json(checkoutData);
  } catch (error) {
    console.error('PayHere checkout error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
