import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <>
      <Head>
        <title>Cognitive DNA Mapping Engine</title>
        <meta name="description" content="Discover how your child learns best with AI-powered cognitive diagnostics." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 overflow-hidden relative">
        {/* Decorative Blobs */}
        <div className="absolute top-[-120px] left-[-80px] w-[400px] h-[400px] bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-100px] right-[-60px] w-[350px] h-[350px] bg-amber-300/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-300/10 rounded-full blur-3xl pointer-events-none" />

        {/* Hero Section */}
        <div className="container mx-auto px-4 py-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-16"
          >
            <div className="inline-block mb-4 px-4 py-1.5 bg-white/20 text-white text-sm font-semibold rounded-full border border-white/30 backdrop-blur-sm">
              AI-Powered Learning Analytics
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-5 leading-tight tracking-tight drop-shadow-lg">
              🧠 Cognitive DNA
              <span className="block text-amber-300">
                Mapping Engine
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto leading-relaxed">
              Fun games and puzzles that reveal how your amazing brain learns best.
              Built for curious minds aged 8–12.
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-16 max-w-4xl mx-auto">
            {[
              { icon: '🎮', title: 'Interactive Games', desc: 'Five adaptive cognitive activities — from memory challenges to logic puzzles.' },
              { icon: '📊', title: 'Brain Map', desc: 'Radar charts, performance gauges, and a professional diagnostic report.' },
              { icon: '💊', title: 'Prescriptions', desc: 'Personalised remedial plans with YouTube tutorials and daily improvement tips.' },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="card bg-white/90 text-slate-800 text-center group hover:bg-white transition-all"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{f.icon}</div>
                <h3 className="text-xl text-slate-900 font-extrabold mb-2">{f.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex justify-center gap-5 flex-wrap"
          >
            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="btn-action text-lg px-10 py-4"
              >
                Login
              </motion.button>
            </Link>

            <Link href="/register">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="btn-secondary text-lg px-10 py-4"
              >
                Sign Up Free
              </motion.button>
            </Link>
          </motion.div>
        </div>

        {/* Footer */}
        <footer className="text-center py-8 text-white/60 text-sm relative z-10">
          <p>Made with ❤️ for young learners everywhere</p>
        </footer>
      </main>
    </>
  );
}
