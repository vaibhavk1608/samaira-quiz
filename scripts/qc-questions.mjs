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
const familyNames = ["Samaira", "Sahir", "Vaibhav", "Nitisha"];
const samairaProfile = {
  name: "Samaira",
  parentNames: ["Vaibhav", "Nitisha"],
  siblingNames: ["Sahir"],
  favorites: {
    colors: ["pink", "blue"],
    animals: ["rabbit"],
    activities: ["drawing", "reading"],
    places: ["park", "library"],
    foods: ["pancakes"],
    styles: ["family", "nature"],
    readingLevel: "normal",
  },
};

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
    .replace(/^At the .*?, (Samaira|Sahir|Vaibhav|Nitisha) observes nature\. /, "")
    .replace(/^(Samaira|Sahir|Vaibhav|Nitisha) and (Samaira|Sahir|Vaibhav|Nitisha) talk science\. /, "")
    .replace(/^During a Grade 2 experiment, (Samaira|Sahir|Vaibhav|Nitisha) thinks: /, "")
    .replace(/^(Samaira|Sahir|Vaibhav|Nitisha) checks a science notebook\. /, "")
    .replace(/\b\d+\b/g, "#")
    .toLowerCase();
}

function seeded(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 2 ** 32;
  };
}

function seededIndex(seed, length) {
  return Math.abs(seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)) % length;
}

function firstOrDefault(items, fallback) {
  return items.find(Boolean) ?? fallback;
}

function replaceFamilyNames(text, profile) {
  const replacements = new Map([
    ["Samaira", profile.name],
    ["Sahir", firstOrDefault(profile.siblingNames, "Sahir")],
    ["Vaibhav", firstOrDefault(profile.parentNames, "Vaibhav")],
    ["Nitisha", profile.parentNames[1] || firstOrDefault(profile.parentNames, "Nitisha")],
  ]);
  return text.replace(/\b(Samaira|Sahir|Vaibhav|Nitisha)\b/g, (match) => replacements.get(match) ?? match);
}

function favoriteFor(profile, key, fallback, seed) {
  const values = profile.favorites[key];
  if (!values.length) {
    return fallback;
  }
  return values[seededIndex(seed, values.length)];
}

function personalize(question, profile) {
  const favoriteActivity = favoriteFor(profile, "activities", "reading", question.id);
  const favoritePlace = favoriteFor(profile, "places", "park", question.id);
  const favoriteFood = favoriteFor(profile, "foods", "apples", question.id);
  let text = replaceFamilyNames(question.question, profile);

  if (question.subject === "Math" && question.skill?.includes("addition") && text.startsWith("What is")) {
    text = `${profile.name} is practicing math after ${favoriteActivity}. ${text}`;
  } else if (question.subject === "Science" && !text.includes(profile.name)) {
    const sibling = firstOrDefault(profile.siblingNames, "Sahir");
    const parent = firstOrDefault(profile.parentNames, "Vaibhav");
    const openers = [
      `${profile.name} notices something at the ${favoritePlace}. `,
      `${sibling} asks a science question. `,
      `${parent} helps with a science notebook. `,
      `${profile.name} observes carefully. `,
      `${profile.name} thinks like a scientist. `,
      `${sibling} and ${profile.name} explore science. `,
      `${profile.name} checks a tiny clue. `,
      `${parent} asks what ${profile.name} observes. `,
      `${sibling} points to an experiment. `,
      `${profile.name} looks for evidence. `,
      `${profile.name} makes a smart guess. `,
      `${sibling} shares a science fact. `,
    ];
    text = `${openers[seededIndex(question.id, openers.length)]}${text}`;
  } else if (question.subject === "Spelling" && !text.includes(profile.name)) {
    const sibling = firstOrDefault(profile.siblingNames, "Sahir");
    const parent = firstOrDefault(profile.parentNames, "Vaibhav");
    const openers = [
      `${profile.name} practices spelling. `,
      `${profile.name} reads a word card. `,
      `${sibling} says a word for ${profile.name}. `,
      `${parent} points to a spelling clue. `,
      `${profile.name} writes in a notebook. `,
      `${profile.name} checks each letter. `,
    ];
    text = `${openers[seededIndex(question.id, openers.length)]}${text}`;
  } else if (question.subject === "Reading" && question.skill === "reading-vocabulary" && !text.includes(profile.name)) {
    const sibling = firstOrDefault(profile.siblingNames, "Sahir");
    const parent = firstOrDefault(profile.parentNames, "Vaibhav");
    const openers = [
      `${profile.name} reads a vocabulary card. `,
      `${sibling} asks about a word. `,
      `${parent} points to a word near some ${favoriteFood}. `,
      `${profile.name} practices reading at the ${favoritePlace}. `,
      `${profile.name} looks closely at the word. `,
      `${sibling} and ${profile.name} read together. `,
    ];
    text = `${openers[seededIndex(question.id, openers.length)]}${text}`;
  }
  return text;
}

function verifyMath(question) {
  const nums = extractNumbers(question.question);
  const answer = correctChoice(question);
  const numericAnswer = Number(answer);
  if (question.question.startsWith("What is") && question.question.includes("+")) {
    assert(numericAnswer === nums[0] + nums[1], "Addition answer is wrong.", question);
    return;
  }
  if (question.question.startsWith("What is") && question.question.includes("-")) {
    assert(numericAnswer === nums[0] - nums[1], "Subtraction answer is wrong.", question);
    return;
  }
  if (question.question.includes("How many tens are in")) {
    assert(numericAnswer === Math.floor(nums[0] / 10), "Place-value tens answer is wrong.", question);
    return;
  }
  if (question.question.includes("How many ones are in")) {
    assert(numericAnswer === nums[0] % 10, "Place-value ones answer is wrong.", question);
    return;
  }
  if (question.question.includes("Skip count by")) {
    assert(numericAnswer === nums[1] + nums[0], "Skip-counting answer is wrong.", question);
    return;
  }
  if (question.question.includes("collect in all")) {
    assert(numericAnswer === nums[0] + nums[1], "Collection word-problem answer is wrong.", question);
    return;
  }
  if (question.question.includes("are left")) {
    assert(numericAnswer === nums[0] - nums[1], "Subtraction word-problem answer is wrong.", question);
    return;
  }
  if (question.question.includes("tens and") && question.question.includes("ones")) {
    assert(numericAnswer === nums[0] * 10 + nums[1], "Expanded-form answer is wrong.", question);
    return;
  }
  if (question.question.includes("Which symbol makes this true")) {
    const expected = nums[0] > nums[1] ? ">" : nums[0] < nums[1] ? "<" : "=";
    assert(answer === expected, "Compare-number answer is wrong.", question);
    return;
  }
  if (question.question.includes("got") && question.question.includes("more") && question.question.includes("used")) {
    assert(numericAnswer === nums[0] + nums[1] - nums[2], "Mixed add/subtract answer is wrong.", question);
    return;
  }
  fail("Unrecognized math pattern.", question);
}

function verifyReading(question) {
  if (question.skill === "reading-vocabulary") {
    assert(question.explanation.toLowerCase().includes(correctChoice(question).toLowerCase()), "Reading vocabulary explanation should support answer.", question);
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
  if (question.skill === "reading-comprehension" || question.skill === "cause-effect") {
    const answer = correctChoice(question).toLowerCase();
    assert(question.explanation.toLowerCase().includes(answer) || answer.split(" ").some((word) => word.length > 3 && question.explanation.toLowerCase().includes(word)), "Reading explanation does not support answer.", question);
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

function pickSession(pool, subject, seed) {
  const rng = seeded(seed);
  const shuffled = [...pool].sort(() => rng() - 0.5);
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

assert(questions.length === expectedTotal, `Expected ${expectedTotal} questions, found ${questions.length}.`);

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
  assert(pool.length === expectedPerSubject, `${subject} should have ${expectedPerSubject} questions.`);
  assert(new Set(pool.map((question) => question.question)).size === expectedPerSubject, `${subject} has repeated exact prompts.`);

  for (let run = 0; run < 300; run += 1) {
    const session = pickSession(pool, subject, run + 1);
    assert(session.length === sessionSize, `${subject} session could not reach 15 varied questions.`);
    assert(new Set(session.map((question) => question.question)).size === session.length, `${subject} session repeated a prompt.`);
    if (subject === "Science") {
      assert(new Set(session.map((question) => question.skill)).size === session.length, "Science session repeated a skill.");
    }
  }

  const openingCounts = new Map();
  pool.forEach((question) => {
    const text = personalize(question, samairaProfile);
    const opening = text.includes(".") ? text.split(".")[0] : text.split("?")[0];
    openingCounts.set(opening, (openingCounts.get(opening) ?? 0) + 1);
  });
  const mostRepeatedOpening = Math.max(...openingCounts.values());
  assert(mostRepeatedOpening <= 40, `${subject} repeats a displayed opening too often: ${mostRepeatedOpening}.`);
}

const personalized = questions.filter((question) => familyNames.some((name) => question.question.includes(name)));
assert(personalized.length >= 500, "Expected broad family-name personalization across question banks.");
assert(!questions.some((question) => question.question.includes("Samaira is writing after seeing a rabbit")), "Old repeated rabbit spelling prompt remains.");

console.log("Question QC passed.");
