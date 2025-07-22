"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, XCircle, Zap } from "lucide-react";
import { GiTrophy } from "react-icons/gi";
import { FaRegHandshake } from "react-icons/fa";

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
  points_scored?: number;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
  const [dimensions, setDimensions] = useState({ width: 700, height: 280 });

  // Calculate cumulative scores for the graph using stored points
  const getCumulativeScores = (answers: Answer[]) => {
    // console.log("Getting cumulative scores for answers:", answers.length);
    
    const sortedAnswers = [...answers].sort((a, b) => a.question_order - b.question_order);
    
    let cumulativeScore = 0;
    const scores = [];
    
    // Create entries for all 7 questions (1-7)
    for (let questionNum = 1; questionNum <= 7; questionNum++) {
      const answer = sortedAnswers.find(a => a.question_order === questionNum);
      
      if (answer) {
        cumulativeScore += answer.points_scored || 0;
        scores.push({
          question: questionNum,
          score: cumulativeScore,
          isCorrect: answer.is_correct,
          timeTaken: answer.time_taken
        });
      } else {
        // No answer for this question - keep same score
        scores.push({
          question: questionNum,
          score: cumulativeScore,
          isCorrect: false,
          timeTaken: 10
        });
      }
    }
    
    // console.log("Generated cumulative scores:", scores);
    return scores;
  };

  const challengerScores = getCumulativeScores(challenger.answers);
  const opponentScores = getCumulativeScores(opponent.answers);

  // Handle container resize for responsive design
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const isMobile = window.innerWidth < 768;
        const isTablet = window.innerWidth < 1024;
        
        if (isMobile) {
          // Mobile: Use container width with minimum
          setDimensions({
            width: Math.max(300, rect.width - 40),
            height: 200
          });
        } else if (isTablet) {
          // Tablet: Use container width but larger
          setDimensions({
            width: Math.max(500, rect.width - 40),
            height: 260
          });
        } else {
          // Desktop: Use original fixed dimensions for perfect display
          setDimensions({
            width: 700,
            height: 280
          });
        }
      }
    };

    // Initial measurement
    updateDimensions();

    // Set up resize observer
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Handle window resize
    window.addEventListener('resize', updateDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth < 1024;
    
    // Use original margins for desktop to preserve the perfect layout
    let margin;
    if (isMobile) {
      margin = { top: 10, right: 30, bottom: 40, left: 50 };
    } else if (isTablet) {
      margin = { top: 0, right: 30, bottom: 40, left: 60 };
    } else {
      margin = { top: -10, right: -50, bottom: 0, left: 100 }; // Original desktop margins
    }
    
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    const g = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear()
      .domain([1, 7.5])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, 170])
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
      .data([1, 2, 3, 4, 5, 6, 7])
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

    // Add data points with hover effects - adjust size for mobile
    const pointRadius = isMobile ? 4 : (isTablet ? 5 : 6);
    const hoverRadius = isMobile ? 6 : (isTablet ? 7 : 8);
    
    g.selectAll(".challenger-point")
      .data(challengerScores)
      .enter()
      .append("circle")
      .attr("class", "challenger-point")
      .attr("cx", d => xScale(d.question))
      .attr("cy", d => yScale(d.score))
      .attr("r", pointRadius)
      .attr("fill", "#06B6D4")
      .attr("stroke", "#0F172A")
      .attr("stroke-width", 2)
      .attr("filter", "drop-shadow(0 0 8px #06B6D4)")
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        d3.select(this).attr("r", hoverRadius);
        setSelectedQuestion(d.question);
      })
      .on("mouseout", function() {
        d3.select(this).attr("r", pointRadius);
        setSelectedQuestion(null);
      });

    g.selectAll(".opponent-point")
      .data(opponentScores)
      .enter()
      .append("circle")
      .attr("class", "opponent-point")
      .attr("cx", d => xScale(d.question))
      .attr("cy", d => yScale(d.score))
      .attr("r", pointRadius)
      .attr("fill", "#EC4899")
      .attr("stroke", "#0F172A")
      .attr("stroke-width", 2)
      .attr("filter", "drop-shadow(0 0 8px #EC4899)")
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        d3.select(this).attr("r", hoverRadius);
        setSelectedQuestion(d.question);
      })
      .on("mouseout", function() {
        d3.select(this).attr("r", pointRadius);
        setSelectedQuestion(null);
      });

    // Axes with mobile-responsive styling
    const fontSize = isMobile ? "10px" : (isTablet ? "11px" : "12px");
    
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickValues([1, 2, 3, 4, 5, 6, 7]).tickFormat(d => `Q${d}`))
      .selectAll("text")
      .attr("fill", "#9CA3AF")
      .style("font-size", fontSize);

    g.append("g")
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .attr("fill", "#9CA3AF")
      .style("font-size", fontSize);

    // Axis labels with mobile adjustments
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", isMobile ? 0 - margin.left : (isTablet ? 10 - margin.left : 30 - margin.left))
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", fontSize)
      .attr("fill", "#9CA3AF")
      .text("Total Score");

    // g.append("text")
    //   .attr("transform", `translate(${width / 2}, ${height + margin.bottom - 8})`)
    //   .attr("x", isMobile ? 0 : (isTablet ? -10 : -20))
    //   .attr("y", isMobile ? 35 : (isTablet ? 40 : 45))
    //   .style("text-anchor", "middle")
    //   .style("font-size", fontSize)
    //   .attr("fill", "#9CA3AF")
    //   .text("Question Number");

  }, [challengerScores, opponentScores, challenger.total_score, opponent.total_score, dimensions]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-2 min-h-[calc(100vh-6rem)] overflow-hidden">
      {/* Left Column - Header with scores and graph */}
      <div className="xl:col-span-2 flex flex-col space-y-2 min-h-0">
        {/* Compact Header with final scores */}
        <Card className="bg-slate-900 border-slate-700 flex-shrink-0">
          <CardContent className="">
            <div className="text-center mb-2">
              <h1 className="text-sm md:text-base font-bold text-white mb-1">{topicName} Challenge Results</h1>
              {winner && (
                <div className="text-sm md:text-base flex items-center justify-center gap-1">
                  {isTie ? (
                    <>
                      <FaRegHandshake className="text-yellow-400" />
                      <span className="text-yellow-400 font-semibold">It&apos;s a Tie!</span>
                    </>
                  ) : (
                    <>
                      <GiTrophy className="text-yellow-400" />
                      <span className="text-yellow-400 font-semibold">
                        {isCurrentUserWinner ? 'You Won!' : 
                         winner === challenger.user_id ? `${challenger.username} Wins!` : `${opponent.username} Wins!`}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex justify-center items-center gap-2 md:gap-3">
              <div className="text-center">
                <Avatar className={`w-6 h-6 md:w-8 md:h-8 mx-auto mb-1 border ${
                  winner === challenger.user_id ? 'border-yellow-400' : 'border-cyan-400'
                }`}>
                  <AvatarImage src={challenger.avatar_url} alt={challenger.username} />
                </Avatar>
                <h3 className="font-medium text-white text-sm">{challenger.username}</h3>
                <div className={`text-base md:text-lg font-bold ${
                  winner === challenger.user_id ? 'text-yellow-400' : 'text-cyan-400'
                }`}>
                  {challenger.total_score}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-base text-yellow-400 md:text-lg mb-1"><Zap className="w-4 h-4 sm:w-4 sm:h-4 md:w-6 md:h-6" fill="currentColor" /></div>
                <div className="text-white font-semibold text-sm">VS</div>
              </div>
              
              <div className="text-center">
                <Avatar className={`w-6 h-6 md:w-8 md:h-8 mx-auto mb-1 border ${
                  winner === opponent.user_id ? 'border-yellow-400' : 'border-pink-400'
                }`}>
                  <AvatarImage src={opponent.avatar_url} alt={opponent.username} />
                </Avatar>
                <h3 className="font-medium text-white text-sm">{opponent.username}</h3>
                <div className={`text-base md:text-lg font-bold ${
                  winner === opponent.user_id ? 'text-yellow-400' : 'text-pink-400'
                }`}>
                  {opponent.total_score}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compact Score progression graph */}
        <Card className="bg-slate-900 border-slate-700 flex-1 gap-4 min-h-0">
          <CardHeader className="">
            <CardTitle className="text-white text-center text-base md:text-lg">Score Progression</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col h-full" ref={containerRef}>
            <div className="flex justify-center flex-1 min-h-0">
              <svg 
                ref={svgRef} 
                className="bg-slate-900 rounded-lg w-full h-full max-w-full"
                style={{ minHeight: '180px' }}
              />
            </div>
            <div className="flex justify-center gap-2 md:gap-3 mt-1 flex-wrap">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0"></div>
                <span className="text-cyan-400 font-medium text-sm md:text-sm max-w-[100px]">{challenger.username}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-pink-400 rounded-full flex-shrink-0"></div>
                <span className="text-pink-400 font-medium text-sm md:text-sm max-w-[100px]">{opponent.username}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Question breakdown */}
      <div className="xl:col-span-1 min-h-0">
        <Card className="bg-slate-900 border-slate-700 h-full flex flex-col gap-4">
          <CardHeader className="flex-shrink-0 pb-2">
            <CardTitle className="text-white text-base md:text-lg text-center">Question Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 pt-0">
            <div className="h-full overflow-hidden">
              {/* Header row */}
              <div className="grid grid-cols-5 xl:grid-cols-8 gap-1 mb-2 text-base text-gray-400 font-medium">
                <div className="col-span-1 text-center pl-2">Q</div>
                <div className="col-span-2 xl:col-span-4 text-center">Player</div>
                <div className="col-span-1 xl:col-span-2 text-center">Time</div>
                <div className="col-span-1 text-center">Score</div>
              </div>
              
              {/* Questions list */}
              <div className="space-y-0.5">
                {Array.from({length: 7}, (_, index) => {
                  const questionNumber = index + 1;
                  const challengerAnswer = challenger.answers.find(a => a.question_order === questionNumber);
                  const opponentAnswer = opponent.answers.find(a => a.question_order === questionNumber);

                  return (
                    <div key={questionNumber} className="space-y-0.5">
                      {/* Challenger row */}
                      <div className={`grid grid-cols-5 xl:grid-cols-8 gap-1 p-1 rounded text-sm transition-all ${
                        selectedQuestion === questionNumber 
                          ? 'bg-yellow-400/10 border border-yellow-400' 
                          : 'bg-slate-800 border border-slate-700'
                      }`}>
                        <div className="col-span-1 text-white font-medium text-center text-sm">
                          Q{questionNumber}
                        </div>
                        <div className="col-span-2 xl:col-span-4 flex items-center gap-1 min-w-0 px-4">
                          <Avatar className="w-4 h-4 xl:w-6 xl:h-6 border border-cyan-400 flex-shrink-0">
                            <AvatarImage src={challenger.avatar_url} alt={challenger.username} />
                          </Avatar>
                          <span className="text-cyan-400 font-medium text-sm max-w-[60px] xl:max-w-none">{challenger.username}</span>
                        </div>
                        <div className="col-span-1 xl:col-span-2 flex items-center gap-1 px-4">
                          {challengerAnswer ? (
                            challengerAnswer.is_correct ? (
                              <CheckCircle className="w-4 h-4 xl:w-4 xl:h-4 text-green-400" />
                            ) : (
                              <XCircle className="w-4 h-4 xl:w-4 xl:h-4 text-red-400" />
                            )
                          ) : (
                            <XCircle className="w-4 h-4 xl:w-4 xl:h-4 text-gray-500" />
                          )}
                          <span className="text-gray-300 text-sm">
                            {challengerAnswer ? `${challengerAnswer.time_taken.toFixed(1)}s` : 'N/A'}
                          </span>
                        </div>
                        <div className="col-span-1 text-yellow-400 font-bold text-sm text-center">
                          +{challengerAnswer?.points_scored || 0}
                        </div>
                      </div>

                      {/* Opponent row */}
                      <div className={`grid grid-cols-5 xl:grid-cols-8 gap-1 p-1 rounded text-sm transition-all ${
                        selectedQuestion === questionNumber 
                          ? 'bg-yellow-400/10 border border-yellow-400' 
                          : 'bg-slate-800 border border-slate-700'
                      }`}>
                        <div className="col-span-1"></div>
                        <div className="col-span-2 xl:col-span-4 flex items-center gap-1 min-w-0 px-4">
                          <Avatar className="w-4 h-4 xl:w-6 xl:h-6 border border-pink-400 flex-shrink-0">
                            <AvatarImage src={opponent.avatar_url} alt={opponent.username} />
                          </Avatar>
                          <span className="text-pink-400 font-medium text-sm max-w-[60px] xl:max-w-none">{opponent.username}</span>
                        </div>
                        <div className="col-span-1 xl:col-span-2 flex items-center gap-1 px-4">
                          {opponentAnswer ? (
                            opponentAnswer.is_correct ? (
                              <CheckCircle className="w-4 h-4 xl:w-4 xl:h-4 text-green-400" />
                            ) : (
                              <XCircle className="w-4 h-4 xl:w-4 xl:h-4 text-red-400" />
                            )
                          ) : (
                            <XCircle className="w-4 h-4 xl:w-4 xl:h-4 text-gray-500" />
                          )}
                          <span className="text-gray-300 text-sm">
                            {opponentAnswer ? `${opponentAnswer.time_taken.toFixed(1)}s` : 'N/A'}
                          </span>
                        </div>
                        <div className="col-span-1 text-yellow-400 font-bold text-sm text-center">
                          +{opponentAnswer?.points_scored || 0}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
