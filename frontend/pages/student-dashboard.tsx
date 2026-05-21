import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { quizAPI, dashboardAPI } from '@/services/api';

interface Activity {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));

    // Fetch activities and dashboard data
    loadActivities();
    loadDashboardData();
  }, []);

  const loadActivities = async () => {
    try {
      const response = await quizAPI.getActivities();
      setActivities(response.data);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.id) return;

      const response = await dashboardAPI.getData(user.id);
      setDashboardData(response.data.data);
      console.log('📊 Dashboard data loaded:', response.data.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const handleActivityClick = (activityId: string) => {
    router.push(`/quiz?type=${activityId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }} className="w-10 h-10 border-4 border-white border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard — Cognitive DNA</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-cyan-300 via-indigo-400 to-fuchsia-400 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-[-100px] right-[-60px] w-[400px] h-[400px] bg-cyan-200/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-80px] left-[-40px] w-[350px] h-[350px] bg-yellow-300/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-[40%] left-[20%] w-[250px] h-[250px] bg-pink-400/40 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-indigo-200">🧠</div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Cognitive DNA</h1>
                <p className="text-slate-500 text-sm font-medium mt-0.5">
                  Welcome, {user?.name} · Class {user?.class}
                </p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-sm font-bold text-slate-500 hover:text-red-500 transition-colors px-4 py-2 rounded-xl hover:bg-red-50">
              Logout
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-10 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 text-white"
          >
            <h2 className="text-3xl md:text-5xl font-extrabold mb-3 text-center tracking-tight drop-shadow-md">
              Choose Your Adventure 🎮
            </h2>
            <p className="text-center max-w-xl mx-auto text-lg font-bold drop-shadow-sm opacity-90">
              Each game maps a different part of your brain. Complete 3 or more for a full diagnostic report.
            </p>
          </motion.div>

          {/* Activities Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => handleActivityClick(activity.id)}
                className="activity-card card bg-white text-slate-800 group shadow-sm hover:shadow-xl transition-all border border-slate-100"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                    style={{ backgroundColor: activity.color + '18' }}>
                    {activity.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg text-slate-900 font-extrabold mb-1 group-hover:text-indigo-600 transition-colors">
                      {activity.name}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{activity.description}</p>
                    <p className="text-sm font-bold mt-3 transition-colors" style={{ color: activity.color }}>
                      Start Activity →
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Brain Badges Section */}
          {dashboardData && dashboardData.brainBadges && dashboardData.brainBadges.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-12 card bg-white text-slate-800 max-w-5xl mx-auto shadow-md border border-slate-100"
            >
              <h3 className="text-xl text-slate-900 font-extrabold mb-5 text-center">
                🏆 Your Brain Badges
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {dashboardData.brainBadges.map((badge: any, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.08, type: 'spring', stiffness: 260, damping: 20 }}
                    className="p-3 bg-gradient-to-br from-amber-50 to-violet-50 rounded-2xl text-center border border-amber-200/50"
                  >
                    <div className="text-4xl mb-1">{badge.icon}</div>
                    <p className="text-xs font-bold text-gray-700 capitalize">{badge.type}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{badge.level}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Cognitive Profile Section */}
          {dashboardData && dashboardData.hasBrainMap && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-8 card bg-white text-slate-800 max-w-5xl mx-auto shadow-md border border-slate-100"
            >
              <h3 className="text-xl text-slate-900 font-extrabold mb-5 text-center">
                🧠 Your Cognitive DNA
              </h3>
              
              {/* Learning Style Badge */}
              <div className="mb-5 flex justify-center">
                <div className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-full text-sm font-bold shadow-lg">
                  ✨ Learning Style: {dashboardData.learningStyle?.toUpperCase() || 'N/A'}
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid md:grid-cols-2 gap-4 mb-5">
                <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200/50">
                  <h4 className="font-bold text-emerald-700 text-sm mb-2">💪 Strengths</h4>
                  <ul className="space-y-1.5">
                    {dashboardData.strengths && dashboardData.strengths.length > 0 ? (
                      dashboardData.strengths.map((strength: string, idx: number) => (
                        <li key={idx} className="text-emerald-600 text-sm flex items-start gap-2">
                          <span className="text-emerald-400 mt-0.5">✓</span>
                          {strength}
                        </li>
                      ))
                    ) : (
                      <li className="text-emerald-600 text-sm flex items-start gap-2">
                        <span className="text-emerald-400 mt-0.5">✓</span>
                        Strong overall cognitive foundation
                      </li>
                    )}
                  </ul>
                </div>
                <div className="p-4 bg-orange-50/80 rounded-2xl border border-orange-200/50">
                  <h4 className="font-bold text-orange-700 text-sm mb-2">🎯 Areas to Improve</h4>
                  <ul className="space-y-1.5">
                    {dashboardData.weaknesses && dashboardData.weaknesses.length > 0 ? (
                      dashboardData.weaknesses.map((weakness: string, idx: number) => (
                        <li key={idx} className="text-orange-600 text-sm flex items-start gap-2">
                          <span className="text-orange-400 mt-0.5">→</span>
                          {weakness}
                        </li>
                      ))
                    ) : (
                      <li className="text-orange-600 text-sm flex items-start gap-2">
                        <span className="text-orange-400 mt-0.5">→</span>
                        Doing great! Keep challenging yourself to maintain high scores.
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-indigo-50/70 p-5 rounded-2xl border border-indigo-200/50">
                <h4 className="font-bold text-indigo-700 text-sm mb-3">💡 Recommendations</h4>
                <ul className="space-y-1.5">
                  {dashboardData.recommendations && dashboardData.recommendations.length > 0 ? (
                    dashboardData.recommendations.map((rec: string, idx: number) => (
                      <li key={idx} className="text-indigo-600 text-sm flex items-start gap-2">
                        <span className="text-indigo-400 mt-0.5">•</span>
                        {rec}
                      </li>
                    ))
                  ) : (
                    <li className="text-indigo-600 text-sm flex items-start gap-2">
                      <span className="text-indigo-400 mt-0.5">•</span>
                      Continue practicing 3 activities daily to unlock more specific insights.
                    </li>
                  )}
                </ul>
              </div>
            </motion.div>
          )}

          {/* Progress Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 card bg-white text-slate-800 max-w-5xl mx-auto shadow-md border border-slate-100"
          >
            <h3 className="text-xl text-slate-900 font-extrabold mb-6 text-center">
              Your Progress 📊
            </h3>
            
            {/* Quiz Activity Metrics */}
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
              <p className="text-sm font-bold text-blue-600 mb-4 text-center uppercase tracking-wide">Quiz Activity Tracking</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="text-center p-4 bg-white rounded-xl border border-blue-100">
                  <p className="text-blue-600 text-xs font-bold mb-2">TOTAL QUIZ SUBMISSIONS</p>
                  <p className="text-4xl font-extrabold text-blue-700">{dashboardData ? dashboardData.totalSubmissions : 0}</p>
                  <p className="text-xs text-blue-500 mt-2">All quiz attempts combined</p>
                </div>
                <div className="text-center p-4 bg-white rounded-xl border border-indigo-100">
                  <p className="text-indigo-600 text-xs font-bold mb-2">UNIQUE ACTIVITIES COMPLETED</p>
                  <p className="text-4xl font-extrabold text-indigo-700">{dashboardData ? dashboardData.uniqueActivities : 0}/5</p>
                  <p className="text-xs text-indigo-500 mt-2">Different activity types (Report unlocks at 3+)</p>
                </div>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: '⭐', label: 'Average Score', value: dashboardData ? `${dashboardData.averageScore}%` : '--%', bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700', labelText: 'text-emerald-600' },
                { icon: '🏆', label: 'Brain Badges', value: dashboardData && dashboardData.brainBadges ? dashboardData.brainBadges.length : 0, bg: 'bg-amber-50 border-amber-100', text: 'text-amber-700', labelText: 'text-amber-600' },
                { icon: '🧠', label: 'Report Status', value: dashboardData && dashboardData.uniqueActivities >= 3 ? '🔓 Unlocked' : '🔒 Locked', bg: 'bg-rose-50 border-rose-100', text: dashboardData && dashboardData.uniqueActivities >= 3 ? 'text-emerald-700' : 'text-rose-700', labelText: 'text-rose-600' },
              ].map((stat) => (
                <div key={stat.label} className={`text-center p-5 ${stat.bg} rounded-2xl border`}>
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <p className={`${stat.labelText} text-sm font-bold`}>{stat.label}</p>
                  <p className={`text-3xl font-extrabold ${stat.text} mt-1`}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center mt-10"
          >
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="btn-action text-base px-8 py-3"
              onClick={() => router.push('/results')}
            >
              View Diagnostic Report 🗺️
            </motion.button>
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="text-center py-8 text-slate-500 text-sm font-medium relative z-10">
          <p>Keep learning and growing! 🌟</p>
        </footer>
      </div>
    </>
  );
}
