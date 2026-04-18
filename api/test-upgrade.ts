import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './_utils/firebase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  const { userId } = req.body;
  if (!userId) return res.status(400).send("Missing userId");

  try {
    await db.collection('users').doc(userId).update({ isPro: true });
    res.status(200).send("Test upgrade successful via Vercel Function");
  } catch (error) {
    console.error("Error in test upgrade:", error);
    res.status(500).send("Database error");
  }
}
