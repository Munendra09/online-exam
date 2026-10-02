const { Question, Answer, Result } = require('../models');

/**
 * Grade based on percentage
 */
function grade(percentage) {
  if (percentage >= 80) return 'A';
  if (percentage >= 60) return 'B';
  if (percentage >= 40) return 'C';
  return 'D';
}

/**
 * Calculate and save/update the result for an exam attempt.
 * Computes score with optional negative marking.
 *
 * @param {object} attempt - ExamAttempt model instance
 * @param {object} exam - Exam model instance
 * @returns {Array} Upsert result
 */
async function calculateResult(attempt, exam) {
  const answers = await Answer.findAll({
    where: { attemptId: attempt.id },
    include: [Question],
  });

  let correct = 0;
  let wrong = 0;
  let unattempted = 0;
  let score = 0;

  for (const answer of answers) {
    if (!answer.selectedAnswer) {
      unattempted++;
      continue;
    }

    if (answer.selectedAnswer === answer.Question.correctAnswer) {
      correct++;
      score += 1;
    } else {
      wrong++;
      if (exam.negativeMarkingEnabled) {
        score -= Number(exam.negativeMarksPerQuestion || 0);
      }
    }
  }

  const percentage = exam.totalQuestions
    ? Number(((score / exam.totalQuestions) * 100).toFixed(2))
    : 0;

  return Result.upsert({
    userId: attempt.userId,
    examId: attempt.examId,
    score,
    correctCount: correct,
    wrongCount: wrong,
    unattemptedCount: unattempted,
    percentage,
    grade: grade(percentage),
  });
}

module.exports = { calculateResult };
