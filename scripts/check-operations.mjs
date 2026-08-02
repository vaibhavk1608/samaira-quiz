import { readFileSync } from "node:fs";

const source = readFileSync("src/data/questionBank.ts", "utf8");
const json = source.match(/export const starterQuestions: Question\[] = ([\s\S]*);\n/)?.[1];

if (!json) {
  throw new Error("Could not read starter question bank.");
}

const questions = JSON.parse(json);
const subjects = ["Math", "Reading", "Science", "Spelling"];
const sessionSize = 15;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(questions.length === 500, `Expected 500 questions, found ${questions.length}.`);
assert(questions.filter((question) => question.grade === 2).length === 500, "Expected 500 Grade 2 questions.");
assert(!questions.some((question) => question.grade !== 2), "Only Grade 2 questions should remain.");
assert(!questions.some((question) => /\b(?:x|times|divided|multiply|multiplication|division|equal-groups)\b/i.test(`${question.question} ${question.skill ?? ""}`)), "Multiplication or division wording remains.");

for (const subject of subjects) {
  const pool = questions.filter((question) => question.subject === subject);
  assert(pool.length >= sessionSize, `${subject} needs at least ${sessionSize} questions.`);
  assert(pool.every((question) => question.grade === 2), `${subject} should only contain Grade 2 questions.`);
}

for (const [index, question] of questions.entries()) {
  assert(question.id, `Question ${index + 1} is missing id.`);
  assert(subjects.includes(question.subject), `${question.id} has invalid subject.`);
  assert(typeof question.question === "string" && question.question.length > 0, `${question.id} has no question text.`);
  assert(Array.isArray(question.choices) && question.choices.length === 4, `${question.id} needs four choices.`);
  assert(Number.isInteger(question.answerIndex) && question.answerIndex >= 0 && question.answerIndex <= 3, `${question.id} has invalid answerIndex.`);
  assert(question.choices[question.answerIndex], `${question.id} has no correct choice.`);
  assert(question.hint && question.explanation, `${question.id} needs hint and explanation.`);
}

const mixedPack = JSON.parse(readFileSync("public/question-packs/samaira-grade-2-pack.json", "utf8"));
assert(mixedPack.questions.length === 500, "Hosted mixed pack should contain 500 questions.");

const sampleRun = {
  id: "run-test",
  date: new Date().toISOString(),
  subject: "Math",
  score: 12,
  total: 15,
  starsEarned: 120,
  missedQuestionIds: ["sample"],
  missedSkills: ["addition-under-20"],
};

assert(sampleRun.score <= sampleRun.total, "Progress run score cannot exceed total.");
assert(sampleRun.starsEarned === sampleRun.score * 10, "Stars earned should match score x 10.");

console.log("Operations check passed.");
