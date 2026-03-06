import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { quizAPI } from '@/services/api';

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

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));

    // Fetch activities
    loadActivities();
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-400 via-pink-300 to-blue-400">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Your Dashboard - Cognitive DNA</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-300 to-blue-400">
        {/* Header */}
        <header className="bg-white/20 backdrop-blur-md shadow-lg">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="text-4xl">🧠</div>
              <div>
                <h1 className="text-2xl font-bold text-white">Cognitive DNA</h1>
                <p className="text-white/90 text-sm">
                  Welcome, {user?.name}! (Class {user?.class})
                </p>
              </div>
            </div>
            <button onClick={handleLogout} className="btn-secondary text-sm px-6 py-2">
              Logout
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h2 className="text-4xl font-bold text-white mb-4 text-center">
              Choose Your Learning Adventure! 🎮
            </h2>
            <p className="text-white/90 text-xl text-center max-w-2xl mx-auto">
              Pick a fun activity below. Each game helps us understand how your amazing brain works!
            </p>
          </motion.div>

          {/* Activities Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleActivityClick(activity.id)}
                className="card cursor-pointer hover:shadow-2xl transition-all"
                style={{ borderLeft: `6px solid ${activity.color}` }}
              >
                <div className="text-6xl mb-4">{activity.icon}</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  {activity.name}
                </h3>
                <p className="text-gray-600 mb-4">{activity.description}</p>
                <div className="text-sm font-semibold" style={{ color: activity.color }}>
                  Click to Start →
                </div>
              </motion.div>
            ))}
          </div>

          {/* Progress Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-16 card"
          >
            <h3 className="text-3xl font-bold text-gray-800 mb-6 text-center">
              Your Progress 📊
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-blue-50 rounded-xl">
                <div className="text-4xl mb-2">🎯</div>
                <p className="text-gray-600">Activities Completed</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">0</p>
              </div>
              <div className="text-center p-6 bg-green-50 rounded-xl">
                <div className="text-4xl mb-2">⭐</div>
                <p className="text-gray-600">Average Score</p>
                <p className="text-3xl font-bold text-green-600 mt-2">--%</p>
              </div>
              <div className="text-center p-6 bg-purple-50 rounded-xl">
                <div className="text-4xl mb-2">🏆</div>
                <p className="text-gray-600">Brain Badges</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">0</p>
              </div>
            </div>
          </motion.div>

          <div className="text-center mt-12">
            <Link href="/results">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary text-lg px-8 py-3"
              >
                View Your Brain Map 🗺️
              </motion.button>
            </Link>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center py-8 text-white/80">
          <p>Keep learning and growing! 🌟</p>
        </footer>
      </div>
    </>
  );
}
