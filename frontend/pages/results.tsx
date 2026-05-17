import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { cognitiveAPI } from '@/services/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/* ────────────────────────────── colour helpers ────────────────────────────── */
function getColorForScore(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#eab308';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}
function getLighterColor(c: string): string {
  const m: Record<string, string> = { '#22c55e': '#86efac', '#eab308': '#fde047', '#f97316': '#fdba74', '#ef4444': '#fca5a5' };
  return m[c] || c;
}

/* ────────────────────────── Overall‑Score gauge data ──────────────────────── */
function buildGaugeData(score: number) {
  return [
    { name: 'Score', value: score },
    { name: 'Remainder', value: 100 - score },
  ];
}
const GAUGE_COLORS = ['#6366f1', '#e5e7eb'];

/* ────────────────────────── grade badge colour map ────────────────────────── */
function gradeColor(grade: string): string {
  if (grade.includes('Advanced')) return 'from-emerald-500 to-teal-500';
  if (grade.includes('Confident')) return 'from-blue-500 to-indigo-500';
  if (grade.includes('Developing')) return 'from-amber-500 to-yellow-500';
  if (grade.includes('Emerging')) return 'from-orange-500 to-red-400';
  return 'from-rose-500 to-pink-500';
}

/* ══════════════════════════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════════════════════════ */
export default function Results() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [quizCount, setQuizCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    setUser(JSON.parse(userData));
    loadProfile();
  }, []);

  // Auto-retry polling if profile isn't ready but user has enough quizzes
  useEffect(() => {
    if (profile || quizCount < 3 || error) return;
    
    let retries = 0;
    const interval = setInterval(async () => {
      retries++;
      if (retries > 5) {
        clearInterval(interval);
        setError("AI Engine timeout. Please try again.");
        return;
      }
      try {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        const res = await import('@/services/api').then(m => m.cognitiveAPI.getProfile(u.id));
        if (res.data?.profile) {
          setProfile(res.data.profile);
          clearInterval(interval);
        }
      } catch (err: any) {
        if (err.response?.status === 500) {
          clearInterval(interval);
          const backendError = err.response?.data?.error || err.response?.data?.message || err.message || "AI Engine unavailable or timed out.";
          setError(backendError);
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [profile, quizCount, error]);

  const loadProfile = async () => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      if (!u.id) { setLoading(false); return; }

      // Fetch quiz count from dashboard for progress display
      try {
        const dashRes = await import('@/services/api').then(m => m.dashboardAPI.getData(u.id));
        const completedTypes = dashRes.data?.data?.completedActivities || [];
        setQuizCount(Array.isArray(completedTypes) ? completedTypes.length : 0);
      } catch { /* non-critical */ }

      const res = await cognitiveAPI.getProfile(u.id);
      setProfile(res.data.profile);
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  /* ── derived data ── */
  const chartData = useMemo(() => profile ? [
    { subject: 'Visual Memory', A: profile.visualMemory, fullMark: 100 },
    { subject: 'Logical Reasoning', A: profile.logicalReasoning, fullMark: 100 },
    { subject: 'Attention', A: profile.attentionFocus, fullMark: 100 },
    { subject: 'Processing Speed', A: profile.processingSpeed, fullMark: 100 },
    { subject: 'Reading', A: profile.readingComprehension, fullMark: 100 },
  ] : [], [profile]);

  const overallScore = useMemo(() => {
    if (!profile) return 0;
    const vals = [profile.visualMemory, profile.logicalReasoning, profile.attentionFocus, profile.processingSpeed, profile.readingComprehension];
    return Math.round(vals.reduce((a: number, b: number) => a + b, 0) / vals.length);
  }, [profile]);

  const gaugeData = useMemo(() => buildGaugeData(overallScore), [overallScore]);

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handlePrintReport = async () => {
    setIsGeneratingPDF(true);
    const element = document.getElementById('pdf-report-content');
    if (!element) {
      setIsGeneratingPDF(false);
      window.print(); // fallback
      return;
    }
    
    // Save original styles
    const originalDisplay = element.style.display;
    const originalPosition = element.style.position;
    const originalTop = element.style.top;
    const originalLeft = element.style.left;
    const originalZIndex = element.style.zIndex;

    // Bring element into viewport temporarily to force browser to render its full height properly
    element.style.display = 'block';
    element.style.position = 'absolute';
    element.style.top = '0';
    element.style.left = '0';
    element.style.zIndex = '-1000'; // hide behind main UI
    
    // Give the DOM a tiny moment to paint the charts and flex columns
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      const canvas = await html2canvas(element, {
        scale: 2, // higher resolution for crisp text
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate scaled image height
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add new pages if content overflows
      while (heightLeft > 0) {
        position = heightLeft - imgHeight; // Shift image up
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`Cognitive-DNA-Report-${user?.name?.replace(/\s+/g, '-') || 'Student'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      // Restore original styles
      element.style.display = originalDisplay;
      element.style.position = originalPosition;
      element.style.top = originalTop;
      element.style.left = originalLeft;
      element.style.zIndex = originalZIndex;
      setIsGeneratingPDF(false);
    }
  };

  /* ── loading state ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }} className="w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  /* ── STATE A: Not enough quizzes completed ── */
  if (!profile && quizCount < 3) {
    const remaining = 3 - quizCount;
    const progressPct = Math.round((quizCount / 3) * 100);

    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 flex flex-col items-center justify-center px-4 relative overflow-hidden">
        <Head><title>Unlock Your Brain Map — Cognitive DNA</title></Head>
        <div className="absolute top-[-80px] left-[-60px] w-[300px] h-[300px] bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-60px] right-[-40px] w-[250px] h-[250px] bg-teal-300/10 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="card bg-white/90 text-slate-800 text-center max-w-lg p-10 relative z-10"
        >
          <div className="text-7xl mb-4">🔒</div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-3 drop-shadow-sm">Unlock Your Brain Map!</h1>

          <div className="mb-5">
            <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5">
              <span>Progress</span>
              <span className="text-slate-700">{quizCount}/3 Quests</span>
            </div>
            <div className="bg-slate-200 rounded-full h-4 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-amber-400 to-teal-400 rounded-full"
              />
            </div>
          </div>

          <p className="text-slate-600 text-base mb-6 leading-relaxed">
            You've completed <span className="font-bold text-amber-500">{quizCount}</span> quest{quizCount !== 1 ? 's' : ''}!
            Complete <span className="font-bold text-teal-600">{remaining} more</span> to unlock your Cognitive DNA Map and secret video recommendations! 🚀
          </p>

          <motion.button 
            whileHover={{ scale: 1.04 }} 
            whileTap={{ scale: 0.97 }} 
            className="btn-action text-lg px-10 py-3"
            onClick={() => router.push('/student-dashboard')}
          >
            Start More Quests →
          </motion.button>
        </motion.div>
      </div>
    );
  }

  /* ── STATE B: Enough quizzes done, but profile not ready yet (AI processing) ── */
  if (!profile && quizCount >= 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 flex flex-col items-center justify-center px-4 relative overflow-hidden">
        <Head><title>Analyzing — Cognitive DNA</title></Head>
        <div className="absolute top-[-80px] left-[-60px] w-[300px] h-[300px] bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-white/90 text-slate-800 text-center max-w-lg p-10 relative z-10"
        >
          {error ? (
            <>
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-3xl font-extrabold text-slate-900 mb-3 drop-shadow-sm">Analysis Paused.</h1>
              <p className="text-slate-600 text-base mb-2 leading-relaxed">
                Our AI is taking a quick break. Please make sure the AI Engine is running and try refreshing the page.
              </p>
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm font-mono px-4 py-3 rounded-xl mb-6 mx-auto max-w-sm">
                Error: {error}
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="btn-action text-lg px-8 py-3"
              >
                Retry Analysis 🔄
              </button>
            </>
          ) : (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                className="text-7xl mb-4 inline-block"
              >🧠</motion.div>
              <h1 className="text-3xl font-extrabold text-slate-900 mb-3 drop-shadow-sm">Analyzing Your Cognitive DNA...</h1>
              <p className="text-slate-600 text-base mb-6 leading-relaxed">
                Our AI is mapping your brain! This may take a few seconds. ✨<br/>
                <span className="text-slate-400 text-sm">The page will update automatically.</span>
              </p>
              <motion.div
                animate={{ scaleX: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="h-1.5 bg-gradient-to-r from-amber-400 via-teal-400 to-violet-400 rounded-full max-w-xs mx-auto"
              />
            </>
          )}
        </motion.div>
      </div>
    );
  }

  /* ════════════════════════════════ MAIN RENDER ═══════════════════════════════ */
  return (
    <>
      <Head><title>Cognitive DNA — Diagnostic Report</title></Head>

      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .results-page {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .card {
            box-shadow: none !important;
            border: 1px solid #e2e8f0 !important;
            break-inside: avoid;
            margin-bottom: 12px !important;
            padding: 16px !important;
          }
          /* Scale down everything slightly so it fits on one page */
          .max-w-6xl {
            transform: scale(0.85);
            transform-origin: top center;
            width: 110% !important;
            margin-left: -5% !important;
          }
          .no-print {
            display: none !important;
          }
          .print-only-header {
            display: block !important;
            margin-bottom: 20px;
          }
          h2 {
            font-size: 1.1rem !important;
            margin-bottom: 8px !important;
          }
        }
      `}</style>

      <div className="results-page min-h-screen bg-gradient-to-br from-cyan-300 via-indigo-400 to-fuchsia-400 py-10 px-4 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-[-100px] right-[-60px] w-[400px] h-[400px] bg-indigo-300/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-80px] left-[-40px] w-[350px] h-[350px] bg-amber-300/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-[40%] left-[20%] w-[250px] h-[250px] bg-purple-300/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-6xl mx-auto relative z-10">

          {/* ─── SCREEN HEADER (hidden in print) ─── */}
          <motion.header initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10 no-print">
            <p className="text-indigo-600 font-bold uppercase tracking-widest text-xs mb-2">Cognitive DNA Engine v2.0</p>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 drop-shadow-md">
              Your Diagnostic Report 🗺️
            </h1>
            <p className="text-lg text-white font-bold drop-shadow-sm opacity-90 max-w-2xl mx-auto">
              A comprehensive overview of your cognitive profile based on your gameplay.
            </p>
          </motion.header>

          {/* ─── PRINT‑ONLY HEADER ─── */}
          <div className="print-only-header" style={{ display: 'none' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: 800, fontFamily: "'Georgia', serif", marginBottom: '4px' }}>
                Cognitive DNA Assessment — Diagnostic Report
              </h1>
              <p style={{ color: '#555', fontSize: '13px', fontFamily: "'Georgia', serif" }}>
                Generated on {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                {user?.name ? ` · Patient: ${user.name}` : ''}
              </p>
              <hr style={{ marginTop: '12px' }} />
            </div>
          </div>

          {/* ═══ ROW 1 ▸ Overall Grade Badge + Performance Gauge ═══ */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Overall Grade Badge */}
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="card bg-white text-slate-800 shadow-sm border border-slate-200 flex flex-col items-center justify-center p-8 rounded-2xl">
              <p className="text-slate-400 uppercase text-xs tracking-widest mb-3">Assessment Grade</p>
              <div className={`bg-gradient-to-r ${gradeColor(profile.overallGrade || 'Developing Learner')} text-white px-8 py-4 rounded-2xl shadow-xl`}>
                <p className="text-3xl md:text-4xl font-extrabold text-center">
                  {profile.overallGrade || 'Developing Learner'}
                </p>
              </div>
              <p className="text-slate-500 text-xs mt-4">Composite Score: {overallScore}/100</p>
            </motion.div>

            {/* Performance Gauge (half‑donut) */}
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }} className="card bg-white text-slate-800 shadow-sm border border-slate-200 flex flex-col items-center justify-center relative p-8 rounded-2xl">
              <p className="text-slate-400 uppercase text-xs tracking-widest mb-1">Overall Performance</p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={gaugeData} cx="50%" cy="90%" startAngle={180} endAngle={0} innerRadius={70} outerRadius={95} paddingAngle={2} dataKey="value" stroke="none">
                    {gaugeData.map((_, i) => (
                      <Cell key={i} fill={GAUGE_COLORS[i]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute bottom-8 text-center">
                <span className="text-4xl font-extrabold text-slate-900">{overallScore}%</span>
              </div>
            </motion.div>
          </div>

          {/* ═══ ROW 2 ▸ Radar Chart + Score Bars ═══ */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Radar / Spider Chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card bg-white text-slate-800 shadow-sm border border-slate-200 p-8 rounded-2xl">
              <h2 className="text-xl font-bold text-slate-900 mb-4 text-center">Cognitive Dimension Map</h2>
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                  <PolarGrid stroke="#cbd5e1" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 12 }} />
                  <Radar name="Score" dataKey="A" stroke="#818cf8" strokeWidth={2} fill="#6366f1" fillOpacity={0.45} />
                </RadarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Score Bars */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card bg-white text-slate-800 shadow-sm border border-slate-200 p-8 rounded-2xl">
              <h2 className="text-xl font-bold text-slate-900 mb-4 text-center">Dimension Scores</h2>
              <div className="space-y-5">
                {[
                  { name: 'Visual Memory',        score: profile.visualMemory,         emoji: '🧠' },
                  { name: 'Logical Reasoning',     score: profile.logicalReasoning,     emoji: '🔬' },
                  { name: 'Attention Focus',       score: profile.attentionFocus,       emoji: '🎯' },
                  { name: 'Processing Speed',      score: profile.processingSpeed,      emoji: '⚡' },
                  { name: 'Reading Comprehension',  score: profile.readingComprehension, emoji: '📚' },
                ].map((t, i) => (
                  <div key={t.name}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-semibold text-slate-600">{t.emoji} {t.name}</span>
                      <span className="text-sm font-bold" style={{ color: getColorForScore(t.score) }}>{Math.round(t.score)}%</span>
                    </div>
                    <div className="bg-slate-200 rounded-full h-3 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${t.score}%` }} transition={{ delay: 0.35 + i * 0.08, duration: 0.7 }} className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${getColorForScore(t.score)}, ${getLighterColor(getColorForScore(t.score))})` }} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ═══ ROW 3 ▸ Diagnostic Summary (Doctor's Note) ═══ */}
          {profile.diagnosticSummary && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card bg-white text-slate-800 shadow-sm border border-slate-200 mb-8 p-8 rounded-2xl" id="diagnostic-summary">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-xl">🩺</div>
                <h2 className="text-xl font-bold text-slate-900">Diagnostic Summary</h2>
              </div>
              <div className="prose-sm max-w-none text-slate-600 leading-relaxed font-mono text-sm bg-slate-50/80 p-5 rounded-xl border border-slate-200">
                {profile.diagnosticSummary.split('\n\n').map((p: string, i: number) => (
                  <p key={i} className="mb-3 last:mb-0 whitespace-pre-wrap">{p}</p>
                ))}
              </div>
            </motion.section>
          )}

          {/* ═══ ROW 4 ▸ Remedial Action Plan (Prescription) ═══ */}
          {profile.remedialPath && profile.remedialPath.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card bg-white text-slate-800 shadow-sm border border-slate-200 mb-8 p-8 rounded-2xl" id="remedial-plan">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center text-xl">💊</div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Remedial Action Plan</h2>
                  <p className="text-slate-400 text-xs">Personalised prescription for each weak dimension</p>
                </div>
              </div>

              <div className="space-y-6">
                {profile.remedialPath.map((item: any, idx: number) => (
                  <motion.div key={idx} initial={{ opacity: 0, x: -25 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.55 + idx * 0.12 }}
                    className="bg-slate-50/80 rounded-2xl border border-slate-200 overflow-hidden">
                    {/* Weakness header bar */}
                    <div className="bg-gradient-to-r from-rose-50 to-orange-50 px-5 py-3 flex items-center justify-between border-b border-rose-100">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div>
                          <p className="text-slate-900 font-bold text-sm">Gap Detected: {item.trait}</p>
                          <p className="text-rose-300 text-xs">Current Score: {Math.round(item.score)}/100</p>
                        </div>
                      </div>
                      <div className="bg-rose-500/30 text-rose-200 text-xs font-bold px-3 py-1 rounded-full">
                        Needs Attention
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      {/* Video Prescription Card */}
                      <a href={item.videoUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-4 p-4 rounded-xl bg-red-50 border border-red-100 hover:border-red-300 transition-all group cursor-pointer"
                        style={{ textDecoration: 'none' }}>
                        <div className="w-14 h-14 bg-red-500 rounded-xl flex items-center justify-center text-slate-900 text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                          ▶
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-900 font-semibold text-sm truncate">{item.videoTitle}</p>
                          <p className="text-red-300 text-xs mt-1">Watch this to boost your {item.trait} skills →</p>
                        </div>
                      </a>

                      {/* Daily Prescription Tip */}
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                        <span className="text-xl mt-0.5">📋</span>
                        <div>
                          <p className="text-emerald-300 font-bold text-xs uppercase tracking-wider mb-1">Daily Prescription</p>
                          <p className="text-slate-600 text-sm leading-relaxed">{item.improvementTip}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* ═══ ROW 5 ▸ Comprehensive Narrative Analysis ═══ */}
          {profile.detailedAnalysisReport && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="card bg-white text-slate-800 shadow-sm border border-slate-200 mb-8 p-8 rounded-2xl" id="analysis-report">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-violet-500 rounded-xl flex items-center justify-center text-xl">📄</div>
                <h2 className="text-xl font-bold text-slate-900">Comprehensive Analysis</h2>
              </div>
              <div className="text-slate-600 text-sm leading-7 space-y-3">
                {profile.detailedAnalysisReport.split('\n\n').map((p: string, i: number) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </motion.section>
          )}

          {/* ═══ ROW 6 ▸ Parent / Teacher Guidelines ═══ */}
          {profile.reportGuidelines && profile.reportGuidelines.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="card bg-white text-slate-800 shadow-sm border border-slate-200 mb-8 p-8 rounded-2xl" id="guidelines-section">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-xl">📝</div>
                <h2 className="text-xl font-bold text-slate-900">Guidelines for Parents & Teachers</h2>
              </div>
              <div className="space-y-3">
                {profile.reportGuidelines.map((g: any, i: number) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.75 + i * 0.08 }}
                    className="flex items-start gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-200">
                    <div className="flex-shrink-0 w-7 h-7 bg-amber-500 text-slate-900 rounded-full flex items-center justify-center font-bold text-xs">{i + 1}</div>
                    <div>
                      <p className="font-bold text-amber-700 text-sm mb-0.5">{g.category}</p>
                      <p className="text-slate-600 text-xs leading-relaxed">{g.instruction}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* ═══ ROW 7 ▸ Video Recommendations ═══ */}
          {profile.recommendedVideos && profile.recommendedVideos.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="card bg-white text-slate-800 shadow-sm border border-slate-200 mb-8 p-8 rounded-2xl no-print" id="video-recommendations">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center text-xl">🎬</div>
                <h2 className="text-xl font-bold text-slate-900">Recommended Watch List</h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {profile.recommendedVideos.map((v: any, i: number) => (
                  <motion.a key={i} href={v.url} target="_blank" rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 + i * 0.08 }}
                    whileHover={{ scale: 1.03, y: -3 }} whileTap={{ scale: 0.97 }}
                    className="block p-4 rounded-xl bg-red-50 border border-red-100 hover:border-red-300 transition-all"
                    style={{ textDecoration: 'none' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-red-500 text-slate-900 rounded-lg flex items-center justify-center text-sm">▶</div>
                      <p className="font-bold text-slate-900 text-xs leading-tight">{v.title}</p>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed">{v.rationale}</p>
                    <p className="text-red-400 text-xs font-semibold mt-2">Watch on YouTube →</p>
                  </motion.a>
                ))}
              </div>
            </motion.section>
          )}

          {/* ═══ LEARNING STYLE ═══ */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="card bg-white text-slate-800 shadow-sm border border-slate-200 mb-8 p-8 rounded-2xl">
            <div className="text-center">
              <p className="text-slate-400 uppercase text-xs tracking-widest mb-3">Detected Learning Style</p>
              <div className="inline-block bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white px-8 py-4 rounded-2xl shadow-xl mb-4">
                <p className="text-3xl font-extrabold capitalize">{profile.learningStyle}</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto mt-4 text-left">
                <div className="bg-slate-50/80 p-5 rounded-xl border border-slate-200">
                  <h3 className="font-bold text-indigo-700 text-sm mb-2">✨ What This Means</h3>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    {profile.learningStyle?.includes('visual') && "The student absorbs information best through diagrams, colour coding, and visual media. Prioritise videos, infographics, and mind-maps in all subjects."}
                    {profile.learningStyle?.includes('logical') && "The student thrives on structure and patterns. Present information as step-by-step processes, and encourage 'why' questions."}
                    {profile.learningStyle?.includes('verbal') && "The student learns through reading and discussion. Encourage read-aloud sessions, journaling, and group debates."}
                    {profile.learningStyle?.includes('kinesthetic') && "The student needs movement and hands-on activities. Use science experiments, building kits, and physical models."}
                  </p>
                </div>
                <div className="bg-slate-50/80 p-5 rounded-xl border border-slate-200">
                  <h3 className="font-bold text-emerald-700 text-sm mb-2">🚀 Quick Tips</h3>
                  <ul className="space-y-1.5">
                    {profile.recommendations?.slice(0, 4).map((rec: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                        <span className="text-emerald-600 mt-0.5">✓</span>{rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.section>

          {/* ═══ ACTION BAR ═══ */}
          <div className="flex justify-center gap-4 flex-wrap no-print mb-4">
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }} 
              className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-7 rounded-xl transition-all shadow-lg text-sm"
              onClick={() => router.push('/student-dashboard')}
            >
              ← Dashboard
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handlePrintReport} disabled={isGeneratingPDF}
              className={`${isGeneratingPDF ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600'} text-white font-bold py-3 px-7 rounded-xl transition-all shadow-lg text-sm flex items-center gap-2`}>
              {isGeneratingPDF ? (
                <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Generating...</>
              ) : '📄 Download PDF Report'}
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }} 
              className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-7 rounded-xl transition-all shadow-lg text-sm"
              onClick={() => router.push('/quiz?type=memory')}
            >
              Play More Games 🎮
            </motion.button>
          </div>

        </div>
      </div>

      {/* ═══ INVISIBLE PDF RENDER CONTAINER ═══ */}
      <div id="pdf-report-content" className="bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 p-8 text-slate-800 relative" style={{ display: 'none', width: '794px', position: 'absolute', top: '-9999px', left: '-9999px', boxSizing: 'border-box' }}>
        
        {/* Fun background decorative blobs for the PDF */}
        <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-yellow-300/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-50px] left-[-50px] w-64 h-64 bg-indigo-300/20 rounded-full blur-3xl pointer-events-none" />
        
        {/* PDF Header */}
        <div className="flex justify-between items-center border-b-[3px] border-indigo-200 pb-5 mb-8 relative z-10">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-500 text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-lg border-2 border-indigo-200 transform -rotate-3">CDNA</div>
                <div>
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-900 to-violet-800 mb-1 tracking-tight">Cognitive Map</h1>
                    <p className="text-sm text-slate-600 font-bold uppercase tracking-wider">Explorer: <span className="text-indigo-700">{user?.name || 'Student'}</span></p>
                    <p className="text-xs text-slate-400 font-medium">Generated: {new Date().toLocaleDateString('en-IN')}</p>
                </div>
            </div>
            <div className="text-right">
                <div className={`inline-block bg-gradient-to-r ${gradeColor(profile.overallGrade || '')} text-white px-5 py-2 rounded-xl shadow-md mb-1.5`}>
                    <p className="text-2xl font-extrabold">{profile.overallGrade || 'Developing Learner'}</p>
                </div>
                <p className="text-sm text-slate-600 font-bold bg-slate-100 px-3 py-1 rounded-lg inline-block">Score: {overallScore}/100</p>
            </div>
        </div>

        {/* PDF Grid Layout */}
        <div className="grid grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="flex flex-col gap-6">
                {/* Box 1: Radar Chart */}
                <div className="border-[1.5px] border-indigo-100 rounded-3xl p-5 bg-white/80 shadow-sm flex flex-col relative z-10">
                    <h2 className="text-sm font-extrabold text-indigo-900 w-full text-center mb-1 uppercase tracking-widest bg-indigo-50 py-1 rounded-lg">Brain Power Map</h2>
                    <div className="flex-1 w-full flex justify-center items-center mt-2">
                        <RadarChart width={320} height={250} cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                            <PolarGrid stroke="#cbd5e1" strokeDasharray="3 3" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11, fontWeight: 800 }} />
                            <Radar dataKey="A" stroke="#8b5cf6" strokeWidth={3} fill="#a78bfa" fillOpacity={0.6} isAnimationActive={false} />
                        </RadarChart>
                    </div>
                </div>

                {/* Box 2: Dimension Scores */}
                <div className="border-[1.5px] border-slate-200 rounded-3xl p-6 bg-white/80 shadow-sm relative z-10">
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                        <div className="w-6 h-6 rounded bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-bold">Lvl</div>
                        <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">Power Levels</h2>
                    </div>
                    <div className="space-y-4">
                    {[
                      { name: 'Visual Memory', score: profile.visualMemory },
                      { name: 'Logical Reasoning', score: profile.logicalReasoning },
                      { name: 'Attention Focus', score: profile.attentionFocus },
                      { name: 'Processing Speed', score: profile.processingSpeed },
                      { name: 'Reading Comp.', score: profile.readingComprehension },
                    ].map((t, i) => (
                      <div key={t.name}>
                        <div className="flex justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-700">{t.name}</span>
                          <span className="text-xs font-black" style={{ color: getColorForScore(t.score) }}>{Math.round(t.score)}%</span>
                        </div>
                        <div className="bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner border border-slate-200/50">
                          <div className="h-full rounded-full" style={{ width: `${t.score}%`, background: getColorForScore(t.score) }} />
                        </div>
                      </div>
                    ))}
                    </div>
                </div>
                
                {/* Box 3: Learning Style */}
                <div className="border-[2px] border-indigo-200 rounded-3xl p-6 bg-gradient-to-br from-indigo-50 to-white shadow-sm flex flex-col justify-center relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-500 flex items-center justify-center text-[10px] font-bold">i</div>
                        <h2 className="text-sm font-extrabold text-indigo-900 uppercase tracking-wide">Learning Style</h2>
                    </div>
                    <p className="text-2xl font-black text-indigo-700 capitalize mb-3">{profile.learningStyle}</p>
                    <div className="text-[11px] text-slate-700 leading-relaxed font-medium bg-white p-3 rounded-xl border border-indigo-100 shadow-sm">
                         {profile.learningStyle?.includes('visual') && "The student absorbs information best through diagrams, colour coding, and visual media. Prioritise videos, infographics, and mind-maps in all subjects."}
                         {profile.learningStyle?.includes('logical') && "The student thrives on structure and patterns. Present information as step-by-step processes, and encourage 'why' questions."}
                         {profile.learningStyle?.includes('verbal') && "The student learns through reading and discussion. Encourage read-aloud sessions, journaling, and group debates."}
                         {profile.learningStyle?.includes('kinesthetic') && "The student needs movement and hands-on activities. Use science experiments, building kits, and physical models."}
                         {!profile.learningStyle && "Learning style profile is still developing. Encourage a mix of visual, auditory, and kinesthetic activities."}
                    </div>
                </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col relative z-10">
                {/* Box 4: Diagnostic Summary */}
                <div className="border-[1.5px] border-slate-200 rounded-3xl p-6 bg-white/80 shadow-sm flex flex-col">
                    <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-3">
                        <div className="w-6 h-6 rounded bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-bold">Ed</div>
                        <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">AI Teacher's Note</h2>
                    </div>
                    <div className="text-[11px] text-slate-700 leading-relaxed space-y-2.5 font-medium">
                        {profile.diagnosticSummary?.split('\n\n').map((p: string, i: number) => (
                          <p key={i} className="text-justify">{p.replace('ASSESSMENT OUTCOME:', 'Your Rank:')}</p>
                        ))}
                    </div>
                </div>

                {/* Box 5: Remedial Plan */}
                <div className="border-[1.5px] border-rose-200 rounded-3xl p-6 bg-white/80 shadow-sm flex flex-col relative z-10 mt-6">
                    <div className="flex items-center gap-2 mb-4 border-b border-rose-100 pb-3">
                        <div className="w-6 h-6 rounded bg-rose-100 text-rose-500 flex items-center justify-center text-[10px] font-bold">►</div>
                        <h2 className="text-sm font-extrabold text-rose-800 uppercase tracking-wide">Next Quests (Focus Areas)</h2>
                    </div>
                    <div className="space-y-3.5">
                    {profile.remedialPath?.slice(0, 3).map((item: any, idx: number) => (
                      <div key={idx} className="bg-gradient-to-r from-rose-50 to-orange-50 rounded-2xl p-3.5 border border-rose-100 shadow-sm relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-400 rounded-l-2xl"></div>
                        <div className="flex justify-between items-center mb-1.5 pl-2">
                            <span className="text-xs font-black text-rose-900">{item.trait}</span>
                            <span className="text-[10px] bg-white text-rose-600 px-2.5 py-0.5 rounded-full font-black shadow-sm border border-rose-100">{Math.round(item.score)}%</span>
                        </div>
                        <p className="text-[11px] text-slate-700 mb-2 leading-snug pl-2"><span className="font-bold text-rose-700">Tip:</span> {item.improvementTip}</p>
                        <p className="text-[10px] text-slate-500 italic pl-2 bg-white/60 p-1.5 rounded-lg border border-white"><span className="font-bold text-rose-400 mr-1">Watch:</span> <span className="font-bold text-slate-700">{item.videoTitle}</span></p>
                      </div>
                    ))}
                    {(!profile.remedialPath || profile.remedialPath.length === 0) && (
                      <div className="flex flex-col items-center justify-center h-full text-center py-4">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center text-xl font-bold mb-2">★</div>
                        <h3 className="text-sm font-bold text-emerald-600 mb-1">Superstar Status!</h3>
                        <p className="text-[11px] text-slate-500">You crushed all the benchmarks. Keep exploring and having fun!</p>
                      </div>
                    )}
                    </div>
                </div>
                
                {/* Box 6: Quick Tips */}
                <div className="border-[2px] border-emerald-200 rounded-3xl p-6 bg-gradient-to-br from-emerald-50 to-white flex-none shadow-sm relative z-10 mt-6">
                    <div className="flex items-center gap-2 mb-3 border-b border-emerald-100 pb-3">
                        <div className="w-6 h-6 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold">UP</div>
                        <h2 className="text-sm font-extrabold text-emerald-800 uppercase tracking-wide">Level Up Strategies</h2>
                    </div>
                    <ul className="space-y-2.5">
                    {profile.recommendations?.slice(0, 3).map((rec: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-[11px] text-emerald-900 leading-snug font-bold">
                        <span className="text-white bg-emerald-500 rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0 mt-0.5 text-[9px] shadow-sm">★</span>
                        <span className="flex-1">{rec}</span>
                        </li>
                    ))}
                    {(!profile.recommendations || profile.recommendations.length === 0) && (
                        <div className="text-center flex flex-col items-center mt-4">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500 font-bold mb-2">+</div>
                            <span className="text-slate-500 text-xs font-bold">Ready for the next level!</span>
                        </div>
                    )}
                    </ul>
                </div>
            </div>
        </div>
        
        {/* PDF Footer */}
        <div className="mt-6 text-center text-[10px] text-slate-400 font-bold border-t-2 border-indigo-100 pt-4 relative z-10 uppercase tracking-wider">
            Cognitive DNA Engine • Secret Brain Map • Page 1 of 1
        </div>
      </div>
    </>
  );
}
