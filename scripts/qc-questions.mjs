import { readFileSync } from "node:fs";

const source = readFileSync("src/data/questionBank.ts", "utf8");
const json = source.match(/export const starterQuestions: Question\[] = ([\s\S]*);\n/)?.[1];
if (!json) {
  throw new Error("Could not read starter question bank.");
}

const questions = JSON.parse(json);
const subjects = ["Math", "Reading", "Science", "Spelling"];
const sessionSize = 15;
const familyNames = ["Samaira", "Sahir", "Vaibhav", "Nitisha"];

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

function normalizePattern(question) {
  return question.question
    .replace(/^Read: ".*?" /, "read-passage ")
    .replace(/^(Samaira|Sahir|Vaibhav|Nitisha) is learning science\. /, "")
    .replace(/^(Samaira|Sahir|Vaibhav|Nitisha) asks: /, "")
    .replace(/^At home, (Samaira|Sahir|Vaibhav|Nitisha) wonders: /, "")
    .replace(/\b\d+\b/g, "#")
    .toLowerCase();
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

function verifyScience(question) {
  const answer = correctChoice(question);
  const explanation = question.explanation.toLowerCase();
  assert(question.skill && question.skill !== "grade-2-science", "Science question needs a specific skill.", question);
  assert(
    explanation.includes(answer.toLowerCase()) || answer.toLowerCase().split(" ").some((word) => word.length > 3 && explanation.includes(word)),
    "Science explanation does not support the answer.",
    question,
  );
}

function verifySpelling(question) {
  const quoted = question.explanation.match(/"([^"]+)"/)?.[1];
  assert(quoted, "Spelling explanation should quote the correct word.", question);
  assert(correctChoice(question) === quoted, "Spelling answer is wrong.", question);
}

function pickSession(pool, subject) {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const uniqueByPrompt = new Map();
  shuffled.forEach((question) => {
    const key = `${question.subject}:${question.question}`;
    if (!uniqueByPrompt.has(key)) {
      uniqueByPrompt.set(key, question);
    }
  });

  const maxSkillCount = subject === "Science" ? 1 : subject === "Reading" ? 5 : subject === "Spelling" ? 4 : 3;
  const selected = [];
  const skillCounts = new Map();
  const patternCounts = new Map();
  Array.from(uniqueByPrompt.values()).forEach((question) => {
    const skill = question.skill ?? question.subject;
    const pattern = normalizePattern(question);
    const skillCount = skillCounts.get(skill) ?? 0;
    const patternCount = patternCounts.get(pattern) ?? 0;
    if (selected.length < sessionSize && skillCount < maxSkillCount && patternCount < 1) {
      selected.push(question);
      skillCounts.set(skill, skillCount + 1);
      patternCounts.set(pattern, patternCount + 1);
    }
  });
  const selectedIds = new Set(selected.map((question) => question.id));
  const fill = [...Array.from(uniqueByPrompt.values()), ...shuffled].filter((question) => !selectedIds.has(question.id));
  return (selected.length >= sessionSize ? selected : [...selected, ...fill]).slice(0, sessionSize);
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
  const uniquePatterns = new Set(pool.map(normalizePattern));
  assert(pool.length === 125, `${subject} should have 125 questions.`);
  assert(uniquePrompts.size >= sessionSize, `${subject} needs enough unique prompts for a session.`);
  if (subject === "Science") {
    assert(uniquePatterns.size >= sessionSize, `${subject} needs enough unique patterns for a session.`);
  }

  for (let run = 0; run < 300; run += 1) {
    const session = pickSession(pool, subject);
    assert(session.length === sessionSize, `${subject} session could not reach 15 varied questions.`);
    assert(new Set(session.map((question) => question.question)).size === session.length, `${subject} session repeated a prompt.`);
    if (subject === "Science") {
      assert(new Set(session.map(normalizePattern)).size === session.length, `${subject} session repeated a pattern.`);
      assert(new Set(session.map((question) => question.skill)).size === session.length, "Science session repeated a skill.");
    }
  }
}

const personalized = questions.filter((question) => familyNames.some((name) => question.question.includes(name)));
assert(personalized.length >= 120, "Expected broad family-name personalization across question banks.");

console.log("Question QC passed.");
