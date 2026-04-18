// ใช้เก็บ signalHistory ใน Memory (แต่ถ้า server restart จะหาย)
let globalSignals = [];

export async function POST(req) {
  try {
    const signal = await req.json();
    globalSignals.unshift({
      ...signal,
      time: new Date().toLocaleString(),
      status: 'SIGNAL_DETECTED'
    });
    
    // เก็บแค่ 50 ล่าสุด
    globalSignals = globalSignals.slice(0, 50);
    
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ signals: globalSignals });
}