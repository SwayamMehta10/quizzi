"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock } from "lucide-react";

interface Answer {
  question_id: string;
  question_text: string;
  user_id: string;
  choice_id: string | null;
  choice_text: string | null;
  is_correct: boolean;
  time_taken: number;
  correct_choice: string;
  question_order: number;
}

interface PlayerResult {
  user_id: string;
  username: string;
  avatar_url: string;
  total_score: number;
  answers: Answer[];
}

interface ChallengeResultsProps {
  challenger: PlayerResult;
  opponent: PlayerResult;
  topicName: string;
  winner?: string | null;
  isCurrentUserWinner?: boolean;
  isTie?: boolean;
}

export default function ChallengeResults({ 
  challenger, 
  opponent, 
  topicName,
  winner,
  isCurrentUserWinner,
  isTie
}: ChallengeResultsProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);

  // Calculate cumulative scores for the graph
  const getCumulativeScores = (answers: Answer[]) => {
    const sortedAnswers = [...answers].sort((a, b) => a.question_order - b.question_order);
    let cumulativeScore = 0;
    return sortedAnswers.map((answer, index) => {
      if (answer.is_correct) {
        const baseScore = 10 + (10 - answer.time_taken);
        const multiplier = (index + 1) === 7 ? 2 : 1; // Double points for 7th question
        cumulativeScore += baseScore * multiplier;
      }
      return {
        question: index + 1,
        score: cumulativeScore,
        isCorrect: answer.is_correct,
        timeTaken: answer.time_taken
      };
    });
  };

  const challengerScores = getCumulativeScores(challenger.answers);
  const opponentScores = getCumulativeScores(opponent.answers);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const margin = { top: 20, right: 80, bottom: 40, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const g = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear()
      .domain([1, 7])
      .range([0, width]);

    const maxScore = Math.max(
      challenger.total_score,
      opponent.total_score,
      d3.max(challengerScores, d => d.score) || 0,
      d3.max(opponentScores, d => d.score) || 0
    );

    const yScale = d3.scaleLinear()
      .domain([0, maxScore + 20])
      .range([height, 0]);

    // Create gradient definitions for neon effects
    const defs = svg.append("defs");

    // Challenger gradient (neon cyan)
    const challengerGradient = defs.append("linearGradient")
      .attr("id", "challengerGradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0).attr("y1", height)
      .attr("x2", 0).attr("y2", 0);
    
    challengerGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#06B6D4")
      .attr("stop-opacity", 0.1);
    
    challengerGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#06B6D4")
      .attr("stop-opacity", 0.8);

    // Opponent gradient (neon magenta)
    const opponentGradient = defs.append("linearGradient")
      .attr("id", "opponentGradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0).attr("y1", height)
      .attr("x2", 0).attr("y2", 0);
    
    opponentGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#EC4899")
      .attr("stop-opacity", 0.1);
    
    opponentGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#EC4899")
      .attr("stop-opacity", 0.8);

    // Grid lines
    g.selectAll(".grid-line-x")
      .data(xScale.ticks(7))
      .enter()
      .append("line")
      .attr("class", "grid-line-x")
      .attr("x1", d => xScale(d))
      .attr("x2", d => xScale(d))
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "#374151")
      .attr("stroke-width", 0.5)
      .attr("stroke-dasharray", "2,2")
      .attr("opacity", 0.3);

    g.selectAll(".grid-line-y")
      .data(yScale.ticks(6))
      .enter()
      .append("line")
      .attr("class", "grid-line-y")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", d => yScale(d))
      .attr("y2", d => yScale(d))
      .attr("stroke", "#374151")
      .attr("stroke-width", 0.5)
      .attr("stroke-dasharray", "2,2")
      .attr("opacity", 0.3);

    // Line generators
    const line = d3.line<{ question: number; score: number }>()
      .x(d => xScale(d.question))
      .y(d => yScale(d.score))
      .curve(d3.curveMonotoneX);

    // Area generators for glow effect
    const area = d3.area<{ question: number; score: number }>()
      .x(d => xScale(d.question))
      .y0(height)
      .y1(d => yScale(d.score))
      .curve(d3.curveMonotoneX);

    // Add area fills for glow effect
    g.append("path")
      .datum(challengerScores)
      .attr("fill", "url(#challengerGradient)")
      .attr("d", area);

    g.append("path")
      .datum(opponentScores)
      .attr("fill", "url(#opponentGradient)")
      .attr("d", area);

    // Add lines with neon glow
    g.append("path")
      .datum(challengerScores)
      .attr("fill", "none")
      .attr("stroke", "#06B6D4")
      .attr("stroke-width", 3)
      .attr("filter", "drop-shadow(0 0 6px #06B6D4)")
      .attr("d", line);

    g.append("path")
      .datum(opponentScores)
      .attr("fill", "none")
      .attr("stroke", "#EC4899")
      .attr("stroke-width", 3)
      .attr("filter", "drop-shadow(0 0 6px #EC4899)")
      .attr("d", line);

    // Add data points with hover effects
    g.selectAll(".challenger-point")
      .data(challengerScores)
      .enter()
      .append("circle")
      .attr("class", "challenger-point")
      .attr("cx", d => xScale(d.question))
      .attr("cy", d => yScale(d.score))
      .attr("r", 6)
      .attr("fill", "#06B6D4")
      .attr("stroke", "#0F172A")
      .attr("stroke-width", 2)
      .attr("filter", "drop-shadow(0 0 8px #06B6D4)")
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        d3.select(this).attr("r", 8);
        setSelectedQuestion(d.question);
      })
      .on("mouseout", function() {
        d3.select(this).attr("r", 6);
        setSelectedQuestion(null);
      });

    g.selectAll(".opponent-point")
      .data(opponentScores)
      .enter()
      .append("circle")
      .attr("class", "opponent-point")
      .attr("cx", d => xScale(d.question))
      .attr("cy", d => yScale(d.score))
      .attr("r", 6)
      .attr("fill", "#EC4899")
      .attr("stroke", "#0F172A")
      .attr("stroke-width", 2)
      .attr("filter", "drop-shadow(0 0 8px #EC4899)")
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        d3.select(this).attr("r", 8);
        setSelectedQuestion(d.question);
      })
      .on("mouseout", function() {
        d3.select(this).attr("r", 6);
        setSelectedQuestion(null);
      });

    // Axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d => `Q${d}`))
      .selectAll("text")
      .attr("fill", "#9CA3AF");

    g.append("g")
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .attr("fill", "#9CA3AF");

    // Axis labels
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .attr("fill", "#9CA3AF")
      .text("Total Score");

    g.append("text")
      .attr("transform", `translate(${width / 2}, ${height + margin.bottom})`)
      .style("text-anchor", "middle")
      .attr("fill", "#9CA3AF")
      .text("Question Number");

  }, [challengerScores, opponentScores, challenger.total_score, opponent.total_score]);

  return (
    <div className="space-y-8">
      {/* Winner announcement */}
      {winner && (
        <Card className="bg-gradient-to-r from-yellow-900/50 to-yellow-800/50 border-yellow-400">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl mb-2">🏆</div>
              {isTie ? (
                <h2 className="text-2xl font-bold text-yellow-400 mb-2">It&apos;s a Tie!</h2>
              ) : (
                <h2 className="text-2xl font-bold text-yellow-400 mb-2">
                  {isCurrentUserWinner ? 'You Won!' : 
                   winner === challenger.user_id ? `${challenger.username} Wins!` : `${opponent.username} Wins!`}
                </h2>
              )}
              <p className="text-yellow-200">
                {isTie ? 'Both players scored the same!' : 
                 isCurrentUserWinner ? 'Congratulations on your victory!' : 'Better luck next time!'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header with final scores */}
      <Card className="bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-white">
            {topicName} Challenge Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center gap-8">
            <div className="text-center">
              <Avatar className={`w-20 h-20 mx-auto mb-2 border-4 ${
                winner === challenger.user_id ? 'border-yellow-400' : 'border-cyan-400'
              }`}>
                <AvatarImage src={challenger.avatar_url} alt={challenger.username} />
              </Avatar>
              <h3 className="font-semibold text-white">{challenger.username}</h3>
              <div className={`text-3xl font-bold ${
                winner === challenger.user_id ? 'text-yellow-400' : 'text-cyan-400'
              }`}>
                {challenger.total_score}
              </div>
              {winner === challenger.user_id && <div className="text-yellow-400 text-sm">Winner!</div>}
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-2">⚡</div>
              <div className="text-white font-semibold">VS</div>
            </div>
            
            <div className="text-center">
              <Avatar className={`w-20 h-20 mx-auto mb-2 border-4 ${
                winner === opponent.user_id ? 'border-yellow-400' : 'border-pink-400'
              }`}>
                <AvatarImage src={opponent.avatar_url} alt={opponent.username} />
              </Avatar>
              <h3 className="font-semibold text-white">{opponent.username}</h3>
              <div className={`text-3xl font-bold ${
                winner === opponent.user_id ? 'text-yellow-400' : 'text-pink-400'
              }`}>
                {opponent.total_score}
              </div>
              {winner === opponent.user_id && <div className="text-yellow-400 text-sm">Winner!</div>}
            </div>
          </div>
          
          {winner && !isTie && (
            <div className="text-center mt-6">
              <Badge className="text-lg px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold">
                🏆 {winner === challenger.user_id ? challenger.username : opponent.username} Wins!
              </Badge>
            </div>
          )}
          {isTie && (
            <div className="text-center mt-6">
              <Badge className="text-lg px-4 py-2 bg-gradient-to-r from-blue-400 to-purple-500 text-white font-bold">
                🤝 It&apos;s a Tie!
              </Badge>
            </div>
          )}
          {!winner && !isTie && (
            <div className="text-center mt-6">
              <Badge className="text-lg px-4 py-2 bg-gradient-to-r from-gray-400 to-gray-600 text-white font-bold">
                Results Complete
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Score progression graph */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-center">Score Progression</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <svg ref={svgRef} className="bg-slate-900 rounded-lg"></svg>
          </div>
          <div className="flex justify-center gap-8 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50"></div>
              <span className="text-cyan-400 font-semibold">{challenger.username}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-pink-400 rounded-full shadow-lg shadow-pink-400/50"></div>
              <span className="text-pink-400 font-semibold">{opponent.username}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed question breakdown */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Question-by-Question Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {challenger.answers.map((challengerAnswer, index) => {
              const opponentAnswer = opponent.answers.find(a => a.question_order === challengerAnswer.question_order);
              if (!opponentAnswer) return null;

              return (
                <div 
                  key={challengerAnswer.question_id}
                  className={`p-4 rounded-lg border transition-all ${
                    selectedQuestion === index + 1 
                      ? 'border-yellow-400 bg-yellow-400/10' 
                      : 'border-slate-600 bg-slate-800'
                  }`}
                >
                  <h4 className="font-semibold text-white mb-3">
                    Question {challengerAnswer.question_order}: {challengerAnswer.question_text}
                  </h4>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Challenger answer */}
                    <div className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
                      <Avatar className="w-10 h-10 border-2 border-cyan-400">
                        <AvatarImage src={challenger.avatar_url} alt={challenger.username} />
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium text-cyan-400">{challenger.username}</div>
                        <div className="flex items-center gap-2 text-sm">
                          {challengerAnswer.is_correct ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400" />
                          )}
                          <span className="text-gray-300">
                            {challengerAnswer.choice_text || 'No answer'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {challengerAnswer.time_taken.toFixed(1)}s
                        </div>
                      </div>
                    </div>

                    {/* Opponent answer */}
                    <div className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
                      <Avatar className="w-10 h-10 border-2 border-pink-400">
                        <AvatarImage src={opponent.avatar_url} alt={opponent.username} />
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium text-pink-400">{opponent.username}</div>
                        <div className="flex items-center gap-2 text-sm">
                          {opponentAnswer.is_correct ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400" />
                          )}
                          <span className="text-gray-300">
                            {opponentAnswer.choice_text || 'No answer'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {opponentAnswer.time_taken.toFixed(1)}s
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Correct answer */}
                  <div className="mt-3 p-2 bg-green-900/30 border border-green-700 rounded">
                    <span className="text-green-400 text-sm font-medium">
                      Correct Answer: {challengerAnswer.correct_choice}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
