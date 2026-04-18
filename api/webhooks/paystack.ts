import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { db } from '../_utils/firebase';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return res.status(500).send("Server configuration error");

  const chunks: Buffer[] = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', async () => {
    const rawBody = Buffer.concat(chunks);
    const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
    
    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(401).send("Invalid signature");
    }

    try {
      const event = JSON.parse(rawBody.toString('utf8'));
      
      if (event.event === 'charge.success') {
        const userId = event.data.metadata?.userId;
        if (userId) {
          await db.collection('users').doc(userId).update({
            isPro: true
          });
          console.log(`Successfully upgraded user ${userId} to Pro via Vercel Webhook`);
        }
      }

      res.status(200).send("Webhook received");
    } catch (error) {
      console.error(error);
      res.status(500).send("Database error");
    }
  });
}
