-- Add points_scored column to answers table
ALTER TABLE answers ADD COLUMN IF NOT EXISTS points_scored integer DEFAULT 0;

-- Update existing records with calculated points based on current scoring logic
UPDATE answers 
SET points_scored = CASE 
    WHEN is_correct = true THEN 
        -- Base score: 10 + time bonus (max 10 seconds bonus)
        CASE 
            WHEN time_taken IS NULL THEN 10
            ELSE 10 + GREATEST(0, 10 - time_taken)
        END
    ELSE 0 
END
WHERE points_scored = 0;

-- For question 7 (assuming order_index = 6), double the points
UPDATE answers 
SET points_scored = points_scored * 2
WHERE points_scored > 0 
AND question_id IN (
    SELECT cq.question_id 
    FROM challenge_questions cq 
    WHERE cq.order_index = 6
);
