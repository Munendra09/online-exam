const { Question } = require('../models');
const shuffle = require('../utils/shuffle');

/**
 * Generate a set of questions for a student based on exam configuration.
 * Picks N random questions from the exam's question pool and shuffles them.
 * No difficulty levels — all questions are treated equally.
 * Ensures no question repeats (random selection without replacement).
 *
 * @param {object} exam - Exam model instance
 * @returns {Array} Shuffled array of question objects (without correctAnswer)
 */
async function generateQuestions(exam) {
  // Get all questions for this exam in random order
  const allQuestions = await Question.findAll({
    where: { examId: exam.id },
    order: Question.sequelize.random(),
    attributes: { exclude: ['correctAnswer', 'createdAt', 'updatedAt'] },
  });

  if (allQuestions.length < exam.totalQuestions) {
    const err = new Error(
      `Not enough questions. Required ${exam.totalQuestions}, found ${allQuestions.length}. ` +
      `Upload more questions via CSV for this exam.`
    );
    err.status = 400;
    throw err;
  }

  // Pick exactly totalQuestions (no repeats since we're slicing from shuffled pool)
  const selected = allQuestions.slice(0, exam.totalQuestions);

  return shuffle(selected.map((q) => q.toJSON()));
}

module.exports = { generateQuestions };
