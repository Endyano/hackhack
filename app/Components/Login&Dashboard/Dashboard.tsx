'use client';

import Link from 'next/link';
import { moodMeta, getCheckinRecommendation } from '../AfterLogin/CheckinData';
import { useDemoState } from '../DemoStateContext';
import { getActiveRecommendation, formatDate } from '../DemoData';
import AppNav from '../AppNav';

const bgDark = '#090C0B';
const accentLime = '#D4FF3E';
const textGray = '#9CA3AF';

const navCards = [
  {
    href: '/move',
    emoji: '🏃',
    title: 'Move',
    description: 'Find your next activity.',
    action: 'Explore',
    color: '#D4FF3E',
  },
  {
    href: '/smart-calendar',
    emoji: '🗓️',
    title: 'Smart Calendar',
    description: 'Find time to move.',
    action: 'View Calendar',
    color: '#38BDF8',
  },
  {
    href: '/carematch',
    emoji: '🤝',
    title: 'CareMatch',
    description: 'Move better together.',
    action: 'Find a Buddy',
    color: '#F472B6',
  },
  {
    href: '/progress',
    emoji: '📈',
    title: 'Progress',
    description: 'See your journey.',
    action: 'View Progress',
    color: '#4ADE80',
  },
];

// Picks a background "mood" icon for the recommendation card based on the activity's copy.
function getActivityGlyph(activity: string) {
  const text = activity.toLowerCase();
  if (text.includes('run')) return '🏃';
  if (text.includes('walk')) return '🚶';
  if (text.includes('stretch') || text.includes('mobility') || text.includes('breath')) return '🧘';
  if (text.includes('rest') || text.includes('recover')) return '😌';
  return '🔥';
}

// Baseline demo values aren't in the checkin's Mood/percentage shape yet — map them for the snapshot cards.
const fallbackMoodEmoji: Record<string, string> = {
  Stressed: '😣',
  Ready: '😊',
};

const fallbackEnergyPercent: Record<string, number> = {
  Low: 25,
  Medium: 55,
  High: 85,
};

const tagStyle = {
  padding: '8px 16px',
  borderRadius: '100px',
  background: 'rgba(212, 255, 62, 0.1)',
  border: '1px solid rgba(212, 255, 62, 0.3)',
  color: accentLime,
  fontSize: '13px',
  fontWeight: 800,
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const recActionMeta: { action: 'accept' | 'shorten' | 'replace' | 'skip'; state: 'accepted' | 'shortened' | 'replaced' | 'skipped'; label: string }[] = [
  { action: 'accept', state: 'accepted', label: 'Accept' },
  { action: 'shorten', state: 'shortened', label: 'Shorten' },
  { action: 'replace', state: 'replaced', label: 'Replace' },
  { action: 'skip', state: 'skipped', label: 'Skip' },
];

export default function Dashboard() {
  const {
    currentUser,
    displayName,
    checkinMood,
    checkinEnergy,
    recommendationState,
    liveRecommendation,
    recommendationLoading,
    applyRecommendationAction,
  } = useDemoState();

  const currentDate = formatDate();
  const hasCheckedInToday = checkinMood !== null && checkinEnergy !== null;

  const activeRec = getActiveRecommendation(currentUser, recommendationState);

  // Prefer the real Foundry response from the backend (set once the user
  // completes the check-in flow). Fall back to the local check-in ladder,
  // then to the seeded demo recommendation, so the card never looks empty.
  const heroRec = liveRecommendation
    ? {
        activity: liveRecommendation.activity,
        intensity: liveRecommendation.intensity,
        reason: liveRecommendation.reason,
        durationMinutes: liveRecommendation.duration_minutes as number | undefined,
        startTime: liveRecommendation.start_time as string | undefined,
      }
    : hasCheckedInToday
      ? { ...getCheckinRecommendation(checkinMood!, checkinEnergy!), durationMinutes: undefined, startTime: undefined }
      : { ...activeRec, durationMinutes: activeRec.durationMinutes as number | undefined, startTime: activeRec.startTime as string | undefined };
  const hasStructuredTiming = heroRec.durationMinutes !== undefined && heroRec.startTime !== undefined;

  const snapshotMoodEmoji = checkinMood ? moodMeta[checkinMood].emoji : fallbackMoodEmoji[currentUser.mood] ?? '😐';
  const snapshotMoodLabel = checkinMood ? moodMeta[checkinMood].label : currentUser.mood;
  const snapshotEnergy = checkinEnergy ?? fallbackEnergyPercent[currentUser.energy] ?? 50;
  const snapshotReadiness = currentUser.readiness;

  const freeSlot = currentUser.freeSlots[0];
  const activityGlyph = getActivityGlyph(heroRec.activity);
  const buddyName = liveRecommendation?.carematch.friend_name ?? currentUser.recommendation.friendName;
  const showBuddyChip =
    recommendationState === 'pending' &&
    (liveRecommendation ? liveRecommendation.social_compatible : !hasCheckedInToday && currentUser.recommendation.socialCompatible);

  return (
    <div
      className="dashboard-page"
      style={{
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        isolation: 'isolate',
        overflow: 'hidden',
        backgroundColor: bgDark,
        backgroundImage: `
          linear-gradient(180deg, rgba(9, 12, 11, 0.94) 0%, rgba(9, 12, 11, 0.86) 45%, rgba(9, 12, 11, 0.97) 100%),
          radial-gradient(circle at 85% 0%, rgba(212, 255, 62, 0.1) 0%, transparent 55%),
          url('https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1920&q=80')
        `,
        backgroundSize: 'cover, cover, cover',
        backgroundPosition: 'center, center, center',
        backgroundAttachment: 'fixed, fixed, fixed',
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <style>
        {`
          .dash-btn { transition: all 0.2s ease; }
          .dash-btn:hover { transform: translateY(-2px); }
          .dashboard-page > nav { position: relative; z-index: 1; }
          .dashboard-wallpaper {
            position: absolute;
            inset: 0;
            z-index: 0;
            pointer-events: none;
            overflow: hidden;
            background:
              radial-gradient(circle at 88% 22%, rgba(212, 255, 62, 0.13), transparent 20%),
              radial-gradient(circle at 5% 88%, rgba(84, 141, 92, 0.14), transparent 24%);
          }
          .dashboard-wallpaper::before {
            content: '';
            position: absolute;
            width: 720px;
            height: 660px;
            top: 80px;
            right: -160px;
            opacity: 0.3;
            background-image:
              linear-gradient(rgba(212, 255, 62, 0.14) 1px, transparent 1px),
              linear-gradient(90deg, rgba(212, 255, 62, 0.14) 1px, transparent 1px);
            background-size: 74px 74px;
            mask-image: radial-gradient(circle, black 5%, transparent 69%);
          }
          .dashboard-route {
            position: absolute;
            width: min(72vw, 920px);
            height: 390px;
            right: -210px;
            top: 185px;
            border: 2px solid rgba(212, 255, 62, 0.18);
            border-radius: 52% 48% 58% 42%;
            transform: rotate(-24deg);
            box-shadow: 0 0 42px rgba(212, 255, 62, 0.08), inset 0 0 36px rgba(212, 255, 62, 0.04);
          }
          .wallpaper-runner {
            position: absolute;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #D4FF3E;
            box-shadow: 0 0 0 6px rgba(212, 255, 62, 0.08), 0 0 22px rgba(212, 255, 62, 0.42);
          }
          .wallpaper-runner::after {
            content: '';
            position: absolute;
            width: 28px;
            height: 2px;
            top: 5px;
            right: 11px;
            background: linear-gradient(90deg, rgba(212, 255, 62, 0), rgba(212, 255, 62, 0.55));
          }
          .runner-one { top: 304px; right: 19%; }
          .runner-two { top: 572px; right: 6%; opacity: 0.6; transform: scale(0.72); }

          .snapshot-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
          .snapshot-card {
            padding: 24px;
            border-radius: 24px;
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.08);
            transition: all 0.2s ease;
          }
          .snapshot-card:hover {
            transform: translateY(-3px);
            border-color: rgba(212, 255, 62, 0.3);
            background: rgba(255,255,255,0.06);
          }
          .energy-bar-track {
            margin-top: 12px;
            height: 6px;
            border-radius: 100px;
            background: rgba(255,255,255,0.08);
            overflow: hidden;
          }
          .energy-bar-fill { height: 100%; border-radius: 100px; background: ${accentLime}; }

          .hero-rec-card { position: relative; overflow: hidden; }
          .hero-rec-card::before {
            content: '';
            position: absolute;
            top: -45%;
            right: -8%;
            width: 460px;
            height: 460px;
            background: radial-gradient(circle, rgba(212,255,62,0.16), transparent 70%);
            pointer-events: none;
            animation: glowDrift 8s ease-in-out infinite;
          }
          .hero-rec-glyph {
            position: absolute;
            right: -6%;
            bottom: -18%;
            font-size: 260px;
            line-height: 1;
            opacity: 0.06;
            transform: rotate(-8deg);
            pointer-events: none;
            filter: blur(1px);
          }
          .reason-clamp {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          @keyframes glowDrift {
            0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.9; }
            50% { transform: translate(-16px, 12px) scale(1.08); opacity: 1; }
          }

          @keyframes companionFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }
          @keyframes companionBreathe {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.06); }
          }
          @keyframes companionPulse {
            0% { transform: scale(0.9); opacity: 0.8; }
            100% { transform: scale(1.55); opacity: 0; }
          }
          @keyframes companionHalo {
            0%, 100% { opacity: 0.55; transform: scale(1); }
            50% { opacity: 0.9; transform: scale(1.1); }
          }
          @keyframes sparkleTwinkle {
            0%, 100% { opacity: 0; transform: scale(0.4); }
            50% { opacity: 1; transform: scale(1); }
          }
          .companion-wrap { position: relative; width: 140px; height: 140px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; animation: companionFloat 5s ease-in-out infinite; }
          .companion-halo {
            position: absolute;
            inset: 4px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(212,255,62,0.5), transparent 68%);
            filter: blur(14px);
            animation: companionHalo 4.5s ease-in-out infinite;
          }
          .companion-avatar { position: relative; width: 112px; height: 112px; display: flex; align-items: center; justify-content: center; }
          .companion-ring {
            position: absolute;
            inset: -10px;
            border-radius: 50%;
            border: 1px solid rgba(212, 255, 62, 0.4);
            animation: companionPulse 2.6s ease-out infinite;
          }
          .companion-ring-delay {
            position: absolute;
            inset: -10px;
            border-radius: 50%;
            border: 1px solid rgba(212, 255, 62, 0.4);
            animation: companionPulse 2.6s ease-out infinite 1.3s;
          }
          .companion-core {
            position: relative;
            width: 96px;
            height: 96px;
            border-radius: 50%;
            background: radial-gradient(circle at 32% 26%, #f2ffb8 0%, rgba(212,255,62,0.95) 30%, rgba(160,214,20,0.65) 62%, rgba(9,12,11,0.95) 100%);
            box-shadow: 0 0 0 1px rgba(212,255,62,0.3), 0 18px 38px rgba(212,255,62,0.28);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            animation: companionBreathe 4.5s ease-in-out infinite;
          }
          .companion-eye { width: 8px; height: 8px; border-radius: 50%; background: #090C0B; }
          .companion-smile {
            position: absolute;
            bottom: 30px;
            left: 50%;
            width: 26px;
            height: 12px;
            transform: translateX(-50%);
            border-bottom: 3px solid rgba(9, 12, 11, 0.7);
            border-radius: 0 0 16px 16px;
          }
          .companion-status {
            position: absolute;
            bottom: 4px;
            right: 4px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #4ADE80;
            border: 3px solid #0B0F0D;
            box-shadow: 0 0 10px rgba(74, 222, 128, 0.6);
          }
          .companion-sparkle {
            position: absolute;
            border-radius: 50%;
            background: #D4FF3E;
            box-shadow: 0 0 8px rgba(212, 255, 62, 0.8);
          }
          .sparkle-a { top: 4px; right: 10px; width: 6px; height: 6px; animation: sparkleTwinkle 3.4s ease-in-out infinite; }
          .sparkle-b { bottom: 18px; left: 0px; width: 5px; height: 5px; animation: sparkleTwinkle 3.4s ease-in-out infinite 1.1s; }
          .sparkle-c { top: 24px; left: -6px; width: 4px; height: 4px; animation: sparkleTwinkle 3.4s ease-in-out infinite 2.2s; }

          .buddy-chip {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            border-radius: 100px;
            background: rgba(244, 114, 182, 0.12);
            border: 1px solid rgba(244, 114, 182, 0.35);
            color: #f9a8d4;
            font-size: 13px;
            font-weight: 800;
          }

          .cta-shimmer { position: relative; overflow: hidden; }
          .cta-shimmer::after {
            content: '';
            position: absolute;
            top: 0;
            left: -60%;
            width: 40%;
            height: 100%;
            background: linear-gradient(115deg, transparent, rgba(255,255,255,0.55), transparent);
            animation: shimmerSweep 3s ease-in-out infinite;
          }
          @keyframes shimmerSweep {
            0% { left: -60%; }
            55%, 100% { left: 130%; }
          }
          .cta-shimmer:hover { transform: translateY(-3px) scale(1.03); box-shadow: 0 18px 36px rgba(212, 255, 62, 0.4) !important; }

          .live-badge { display: inline-flex; align-items: center; gap: 6px; }
          .live-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #4ADE80;
            box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.18), 0 0 8px rgba(74, 222, 128, 0.9);
            animation: livePulse 1.8s ease-in-out infinite;
          }
          @keyframes livePulse {
            0%, 100% { transform: scale(1); box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.18), 0 0 8px rgba(74, 222, 128, 0.9); }
            50% { transform: scale(1.25); box-shadow: 0 0 0 5px rgba(74, 222, 128, 0.1), 0 0 12px rgba(74, 222, 128, 1); }
          }

          .nav-card-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 32px; }
          .nav-card {
            display: block;
            text-decoration: none;
            color: inherit;
            padding: 44px 40px;
            border-radius: 32px;
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.05);
            transition: all 0.2s ease;
          }
          .nav-card:hover {
            transform: translateY(-6px);
            border-color: rgba(212, 255, 62, 0.4);
            background: rgba(212, 255, 62, 0.05);
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          }
          .nav-card-icon { transition: transform 0.25s ease, box-shadow 0.25s ease; }
          .nav-card:hover .nav-card-icon { transform: scale(1.1) rotate(-4deg); }
          .nav-card-cta { display: inline-flex; align-items: center; transition: transform 0.25s ease; }
          .nav-card:hover .nav-card-cta { transform: translateX(5px); }

          @media (max-width: 720px) {
            .nav-card-grid { grid-template-columns: 1fr; }
            .nav-card { padding: 32px 28px; }
            .snapshot-grid { grid-template-columns: 1fr; }
          }
        `}
      </style>

      <AppNav />
      <div className="dashboard-wallpaper" aria-hidden="true">
        <div className="dashboard-route" />
        <span className="wallpaper-runner runner-one" />
        <span className="wallpaper-runner runner-two" />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1280px', margin: '0 auto', padding: '56px 5% 100px', display: 'flex', flexDirection: 'column', gap: '48px' }}>
        {/* WELCOME */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <p style={{ margin: 0, color: textGray, fontSize: '14px', fontWeight: 600 }}>{currentDate}</p>
            <h1 style={{ margin: '10px 0 6px', fontSize: 'clamp(2.4rem, 4vw, 3.4rem)', fontWeight: 900, letterSpacing: '-1.5px' }}>
              {getGreeting()}, <span style={{ color: accentLime }}>{displayName}</span> 👋
            </h1>
            <p style={{ margin: 0, color: textGray, fontSize: '16px', fontWeight: 600 }}>Your wellbeing snapshot</p>
          </div>

          {!hasCheckedInToday && (
            <Link
              href={`/checkin/mood?user=${currentUser.id}`}
              className="dash-btn"
              style={{
                display: 'inline-block',
                padding: '14px 26px',
                borderRadius: '100px',
                border: `1px solid rgba(212, 255, 62, 0.4)`,
                color: accentLime,
                fontWeight: 800,
                fontSize: '14px',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Check in now →
            </Link>
          )}
        </header>

        {/* TODAY'S WELLBEING SNAPSHOT */}
        <div className="snapshot-grid">
          <div className="snapshot-card">
            <span style={{ fontSize: '30px' }}>{snapshotMoodEmoji}</span>
            <p style={{ margin: '14px 0 4px', color: textGray, fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Mood</p>
            <p style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>{snapshotMoodLabel}</p>
          </div>

          <div className="snapshot-card">
            <span style={{ fontSize: '30px' }}>⚡</span>
            <p style={{ margin: '14px 0 4px', color: textGray, fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Energy</p>
            <p style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: accentLime }}>{snapshotEnergy}%</p>
            <div className="energy-bar-track">
              <div className="energy-bar-fill" style={{ width: `${snapshotEnergy}%` }} />
            </div>
          </div>

          <div className="snapshot-card">
            <span style={{ fontSize: '30px' }}>💪</span>
            <p style={{ margin: '14px 0 4px', color: textGray, fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Readiness</p>
            <p style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: snapshotReadiness === 'Good' ? accentLime : '#f8fafc' }}>{snapshotReadiness}</p>
          </div>
        </div>

        {/* MAIN AI RECOMMENDATION — CareBot companion */}
        <section
          className="hero-rec-card"
          style={{
            borderRadius: '32px',
            background: 'linear-gradient(160deg, rgba(212, 255, 62, 0.08), rgba(15, 23, 42, 0.94))',
            border: '1px solid rgba(212, 255, 62, 0.22)',
            padding: 'clamp(28px, 4vw, 40px)',
            boxShadow: '0 30px 60px rgba(0,0,0,0.35)',
          }}
        >
          <div style={{ display: 'flex', gap: '36px', alignItems: 'flex-start', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
              <div className="companion-wrap">
                <div className="companion-halo" />
                <div className="companion-avatar">
                  <div className="companion-ring" />
                  <div className="companion-ring-delay" />
                  <div className="companion-core">
                    <span className="companion-eye" />
                    <span className="companion-eye" />
                    <span className="companion-smile" />
                  </div>
                  <span className="companion-status" />
                </div>
                <span className="companion-sparkle sparkle-a" />
                <span className="companion-sparkle sparkle-b" />
                <span className="companion-sparkle sparkle-c" />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 800, color: textGray, letterSpacing: '0.06em' }}>CareBot</span>
            </div>

            <div style={{ flex: '1 1 280px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <p style={{ margin: 0, color: accentLime, fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  ✨ Recommended for you
                </p>
                <span className="live-badge" style={{ color: textGray, fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  <span className="live-dot" /> {recommendationLoading ? 'Thinking…' : 'Live'}
                </span>
              </div>
              <h2 style={{ margin: '14px 0 0', fontSize: 'clamp(2rem, 3.4vw, 2.8rem)', fontWeight: 900, letterSpacing: '-1.2px' }}>
                {heroRec.activity}
              </h2>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', margin: '18px 0' }}>
                <span style={tagStyle}>{heroRec.intensity}</span>
                {hasStructuredTiming && <span style={tagStyle}>{heroRec.durationMinutes} min</span>}
                {hasStructuredTiming && <span style={tagStyle}>Today · {heroRec.startTime}</span>}
                {showBuddyChip && <span className="buddy-chip">🤝 {buddyName} is free too</span>}
              </div>

              <p className="reason-clamp" style={{ margin: '0 0 28px', color: '#cbd5e1', fontSize: '16px', lineHeight: 1.6, maxWidth: '520px' }}>
                {heroRec.reason}
              </p>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
                {recActionMeta.map(({ action, state, label }) => {
                  const isActive = recommendationState === state;
                  return (
                    <button
                      key={state}
                      onClick={() => applyRecommendationAction(action)}
                      disabled={recommendationLoading}
                      className="dash-btn"
                      style={{
                        padding: '10px 20px',
                        borderRadius: '100px',
                        border: `1px solid ${isActive ? accentLime : 'rgba(255,255,255,0.16)'}`,
                        background: isActive ? accentLime : 'rgba(255,255,255,0.04)',
                        color: isActive ? bgDark : '#e2e8f0',
                        fontWeight: 800,
                        fontSize: '13px',
                        cursor: recommendationLoading ? 'default' : 'pointer',
                        opacity: recommendationLoading ? 0.6 : 1,
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <Link
                href="/active-session"
                className="dash-btn cta-shimmer"
                style={{
                  display: 'inline-block',
                  padding: '18px 40px',
                  borderRadius: '100px',
                  background: accentLime,
                  color: bgDark,
                  fontWeight: 900,
                  fontSize: '16px',
                  textDecoration: 'none',
                  boxShadow: '0 14px 30px rgba(212, 255, 62, 0.3)',
                }}
              >
                Start Activity →
              </Link>
            </div>
          </div>

          <span className="hero-rec-glyph" aria-hidden="true">{activityGlyph}</span>
        </section>

        {/* SECTION DIVIDER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212, 255, 62, 0.35))' }} />
          <span style={{ color: textGray, fontSize: '12px', fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            What would you like to do today?
          </span>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(212, 255, 62, 0.35), transparent)' }} />
        </div>

        {/* FEATURE NAVIGATION */}
        <div>
          <div className="nav-card-grid">
            {navCards.map((card) => (
              <Link key={card.href} href={card.href} className="nav-card">
                <div
                  className="nav-card-icon"
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '20px',
                    background: `${card.color}22`,
                    border: `1px solid ${card.color}40`,
                    boxShadow: `0 10px 26px ${card.color}33`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '36px',
                    marginBottom: '28px',
                  }}
                >
                  {card.emoji}
                </div>
                <h3 style={{ margin: '0 0 12px', fontSize: '1.6rem', fontWeight: 800 }}>{card.title}</h3>
                <p style={{ margin: 0, color: textGray, fontSize: '16px', lineHeight: 1.6 }}>{card.description}</p>
                <span className="nav-card-cta" style={{ marginTop: '24px', color: card.color, fontWeight: 800, fontSize: '16px' }}>
                  {card.action} →
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* SMART CALENDAR PREVIEW */}
        <section
          style={{
            borderRadius: '28px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '30px 36px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
          }}
        >
          <div>
            <p style={{ margin: 0, color: accentLime, fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              🗓️ Next available time
            </p>
            <p style={{ margin: '12px 0 0', fontSize: '1.5rem', fontWeight: 800 }}>
              Today · {freeSlot.start}–{freeSlot.end}
            </p>
            <p style={{ margin: '6px 0 0', color: textGray, fontSize: '14px' }}>{freeSlot.usableMinutes} min available</p>
          </div>

          <div style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: 700 }}>
            ✨ Recommended: <span style={{ color: accentLime, fontWeight: 800 }}>{heroRec.activity}{heroRec.startTime ? ` · ${heroRec.startTime}` : ''}</span>
          </div>

          <Link
            href="/smart-calendar"
            className="dash-btn"
            style={{
              padding: '14px 26px',
              borderRadius: '100px',
              border: '1px solid rgba(255,255,255,0.18)',
              color: '#f8fafc',
              fontWeight: 800,
              fontSize: '14px',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            View Smart Calendar →
          </Link>
        </section>
      </div>
    </div>
  );
}
