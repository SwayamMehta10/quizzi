"use client";

import { motion } from "framer-motion";
import { MdOutlineLeaderboard } from "react-icons/md";

export default function LeaderboardPage() {
  return (
    <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-8rem)] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-6"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative"
        >
          <MdOutlineLeaderboard className="w-24 h-24 mx-auto text-primary" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-4xl sm:text-5xl font-extrabold text-primary tracking-tighter"
        >
          Leaderboard
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-xl sm:text-2xl text-muted-foreground font-medium"
        >
          Coming Soon
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto"
        >
          We&apos;re working hard to bring you an exciting leaderboard experience. Check back soon!
        </motion.p>
      </motion.div>
    </div>
  );
}
