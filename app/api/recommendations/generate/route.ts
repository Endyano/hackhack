import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseServiceClient } from '../../../../lib/supabase/server';
import { resolveCareShiftProfile } from '../../../../lib/supabase/profile';

type Recommendation = { activity?: unknown; durationMinutes?: unknown; intensity?: unknown; reason?: unknown };

function getAccessToken(request: NextRequest) {
  const value = request.headers.get('authorization');
  return value?.startsWith('Bearer ') ? value.slice(7) : null;
}

export async function POST(request: NextRequest) {
  const token = getAccessToken(request);
  if (!token) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  try {
    const authClient = createSupabaseServerClient(token);
    const { data: auth, error: authError } = await authClient.auth.getUser(token);
    if (authError || !auth.user) return NextResponse.json({ error: 'Invalid session.' }, { status: 401 });
    const body = await request.json().catch(() => null) as { mood?: unknown; energy?: unknown } | null;
    if (!body || !['positive', 'neutral', 'negative'].includes(String(body.mood)) || typeof body.energy !== 'number' || body.energy < 0 || body.energy > 100) return NextResponse.json({ error: 'A valid body status and readiness score are required.' }, { status: 400 });

    const endpoint = process.env.AZURE_AI_FOUNDRY_ENDPOINT?.replace(/\/$/, '');
    const apiKey = process.env.AZURE_AI_FOUNDRY_API_KEY;
    const deployment = process.env.AZURE_AI_DEPLOYMENT;
    if (!endpoint || !apiKey || !deployment) return NextResponse.json({ error: 'Azure AI Foundry is not configured.' }, { status: 500 });

    const supabase = createSupabaseServiceClient();
    const profile = await resolveCareShiftProfile(supabase, auth.user);
    const { data: recentRecommendations } = await supabase
      .from('activity_recommendations')
      .select('activity_name')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(5);
    const recentActivities = (recentRecommendations ?? []).map((item) => item.activity_name).join(', ') || 'None yet';

    const azureBase = endpoint.endsWith('/openai/v1') ? endpoint.slice(0, -'/openai/v1'.length) : endpoint;
    const prompt = `You are a careful physical-care coach. The user reports body status "${body.mood}" and training readiness ${body.energy}/100. Recommend one safe, realistic workout.

Recent recommendations: ${recentActivities}.

Vary the recommendation: do not repeat a recent activity or default to an aerobic walk when another suitable option exists. Rotate among easy runs, brisk walks, cycling, bodyweight strength, Pilates, yoga, mobility, dance cardio, stair intervals, and recovery breathing/stretching. Match intensity to readiness. A negative body status must prefer recovery or gentle movement. Do not mention medical diagnosis.

Return ONLY valid JSON: {"activity":"short activity name","durationMinutes":number between 5 and 45,"intensity":"Very Light|Light|Moderate|Vigorous","reason":"one supportive sentence"}.`;
    const azureResponse = await fetch(`${azureBase}/openai/deployments/${encodeURIComponent(deployment)}/chat/completions?api-version=2024-10-21`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
      body: JSON.stringify({ messages: [{ role: 'system', content: 'Return valid JSON only.' }, { role: 'user', content: prompt }], response_format: { type: 'json_object' }, temperature: 0.8, max_tokens: 300 }),
    });
    if (!azureResponse.ok) return NextResponse.json({ error: 'Azure AI could not generate a recommendation.' }, { status: 502 });
    const azureBody = await azureResponse.json() as { choices?: Array<{ message?: { content?: unknown } }> };
    const content = azureBody.choices?.[0]?.message?.content;
    const text = typeof content === 'string' ? content.replace(/^```json\s*|\s*```$/g, '').trim() : '';
    const json = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
    const recommendation = json ? JSON.parse(json) as Recommendation : null;
    if (!recommendation || typeof recommendation.activity !== 'string' || typeof recommendation.durationMinutes !== 'number' || typeof recommendation.intensity !== 'string' || typeof recommendation.reason !== 'string' || !Number.isInteger(recommendation.durationMinutes) || recommendation.durationMinutes < 5 || recommendation.durationMinutes > 45) return NextResponse.json({ error: 'Azure AI returned an incomplete recommendation. Please try again.' }, { status: 502 });

    const { error: saveError } = await supabase.from('activity_recommendations').insert({ user_id: profile.id, activity_name: recommendation.activity.trim(), category: 'physical', start_time: new Date().toISOString(), duration_minutes: recommendation.durationMinutes, intensity: recommendation.intensity.trim(), reason: recommendation.reason.trim() });
    if (saveError) return NextResponse.json({ error: saveError.message }, { status: 500 });

    return NextResponse.json({ activity: recommendation.activity.trim(), durationMinutes: recommendation.durationMinutes, intensity: recommendation.intensity.trim(), reason: recommendation.reason.trim() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to generate a recommendation.' }, { status: 500 });
  }
}
