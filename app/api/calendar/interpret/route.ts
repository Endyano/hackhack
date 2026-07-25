import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../lib/supabase/server';

type AiEvent = { title?: unknown; date?: unknown; startTime?: unknown; endTime?: unknown; type?: unknown };
type AiResponse = { events?: unknown };
type ValidAiEvent = { title: string; date: string; startTime: string; endTime: string; type: 'training' | 'mobility' | 'recovery' | 'social' };

function getAccessToken(request: NextRequest) {
  const value = request.headers.get('authorization');
  return value?.startsWith('Bearer ') ? value.slice(7) : null;
}

function isValidEvent(event: AiEvent): event is ValidAiEvent {
  const validType = event.type === 'training' || event.type === 'mobility' || event.type === 'recovery' || event.type === 'social';
  return typeof event.title === 'string' && typeof event.date === 'string' && typeof event.startTime === 'string' && typeof event.endTime === 'string' && validType && /^\d{4}-\d{2}-\d{2}$/.test(event.date) && /^\d{2}:\d{2}$/.test(event.startTime) && /^\d{2}:\d{2}$/.test(event.endTime);
}

function readEvents(content: unknown) {
  if (typeof content !== 'string') return [] as ValidAiEvent[];
  const text = content.replace(/^```json\s*|\s*```$/g, '').trim();
  const json = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
  try {
    const parsed = json ? JSON.parse(json) as AiResponse : null;
    return Array.isArray(parsed?.events) ? (parsed.events as AiEvent[]).filter(isValidEvent) : [];
  } catch {
    return [];
  }
}

function singaporeDate(offsetDays = 0) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Singapore',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  const date = new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day) + offsetDays));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

const MONTH_INDEX: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

function dateFromParts(year: number, month: number, day: number) {
  const value = new Date(Date.UTC(year, month, day));
  if (value.getUTCFullYear() !== year || value.getUTCMonth() !== month || value.getUTCDate() !== day) return null;
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function explicitDateFromInput(input: string) {
  const text = input.toLowerCase();
  if (/\b(day after tomorrow|lusa)\b/.test(text)) return singaporeDate(2);
  if (/\b(tomorrow|tmr|besok)\b/.test(text)) return singaporeDate(1);
  if (/\b(today|hari ini)\b/.test(text)) return singaporeDate();

  const iso = text.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
  if (iso) return dateFromParts(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));

  const monthFirst = text.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(20\d{2}))?\b/);
  const dayFirst = text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+(20\d{2}))?\b/);
  const match = monthFirst ?? dayFirst;
  if (!match) return null;

  const month = monthFirst ? MONTH_INDEX[match[1]] : MONTH_INDEX[match[2]];
  const day = Number(monthFirst ? match[2] : match[1]);
  const statedYear = Number(monthFirst ? match[3] : match[3]);
  if (statedYear) return dateFromParts(statedYear, month, day);

  const [currentYear, currentMonth, currentDay] = singaporeDate().split('-').map(Number);
  const thisYear = dateFromParts(currentYear, month, day);
  if (!thisYear) return null;
  return thisYear >= `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`
    ? thisYear
    : dateFromParts(currentYear + 1, month, day);
}

function enforceExplicitDate(input: string, events: ValidAiEvent[]) {
  // The model still decides the activity and time. We only lock a clear,
  // single date from the user's wording so an old model-default year cannot drift in.
  if (events.length !== 1) return events;
  const date = explicitDateFromInput(input);
  return date ? [{ ...events[0], date }] : events;
}

export async function POST(request: NextRequest) {
  const token = getAccessToken(request);
  if (!token) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  try {
    const authClient = createSupabaseServerClient(token);
    const { data, error: authError } = await authClient.auth.getUser(token);
    if (authError || !data.user) return NextResponse.json({ error: 'Invalid session.' }, { status: 401 });

    const body = await request.json().catch(() => null) as { input?: unknown } | null;
    if (!body || typeof body.input !== 'string' || !body.input.trim()) return NextResponse.json({ error: 'Enter a calendar request.' }, { status: 400 });

    const endpoint = process.env.AZURE_AI_FOUNDRY_ENDPOINT?.replace(/\/$/, '');
    const apiKey = process.env.AZURE_AI_FOUNDRY_API_KEY;
    const deployment = process.env.AZURE_AI_DEPLOYMENT;
    if (!endpoint || !apiKey || !deployment) return NextResponse.json({ error: 'Azure AI Foundry is not configured.' }, { status: 500 });

    const today = singaporeDate();
    const azureBase = endpoint.endsWith('/openai/v1') ? endpoint.slice(0, -'/openai/v1'.length) : endpoint;
    const systemPrompt = `You are CareBot, a precise calendar assistant. Understand natural English or Indonesian calendar requests, including informal wording, 12/24-hour time, "tmr", "next Monday", specific dates, several activities, and recurring requests. Today is ${today} in Asia/Singapore. Resolve relative dates correctly. Return ONLY this JSON shape: {"events":[{"title":"Run","date":"YYYY-MM-DD","startTime":"HH:mm","endTime":"HH:mm","type":"training"}]}. Never use keys named action, details, activity, days, or time. Keep title short: only the event name, never include dates, times, or request wording. Valid types: training, mobility, recovery, social. If the user asks for multiple days, return one event per requested day; choose the next suitable future dates when exact days are not specified. If no time range is given, choose a sensible 30-minute slot.
Example: "Pilates 2 more days at 8 am to 9 am" returns {"events":[{"title":"Pilates","date":"2026-07-26","startTime":"08:00","endTime":"09:00","type":"mobility"},{"title":"Pilates","date":"2026-07-28","startTime":"08:00","endTime":"09:00","type":"mobility"}]}.`;
    const azureUrl = `${azureBase}/openai/deployments/${encodeURIComponent(deployment)}/chat/completions?api-version=2024-10-21`;
    const azureResponse = await fetch(azureUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
      body: JSON.stringify({ messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: body.input.trim() }], response_format: { type: 'json_object' }, temperature: 0, max_tokens: 180 }),
    });
    if (!azureResponse.ok) return NextResponse.json({ error: 'Azure AI could not interpret this request. Check your Foundry deployment.' }, { status: 502 });

    const azureBody = await azureResponse.json() as { choices?: Array<{ message?: { content?: unknown } }> };
    const firstContent = azureBody.choices?.[0]?.message?.content;
    let validEvents = readEvents(firstContent);
    if (validEvents.length === 0) {
      const repairPrompt = `Convert this into the required calendar JSON. Original request: ${body.input.trim()}\nPrevious model response: ${typeof firstContent === 'string' ? firstContent : 'No response'}\nReturn ONLY {"events":[{"title":"short name","date":"YYYY-MM-DD","startTime":"HH:mm","endTime":"HH:mm","type":"training|mobility|recovery|social"}]}.`;
      const repairResponse = await fetch(azureUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
        body: JSON.stringify({ messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: repairPrompt }], response_format: { type: 'json_object' }, temperature: 0, max_tokens: 220 }),
      });
      if (repairResponse.ok) {
        const repairBody = await repairResponse.json() as { choices?: Array<{ message?: { content?: unknown } }> };
        validEvents = readEvents(repairBody.choices?.[0]?.message?.content);
      }
    }
    if (validEvents.length === 0) {
      return NextResponse.json({ error: 'CareBot could not confidently find a date and time. Try including a date and a time range.' }, { status: 422 });
    }
    validEvents = enforceExplicitDate(body.input, validEvents);
    return NextResponse.json({ events: validEvents.slice(0, 7).map((event) => ({ title: event.title.trim(), date: event.date, startTime: event.startTime, endTime: event.endTime, type: event.type })) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to interpret calendar request.' }, { status: 500 });
  }
}
