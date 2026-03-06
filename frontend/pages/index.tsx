import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <>
      <Head>
        <title>Cognitive DNA Mapping Engine</title>
        <meta name="description" content="Discover how you learn best!" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-300 to-blue-400">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">
              🧠 Cognitive DNA Mapping Engine
            </h1>
            <p className="text-2xl text-white mb-8 drop-shadow">
              Discover Your Super Learning Powers!
            </p>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Fun games and puzzles that help you understand how your amazing brain works!
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="card text-center"
            >
              <div className="text-6xl mb-4">🎮</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Fun Games</h3>
              <p className="text-gray-600">
                Play exciting puzzle games, memory challenges, and brain teasers!
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="card text-center"
            >
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Your Brain Map</h3>
              <p className="text-gray-600">
                See your unique learning strengths in a colorful chart!
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="card text-center"
            >
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Get Smarter</h3>
              <p className="text-gray-600">
                Learn special tricks to study better and faster!
              </p>
            </motion.div>
          </div>

          {/* CTA Buttons */}
          <div className="flex justify-center gap-6 flex-wrap">
            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary text-xl px-12 py-4"
              >
                Login
              </motion.button>
            </Link>

            <Link href="/register">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-secondary text-xl px-12 py-4"
              >
                Sign Up
              </motion.button>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-8 text-white/80">
          <p>Made with ❤️ for young learners everywhere</p>
        </footer>
      </main>
    </>
  );
}
