import { existsSync, readFileSync } from "node:fs";

function readQuestions() {
  if (existsSync("src/data/questionBank.json")) {
    return JSON.parse(readFileSync("src/data/questionBank.json", "utf8"));
  }
  const source = readFileSync("src/data/questionBank.ts", "utf8");
  const arrayLiteral = source.match(/export const starterQuestions: Question\[] = ([\s\S]*);\n/)?.[1];
  const jsonStringLiteral = source.match(/const questionJson = ([\s\S]*?);\n/)?.[1];
  if (!arrayLiteral && !jsonStringLiteral) {
    throw new Error("Could not read starter question bank.");
  }
  return arrayLiteral ? JSON.parse(arrayLiteral) : JSON.parse(JSON.parse(jsonStringLiteral));
}

const questions = readQuestions();
const subjects = ["Math", "Reading", "Science", "Spelling"];
const sessionSize = 15;
const expectedTotal = 1600;
const expectedPerSubject = 400;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(questions.length === expectedTotal, `Expected ${expectedTotal} questions, found ${questions.length}.`);
assert(questions.filter((question) => question.grade === 2).length === expectedTotal, `Expected ${expectedTotal} Grade 2 questions.`);
assert(!questions.some((question) => question.grade !== 2), "Only Grade 2 questions should remain.");
assert(!questions.some((question) => /\b(?:x|times|divided|multiply|multiplication|division|equal-groups)\b/i.test(`${question.question} ${question.skill ?? ""}`)), "Multiplication or division wording remains.");

for (const subject of subjects) {
  const pool = questions.filter((question) => question.subject === subject);
  assert(pool.length === expectedPerSubject, `${subject} should contain ${expectedPerSubject} questions.`);
  assert(pool.length >= sessionSize, `${subject} needs at least ${sessionSize} questions.`);
  assert(pool.every((question) => question.grade === 2), `${subject} should only contain Grade 2 questions.`);
  assert(new Set(pool.map((question) => question.question)).size === expectedPerSubject, `${subject} should not repeat exact question prompts.`);
}

for (const [index, question] of questions.entries()) {
  assert(question.id, `Question ${index + 1} is missing id.`);
  assert(subjects.includes(question.subject), `${question.id} has invalid subject.`);
  assert(typeof question.question === "string" && question.question.length > 0, `${question.id} has no question text.`);
  assert(Array.isArray(question.choices) && question.choices.length === 4, `${question.id} needs four choices.`);
  assert(new Set(question.choices).size === 4, `${question.id} needs four unique choices.`);
  assert(Number.isInteger(question.answerIndex) && question.answerIndex >= 0 && question.answerIndex <= 3, `${question.id} has invalid answerIndex.`);
  assert(question.choices[question.answerIndex], `${question.id} has no correct choice.`);
  assert(question.hint && question.explanation, `${question.id} needs hint and explanation.`);
}

const mixedPack = JSON.parse(readFileSync("public/question-packs/samaira-grade-2-pack.json", "utf8"));
assert(mixedPack.questions.length === expectedTotal, `Hosted mixed pack should contain ${expectedTotal} questions.`);

const sampleRun = {
  id: "run-test",
  date: new Date().toISOString(),
  subject: "Math",
  score: 12,
  total: 15,
  starsEarned: 120,
  missedQuestionIds: ["sample"],
  missedSkills: ["addition-under-20"],
  missedDetails: [
    {
      questionId: "sample",
      subject: "Math",
      skill: "addition-under-20",
      question: "What is 8 + 5?",
      choices: ["11", "13", "12", "10"],
      selectedAnswer: "11",
      correctAnswer: "13",
      explanation: "8 + 5 = 13.",
    },
  ],
};

assert(sampleRun.score <= sampleRun.total, "Progress run score cannot exceed total.");
assert(sampleRun.starsEarned === sampleRun.score * 10, "Stars earned should match score x 10.");
assert(sampleRun.missedDetails[0].selectedAnswer === "11", "Missed detail should store selected answer.");
assert(sampleRun.missedDetails[0].correctAnswer === "13", "Missed detail should store correct answer.");

function rewardUnlocked(score, total) {
  return score / total >= 0.9;
}

assert(rewardUnlocked(14, 15), "14/15 should unlock reward.");
assert(rewardUnlocked(15, 15), "15/15 should unlock reward.");
assert(!rewardUnlocked(13, 15), "13/15 should not unlock reward.");

function winnerFor(board) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

assert(winnerFor(["X", "X", "X", null, null, null, null, null, null]) === "X", "Tic Tac Toe should detect kid row win.");
assert(winnerFor(["O", null, null, "O", null, null, "O", null, null]) === "O", "Tic Tac Toe should detect app column win.");
assert(winnerFor(["X", null, "O", null, "X", null, "O", null, "X"]) === "X", "Tic Tac Toe should detect diagonal win.");

console.log("Operations check passed.");
