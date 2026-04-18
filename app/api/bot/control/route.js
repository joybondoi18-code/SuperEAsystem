import { startBotForUser, stopBotForUser, getAllBotStatus } from '../../../../core/botService';

export async function POST(req) {
  try {
    const { action, userId } = await req.json();
    
    if (action === 'start') {
      const result = await startBotForUser(userId);
      return Response.json(result);
    }
    
    if (action === 'stop') {
      const result = await stopBotForUser(userId);
      return Response.json(result);
    }
    
    if (action === 'status') {
      const status = getAllBotStatus();
      return Response.json({ status });
    }
    
    return Response.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    console.error('Bot control error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
} 