'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useDemoState } from '../Components/DemoStateContext';
import { getActiveRecommendation } from '../Components/DemoData';

const bgDark = '#090C0B';
const accentLime = '#D4FF3E';
const textGray = '#9CA3AF';
const surface = '#0f172a';

const RECOVERY_MOVES = ['Neck Roll', 'Shoulder Stretch', 'Seated Spinal Twist', 'Wrist & Forearm Stretch', 'Deep Breathing'];
const MOVE_SECONDS = 30;

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function detectMode(activity: string, isSocial: boolean): 'outdoor' | 'indoor' | 'social' {
  if (isSocial) return 'social';
  const text = activity.toLowerCase();
  if (text.includes('stretch') || text.includes('mobility') || text.includes('breath') || text.includes('bodyweight')) return 'indoor';
  return 'outdoor';
}

function ProgressRing({ percent, size, children }: { percent: number; size: number; children: ReactNode }) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        padding: '10px',
        background: `conic-gradient(${accentLime} ${clamped * 3.6}deg, rgba(255,255,255,0.08) ${clamped * 3.6}deg)`,
        boxShadow: '0 0 60px rgba(212,255,62,0.12)',
        transition: 'background 1s linear',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: bgDark,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'inset 0 0 40px rgba(212,255,62,0.08)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function MetricBlock({ value, unit, label }: { value: string; unit?: string; label: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div>
        <span style={{ fontSize: '2.4rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-1px' }}>{value}</span>
        {unit && <span style={{ fontSize: '0.95rem', fontWeight: 700, color: textGray, marginLeft: '4px' }}>{unit}</span>}
      </div>
      <p style={{ margin: '6px 0 0', color: textGray, fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
    </div>
  );
}

function ModeBadge({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 18px',
        borderRadius: '100px',
        background: 'rgba(212, 255, 62, 0.1)',
        border: '1px solid rgba(212, 255, 62, 0.3)',
        color: accentLime,
        fontSize: '12px',
        fontWeight: 900,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
      }}
    >
      <span className="session-dot" /> {children}
    </span>
  );
}

export default function ActiveSessionPage() {
  const router = useRouter();
  const { currentUser, recommendationState, setRecommendationState } = useDemoState();
  const activeRec = getActiveRecommendation(currentUser, recommendationState);
  const totalSeconds = activeRec.durationMinutes * 60;

  const isSocial = (recommendationState === 'pending' || recommendationState === 'accepted') && currentUser.recommendation.socialCompatible;
  const mode = detectMode(activeRec.activity, isSocial);

  // SESSION TIMER (outdoor + social modes)
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);

  useEffect(() => {
    setSecondsLeft(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const elapsed = totalSeconds - secondsLeft;
  const sessionProgress = totalSeconds > 0 ? (elapsed / totalSeconds) * 100 : 0;

  const warmup = Math.min(5, Math.max(2, Math.round(activeRec.durationMinutes * 0.2)));
  const cooldown = warmup;
  const mainPhase = Math.max(activeRec.durationMinutes - warmup - cooldown, 1);
  const steps = [
    { label: `${warmup}-min Warm up`, endsAt: warmup * 60 },
    { label: `${mainPhase}-min Main Phase · ${activeRec.activity}`, endsAt: (warmup + mainPhase) * 60 },
    { label: `${cooldown}-min Cool down`, endsAt: totalSeconds },
  ];
  const firstUnfinished = steps.findIndex((step) => elapsed < step.endsAt);
  const currentStepIndex = firstUnfinished === -1 ? steps.length - 1 : firstUnfinished;

  // OUTDOOR MODE — pace-derived distance from the live timer
  const paceMinPerKm = 5.5;
  const distanceKm = (elapsed / 60 / paceMinPerKm).toFixed(1);

  // INDOOR MODE — per-move countdown
  const [stepIndex, setStepIndex] = useState(0);
  const [moveSecondsLeft, setMoveSecondsLeft] = useState(MOVE_SECONDS);

  useEffect(() => {
    if (mode !== 'indoor') return;
    setMoveSecondsLeft(MOVE_SECONDS);
    const id = setInterval(() => {
      setMoveSecondsLeft((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [mode, stepIndex]);

  const isLastMove = stepIndex === RECOVERY_MOVES.length - 1;

  const handleFinish = () => {
    setRecommendationState('accepted');
    router.push('/dashboard');
  };

  const handleNextMove = () => {
    if (isLastMove) {
      handleFinish();
    } else {
      setStepIndex((current) => current + 1);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: bgDark,
        backgroundImage: 'radial-gradient(circle at 50% 15%, rgba(212, 255, 62, 0.1) 0%, transparent 55%)',
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style>
        {`
          @keyframes sessionPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.45; transform: scale(1.3); }
          }
          @keyframes timerGlow {
            0%, 100% { text-shadow: 0 0 40px rgba(212,255,62,0.45), 0 0 90px rgba(212,255,62,0.2); }
            50% { text-shadow: 0 0 60px rgba(212,255,62,0.7), 0 0 120px rgba(212,255,62,0.35); }
          }
          @keyframes mapPulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.6); opacity: 0.4; }
          }
          .session-dot { width: 8px; height: 8px; border-radius: 50%; background: #4ADE80; animation: sessionPulse 1.6s ease-in-out infinite; flex-shrink: 0; }
          .session-back { transition: all 0.2s ease; }
          .session-back:hover { border-color: rgba(255,255,255,0.35); color: #f8fafc; }
          .session-timer { animation: timerGlow 3.2s ease-in-out infinite; }
          .session-finish { transition: all 0.2s ease; }
          .session-finish:hover { transform: translateY(-3px); box-shadow: 0 20px 40px rgba(212, 255, 62, 0.4) !important; }
          .session-step { transition: all 0.25s ease; }
          .map-pulse-dot { animation: mapPulse 1.8s ease-out infinite; }
        `}
      </style>

      {/* TOP BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '32px 5%' }}>
        <button
          onClick={() => router.back()}
          className="session-back"
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.16)',
            borderRadius: '100px',
            color: textGray,
            padding: '12px 24px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 700,
          }}
        >
          ← Back
        </button>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: textGray, fontSize: '12px', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          <span className="session-dot" /> Session in Progress
        </span>
      </div>

      {/* CENTERPIECE */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 24px 40px', gap: '40px' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: '0 0 16px', color: accentLime, fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
            {activeRec.activity} · {activeRec.intensity}
          </p>

          {mode === 'outdoor' && <ModeBadge>CareBot tracking enabled</ModeBadge>}
          {mode === 'indoor' && <ModeBadge>🧘 Guided Routine</ModeBadge>}
          {mode === 'social' && <ModeBadge>🤝 CareMatch Sync</ModeBadge>}
        </div>

        {/* ===== MODE A: OUTDOOR ACTIVE ===== */}
        {mode === 'outdoor' && (
          <>
            <div
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '520px',
                height: '220px',
                borderRadius: '24px',
                overflow: 'hidden',
                background: surface,
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <svg width="100%" height="100%" viewBox="0 0 400 220" preserveAspectRatio="none">
                <defs>
                  <pattern id="mapGrid" width="28" height="28" patternUnits="userSpaceOnUse">
                    <path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="400" height="220" fill="url(#mapGrid)" />
                <path
                  d="M 40,180 C 90,60 150,190 210,80 S 330,40 365,95"
                  fill="none"
                  stroke={accentLime}
                  strokeWidth="4"
                  strokeLinecap="round"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(212,255,62,0.6))' }}
                />
                <circle cx="40" cy="180" r="6" fill="#f8fafc" />
                <circle
                  className="map-pulse-dot"
                  cx="365"
                  cy="95"
                  r="7"
                  fill={accentLime}
                  style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                />
                <circle cx="365" cy="95" r="7" fill={accentLime} />
              </svg>
              <span
                style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  padding: '6px 14px',
                  borderRadius: '100px',
                  background: 'rgba(9,12,11,0.7)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
              >
                ☀️ 28°C
              </span>
            </div>

            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <MetricBlock value="5:30" unit="/km" label="Pace" />
              <MetricBlock value={distanceKm} unit="km" label="Distance" />
              <MetricBlock value={formatTime(secondsLeft)} label="Time Left" />
            </div>
          </>
        )}

        {/* ===== MODE C: CAREMATCH SOCIAL SYNC ===== */}
        {mode === 'social' && (
          <>
            <ProgressRing percent={sessionProgress} size={260}>
              <span className="session-timer" style={{ fontSize: 'clamp(2.6rem, 8vw, 4rem)', fontWeight: 900, color: accentLime, letterSpacing: '-2px' }}>
                {formatTime(secondsLeft)}
              </span>
            </ProgressRing>

            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <MetricBlock value="142" unit="BPM" label="Your Live HR" />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '16px 22px',
                borderRadius: '20px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(244, 114, 182, 0.3)',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              }}
            >
              <span style={{ position: 'relative', width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(244,114,182,0.16)', border: '1px solid rgba(244,114,182,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#f9a8d4', fontSize: '16px', flexShrink: 0 }}>
                {currentUser.recommendation.friendName.charAt(0)}
                <span style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '12px', height: '12px', borderRadius: '50%', background: '#4ADE80', border: `2px solid ${bgDark}` }} />
              </span>
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: '14px' }}>{currentUser.recommendation.friendName} is on Step 2</p>
                <p style={{ margin: '4px 0 0', color: textGray, fontSize: '12px' }}>❤️ Live HR: 110 BPM</p>
              </div>
            </div>
          </>
        )}

        {/* ===== MODE B: GUIDED INDOOR / RECOVERY ===== */}
        {mode === 'indoor' && (
          <>
            <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: textGray }}>
              Step {stepIndex + 1} of {RECOVERY_MOVES.length}
            </p>
            <ProgressRing percent={((MOVE_SECONDS - moveSecondsLeft) / MOVE_SECONDS) * 100} size={220}>
              <div style={{ textAlign: 'center' }}>
                <span className="session-timer" style={{ display: 'block', fontSize: 'clamp(2.4rem, 7vw, 3.4rem)', fontWeight: 900, color: accentLime, letterSpacing: '-1px' }}>
                  0:{String(moveSecondsLeft).padStart(2, '0')}
                </span>
              </div>
            </ProgressRing>
            <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, textAlign: 'center' }}>{RECOVERY_MOVES[stepIndex]}</h2>

            <button
              onClick={handleNextMove}
              className="session-finish"
              style={{
                width: '100%',
                maxWidth: '360px',
                padding: '20px',
                borderRadius: '100px',
                border: 'none',
                background: accentLime,
                color: bgDark,
                fontWeight: 900,
                fontSize: '16px',
                cursor: 'pointer',
                boxShadow: '0 14px 30px rgba(212, 255, 62, 0.3)',
              }}
            >
              {isLastMove ? 'Finish Routine' : 'Next Move →'}
            </button>
          </>
        )}

        {/* CHECKLIST — outdoor & social share the whole-session phases */}
        {mode !== 'indoor' && (
          <div style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {steps.map((step, index) => {
              const isDone = index < currentStepIndex;
              const isActive = index === currentStepIndex;
              return (
                <div
                  key={step.label}
                  className="session-step"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '16px 20px',
                    borderRadius: '18px',
                    background: isActive ? 'rgba(212, 255, 62, 0.08)' : surface,
                    border: `1px solid ${isActive ? 'rgba(212, 255, 62, 0.4)' : 'rgba(255,255,255,0.05)'}`,
                  }}
                >
                  <span
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: 900,
                      background: isDone ? accentLime : 'transparent',
                      border: `2px solid ${isDone || isActive ? accentLime : 'rgba(255,255,255,0.2)'}`,
                      color: isDone ? bgDark : accentLime,
                    }}
                  >
                    {isDone ? '✓' : index + 1}
                  </span>
                  <span style={{ fontWeight: isActive ? 800 : 600, color: isActive ? '#f8fafc' : textGray, fontSize: '15px' }}>{step.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FINISH — outdoor & social only; indoor finishes via its own step button */}
      {mode !== 'indoor' && (
        <div style={{ padding: '24px 5% 48px', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={handleFinish}
            className="session-finish"
            style={{
              width: '100%',
              maxWidth: '440px',
              padding: '22px',
              borderRadius: '100px',
              border: 'none',
              background: accentLime,
              color: bgDark,
              fontWeight: 900,
              fontSize: '18px',
              cursor: 'pointer',
              boxShadow: '0 14px 30px rgba(212, 255, 62, 0.3)',
            }}
          >
            Finish Workout
          </button>
        </div>
      )}
    </div>
  );
}
