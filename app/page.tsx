'use client';

import { useRouter } from 'next/navigation';

export default function MainApp() {
  const router = useRouter();

  // Fungsi pindah ke halaman login
  const handleOpenLogin = () => {
    router.push('/login');
  };

  // --- TAMPILAN UTAMA: LANDING PAGE ---
  const bgDark = '#090C0B';
  const accentLime = '#D4FF3E'; 
  const textGray = '#9CA3AF';

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      backgroundColor: bgDark, 
      backgroundImage: `
        linear-gradient(to right, rgba(9, 12, 11, 1) 0%, rgba(9, 12, 11, 0.8) 35%, rgba(9, 12, 11, 0.2) 100%),
        radial-gradient(circle at 80% 50%, rgba(212, 255, 62, 0.1) 0%, transparent 60%),
        url('https://images.unsplash.com/photo-1486218119243-13883505764c?auto=format&fit=crop&w=1920&q=80')
      `,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      color: 'white', 
      fontFamily: 'system-ui, -apple-system, sans-serif', 
      overflowX: 'hidden',
      position: 'relative'
    }}>
      
      {/* INJECTED CSS ANIMATIONS & HOVER EFFECTS */}
      <style>
        {`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(50px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes popOut {
            0% { opacity: 0; transform: scale(0.85); }
            70% { transform: scale(1.02); }
            100% { opacity: 1; transform: scale(1); }
          }
          @keyframes floatWidget {
            0% { transform: translateY(0px) translateZ(50px); }
            50% { transform: translateY(-20px) translateZ(50px); }
            100% { transform: translateY(0px) translateZ(50px); }
          }
          @keyframes levitatePhone {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-30px); }
            100% { transform: translateY(0px); }
          }
          @keyframes levitateWatch {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
            100% { transform: translateY(0px); }
          }
          @keyframes pulseGlow {
            0% { box-shadow: 0 0 50px rgba(212, 255, 62, 0.15), inset 0 0 40px rgba(212, 255, 62, 0.1); transform: scale(1); }
            50% { box-shadow: 0 0 80px rgba(212, 255, 62, 0.4), inset 0 0 60px rgba(212, 255, 62, 0.2); transform: scale(1.02); }
            100% { box-shadow: 0 0 50px rgba(212, 255, 62, 0.15), inset 0 0 40px rgba(212, 255, 62, 0.1); transform: scale(1); }
          }
          
          .animate-fade-up {
            opacity: 0;
            animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .animate-pop {
            opacity: 0;
            animation: popOut 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          }
          .animate-phone-levitate {
            animation: levitatePhone 8s ease-in-out infinite;
          }
          .animate-watch-levitate {
            animation: levitateWatch 6s ease-in-out infinite 1s;
          }
          .animate-pulse {
            animation: pulseGlow 3s infinite;
          }

          .btn-primary {
            transition: all 0.3s ease;
          }
          .btn-primary:hover {
            transform: translateY(-5px) scale(1.05);
            box-shadow: 0 15px 30px rgba(212, 255, 62, 0.4) !important;
          }
          .btn-secondary {
            transition: all 0.3s ease;
          }
          .btn-secondary:hover {
            transform: translateY(-5px) scale(1.05);
            background-color: rgba(255, 255, 255, 0.1) !important;
            border-color: #fff !important;
          }
          .nav-link {
            transition: all 0.2s ease;
          }
          .nav-link:hover {
            color: ${accentLime} !important;
            text-shadow: 0 0 10px rgba(212, 255, 62, 0.5);
          }
        `}
      </style>

      {/* BACKGROUND ORBITS */}
      <div style={{ position: 'absolute', top: '50%', right: '-15%', transform: 'translateY(-50%)', width: '1600px', height: '1600px', borderRadius: '50%', border: '2px solid rgba(212, 255, 62, 0.08)', zIndex: 0, pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', top: '50%', right: '-5%', transform: 'translateY(-50%)', width: '1200px', height: '1200px', borderRadius: '50%', border: '2px solid rgba(212, 255, 62, 0.12)', zIndex: 0, pointerEvents: 'none' }}></div>

      {/* NAVBAR */}
      <nav className="animate-fade-up" style={{ animationDelay: '0.1s', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '40px 5%', borderBottom: '1px solid rgba(255,255,255,0.05)', zIndex: 10, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '80px', height: '80px', backgroundColor: accentLime, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: bgDark, fontWeight: '900', fontSize: '40px', fontStyle: 'italic', boxShadow: `0 0 20px rgba(212, 255, 62, 0.2)` }}>
            C
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '40px', fontWeight: '900', letterSpacing: '-1px' }}>
              CareShift<span style={{ fontSize: '18px', verticalAlign: 'super' }}>™</span>
            </h2>
            <p style={{ margin: 0, fontSize: '16px', color: accentLime, fontWeight: '800' }}>The Wellbeing Decision Engine™</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '32px', color: textGray, fontSize: '30px', fontWeight: '600' }}>
          <span className="nav-link" style={{ cursor: 'pointer', color: 'white' }}>How It Works</span>
          <span style={{ color: accentLime, opacity: 0.5, fontSize: '24px' }}>•</span>
          <span className="nav-link" style={{ cursor: 'pointer', color: 'white' }}>Movement Guide</span>
          <span style={{ color: accentLime, opacity: 0.5, fontSize: '24px' }}>•</span>
          <span className="nav-link" style={{ cursor: 'pointer', color: 'white' }}>What's New</span>
          <span style={{ color: accentLime, opacity: 0.5, fontSize: '24px' }}>•</span>
          <span className="nav-link" style={{ cursor: 'pointer', color: 'white' }}>About</span>
        </div>

        <button 
          className="btn-primary"
          onClick={handleOpenLogin} 
          style={{ backgroundColor: accentLime, color: '#000', padding: '20px 40px', borderRadius: '100px', cursor: 'pointer', fontSize: '30px', fontWeight: '900', border: 'none', boxShadow: '0 4px 15px rgba(212, 255, 62, 0.3)' }}>
          Start
        </button>
      </nav>

      {/* HERO SECTION */}
      <main style={{ flex: 1, display: 'flex', padding: '60px 5%', gap: '80px', maxWidth: '2500px', margin: '0 auto', width: '100%', boxSizing: 'border-box', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        
        {/* KOLOM KIRI */}
        <div style={{ flex: '1.3', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          
          <div className="animate-fade-up" style={{ animationDelay: '0.2s', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
            <div className="animate-pulse" style={{ width: '16px', height: '16px', backgroundColor: accentLime, borderRadius: '50%' }}></div>
            <span style={{ color: accentLime, fontSize: '22px', fontWeight: '900', letterSpacing: '4px', textShadow: '0 0 10px rgba(212, 255, 62, 0.3)' }}>DAILY WELLBEING DECISION GUIDANCE</span>
          </div>
          
          <h1 className="animate-fade-up" style={{ animationDelay: '0.3s', fontSize: '150px', fontWeight: '900', lineHeight: '0.95', margin: '0 0 40px 0', letterSpacing: '-5px', textShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
            Know your <span style={{ color: accentLime, textShadow: '0 0 30px rgba(212, 255, 62, 0.4)' }}>next</span><br />
            <span style={{ background: 'linear-gradient(90deg, #4ADE80, #38BDF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
              move.
            </span>
          </h1>
          
          <p className="animate-fade-up" style={{ animationDelay: '0.4s', fontSize: '32px', color: '#E2E8F0', maxWidth: '850px', lineHeight: '1.5', margin: '0 0 50px 0', fontWeight: '400', textShadow: '0 4px 10px rgba(0,0,0,0.8)' }}>
            Not sure whether to push, move lightly, recover, or reset?<br />
            CareShift turns your calendar schedule, recent movement, and current mood into one clear Daily Signal.
          </p>
          
          <div className="animate-fade-up" style={{ animationDelay: '0.5s', borderLeft: `8px solid ${accentLime}`, paddingLeft: '32px', marginBottom: '60px', backgroundColor: 'rgba(0,0,0,0.2)', padding: '20px 32px', borderRadius: '0 20px 20px 0', backdropFilter: 'blur(5px)' }}>
            <p style={{ fontSize: '26px', margin: 0, color: '#CBD5E1', lineHeight: '1.6' }}>
              <strong style={{ color: 'white' }}>Trackers show what you did.</strong> CareShift helps you decide what fits today without the guilt.
            </p>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: '0.6s', display: 'flex', gap: '30px', fontSize: '30px', fontWeight: '900', color: 'white', marginBottom: '60px', textShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
            <span>Move</span> <span style={{ color: accentLime }}>•</span>
            <span>Sync</span> <span style={{ color: accentLime }}>•</span>
            <span>Match</span> <span style={{ color: accentLime }}>•</span>
            <span>Recover</span>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: '0.7s', display: 'flex', gap: '24px' }}>
            <button 
              className="btn-primary"
              onClick={handleOpenLogin} 
              style={{ backgroundColor: accentLime, color: '#000', padding: '24px 48px', borderRadius: '100px', cursor: 'pointer', fontSize: '26px', fontWeight: '900', border: 'none' }}>
              Launch Hackathon MVP
            </button>
            <button 
              className="btn-secondary"
              onClick={handleOpenLogin} 
              style={{ backgroundColor: 'transparent', color: 'white', padding: '24px 48px', borderRadius: '100px', cursor: 'pointer', fontSize: '26px', fontWeight: '800', border: '3px solid rgba(255,255,255,0.3)' }}>
              See the decision
            </button>
          </div>
        </div>

        {/* KOLOM KANAN (PHONE & WATCH MOCKUPS) */}
        <div style={{ flex: '1', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', perspective: '1400px' }}>
          
          <div className="animate-pop" style={{ animationDelay: '0.5s', position: 'relative' }}>
            
            <div className="animate-phone-levitate" style={{ position: 'relative', zIndex: 2 }}>

              {/* FLOATING WIDGETS */}
              <div style={{ position: 'absolute', right: '-25%', top: '25%', display: 'flex', flexDirection: 'column', gap: '50px', zIndex: 10, transform: 'translateZ(60px)' }}>
                
                <div style={{ 
                  opacity: 0, 
                  animation: 'popOut 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards 1.2s, floatWidget 4s ease-in-out infinite 1.8s', 
                  display: 'flex', alignItems: 'center', gap: '20px', padding: '20px 32px', backgroundColor: 'rgba(10, 15, 13, 0.9)', border: '2px solid rgba(255,255,255,0.1)', borderRadius: '100px', backdropFilter: 'blur(12px)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' 
                }}>
                  <img src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=80&q=80" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} alt="Health" />
                  <div style={{ fontSize: '20px', fontWeight: '700', lineHeight: '1.2' }}>Calendar<br/><span style={{ color: textGray, fontSize: '16px', fontWeight: '500' }}>Connected</span></div>
                </div>

                <div style={{ 
                  opacity: 0, 
                  animation: 'popOut 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards 1.4s, floatWidget 4.5s ease-in-out infinite 2.0s', 
                  display: 'flex', alignItems: 'center', gap: '20px', padding: '20px 32px', backgroundColor: 'rgba(10, 15, 13, 0.9)', border: '2px solid rgba(255,255,255,0.1)', borderRadius: '100px', backdropFilter: 'blur(12px)', marginLeft: '80px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' 
                }}>
                  <img src="https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=80&q=80" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} alt="Wearables" />
                  <div style={{ fontSize: '20px', fontWeight: '700', lineHeight: '1.2' }}>CareMatch<br/><span style={{ color: textGray, fontSize: '16px', fontWeight: '500' }}>Synced</span></div>
                </div>
                
                {/* SVG Connector */}
                <svg className="animate-fade-up" style={{ 
                  animationDelay: '1.6s', 
                  position: 'absolute', 
                  left: '-30px', 
                  top: '70px',    
                  width: '200px', 
                  height: '200px', 
                  pointerEvents: 'none', 
                  zIndex: -1 
                }}>
                  <path d="M 0, 80 Q 60, 80 150, 20" fill="none" stroke={accentLime} strokeWidth="3" strokeDasharray="8 8" opacity="0.6" />
                  <path d="M 0, 80 Q 60, 80 150, 130" fill="none" stroke={accentLime} strokeWidth="3" strokeDasharray="8 8" opacity="0.6" />
                </svg>
              </div>
              
              {/* EFEK 3D PHONE */}
              <div style={{ 
                width: '500px', 
                height: '1100px', 
                backgroundColor: '#111814', 
                border: '10px solid #334139', 
                borderRadius: '64px', 
                padding: '40px 30px', 
                position: 'relative', 
                zIndex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '30px', 
                overflow: 'hidden',
                transform: 'rotateY(-20deg) rotateX(8deg) rotateZ(2deg)',
                transformStyle: 'preserve-3d',
                boxShadow: `
                  -1px 1px 0 #1e2621, -2px 2px 0 #1e2621, -3px 3px 0 #1e2621, 
                  -4px 4px 0 #1e2621, -5px 5px 0 #1e2621, -6px 6px 0 #1e2621, 
                  -7px 7px 0 #1e2621, -8px 8px 0 #1e2621, -9px 9px 0 #1e2621, 
                  -10px 10px 0 #1e2621, -11px 11px 0 #1e2621, -12px 12px 0 #1e2621,
                  -50px 60px 100px rgba(0,0,0,0.95), 
                  inset 0 0 0 3px rgba(255,255,255,0.05)
                `
              }}>
                
                {/* Top Notch */}
                <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '150px', height: '36px', backgroundColor: '#2A3630', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px', zIndex: 10 }}></div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 'bold' }}>12:40</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ width: '24px', height: '14px', backgroundColor: 'white', borderRadius: '4px' }}></div>
                  </div>
                </div>

                {/* PROFILE */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ width: '60px', height: '60px', backgroundColor: accentLime, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black', fontWeight: '900', fontSize: '32px' }}>C</div>
                    <div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>CareShift™</div>
                      <div style={{ fontSize: '16px', color: accentLime, fontWeight: '800', letterSpacing: '0.5px' }}>YOUR DAY, DECODED</div>
                    </div>
                  </div>
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" style={{ width: '55px', height: '55px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${accentLime}` }} alt="Profile" />
                </div>

                <p style={{ margin: 0, fontSize: '20px', color: textGray, fontWeight: '500' }}>Hi Endy 👋</p>

                {/* AI Signal Circle */}
                <div style={{ border: `2px solid rgba(255,255,255,0.1)`, borderRadius: '32px', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', marginTop: '20px', position: 'relative', backgroundColor: 'rgba(212, 255, 62, 0.02)' }}>
                  <div style={{ position: 'absolute', top: '-14px', backgroundColor: '#111814', padding: '0 20px', fontSize: '16px', color: textGray, fontWeight: '800', letterSpacing: '1.5px' }}>TODAY'S SIGNAL</div>
                  
                  <div className="animate-pulse" style={{ width: '240px', height: '240px', borderRadius: '50%', border: `8px solid ${accentLime}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '70px', fontWeight: '900', color: accentLime, lineHeight: '1' }}>MOVE</span>
                    <span style={{ fontSize: '18px', textAlign: 'center', padding: '0 24px', marginTop: '10px', color: 'white', fontWeight: '600' }}>Keep the day alive.</span>
                  </div>
                </div>

                {/* CareMatch Mini UI */}
                <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '24px', padding: '32px', marginTop: '16px', border: '2px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '16px', color: accentLime, fontWeight: '900', letterSpacing: '1px', marginBottom: '12px' }}>CAREMATCH AI</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', marginBottom: '12px' }}>15-Min Reset</div>
                  <div style={{ fontSize: '20px', color: textGray, lineHeight: '1.5' }}>Eric is also free right now. A short, easy walk restarts your momentum without pressure.</div>
                </div>

              </div>

            </div>

            {/* 3D SMARTWATCH */}
            <div className="animate-watch-levitate" style={{ 
              position: 'absolute', 
              bottom: '-60px', 
              left: '-160px', 
              zIndex: 20, 
              opacity: 0,
              animation: 'popOut 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards 0.9s, levitateWatch 6s ease-in-out infinite 1.5s'
            }}>
              <div style={{ width: '140px', height: '40px', backgroundColor: '#1A231E', margin: '0 auto', borderTopLeftRadius: '10px', borderTopRightRadius: '10px', transform: 'perspective(200px) rotateX(20deg)', transformOrigin: 'bottom', border: '2px solid #2A3630', borderBottom: 'none' }}></div>
              
              <div style={{ 
                width: '220px', height: '260px', backgroundColor: '#0B0F0D', 
                border: '12px solid #334139', borderRadius: '50px', 
                padding: '24px', position: 'relative', 
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                transform: 'rotateY(15deg) rotateX(10deg) rotateZ(-5deg)', transformStyle: 'preserve-3d',
                boxShadow: `
                  5px 5px 0 #1e2621, 6px 6px 0 #1e2621, 7px 7px 0 #1e2621, 8px 8px 0 #1e2621,
                  -30px 40px 60px rgba(0,0,0,0.8), inset 0 0 0 2px rgba(255,255,255,0.05)
                `
              }}>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                   <div style={{ color: textGray, fontSize: '18px', fontWeight: 'bold' }}>12:40</div>
                   <div style={{ width: '10px', height: '10px', backgroundColor: '#F43F5E', borderRadius: '50%', boxShadow: '0 0 10px #F43F5E' }}></div>
                </div>

                <div style={{ width: '130px', height: '130px', borderRadius: '50%', border: `6px solid ${accentLime}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderTopColor: 'transparent', transform: 'rotate(45deg)' }}>
                  <div style={{ transform: 'rotate(-45deg)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                     <span style={{ fontSize: '40px', fontWeight: '900', color: 'white', lineHeight: '1' }}>72</span>
                     <span style={{ fontSize: '14px', color: accentLime, fontWeight: 'bold', marginTop: '4px' }}>BPM</span>
                  </div>
                </div>
                
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                  <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>Resting HR</div>
                  <div style={{ color: textGray, fontSize: '14px' }}>Synced live</div>
                </div>
              </div>

              <div style={{ width: '140px', height: '40px', backgroundColor: '#1A231E', margin: '0 auto', borderBottomLeftRadius: '10px', borderBottomRightRadius: '10px', transform: 'perspective(200px) rotateX(-20deg)', transformOrigin: 'top', border: '2px solid #2A3630', borderTop: 'none' }}></div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}