import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { cognitiveAPI } from '@/services/api';

export default function Results() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.id) {
        console.error('User ID not found');
        setLoading(false);
        return;
      }
      const response = await cognitiveAPI.getProfile(user.id);
      setProfile(response.data.profile);
    } catch (error) {
      console.error('Error loading profile:', error);
      // Profile not found is OK - user just needs to complete more activities
    } finally {
      setLoading(false);
    }
  };

  // Prepare data for radar chart
  const chartData = profile ? [
    { subject: 'Visual Memory', A: profile.visualMemory, fullMark: 100 },
    { subject: 'Logical Reasoning', A: profile.logicalReasoning, fullMark: 100 },
    { subject: 'Attention', A: profile.attentionFocus, fullMark: 100 },
    { subject: 'Processing Speed', A: profile.processingSpeed, fullMark: 100 },
    { subject: 'Reading', A: profile.readingComprehension, fullMark: 100 },
  ] : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-400 via-pink-300 to-blue-400">
        <div className="text-white text-2xl">Loading your brain map...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-300 to-blue-400 py-8 px-4">
        <Head>
          <title>Your Brain Map - Cognitive DNA</title>
        </Head>
        
        <div className="max-w-4xl mx-auto text-center text-white mt-20">
          <div className="text-8xl mb-6">🗺️</div>
          <h1 className="text-5xl font-bold mb-6">No Brain Map Yet!</h1>
          <p className="text-2xl mb-8">
            Complete at least 3 activities to generate your Cognitive DNA Profile
          </p>
          <Link href="/student-dashboard">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary text-xl px-12 py-4"
            >
              Start Activities →
            </motion.button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Your Brain Map - Cognitive DNA</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-300 to-blue-400 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 text-white">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-5xl font-bold mb-4">🧠 Your Cognitive DNA Map!</h1>
              <p className="text-xl">
                This shows how YOUR amazing brain learns best!
              </p>
            </motion.div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            {/* Radar Chart */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card bg-white"
            >
              <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
                Your Learning Superpowers
              </h2>
              
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                  <PolarGrid stroke="#e0e0e0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#4a5568', fontSize: 14 }} />
                  <Radar
                    name="Your Score"
                    dataKey="A"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    fill="#a78bfa"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>

              <div className="text-center mt-4 text-sm text-gray-600">
                                Each point shows how strong that skill is!
              </div>
            </motion.div>

            {/* Detailed Scores */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="card bg-white"
            >
              <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
                Your Scores
              </h2>

              <div className="space-y-4">
                {[
                  { name: 'Visual Memory', score: profile.visualMemory, emoji: '🧠' },
                  { name: 'Logical Reasoning', score: profile.logicalReasoning, emoji: '🔬' },
                  { name: 'Attention Focus', score: profile.attentionFocus, emoji: '🎯' },
                  { name: 'Processing Speed', score: profile.processingSpeed, emoji: '⚡' },
                  { name: 'Reading Comprehension', score: profile.readingComprehension, emoji: '📚' },
                ].map((trait, idx) => (
                  <div key={trait.name}>
                    <div className="flex justify-between mb-2">
                      <span className="text-lg font-semibold text-gray-700">
                        {trait.emoji} {trait.name}
                      </span>
                      <span className="text-lg font-bold" style={{ color: getColorForScore(trait.score) }}>
                        {Math.round(trait.score)}%
                      </span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${trait.score}%` }}
                        transition={{ delay: idx * 0.1, duration: 0.8 }}
                        className="h-full rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${getColorForScore(trait.score)} 0%, ${getLighterColor(getColorForScore(trait.score))} 100%)`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Learning Style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card bg-white mb-8"
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
              🎯 Your Learning Style
            </h2>
            
            <div className="text-center">
              <div className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-2xl mb-6">
                <p className="text-lg mb-2">You are a:</p>
                <p className="text-4xl font-bold">{profile.learningStyle}</p>
                <p className="text-sm mt-2 opacity-90">Learner!</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 text-left max-w-4xl mx-auto">
                <div className="bg-blue-50 p-6 rounded-xl">
                  <h3 className="text-xl font-bold text-blue-800 mb-3">✨ What This Means:</h3>
                  <p className="text-gray-700">
                    {profile.learningStyle.includes('Visual') && "You learn best by SEEING! Pictures, diagrams, and videos help you understand better. "}
                    {profile.learningStyle.includes('Logical') && "You love finding PATTERNS and solving puzzles! You ask 'why' and want to understand how things work. "}
                    {profile.learningStyle.includes('Verbal') && "You learn by READING and TALKING! Words, stories, and discussions help you learn. "}
                    {profile.learningStyle.includes('Kinesthetic') && "You learn by DOING! Hands-on activities and moving around help you remember better."}
                  </p>
                </div>

                <div className="bg-green-50 p-6 rounded-xl">
                  <h3 className="text-xl font-bold text-green-800 mb-3">🚀 Tips for You:</h3>
                  <ul className="space-y-2 text-gray-700">
                    {profile.recommendations?.slice(0, 4).map((rec: string, idx: number) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-2">✅</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Navigation */}
          <div className="flex justify-center gap-6 flex-wrap">
            <Link href="/student-dashboard">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary text-lg px-8 py-3"
              >
                ← Back to Dashboard
              </motion.button>
            </Link>

            <Link href="/quiz?type=memory">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-secondary text-lg px-8 py-3"
              >
                Play More Games 🎮
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

function getColorForScore(score: number): string {
  if (score >= 80) return '#4CAF50';
  if (score >= 60) return '#FFC107';
  if (score >= 40) return '#FF9800';
  return '#F44336';
}

function getLighterColor(color: string): string {
  const lighterMap: any = {
    '#4CAF50': '#81C784',
    '#FFC107': '#FFD54F',
    '#FF9800': '#FFB74D',
    '#F44336': '#E57373',
  };
  return lighterMap[color] || color;
}
