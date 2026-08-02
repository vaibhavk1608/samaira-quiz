import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const subjects = ["Math", "Reading", "Science", "Spelling"];
const countsBySubject = { Math: 125, Reading: 125, Science: 125, Spelling: 125 };
const grade = 2;

const sightWords = ["because", "before", "around", "friend", "always", "pretty", "school", "family", "together", "please", "small", "found"];
const spellingWords = [
  ["because", "a word that tells why"],
  ["before", "a word that means earlier than"],
  ["around", "a word that means on all sides"],
  ["friend", "someone you like and trust"],
  ["always", "a word that means every time"],
  ["pretty", "a word that means nice to look at"],
  ["school", "a place where students learn"],
  ["family", "people who care for each other at home"],
  ["together", "a word that means with each other"],
  ["please", "a polite word used when asking"],
  ["small", "a word that means little"],
  ["found", "a word that means discovered"],
  ["happy", "feeling glad"],
  ["table", "furniture used for eating or working"],
  ["little", "not big"],
  ["yellow", "the color of a lemon"],
  ["button", "something used to fasten a shirt"],
  ["summer", "a warm season"],
  ["rabbit", "an animal with long ears"],
  ["garden", "a place where flowers or vegetables grow"],
  ["number", "a symbol that shows how many"],
  ["pencil", "a tool used for writing"],
  ["window", "glass you can look through in a wall"],
  ["teacher", "a person who helps students learn"],
];

const science = [
  ["What does a seed grow into?", ["Plant", "Rock", "Cloud", "Spoon"], 0, "A seed can sprout.", "A seed can grow into a plant."],
  ["Which object is pulled by a magnet?", ["Paper clip", "Apple", "Crayon", "Leaf"], 0, "It is made of metal.", "A paper clip can be pulled by a magnet."],
  ["What is a baby frog called?", ["Tadpole", "Kitten", "Calf", "Chick"], 0, "It swims before it grows legs.", "A baby frog is called a tadpole."],
  ["Which weather has water falling from clouds?", ["Rain", "Sunny", "Windy", "Foggy"], 0, "You may use an umbrella.", "Rain is water falling from clouds."],
  ["What do lungs help you do?", ["Breathe", "Draw", "Jump", "Taste"], 0, "You use them when you inhale.", "Lungs help us breathe."],
  ["Which material is clear and used in windows?", ["Glass", "Wood", "Cloth", "Paper"], 0, "You can see through it.", "Glass is clear and used in windows."],
  ["What happens to ice when it gets warm?", ["It melts", "It sings", "It grows fur", "It turns into sand"], 0, "Warmth changes it to liquid water.", "Ice melts into water when it gets warm."],
  ["Which animal group has scales and lays eggs?", ["Fish", "Dogs", "Birds", "Horses"], 0, "Many of them swim.", "Fish have scales and lay eggs."],
  ["Which part of a plant takes in water?", ["Roots", "Petals", "Fruit", "Stem"], 0, "This part is usually in soil.", "Roots take in water from soil."],
  ["What do animals need to live?", ["Food and water", "Glue and paper", "Shoes and hats", "Books and crayons"], 0, "Think about basic needs.", "Animals need food, water, air, and shelter."],
  ["Which tool can measure how hot or cold something is?", ["Thermometer", "Ruler", "Clock", "Compass"], 0, "It uses degrees.", "A thermometer measures temperature."],
  ["What is a habitat?", ["A place where an animal lives", "A kind of snack", "A school supply", "A type of shoe"], 0, "Animals find food and shelter there.", "A habitat is a place where an animal lives."],
];

const reading = [
  {
    passage: "Lina planted three seeds. Each day she gave them water. Soon, tiny green leaves came up.",
    question: "What happened after Lina watered the seeds?",
    choices: ["Leaves came up", "The seeds disappeared", "It snowed inside", "She lost the pot"],
    answerIndex: 0,
    hint: "Look at the last sentence.",
    explanation: "Tiny green leaves came up after Lina cared for the seeds.",
  },
  {
    passage: "Omar forgot his lunch. His friend shared a sandwich. Omar smiled and said thank you.",
    question: "How did Omar's friend help?",
    choices: ["Shared a sandwich", "Took his pencil", "Closed the door", "Drew a map"],
    answerIndex: 0,
    hint: "A friend helped with lunch.",
    explanation: "Omar's friend shared a sandwich with him.",
  },
  {
    passage: "The class made a paper chain. Each child added one link. The chain got longer and longer.",
    question: "What is the main idea?",
    choices: ["The class made a chain together", "The class ate apples", "One child went home", "The paper was lost"],
    answerIndex: 0,
    hint: "Choose the answer that tells what the whole story is about.",
    explanation: "The passage is mostly about the class making a paper chain together.",
  },
  {
    passage: "Nia heard thunder. She put on her raincoat before she walked outside.",
    question: "Why did Nia put on a raincoat?",
    choices: ["She thought it might rain", "She wanted to swim", "She was going to bed", "She had a sunburn"],
    answerIndex: 0,
    hint: "Thunder can be a clue about weather.",
    explanation: "Nia heard thunder, so she thought it might rain.",
  },
  {
    passage: "Max practiced tying his shoes every morning. On Friday, he tied them without help.",
    question: "What lesson does the story teach?",
    choices: ["Practice helps you improve", "Shoes should stay untied", "Friday is always cold", "Morning is for sleeping"],
    answerIndex: 0,
    hint: "Think about what changed after practice.",
    explanation: "Max improved because he practiced.",
  },
];

const storyNames = ["Ava", "Leo", "Maya", "Noah", "Zoe", "Eli", "Ria", "Milo", "Tara", "Ben"];
const storyPlaces = ["park", "library", "garden", "classroom", "kitchen", "playground", "porch", "market", "zoo", "beach"];
const storyObjects = ["blue kite", "red book", "small shell", "yellow cup", "green leaf", "paper star", "soft scarf", "tiny seed", "silver key", "brown basket"];
const storyActions = ["found", "carried", "shared", "washed", "saved", "counted", "packed", "painted", "fixed", "sorted"];
const completeSentences = [
  ["The bright bird sang.", "Under the table.", "Ran very fast.", "Because it was."],
  ["My sister packed lunch.", "After the bell.", "Jumped over.", "With a red hat."],
  ["The puppy slept quietly.", "Near the door.", "Before school.", "And then."],
  ["We walked to the library.", "In the blue box.", "Because happy.", "Found three."],
  ["Dad watered the garden.", "Across the street.", "Very quickly.", "When the."],
  ["The class cleaned up.", "Beside my chair.", "After lunch.", "With crayons."],
  ["Samaira drew a rainbow.", "Under a cloud.", "Before the.", "Running fast."],
  ["The small boat floated.", "On the.", "Because it.", "With my friend."],
];
const vocabQuestions = [
  ["What does \"before\" mean?", "Earlier than", ["After", "Beside", "Very loud"], "Breakfast comes before lunch.", "\"Before\" means earlier than something else."],
  ["What does \"together\" mean?", "With each other", ["Alone", "Yesterday", "Very tiny"], "Friends can work together.", "\"Together\" means with each other."],
  ["What does \"because\" tell?", "A reason", ["A color", "A number", "A place"], "The word often explains why.", "\"Because\" tells a reason."],
  ["What does \"around\" mean?", "On all sides", ["Only above", "Never near", "Very late"], "A fence can go around a yard.", "\"Around\" can mean on all sides."],
  ["What does \"found\" mean?", "Discovered", ["Dropped", "Forgot", "Painted"], "If you found a coin, you discovered it.", "\"Found\" means discovered."],
  ["What does \"small\" mean?", "Little", ["Huge", "Loud", "Heavy"], "A small cup is little.", "\"Small\" means little."],
  ["What does \"please\" show?", "A polite request", ["A loud warning", "A color", "A season"], "We use please when asking kindly.", "\"Please\" is used for a polite request."],
  ["What does \"friend\" mean?", "Someone you like and trust", ["A kind of food", "A toy box", "A rainy day"], "A friend can play and help.", "A friend is someone you like and trust."],
];

function idFor(subject, number) {
  return `g2-${subject.toLowerCase()}-${String(number).padStart(3, "0")}`;
}

function rotateChoices(correct, distractors, seed) {
  const values = [];
  [correct, ...distractors].forEach((value) => {
    const text = String(value);
    if (!values.includes(text)) {
      values.push(text);
    }
  });
  if (typeof correct === "number") {
    let offset = 1;
    while (values.length < 4) {
      const candidate = String(Math.max(0, correct + offset));
      if (!values.includes(candidate)) {
        values.push(candidate);
      }
      offset += 1;
    }
  }
  while (values.length < 4) {
    const candidate = `Choice ${values.length + 1}`;
    if (!values.includes(candidate)) {
      values.push(candidate);
    }
  }
  values.length = 4;
  const shift = seed % values.length;
  const choices = [...values.slice(shift), ...values.slice(0, shift)];
  return { choices, answerIndex: choices.indexOf(String(correct)) };
}

function mathQuestion(n) {
  const mode = n % 7;
  if (mode === 0) {
    const a = 12 + (n % 28);
    const b = 5 + ((n * 3) % 18);
    const correct = a + b;
    return { skill: "two-digit-addition", question: `What is ${a} + ${b}?`, ...rotateChoices(correct, [correct - 2, correct + 1, correct + 4], n), hint: "Add the ones, then the tens.", explanation: `${a} + ${b} = ${correct}.` };
  }
  if (mode === 1) {
    const b = 4 + (n % 18);
    const correct = 10 + (n % 20);
    const a = correct + b;
    return { skill: "two-digit-subtraction", question: `What is ${a} - ${b}?`, ...rotateChoices(correct, [correct + 2, Math.max(0, correct - 2), correct + 5], n), hint: "Subtract carefully from the larger number.", explanation: `${a} - ${b} = ${correct}.` };
  }
  if (mode === 2) {
    const value = 24 + (n % 70);
    const correct = Math.floor(value / 10);
    return { skill: "place-value-tens", question: `How many tens are in ${value}?`, ...rotateChoices(correct, [correct + 1, value % 10, Math.max(0, correct - 1)], n), hint: "The first digit tells the tens.", explanation: `${value} has ${correct} tens.` };
  }
  if (mode === 3) {
    const value = 31 + (n % 68);
    const correct = value % 10;
    return { skill: "place-value-ones", question: `How many ones are in ${value}?`, ...rotateChoices(correct, [correct + 1, Math.max(0, correct - 1), Math.floor(value / 10)], n), hint: "The last digit tells the ones.", explanation: `${value} has ${correct} ones.` };
  }
  if (mode === 4) {
    const correct = 2 * (6 + (n % 12));
    return { skill: "skip-counting", question: `Skip count by 2. What comes after ${correct - 2}?`, ...rotateChoices(correct, [correct - 1, correct + 2, correct + 4], n), hint: "Add 2 each time.", explanation: `${correct - 2} is followed by ${correct}.` };
  }
  if (mode === 5) {
    const a = 7 + (n % 12);
    const b = 3 + (n % 9);
    const correct = a + b;
    return { skill: "addition-word-problems", question: `Samaira read ${a} pages in the morning and ${b} pages later. How many pages did she read?`, ...rotateChoices(correct, [correct - 1, correct + 2, correct + 4], n), hint: "The story asks how many in all.", explanation: `${a} + ${b} = ${correct} pages.` };
  }
  const b = 2 + (n % 8);
  const correct = 6 + (n % 14);
  const a = correct + b;
  return { skill: "subtraction-word-problems", question: `Samaira had ${a} crayons. She gave away ${b}. How many crayons are left?`, ...rotateChoices(correct, [correct + 1, Math.max(0, correct - 1), correct + 3], n), hint: "Giving away means subtract.", explanation: `${a} - ${b} = ${correct} crayons.` };
}

function readingQuestion(n) {
  const mode = n % 4;
  if (mode === 0) {
    if (n < reading.length * 4) {
      const item = reading[n % reading.length];
      return { skill: "reading-comprehension", question: `Read: "${item.passage}" ${item.question}`, choices: item.choices, answerIndex: item.answerIndex, hint: item.hint, explanation: item.explanation };
    }
    const name = storyNames[n % storyNames.length];
    const place = storyPlaces[Math.floor(n / 2) % storyPlaces.length];
    const object = storyObjects[Math.floor(n / 3) % storyObjects.length];
    const action = storyActions[Math.floor(n / 5) % storyActions.length];
    const passage = `${name} went to the ${place}. ${name} ${action} a ${object}. Then ${name} smiled.`;
    return {
      skill: "reading-comprehension",
      question: `Read: "${passage}" What did ${name} ${action}?`,
      choices: [object, "a lunch box", "a rainy cloud", "a toy truck"],
      answerIndex: 0,
      hint: `Look for what ${name} ${action}.`,
      explanation: `The story says ${name} ${action} a ${object}.`,
    };
  }
  if (mode === 1) {
    const word = sightWords[n % sightWords.length];
    const sentenceStarters = ["I read the word", "Point to the word", "Find the word", "Choose the word", "Tap the word"];
    return { skill: "sight-words", question: `${sentenceStarters[Math.floor(n / sightWords.length) % sentenceStarters.length]} "${word}".`, ...rotateChoices(word, [sightWords[(n + 1) % sightWords.length], sightWords[(n + 2) % sightWords.length], sightWords[(n + 3) % sightWords.length]], n), hint: "Look at each letter from left to right.", explanation: `The word is "${word}".` };
  }
  if (mode === 2) {
    const choices = completeSentences[Math.floor(n / 4) % completeSentences.length];
    return { skill: "sentence-meaning", question: `Which sentence is complete?`, choices, answerIndex: 0, hint: "A complete sentence tells a full idea.", explanation: `"${choices[0]}" is a complete sentence.` };
  }
  const [question, correct, distractors, hint, explanation] = vocabQuestions[Math.floor(n / 4) % vocabQuestions.length];
  return { skill: "reading-vocabulary", question, ...rotateChoices(correct, distractors, n), hint, explanation };
}

function scienceQuestion(n) {
  const [question, choices, answerIndex, hint, explanation] = science[n % science.length];
  const reviewWords = ["", "Review: ", "Think: ", "Try this: "];
  return { skill: "grade-2-science", question: `${reviewWords[Math.floor(n / science.length) % reviewWords.length]}${question}`, choices, answerIndex, hint, explanation };
}

function spellingQuestion(n) {
  const [word, clue] = spellingWords[n % spellingWords.length];
  const words = spellingWords.map(([item]) => item);
  const wrong = [`${word.slice(0, -1)}e`, word.replace(/[aeiou]/, ""), `${word}${word.at(-1)}`].filter((item, index, list) => item && item !== word && list.indexOf(item) === index);
  return { skill: "grade-2-spelling", question: `Which spelling is correct for ${clue}?`, ...rotateChoices(word, [...wrong, words[(n + 4) % words.length]], n), hint: `Listen for the sounds in the answer word.`, explanation: `"${word}" is spelled correctly.` };
}

function buildQuestion(subject, number) {
  const builders = { Math: mathQuestion, Reading: readingQuestion, Science: scienceQuestion, Spelling: spellingQuestion };
  return { id: idFor(subject, number), grade, subject, source: "starter", ...builders[subject](number) };
}

const questions = [];
for (const subject of subjects) {
  for (let number = 1; number <= countsBySubject[subject]; number += 1) {
    questions.push(buildQuestion(subject, number));
  }
}

const tsPath = resolve("src/data/questionBank.ts");
mkdirSync(dirname(tsPath), { recursive: true });
writeFileSync(tsPath, `import type { Question } from "../types";\n\nexport const starterQuestions: Question[] = ${JSON.stringify(questions, null, 2)};\n`);

rmSync(resolve("public/question-packs"), { recursive: true, force: true });

const jsonPath = resolve("public/question-packs/grade-2-pack.json");
mkdirSync(dirname(jsonPath), { recursive: true });
writeFileSync(jsonPath, JSON.stringify({ title: "Samaira Grade 2 Question Pack", grade, questions: questions.map(({ id: _id, ...question }) => question) }, null, 2));
writeFileSync(resolve("public/question-packs/samaira-grade-2-pack.json"), JSON.stringify({ title: "Samaira Grade 2 Question Pack", questions: questions.map(({ id: _id, ...question }) => question) }, null, 2));

console.log(`Generated ${questions.length} questions.`);
