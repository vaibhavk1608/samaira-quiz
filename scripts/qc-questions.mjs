import { readFileSync } from "node:fs";

const source = readFileSync("src/data/questionBank.ts", "utf8");
const json = source.match(/export const starterQuestions: Question\[] = ([\s\S]*);\n/)?.[1];
if (!json) {
  throw new Error("Could not read starter question bank.");
}

const questions = JSON.parse(json);
const subjects = ["Math", "Reading", "Science", "Spelling"];
const sessionSize = 15;

function fail(message, question) {
  const suffix = question ? `\n${question.id}: ${question.question}` : "";
  throw new Error(`${message}${suffix}`);
}

function assert(condition, message, question) {
  if (!condition) {
    fail(message, question);
  }
}

function correctChoice(question) {
  return question.choices[question.answerIndex];
}

function extractNumbers(text) {
  return Array.from(text.matchAll(/\d+/g), (match) => Number(match[0]));
}

function stripPrefix(text) {
  return text.replace(/^(Review: |Think: |Try this: )/, "");
}

function verifyMath(question) {
  const nums = extractNumbers(question.question);
  const answer = Number(correctChoice(question));
  if (question.question.startsWith("What is") && question.question.includes("+")) {
    assert(answer === nums[0] + nums[1], "Addition answer is wrong.", question);
    return;
  }
  if (question.question.startsWith("What is") && question.question.includes("-")) {
    assert(answer === nums[0] - nums[1], "Subtraction answer is wrong.", question);
    return;
  }
  if (question.question.includes("How many tens are in")) {
    assert(answer === Math.floor(nums[0] / 10), "Place-value tens answer is wrong.", question);
    return;
  }
  if (question.question.includes("How many ones are in")) {
    assert(answer === nums[0] % 10, "Place-value ones answer is wrong.", question);
    return;
  }
  if (question.question.includes("Skip count by 2")) {
    assert(answer === nums.at(-1) + 2, "Skip-counting answer is wrong.", question);
    return;
  }
  if (question.question.includes("pages")) {
    assert(answer === nums[0] + nums[1], "Page word-problem answer is wrong.", question);
    return;
  }
  if (question.question.includes("crayons")) {
    assert(answer === nums[0] - nums[1], "Crayon word-problem answer is wrong.", question);
    return;
  }
  fail("Unrecognized math pattern.", question);
}

const scienceAnswers = new Map([
  ["What does a seed grow into?", "Plant"],
  ["Which object is pulled by a magnet?", "Paper clip"],
  ["What is a baby frog called?", "Tadpole"],
  ["Which weather has water falling from clouds?", "Rain"],
  ["What do lungs help you do?", "Breathe"],
  ["Which material is clear and used in windows?", "Glass"],
  ["What happens to ice when it gets warm?", "It melts"],
  ["Which animal group has scales and lays eggs?", "Fish"],
  ["Which part of a plant takes in water?", "Roots"],
  ["What do animals need to live?", "Food and water"],
  ["Which tool can measure how hot or cold something is?", "Thermometer"],
  ["What is a habitat?", "A place where an animal lives"],
]);

function verifyScience(question) {
  const base = stripPrefix(question.question);
  assert(scienceAnswers.has(base), "Unrecognized science question.", question);
  assert(correctChoice(question) === scienceAnswers.get(base), "Science answer is wrong.", question);
}

const vocabAnswers = new Map([
  ['What does "before" mean?', "Earlier than"],
  ['What does "together" mean?', "With each other"],
  ['What does "because" tell?', "A reason"],
  ['What does "around" mean?', "On all sides"],
  ['What does "found" mean?', "Discovered"],
  ['What does "small" mean?', "Little"],
  ['What does "please" show?', "A polite request"],
  ['What does "friend" mean?', "Someone you like and trust"],
]);

function verifyReading(question) {
  if (question.skill === "reading-vocabulary") {
    assert(vocabAnswers.has(question.question), "Unrecognized reading vocabulary question.", question);
    assert(correctChoice(question) === vocabAnswers.get(question.question), "Reading vocabulary answer is wrong.", question);
    return;
  }
  if (question.skill === "sentence-meaning") {
    assert(correctChoice(question).endsWith("."), "Complete-sentence answer should be sentence-like.", question);
    assert(question.explanation.includes(correctChoice(question)), "Sentence explanation should cite correct answer.", question);
    return;
  }
  if (question.skill === "sight-words") {
    const quoted = question.question.match(/"([^"]+)"/)?.[1];
    assert(quoted && correctChoice(question) === quoted, "Sight-word answer is wrong.", question);
    return;
  }
  if (question.skill === "reading-comprehension") {
    assert(question.explanation.includes(correctChoice(question)) || correctChoice(question).split(" ").some((word) => question.explanation.includes(word)), "Reading explanation does not support answer.", question);
    return;
  }
  fail("Unrecognized reading skill.", question);
}

function verifySpelling(question) {
  const quoted = question.explanation.match(/"([^"]+)"/)?.[1];
  assert(quoted, "Spelling explanation should quote the correct word.", question);
  assert(correctChoice(question) === quoted, "Spelling answer is wrong.", question);
}

function pickSession(pool, recentIds = []) {
  const fresh = pool.filter((question) => !recentIds.includes(question.id));
  const usable = fresh.length >= sessionSize ? fresh : pool;
  const uniqueByPrompt = new Map();
  [...usable]
    .sort(() => Math.random() - 0.5)
    .forEach((question) => {
      const key = `${question.subject}:${question.question}`;
      if (!uniqueByPrompt.has(key)) {
        uniqueByPrompt.set(key, question);
      }
    });
  const unique = Array.from(uniqueByPrompt.values());
  const fallback = [...usable].sort(() => Math.random() - 0.5);
  return (unique.length >= sessionSize ? unique : [...unique, ...fallback]).slice(0, sessionSize);
}

assert(questions.length === 500, `Expected 500 questions, found ${questions.length}.`);

for (const question of questions) {
  assert(question.grade === 2, "Question is not Grade 2.", question);
  assert(subjects.includes(question.subject), "Invalid subject.", question);
  assert(!/\b(?:x|times|divided|multiply|multiplication|division|equal-groups)\b/i.test(`${question.question} ${question.skill ?? ""}`), "Multiplication/division wording remains.", question);
  assert(question.choices.length === 4, "Question must have four choices.", question);
  assert(new Set(question.choices).size === 4, "Answer choices must be unique.", question);
  assert(Number.isInteger(question.answerIndex) && question.answerIndex >= 0 && question.answerIndex <= 3, "Invalid answer index.", question);
  assert(question.hint && question.explanation, "Question needs hint and explanation.", question);

  if (question.subject === "Math") {
    verifyMath(question);
  } else if (question.subject === "Reading") {
    verifyReading(question);
  } else if (question.subject === "Science") {
    verifyScience(question);
  } else if (question.subject === "Spelling") {
    verifySpelling(question);
  }
}

for (const subject of subjects) {
  const pool = questions.filter((question) => question.subject === subject);
  const uniquePrompts = new Set(pool.map((question) => question.question));
  assert(pool.length === 125, `${subject} should have 125 questions.`);
  assert(uniquePrompts.size >= sessionSize, `${subject} needs enough unique prompts for a session.`);

  for (let run = 0; run < 250; run += 1) {
    const session = pickSession(pool);
    const promptKeys = session.map((question) => question.question);
    assert(new Set(promptKeys).size === session.length, `${subject} session repeated a prompt.`);
  }
}

console.log("Question QC passed.");
