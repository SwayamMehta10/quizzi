"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import { notify } from "@/lib/notifications";
import { useRouter } from "next/navigation";
import { Zap, Trophy, Flame } from "lucide-react";

interface Question {
  question_id: string;
  text: string;
  choices: string[];
  choice_ids: string[];
}

interface Player {
  id: string;
  username: string;
  avatar_url?: string;
  gender?: string;
}

interface Challenge {
  challenge_id: string;
  challenger: Player;
  opponent: Player;
  topic: {
    topic_id: string;
    name: string;
  };
  challenger_id: string;
  opponent_id: string;
  challenger_status: string;
  opponent_status: string;
}

interface PlayChallengeProps {
  challenge: Challenge;
  questions: Question[];
  currentUser: User;
}

const PlayerAvatarBlock = ({
  player,
  color,
  layoutId,
  size,
  usernameClass,
  score,
}: {
  player: Player;
  color: string;
  layoutId: string;
  size: string;
  usernameClass: string;
  score?: number | string;
}) => (
  <motion.div 
    layout 
    layoutId={layoutId}
    className="text-center"
    transition={{ duration: 1 }}
  >
    <div className={`relative mb-2`}>
      <div className={`${size} rounded-full ${color} p-2 mx-auto flex items-center justify-center`}>
        <Avatar className="w-full h-full">
          <AvatarImage src={player.avatar_url} className="w-full h-full object-cover rounded-full" />
        </Avatar>
      </div>
    </div>
    <h3 className={`text-white font-medium ${usernameClass} mb-1 tracking-tight break-words max-w-full`}>{player.username}</h3>
    {score !== undefined && (
      <div className="text-lg sm:text-xl md:text-2xl font-bold text-white mt-1 tracking-tight">{score}</div>
    )}
  </motion.div>
);

export default function PlayChallenge({ challenge, questions, currentUser }: PlayChallengeProps) {
  const router = useRouter();
  const supabase = createClient();
  
  const [gamePhase, setGamePhase] = useState<'intro' | 'countdown' | 'playing' | 'finished'>('intro');
  const [countdownTime, setCountdownTime] = useState(3);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [score, setScore] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  
  const isChallenger = challenge.challenger_id === currentUser.id;
  const currentPlayer = isChallenger ? challenge.challenger : challenge.opponent;
  const otherPlayer = isChallenger ? challenge.opponent : challenge.challenger;
  
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  // Initial intro effect - start countdown after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setGamePhase('countdown');
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Countdown effect
  useEffect(() => {
    if (gamePhase === 'countdown' && countdownTime > 0) {
      const timer = setTimeout(() => {
        setCountdownTime(countdownTime - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (gamePhase === 'countdown' && countdownTime === 0) {
      setGamePhase('playing');
      setTimeLeft(10);
      setQuestionStartTime(Date.now()); // SECURITY: Track game start time
    }
  }, [gamePhase, countdownTime]);

  const finishGame = useCallback(async (finalScore: number) => {
    setGamePhase('finished');
    
    try {
      // Store the final result in challenge_results table
      const { error: resultsError } = await supabase
        .from('challenge_results')
        .insert({
          challenge_id: challenge.challenge_id,
          user_id: currentUser.id,
          score: finalScore,
          time_taken: null // Could calculate total time if needed
        });

      if (resultsError) throw resultsError;

      // Update the challenger/opponent status to completed
      const statusField = isChallenger ? 'challenger_status' : 'opponent_status';
      const { error: statusError } = await supabase
        .from('challenges')
        .update({ 
          [statusField]: 'completed'
        })
        .eq('challenge_id', challenge.challenge_id);

      if (statusError) throw statusError;

      notify.success(`Game completed! You scored ${finalScore}/160`);
      
      // Redirect to results after a short delay
      setTimeout(() => {
        router.push(`/challenges/results/${challenge.challenge_id}`);
      }, 3000);
      
    } catch (error) {
      console.error('Error finishing game:', error);
      notify.error('Failed to save game results');
    }
  }, [challenge.challenge_id, currentUser.id, isChallenger, supabase, router]);

  const nextQuestion = useCallback(() => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedChoice(null);
      setIsAnswerCorrect(null);
      setShowResult(false);
      setTimeLeft(10);
      setQuestionStartTime(Date.now());
    } else {
      // Last question - game will be finished by handleChoiceSelect or handleTimeUp
      setGamePhase('finished');
    }
  }, [currentQuestionIndex, totalQuestions]);

  const handleTimeUp = useCallback(async () => {
    setShowResult(true);
    setIsAnswerCorrect(false); // Timeout is always incorrect
    
    // Submit timeout answer via API
    try {
      console.log('Submitting timeout answer for question:', currentQuestion?.question_id);
      const response = await fetch('/api/challenges/submit-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challengeId: challenge.challenge_id,
          questionId: currentQuestion.question_id,
          choiceId: null, // No choice selected
          timeTaken: 10, // Full time elapsed
          questionOrder: currentQuestionIndex + 1,
          questionStartTime // SECURITY: Send start time for validation
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error submitting timeout answer via API:', errorData);
      }
    } catch (error) {
      console.error('Error submitting timeout answer:', error);
    }
    
    // If this is the last question, finish the game
    if (currentQuestionIndex === totalQuestions - 1) {
      setTimeout(() => {
        finishGame(score);
      }, 2000);
      return;
    }
    
    setTimeout(() => {
      nextQuestion();
    }, 2000);
  }, [nextQuestion, challenge.challenge_id, currentQuestion.question_id, currentQuestionIndex, questionStartTime, totalQuestions, score, finishGame]);

  // Timer countdown for questions
  useEffect(() => {
    if (gamePhase === 'playing' && timeLeft > 0 && !showResult) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gamePhase === 'playing' && timeLeft === 0 && !showResult) {
      handleTimeUp();
    }
  }, [gamePhase, timeLeft, showResult, handleTimeUp]);

  const handleChoiceSelect = useCallback(async (choiceIndex: number) => {
    if (selectedChoice !== null || showResult || gamePhase !== 'playing') return;
    
    setSelectedChoice(choiceIndex);
    setShowResult(true);
    
    const timeTaken = 10 - timeLeft;
    const selectedChoiceId = currentQuestion.choice_ids[choiceIndex];
    
    // Submit answer via API
    try {
      const response = await fetch('/api/challenges/submit-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challengeId: challenge.challenge_id,
          questionId: currentQuestion.question_id,
          choiceId: selectedChoiceId,
          timeTaken: timeTaken,
          questionOrder: currentQuestionIndex + 1,
          questionStartTime // SECURITY: Send start time for validation
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const { scoreCalculation, isCorrect } = result.result;
        
        // Store whether the answer was correct for visual feedback
        setIsAnswerCorrect(isCorrect);
        
        if (isCorrect && scoreCalculation) {
          const newScore = score + scoreCalculation.totalScore;
          setScore(newScore);
          
          // If this is the last question, finish the game
          if (currentQuestionIndex === totalQuestions - 1) {
            setTimeout(() => {
              finishGame(newScore);
            }, 100);
            return; // Don't call nextQuestion for the last question
          }
        }
      } else {
        console.error('Error submitting answer:', result.error);
        // SECURITY: No client-side fallback calculation to prevent cheating
        // Score must be calculated server-side only
        setIsAnswerCorrect(false); // Default to incorrect if API fails
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      // SECURITY: No client-side fallback calculation to prevent cheating
      // All scoring must be server-side only
      setIsAnswerCorrect(false); // Default to incorrect if API fails
    }
    
    // Don't call nextQuestion if it's the last question and we're finishing the game
    if (currentQuestionIndex === totalQuestions - 1) {
      // Game completion is handled in the response processing above
      return;
    }
    
    setTimeout(() => {
      nextQuestion();
    }, 2000);
  }, [selectedChoice, showResult, gamePhase, score, currentQuestion, challenge.challenge_id, currentQuestionIndex, totalQuestions, timeLeft, questionStartTime, finishGame, nextQuestion]);

  const getChoiceButtonClass = (choiceIndex: number) => {
    const baseClasses = "h-12 sm:h-14 md:h-16 w-full text-center justify-center px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base md:text-lg font-medium rounded-xl transition-all duration-300 transform tracking-tight";
    
    if (!showResult) {
      return `${baseClasses} bg-white text-black border border-gray-300 hover:bg-gray-50 hover:scale-[1.02]`;
    }
    
    // Show visual feedback based on answer correctness without exposing correct answers
    if (choiceIndex === selectedChoice) {
      if (isAnswerCorrect === true) {
        return `${baseClasses} bg-green-500 text-white border border-green-500 shadow-lg shadow-green-500/25`;
      } else if (isAnswerCorrect === false) {
        return `${baseClasses} bg-red-500 text-white border border-red-500 shadow-lg shadow-red-500/25`;
      } else {
        // Fallback in case answer correctness is not determined yet
        return `${baseClasses} bg-blue-500 text-white border border-blue-500`;
      }
    }
    
    // All other options remain white but disabled
    return `${baseClasses} bg-white text-gray-400 border border-gray-300 opacity-60`;
  };

  // Intro Phase - VS Screen
  if (gamePhase === 'intro') {
    return (
      <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 3, ease: "easeOut" }}
          className="text-center w-full max-w-4xl"
        >
          <div className="flex items-center justify-center gap-4 sm:gap-8 md:gap-12 mb-6 md:mb-8 flex-wrap md:flex-nowrap">
            {/* Current Player */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 2 }}
            >
              <PlayerAvatarBlock
                player={currentPlayer}
                color="bg-red-500"
                layoutId="player-avatar-current"
                size="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48"
                usernameClass="text-sm sm:text-base md:text-lg"
              />
            </motion.div>

            {/* Lightning Bolt */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 2 }}
              transition={{ delay: 0, duration: 3, type: "spring" }}
              className="text-yellow-400 text-2xl sm:text-3xl md:text-4xl order-2 md:order-none"
            >
              <Zap className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" fill="currentColor" />
            </motion.div>

            {/* Opponent */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 2 }}
            >
              <PlayerAvatarBlock
                player={otherPlayer}
                color="bg-green-500"
                layoutId="player-avatar-opponent"
                size="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48"
                usernameClass="text-sm sm:text-base md:text-lg"
              />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 2 }}
          >
            <div className="text-white text-base sm:text-lg md:text-xl font-semibold tracking-tight mt-4 md:mt-0">
              {challenge.topic.name}
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Countdown Phase
  if (gamePhase === 'countdown') {
    return (
      <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center px-4">
        <div className="w-full max-w-6xl">
          {/* Players moved to sides */}
            <div className="flex justify-between items-center">
              <PlayerAvatarBlock
                player={currentPlayer}
                color="bg-red-500"
                layoutId="player-avatar-current"
                size="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32"
                usernameClass="text-xs sm:text-sm md:text-base"
                score={0}
              />

              <div className="text-center px-4">
                <motion.div
                key={countdownTime}
                initial={{ scale: 0, rotate: -360 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ type: "spring", duration: 1 }}
                className="text-white text-4xl sm:text-5xl md:text-6xl font-bold"
                >
                {countdownTime}
                </motion.div>
                <div className="text-white text-sm sm:text-base md:text-lg font-medium mt-2 tracking-tight">
                Get Ready!
                </div>
              </div>

              <PlayerAvatarBlock
                player={otherPlayer}
                color="bg-green-500"
                layoutId="player-avatar-opponent"
                size="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32"
                usernameClass="text-xs sm:text-sm md:text-base"
                score={0}
              />
            </div>
        </div>
      </div>
    );
  }

  // Finished Phase
  if (gamePhase === 'finished') {
    return (
      <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <div className="text-6xl mb-4 flex justify-center">
            <Trophy className="w-16 h-16 text-yellow-400" fill="currentColor" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-white tracking-tight">Game Complete!</h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-400 mb-4 font-medium">
            Final Score: {score}
          </p>
          <p className="text-sm sm:text-base text-gray-400 tracking-tight">Redirecting to results...</p>
        </motion.div>
      </div>
    );
  }

  // Playing Phase - Main Game (QuizUp Style)
  return (
    <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center px-2 sm:px-4">
      <div className="w-full max-w-6xl">
        {/* Mobile Layout */}
        <div className="md:hidden">
          {/* Players at top */}
          <div className="flex justify-between items-center mb-4 px-2">
            <PlayerAvatarBlock
              player={currentPlayer}
              color="bg-red-500"
              layoutId="player-avatar-current"
              size="w-16 h-16"
              usernameClass="text-xs"
              score={score}
            />
            <PlayerAvatarBlock
              player={otherPlayer}
              color="bg-green-500"
              layoutId="player-avatar-opponent"
              size="w-16 h-16"
              usernameClass="text-xs"
              score="?"
            />
          </div>
          
          {/* Game content */}
          <div className="text-center px-2">
            {/* Timer */}
            <motion.div
              key={timeLeft}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className={`inline-flex items-center justify-center w-12 h-12 rounded-full text-lg font-bold transition-colors duration-300 mb-4 ${
                timeLeft <= 3 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-blue-500 text-white'
              }`}
            >
              {timeLeft}
            </motion.div>

            {/* Progress Bar */}
            <div className="mb-4">
              <Progress 
                value={(currentQuestionIndex / totalQuestions) * 100} 
                className="w-full h-2 bg-gray-700"
              />
              <div className="text-center mt-2 text-gray-400 text-xs">
                {currentQuestionIndex + 1} of {totalQuestions}
                {(currentQuestionIndex + 1) === 7 && (
                  <span className="ml-2 text-yellow-400 font-bold animate-pulse text-xs">
                    <Flame className="inline w-3 h-3 mr-1" fill="currentColor" />
                    DOUBLE POINTS!
                  </span>
                )}
              </div>
            </div>

            {/* Question */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="text-center mb-6"
              >
                <div className={`backdrop-blur-sm rounded-xl p-4 border transition-all duration-500 ${
                  (currentQuestionIndex + 1) === 7 
                    ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-400 shadow-lg shadow-yellow-400/25' 
                    : 'bg-slate-800/50 border-slate-700'
                }`}>
                  <h2 className={`text-base font-semibold leading-relaxed ${
                    (currentQuestionIndex + 1) === 7 ? 'text-yellow-100' : 'text-white'
                  }`}>
                    {currentQuestion.text}
                  </h2>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Answer Choices */}
            <div className="space-y-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestionIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3"
                >
                  {currentQuestion.choices.map((choice, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                    >
                      <Button
                        className={getChoiceButtonClass(index)}
                        onClick={() => handleChoiceSelect(index)}
                        disabled={showResult}
                      >
                        {choice}
                      </Button>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex justify-between items-center">
          <PlayerAvatarBlock
            player={currentPlayer}
            color="bg-red-500"
            layoutId="player-avatar-current"
            size="w-24 h-24 lg:w-32 lg:h-32"
            usernameClass="text-sm lg:text-base"
            score={score}
          />

          <div className="text-center max-w-2xl px-8">
            {/* Timer */}
            <motion.div
              key={timeLeft}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className={`inline-flex items-center justify-center w-14 h-14 lg:w-16 lg:h-16 rounded-full text-xl font-bold transition-colors duration-300 mb-6 ${
                timeLeft <= 3 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-blue-500 text-white'
              }`}
            >
              {timeLeft}
            </motion.div>

            {/* Progress Bar */}
            <div className="mb-6">
              <Progress 
                value={(currentQuestionIndex / totalQuestions) * 100} 
                className="w-full h-2 bg-gray-700"
              />
              <div className="text-center mt-2 text-gray-400 text-sm">
                {currentQuestionIndex + 1} of {totalQuestions}
                {(currentQuestionIndex + 1) === 7 && (
                  <span className="ml-2 text-yellow-400 font-bold animate-pulse">
                    <Flame className="inline w-4 h-4 mr-1" fill="currentColor" />
                    DOUBLE POINTS!
                  </span>
                )}
              </div>
            </div>

            {/* Question */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="text-center mb-8"
              >
                <div className={`backdrop-blur-sm rounded-xl p-6 border transition-all duration-500 ${
                  (currentQuestionIndex + 1) === 7 
                    ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-400 shadow-lg shadow-yellow-400/25' 
                    : 'bg-slate-800/50 border-slate-700'
                }`}>
                  <h2 className={`text-xl lg:text-2xl font-semibold leading-relaxed ${
                    (currentQuestionIndex + 1) === 7 ? 'text-yellow-100' : 'text-white'
                  }`}>
                    {currentQuestion.text}
                  </h2>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Answer Choices */}
            <div className="space-y-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestionIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {currentQuestion.choices.map((choice, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                    >
                      <Button
                        className={getChoiceButtonClass(index)}
                        onClick={() => handleChoiceSelect(index)}
                        disabled={showResult}
                      >
                        {choice}
                      </Button>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <PlayerAvatarBlock
            player={otherPlayer}
            color="bg-green-500"
            layoutId="player-avatar-opponent"
            size="w-24 h-24 lg:w-32 lg:h-32"
            usernameClass="text-sm lg:text-base"
            score="?"
          />
        </div>
      </div>
    </div>
  );
}
