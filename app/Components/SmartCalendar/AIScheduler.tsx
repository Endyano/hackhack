'use client';

import { useRef, useState } from 'react';
import type { CalendarEntry } from '../DemoData';
import { toMinutes, fromMinutes, pad } from './calendarStyles';

type AISchedulerProps = {
  onAddEntry: (entry: CalendarEntry) => void;
  /** The user's CareMatch buddy — mentioning this name in the input triggers Mutual Free Time Sync. */
  friendName?: string;
};

/**
 * "Mutual Free Time Sync" — when the parsed text mentions the user's CareMatch
 * buddy (e.g. "...with Daniel"), the AI treats it as a joint-activity match
 * instead of a plain personal entry: the buddy's name is stripped out of the
 * title and the entry is tagged `type: 'match'` with an explanatory note.
 * In production this is where a real overlap-check against both Google
 * Calendars would run before confirming the slot.
 */
function parseScheduleInput(raw: string, friendName?: string): CalendarEntry {
  let text = raw.trim();

  let startMinutes: number;
  const timeMatch =
    text.match(/(?:at\s*)?(\d{1,2})(?:[.:](\d{2}))?\s*(am|pm)?/i) ?? text.match(/(\d{1,2})[.:](\d{2})/);

  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const meridiem = timeMatch[3]?.toLowerCase();
    if (meridiem === 'pm' && hour < 12) hour += 12;
    startMinutes = hour * 60 + minute;
    text = text.replace(timeMatch[0], ' ');
  } else {
    const now = new Date();
    startMinutes = toMinutes(`${pad(now.getHours())}:${pad(now.getMinutes())}`) + 60;
  }

  let durationMinutes = 30;
  const durationMatch = raw.match(/(\d+)\s*hours?/i) ?? raw.match(/(\d+)\s*minutes?/i);
  if (durationMatch) {
    const value = parseInt(durationMatch[1], 10);
    durationMinutes = /hours?/i.test(durationMatch[0]) ? value * 60 : value;
    text = text.replace(durationMatch[0], ' ');
  }

  let mentionsFriend = false;
  if (friendName) {
    const friendMatch = new RegExp(`\\b(with|and|together with)\\s+${friendName}\\b`, 'i');
    mentionsFriend = friendMatch.test(text);
    text = text.replace(friendMatch, ' ');
  }

  text = text
    .replace(/\b(tomorrow|today|later|morning|afternoon|evening|night)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const cleanTitle = text.length > 0 ? text.charAt(0).toUpperCase() + text.slice(1) : 'New activity';
  const start = fromMinutes(startMinutes);
  const end = fromMinutes(startMinutes + durationMinutes);

  if (mentionsFriend && friendName) {
    return {
      title: `🏃 ${cleanTitle} with ${friendName}`,
      start,
      end,
      type: 'match',
      note: `AI found that you and ${friendName} are both free at this time — ${friendName}’s energy is looking good!`,
    };
  }

  return { title: cleanTitle, start, end, type: 'activity' };
}

export default function AIScheduler({ onAddEntry, friendName }: AISchedulerProps) {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [lastSession, setLastSession] = useState<CalendarEntry | null>(null);
  const [voiceUnsupported, setVoiceUnsupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  const handleToggleRecord = () => {
    const SpeechRecognitionCtor =
      typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

    if (!SpeechRecognitionCtor) {
      setVoiceUnsupported(true);
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results as ArrayLike<any>)
        .map((result: any) => result[0].transcript)
        .join(' ');
      setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const handleSubmit = () => {
    if (!inputText.trim() || isProcessing) return;
    setIsProcessing(true);
    setFeedback('CareBot is reading your training request…');
    setLastSession(null);

    window.setTimeout(() => {
      const entry = parseScheduleInput(inputText, friendName);
      onAddEntry(entry);
      setLastSession(entry);
      setFeedback(
        entry.type === 'match'
          ? `AI found shared time: "${entry.title}" at ${entry.start}–${entry.end}.`
          : `AI added "${entry.title}" at ${entry.start}–${entry.end}.`,
      );
      setInputText('');
      setIsProcessing(false);
    }, 700);
  };

  const canSubmit = inputText.trim().length > 0 && !isProcessing;

  return (
    <div className="rounded-[28px] border border-[#D4FF3E]/[0.18] bg-[linear-gradient(180deg,rgba(212,255,62,0.08),rgba(15,23,42,0.94))] p-6">
      <style>{`
        @keyframes careBotFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes careBotPulse { 0% { transform: scale(.9); opacity: .8; } 100% { transform: scale(1.55); opacity: 0; } }
        @keyframes careBotBreathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }
        @keyframes careBotHalo { 0%, 100% { opacity: .55; transform: scale(1); } 50% { opacity: .9; transform: scale(1.1); } }
        @keyframes careBotSparkle { 0%, 100% { opacity: 0; transform: scale(.4); } 50% { opacity: 1; transform: scale(1); } }
        @keyframes calendarWrite { from { opacity: 0; transform: translateY(8px) scale(.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .calendar-companion { position: relative; width: 250px; height: 270px; flex-shrink: 0; display: flex; align-items: flex-start; justify-content: center; animation: careBotFloat 5s ease-in-out infinite; }
        .calendar-companion-halo { position: absolute; top: 0; width: 220px; height: 220px; border-radius: 50%; background: radial-gradient(circle, rgba(212,255,62,.5), transparent 68%); filter: blur(18px); animation: careBotHalo 4.5s ease-in-out infinite; }
        .calendar-companion-avatar { position: relative; z-index: 2; width: 180px; height: 180px; display: flex; align-items: center; justify-content: center; }
        .calendar-companion-ring { position: absolute; inset: -16px; border-radius: 50%; border: 1px solid rgba(212,255,62,.4); animation: careBotPulse 2.6s ease-out infinite; }
        .calendar-companion-ring-delay { position: absolute; inset: -16px; border-radius: 50%; border: 1px solid rgba(212,255,62,.4); animation: careBotPulse 2.6s ease-out infinite 1.3s; }
        .calendar-companion-core { position: relative; width: 160px; height: 160px; border-radius: 50%; background: radial-gradient(circle at 32% 26%, #f2ffb8 0%, rgba(212,255,62,.95) 30%, rgba(160,214,20,.65) 62%, rgba(9,12,11,.95) 100%); box-shadow: 0 0 0 1px rgba(212,255,62,.3), 0 22px 48px rgba(212,255,62,.32); display: flex; align-items: center; justify-content: center; gap: 26px; animation: careBotBreathe 4.5s ease-in-out infinite; }
        .calendar-companion-eye { width: 13px; height: 13px; border-radius: 50%; background: #090C0B; }
        .calendar-companion-smile { position: absolute; bottom: 47px; left: 50%; width: 42px; height: 17px; transform: translateX(-50%); border-bottom: 5px solid rgba(9,12,11,.7); border-radius: 0 0 24px 24px; }
        .calendar-companion-body { position: absolute; z-index: 1; bottom: 8px; width: 124px; height: 112px; border: 1px solid rgba(212,255,62,.35); border-radius: 48px 48px 28px 28px; background: linear-gradient(145deg, rgba(212,255,62,.28), rgba(15,23,42,.95) 62%); box-shadow: inset 0 1px 0 rgba(255,255,255,.14), 0 16px 30px rgba(0,0,0,.28); }
        .calendar-companion-body::before { content: ''; position: absolute; top: 24px; left: 50%; width: 58px; height: 24px; transform: translateX(-50%); border-radius: 99px; background: rgba(212,255,62,.18); border: 1px solid rgba(212,255,62,.35); }
        .calendar-companion-feet { position: absolute; z-index: 0; bottom: 0; width: 142px; height: 28px; border-radius: 50%; background: radial-gradient(ellipse, rgba(212,255,62,.2), transparent 70%); filter: blur(4px); }
        .calendar-companion-status { position: absolute; z-index: 3; bottom: 8px; right: 8px; width: 22px; height: 22px; border-radius: 50%; background: #4ADE80; border: 3px solid #0B0F0D; box-shadow: 0 0 12px rgba(74,222,128,.6); }
        .calendar-companion-sparkle { position: absolute; border-radius: 50%; background: #D4FF3E; box-shadow: 0 0 8px rgba(212,255,62,.8); }
        .calendar-sparkle-a { top: 10px; right: 18px; width: 8px; height: 8px; animation: careBotSparkle 3.4s ease-in-out infinite; }
        .calendar-sparkle-b { bottom: 44px; left: 12px; width: 7px; height: 7px; animation: careBotSparkle 3.4s ease-in-out infinite 1.1s; }
        .calendar-sparkle-c { top: 38px; left: 10px; width: 6px; height: 6px; animation: careBotSparkle 3.4s ease-in-out infinite 2.2s; }
        .carebot-thinking .calendar-companion-core { box-shadow: 0 0 0 1px rgba(212,255,62,.6), 0 0 42px rgba(212,255,62,.6); }
        .calendar-written { animation: calendarWrite .45s ease-out both; }
        @media (max-width: 640px) { .calendar-companion { width: 100%; height: 215px; } .calendar-companion-avatar { width: 145px; height: 145px; } .calendar-companion-core { width: 130px; height: 130px; } .calendar-companion-body { transform: scale(.82); transform-origin: bottom; bottom: -2px; } }
      `}</style>

      <div className="flex flex-wrap items-center gap-5">
        <div className={`calendar-companion ${isProcessing ? 'carebot-thinking' : ''}`} aria-label="CareBot">
          <div className="calendar-companion-halo" /><div className="calendar-companion-feet" /><div className="calendar-companion-body" /><div className="calendar-companion-avatar"><div className="calendar-companion-ring" /><div className="calendar-companion-ring-delay" /><div className="calendar-companion-core"><span className="calendar-companion-eye" /><span className="calendar-companion-eye" /><span className="calendar-companion-smile" /></div><span className="calendar-companion-status" /></div><span className="calendar-companion-sparkle calendar-sparkle-a" /><span className="calendar-companion-sparkle calendar-sparkle-b" /><span className="calendar-companion-sparkle calendar-sparkle-c" />
        </div>
        <div className="min-w-[220px] flex-1">
          <p className="m-0 text-[12px] font-black uppercase tracking-[0.14em] text-[#D4FF3E]">CareBot</p>
          <h2 className="mt-2 text-2xl font-extrabold text-white">What are we training today?</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">Tell me the session and time.</p>
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-white/[0.12] bg-[#090c0b]/55 p-4 sm:p-5">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#D4FF3E] text-[#090c0b]">C</span> Ready when you are.</div>
        <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Example: Tomorrow at 5 pm, run for 30 minutes with Daniel" rows={3} className="mt-3 w-full resize-y rounded-2xl border border-white/[0.14] bg-white/[0.04] px-4 py-3.5 text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus:border-[#D4FF3E]/60" />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button onClick={handleToggleRecord} className={`flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-bold transition-transform hover:-translate-y-0.5 ${isRecording ? 'border-rose-400/50 bg-rose-400/[0.12] text-rose-300' : 'border-white/[0.16] bg-white/[0.04] text-slate-200'}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${isRecording ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-[#D4FF3E]'}`} />
            {isRecording ? 'Listening… tap to stop' : 'Talk to CareBot'}
          </button>
          <button onClick={handleSubmit} disabled={!canSubmit} className={`min-w-[220px] flex-1 rounded-full px-5 py-3 text-sm font-black transition-transform ${canSubmit ? 'cursor-pointer bg-[#D4FF3E] text-[#0f172a] hover:-translate-y-0.5' : 'cursor-not-allowed bg-[#D4FF3E]/25 text-[#0f172a]/70'}`}>
            {isProcessing ? 'Adding to calendar…' : 'Add to calendar'}
          </button>
        </div>
        {voiceUnsupported && <p className="mt-3 text-xs text-rose-400">Voice input is not supported in this browser. Try Chrome on desktop, or type directly.</p>}
      </div>

      {feedback && <div className={`calendar-written mt-4 flex items-start gap-3 rounded-2xl border p-4 ${isProcessing ? 'border-sky-300/25 bg-sky-300/[0.08]' : 'border-[#D4FF3E]/35 bg-[#D4FF3E]/[0.09]'}`}><span className="text-xl">{isProcessing ? '✦' : '✓'}</span><div><p className="m-0 text-sm font-bold text-white">{feedback}</p>{lastSession && <p className="mt-1 text-xs text-lime-200">Calendar updated: {lastSession.title} · {lastSession.start}–{lastSession.end}</p>}</div></div>}
    </div>
  );
}
