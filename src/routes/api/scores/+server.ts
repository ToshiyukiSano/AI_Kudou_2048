import { PrismaClient } from '@prisma/client';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const prisma = new PrismaClient();

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { score } = await request.json();
    const savedScore = await prisma.score.create({
      data: { score }
    });
    return json(savedScore);
  } catch (error) {
    console.error('Error saving score:', error);
    return new Response('Error saving score', { status: 500 });
  }
};

export const GET: RequestHandler = async () => {
  try {
    const scores = await prisma.score.findMany({
      orderBy: { score: 'desc' },
      take: 10
    });
    return json(scores);
  } catch (error) {
    console.error('Error fetching scores:', error);
    return new Response('Error fetching scores', { status: 500 });
  }
};
