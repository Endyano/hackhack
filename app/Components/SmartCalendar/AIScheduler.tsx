'use client';

import { useRef, useState } from 'react';
import type { CalendarEntry } from '../DemoData';
import { typeColor, typeLabel, toMinutes, fromMinutes, pad } from './calendarStyles';

type AISchedulerProps = {
  calendarEntries: CalendarEntry[];
  onAddEntry: (entry: CalendarEntry) => void;
};

const accentLime = '#D4FF3E';
const textGray = '#94a3b8';

function parseScheduleInput(raw: string): CalendarEntry {
  let text = raw.trim();

  let startMinutes: number | null = null;
  const timeMatch = text.match(/jam\s*(\d{1,2})(?:[.:](\d{2}))?\s*(pagi|siang|sore|malam)?/i)
    ?? text.match(/(\d{1,2})[.:](\d{2})/);

  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const meridiem = timeMatch[3]?.toLowerCase();
    if (meridiem === 'siang' && hour < 12) hour += 0;
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

  text = text
    .replace(/\b(besok|hari ini|nanti|pagi|siang|sore|malam)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const title = text.length > 0 ? text.charAt(0).toUpperCase() + text.slice(1) : 'Aktivitas baru';

  return {
    title,
    start: fromMinutes(startMinutes),
    end: fromMinutes(startMinutes + durationMinutes),
    type: 'activity',
  };
}

export default function AIScheduler({ calendarEntries, onAddEntry }: AISchedulerProps) {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [voiceUnsupported, setVoiceUnsupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  const handleToggleRecord = () => {
    const SpeechRecognitionCtor =
      typeof window !== 'undefined' &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

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
      const entry = parseScheduleInput(inputText);
      onAddEntry(entry);
      setFeedback(`AI menambahkan "${entry.title}" pukul ${entry.start}–${entry.end}.`);
      setInputText('');
      setIsProcessing(false);
    }, 700);
  };

  const sortedEntries = [...calendarEntries].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));

  return (
    <div
      style={{
        borderRadius: '28px',
        background: 'linear-gradient(180deg, rgba(212, 255, 62, 0.06), rgba(15, 23, 42, 0.9))',
        border: '1px solid rgba(212, 255, 62, 0.18)',
        padding: '26px',
      }}
    >
      <p style={{ margin: 0, color: accentLime, fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
        Fitur · Smart Calendar
      </p>
      <h2 style={{ margin: '12px 0 0', fontSize: '1.4rem', fontWeight: 800 }}>Tulis atau ucapkan kegiatanmu</h2>
      <p style={{ margin: '8px 0 0', color: textGray, fontSize: '13px', lineHeight: 1.6 }}>
        Smart Calendar mencari waktu luangmu dan membantu AI menuliskan kegiatan ke kalender. Contoh: &ldquo;Besok jam 5 sore lari 30 menit sama Daniel&rdquo;.
      </p>

      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Tulis kegiatanmu di sini, atau tekan tombol mic untuk merekam suara..."
        rows={3}
        style={{
          width: '100%',
          marginTop: '18px',
          padding: '14px 16px',
          borderRadius: '18px',
          border: '1px solid rgba(255,255,255,0.14)',
          background: 'rgba(255,255,255,0.03)',
          color: 'white',
          fontSize: '14px',
          fontFamily: 'inherit',
          resize: 'vertical',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />

      {voiceUnsupported && (
        <p style={{ margin: '10px 0 0', color: '#fb7185', fontSize: '12px' }}>
          Input suara tidak didukung di browser ini. Coba gunakan Chrome desktop, atau ketik langsung.
        </p>
      )}

      <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
        <button
          onClick={handleToggleRecord}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 20px',
            borderRadius: '100px',
            border: isRecording ? '1px solid rgba(248, 113, 113, 0.5)' : '1px solid rgba(212, 255, 62, 0.35)',
            background: isRecording ? 'rgba(248, 113, 113, 0.12)' : 'rgba(212, 255, 62, 0.08)',
            color: isRecording ? '#fca5a5' : accentLime,
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: isRecording ? '#f87171' : accentLime,
              boxShadow: isRecording ? '0 0 8px #f87171' : 'none',
            }}
          />
          {isRecording ? 'Berhenti Merekam...' : 'Rekam Suara'}
        </button>

        <button
          onClick={handleSubmit}
          disabled={!inputText.trim() || isProcessing}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '14px 20px',
            borderRadius: '100px',
            border: 'none',
            background: !inputText.trim() || isProcessing ? 'rgba(212, 255, 62, 0.25)' : accentLime,
            color: '#0f172a',
            fontWeight: 900,
            fontSize: '14px',
            cursor: !inputText.trim() || isProcessing ? 'not-allowed' : 'pointer',
          }}
        >
          {isProcessing ? 'AI sedang memproses...' : 'Tambahkan ke Kalender dengan AI'}
        </button>
      </div>

      {feedback && (
        <p style={{ margin: '14px 0 0', color: '#bef264', fontSize: '13px', fontWeight: 600 }}>{feedback}</p>
      )}

      <div style={{ display: 'grid', gap: '10px', marginTop: '22px' }}>
        {sortedEntries.map((entry, index) => (
          <div
            key={`${entry.title}-${entry.start}-${index}`}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 16px',
              borderRadius: '16px',
              background: '#0f172a',
              border: entry.type === 'activity' ? '1px solid rgba(212, 255, 62, 0.3)' : '1px solid transparent',
            }}
          >
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '14px' }}>{entry.title}</p>
              <p style={{ margin: '4px 0 0', color: textGray, fontSize: '12px' }}>
                {entry.start} &ndash; {entry.end}
              </p>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: typeColor[entry.type],
                background: `${typeColor[entry.type]}1a`,
                padding: '6px 12px',
                borderRadius: '100px',
                whiteSpace: 'nowrap',
              }}
            >
              {typeLabel[entry.type]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
