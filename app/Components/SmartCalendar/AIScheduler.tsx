'use client';

import { useRef, useState } from 'react';
import type { CalendarEntry } from '../DemoData';
import { typeColor, typeLabel, toMinutes, fromMinutes, pad } from './calendarStyles';

type AISchedulerProps = {
  calendarEntries: CalendarEntry[];
  onAddEntry: (entry: CalendarEntry) => void;
  /** The user's CareMatch buddy — mentioning this name in the input triggers Mutual Free Time Sync. */
  friendName?: string;
};

/**
 * "Mutual Free Time Sync" — when the parsed text mentions the user's CareMatch
 * buddy (e.g. "...sama Daniel"), the AI treats it as a joint-activity match
 * instead of a plain personal entry: the buddy's name is stripped out of the
 * title and the entry is tagged `type: 'match'` with an explanatory note.
 * In production this is where a real overlap-check against both Google
 * Calendars would run before confirming the slot.
 */
function parseScheduleInput(raw: string, friendName?: string): CalendarEntry {
  let text = raw.trim();

  let startMinutes: number;
  const timeMatch =
    text.match(/jam\s*(\d{1,2})(?:[.:](\d{2}))?\s*(pagi|siang|sore|malam)?/i) ?? text.match(/(\d{1,2})[.:](\d{2})/);

  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const meridiem = timeMatch[3]?.toLowerCase();
    if ((meridiem === 'sore' || meridiem === 'malam') && hour < 12) hour += 12;
    startMinutes = hour * 60 + minute;
    text = text.replace(timeMatch[0], ' ');
  } else {
    const now = new Date();
    startMinutes = toMinutes(`${pad(now.getHours())}:${pad(now.getMinutes())}`) + 60;
  }

  let durationMinutes = 30;
  const durationMatch = raw.match(/(\d+)\s*jam/i) ?? raw.match(/(\d+)\s*menit/i);
  if (durationMatch) {
    const value = parseInt(durationMatch[1], 10);
    durationMinutes = /jam/i.test(durationMatch[0]) ? value * 60 : value;
    text = text.replace(durationMatch[0], ' ');
  }

  let mentionsFriend = false;
  if (friendName) {
    const friendMatch = new RegExp(`\\b(sama|dengan|bareng)\\s+${friendName}\\b`, 'i');
    mentionsFriend = friendMatch.test(text);
    text = text.replace(friendMatch, ' ');
  }

  text = text
    .replace(/\b(besok|hari ini|nanti|pagi|siang|sore|malam)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const cleanTitle = text.length > 0 ? text.charAt(0).toUpperCase() + text.slice(1) : 'Aktivitas baru';
  const start = fromMinutes(startMinutes);
  const end = fromMinutes(startMinutes + durationMinutes);

  if (mentionsFriend && friendName) {
    return {
      title: `🏃 ${cleanTitle} with ${friendName}`,
      start,
      end,
      type: 'match',
      note: `AI mendeteksi kamu dan ${friendName} sama-sama free di jam ini — energi ${friendName} lagi bagus!`,
    };
  }

  return { title: cleanTitle, start, end, type: 'activity' };
}

export default function AIScheduler({ calendarEntries, onAddEntry, friendName }: AISchedulerProps) {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState('');
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
    recognition.lang = 'id-ID';
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
    setFeedback('');

    window.setTimeout(() => {
      const entry = parseScheduleInput(inputText, friendName);
      onAddEntry(entry);
      setFeedback(
        entry.type === 'match'
          ? `AI menemukan waktu bareng: "${entry.title}" pukul ${entry.start}–${entry.end}.`
          : `AI menambahkan "${entry.title}" pukul ${entry.start}–${entry.end}.`,
      );
      setInputText('');
      setIsProcessing(false);
    }, 700);
  };

  const sortedEntries = [...calendarEntries].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  const canSubmit = inputText.trim().length > 0 && !isProcessing;

  return (
    <div className="rounded-[28px] border border-[#D4FF3E]/[0.18] bg-[linear-gradient(180deg,rgba(212,255,62,0.06),rgba(15,23,42,0.9))] p-6">
      {/* HEADER */}
      <p className="text-[13px] font-black uppercase tracking-[0.12em] text-[#D4FF3E]">Fitur · Smart Calendar</p>
      <h2 className="mt-3 text-2xl font-extrabold text-white">Tulis atau ucapkan kegiatanmu</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-slate-400">
        Smart Calendar mencari waktu luangmu dan membantu AI menuliskan kegiatan ke kalender. Contoh: &ldquo;Besok
        jam 5 sore lari 30 menit sama Daniel&rdquo;.
      </p>

      {/* INPUT */}
      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Tulis kegiatanmu di sini, atau tekan tombol mic untuk merekam suara..."
        rows={3}
        className="mt-4 w-full resize-y rounded-2xl border border-white/[0.14] bg-white/[0.03] px-4 py-3.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-[#D4FF3E]/50"
      />

      {voiceUnsupported && (
        <p className="mt-2 text-xs text-rose-400">
          Input suara tidak didukung di browser ini. Coba gunakan Chrome desktop, atau ketik langsung.
        </p>
      )}

      {/* ACTIONS */}
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={handleToggleRecord}
          className={`flex items-center gap-2.5 rounded-full border px-5 py-3.5 text-sm font-bold transition-transform hover:-translate-y-0.5 ${
            isRecording
              ? 'border-rose-400/50 bg-rose-400/[0.12] text-rose-300'
              : 'border-[#D4FF3E]/35 bg-[#D4FF3E]/[0.08] text-[#D4FF3E]'
          }`}
        >
          <span
            className={`h-2.5 w-2.5 rounded-full ${isRecording ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-[#D4FF3E]'}`}
          />
          {isRecording ? 'Berhenti Merekam...' : 'Rekam Suara'}
        </button>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`min-w-[200px] flex-1 rounded-full px-5 py-3.5 text-sm font-black transition-transform ${
            canSubmit
              ? 'cursor-pointer bg-[#D4FF3E] text-[#0f172a] hover:-translate-y-0.5'
              : 'cursor-not-allowed bg-[#D4FF3E]/25 text-[#0f172a]/70'
          }`}
        >
          {isProcessing ? 'AI sedang memproses...' : 'Tambahkan ke Kalender dengan AI'}
        </button>
      </div>

      {feedback && <p className="mt-3.5 text-[13px] font-semibold text-lime-300">{feedback}</p>}

      {/* SCHEDULE LIST */}
      <div className="mt-5 grid gap-2.5">
        {sortedEntries.map((entry, index) => {
          const isMatch = entry.type === 'match';
          return (
            <div
              key={`${entry.title}-${entry.start}-${index}`}
              className={`flex items-center justify-between gap-3 rounded-2xl bg-[#1e293b] p-4 ${
                isMatch ? 'border border-[#D4FF3E]/60 shadow-[0_0_0_1px_rgba(212,255,62,0.15)]' : 'border border-transparent'
              }`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{entry.title}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {entry.start} &ndash; {entry.end}
                </p>
                {isMatch && entry.note && <p className="mt-1.5 max-w-md text-xs leading-relaxed text-lime-200/90">{entry.note}</p>}
              </div>
              <span
                className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-extrabold"
                style={{ color: typeColor[entry.type], background: `${typeColor[entry.type]}1a` }}
              >
                {typeLabel[entry.type]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
