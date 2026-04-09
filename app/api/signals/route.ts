import { createClient } from '@/lib/supabase/server';
import type { ForexSignal } from '@/lib/types';

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('signals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[v0] Supabase fetch error:', error);
      return Response.json({ signals: [] });
    }

    // Transform database records to ForexSignal format
    const signals: ForexSignal[] = (data || []).map((record) => ({
      id: record.id,
      symbol: record.symbol,
      signal: record.signal,
      price: Number(record.price),
      analysis: record.analysis,
      confidence: record.confidence,
      riskLevel: record.risk_level,
      timestamp: new Date(record.created_at),
      telegramSent: record.telegram_sent,
    }));

    return Response.json({ signals });
  } catch (error) {
    console.error('[v0] Signals fetch error:', error);
    return Response.json({ signals: [] });
  }
}
