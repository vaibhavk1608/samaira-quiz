import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const subjects = ["Math", "Reading", "Science", "Spelling"];
const countsBySubject = { Math: 400, Reading: 400, Science: 400, Spelling: 400 };
const grade = 2;
const familyNames = ["Samaira", "Sahir", "Vaibhav", "Nitisha"];

const sightWords = [
  "because",
  "before",
  "around",
  "friend",
  "always",
  "pretty",
  "school",
  "family",
  "together",
  "please",
  "small",
  "found",
  "happy",
  "again",
  "every",
  "after",
  "under",
  "would",
  "could",
  "their",
  "where",
  "there",
  "right",
  "write",
  "green",
  "house",
  "laugh",
  "light",
  "carry",
  "clean",
  "start",
  "bring",
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
  ["What does \"careful\" mean?", "Doing something with attention", ["Running away", "Very sleepy", "Full of rain"], "You are careful when you look closely.", "\"Careful\" means doing something with attention."],
  ["What does \"brave\" mean?", "Not giving up when something is hard", ["Very cold", "Made of paper", "Under a chair"], "A brave person tries even when nervous.", "\"Brave\" means not giving up when something is hard."],
  ["What does \"gentle\" mean?", "Soft and kind", ["Very rough", "Super loud", "Always late"], "A gentle touch is soft.", "\"Gentle\" means soft and kind."],
  ["What does \"tiny\" mean?", "Very small", ["Very tall", "Very noisy", "Very fast"], "A seed can be tiny.", "\"Tiny\" means very small."],
  ["What does \"quick\" mean?", "Fast", ["Slow", "Round", "Sweet"], "A quick runner moves fast.", "\"Quick\" means fast."],
  ["What does \"quiet\" mean?", "Not loud", ["Very bright", "Very hungry", "Full of mud"], "A library is often quiet.", "\"Quiet\" means not loud."],
  ["What does \"repair\" mean?", "Fix", ["Break", "Hide", "Paint blue"], "You repair a toy when you fix it.", "\"Repair\" means fix."],
  ["What does \"share\" mean?", "Let someone use part of something", ["Keep it all", "Throw it away", "Forget it"], "You share when you let someone have a turn.", "\"Share\" means let someone use part of something."],
];

const readingPassageParts = {
  names: ["Samaira", "Sahir", "Vaibhav", "Nitisha", "Ava", "Leo", "Maya", "Noah", "Zoe", "Eli", "Mina", "Owen", "Riya", "Ivy", "Nina", "Arjun"],
  places: ["park", "library", "garden", "classroom", "kitchen", "playground", "porch", "market", "zoo", "beach", "museum", "yard", "bus stop", "art room", "music room", "science table"],
  objects: ["blue kite", "red book", "small shell", "yellow cup", "green leaf", "paper star", "soft scarf", "tiny seed", "silver key", "brown basket", "rainy boot", "striped bag", "smooth stone", "white card", "orange hat", "wooden block"],
  actions: ["found", "carried", "shared", "washed", "saved", "counted", "packed", "painted", "fixed", "sorted", "opened", "closed", "drew", "folded", "picked", "moved"],
  feelings: ["proud", "happy", "calm", "excited", "thankful", "curious", "brave", "kind"],
};

const actionBaseForms = new Map([
  ["found", "find"],
  ["carried", "carry"],
  ["shared", "share"],
  ["washed", "wash"],
  ["saved", "save"],
  ["counted", "count"],
  ["packed", "pack"],
  ["painted", "paint"],
  ["fixed", "fix"],
  ["sorted", "sort"],
  ["opened", "open"],
  ["closed", "close"],
  ["drew", "draw"],
  ["folded", "fold"],
  ["picked", "pick"],
  ["moved", "move"],
]);

const sentenceTopics = [
  ["bird", "The bright bird sang."],
  ["lunch", "Nitisha packed lunch."],
  ["puppy", "The puppy slept quietly."],
  ["library", "We walked to the library."],
  ["garden", "Vaibhav watered the garden."],
  ["class", "The class cleaned up."],
  ["rainbow", "Samaira drew a rainbow."],
  ["helper", "Sahir helped clean up."],
  ["moon", "The moon looked bright."],
  ["teacher", "The teacher read a story."],
  ["soccer", "Maya kicked the ball."],
  ["music", "Leo played a drum."],
  ["snack", "Ava washed the apple."],
  ["paint", "Noah mixed blue paint."],
  ["wagon", "The red wagon rolled."],
  ["seed", "The tiny seed sprouted."],
  ["clock", "The clock ticked softly."],
  ["window", "The window was open."],
  ["bridge", "We crossed the bridge."],
  ["notebook", "Riya wrote a note."],
];

const spellingWords = [
  ["because", "a word that tells why", "vowel-team"],
  ["before", "a word that means earlier than", "r-controlled"],
  ["around", "a word that means on all sides", "vowel-team"],
  ["friend", "someone you like and trust", "vowel-team"],
  ["always", "a word that means every time", "vowel-team"],
  ["pretty", "a word that means nice to look at", "double-letter"],
  ["school", "a place where students learn", "consonant-team"],
  ["family", "people who care for each other at home", "ending-y"],
  ["together", "a word that means with each other", "compound-ish"],
  ["please", "a polite word used when asking", "silent-e"],
  ["small", "a word that means little", "double-letter"],
  ["found", "a word that means discovered", "vowel-team"],
  ["happy", "feeling glad", "double-letter"],
  ["table", "furniture used for eating or working", "silent-e"],
  ["little", "not big", "double-letter"],
  ["yellow", "the color of a lemon", "ending-y"],
  ["button", "something used to fasten a shirt", "double-letter"],
  ["summer", "a warm season", "double-letter"],
  ["rabbit", "an animal with long ears", "double-letter"],
  ["garden", "a place where flowers or vegetables grow", "r-controlled"],
  ["number", "a symbol that shows how many", "r-controlled"],
  ["pencil", "a tool used for writing", "soft-c"],
  ["window", "glass you can look through in a wall", "ending-w"],
  ["teacher", "a person who helps students learn", "vowel-team"],
  ["mother", "a female parent", "digraph-th"],
  ["father", "a male parent", "digraph-th"],
  ["sister", "a girl sibling", "r-controlled"],
  ["brother", "a boy sibling", "digraph-th"],
  ["orange", "a fruit and a color", "soft-g"],
  ["purple", "a mix of red and blue", "r-controlled"],
  ["circle", "a round shape", "soft-c"],
  ["square", "a shape with four equal sides", "vowel-team"],
  ["winter", "a cold season", "r-controlled"],
  ["spring", "a season when plants grow", "blend"],
  ["flower", "a colorful plant part", "vowel-team"],
  ["basket", "something used to carry things", "closed-syllable"],
  ["kitten", "a baby cat", "double-letter"],
  ["puppy", "a baby dog", "double-letter"],
  ["dinner", "an evening meal", "double-letter"],
  ["breakfast", "a morning meal", "compound"],
  ["blanket", "something warm for a bed", "closed-syllable"],
  ["pocket", "a small place in clothing", "closed-syllable"],
  ["rocket", "something that can fly into space", "closed-syllable"],
  ["planet", "a large object that moves around a star", "closed-syllable"],
  ["magnet", "something that pulls some metals", "closed-syllable"],
  ["market", "a place to buy food", "r-controlled"],
  ["letter", "a written message or alphabet mark", "double-letter"],
  ["better", "more good", "double-letter"],
  ["water", "a liquid people drink", "r-controlled"],
  ["under", "below something", "r-controlled"],
  ["after", "later than", "r-controlled"],
  ["carry", "to hold and move something", "double-letter"],
  ["story", "something you read or tell", "ending-y"],
  ["money", "coins or bills used to buy things", "ending-y"],
  ["honey", "sweet food made by bees", "ending-y"],
  ["cookie", "a sweet baked snack", "vowel-team"],
  ["bottle", "a container for liquid", "double-letter"],
  ["middle", "the center", "double-letter"],
  ["giggle", "a small laugh", "double-letter"],
  ["puddle", "a small pool of water", "double-letter"],
  ["candle", "wax with a wick", "consonant-le"],
  ["handle", "the part you hold", "consonant-le"],
  ["simple", "easy to understand", "consonant-le"],
  ["people", "more than one person", "consonant-le"],
  ["clean", "not dirty", "vowel-team"],
  ["green", "the color of grass", "vowel-team"],
  ["sleep", "rest with eyes closed", "vowel-team"],
  ["sheep", "an animal with wool", "vowel-team"],
  ["beach", "sand near water", "vowel-team"],
  ["reach", "to stretch toward something", "vowel-team"],
  ["train", "cars pulled on a track", "vowel-team"],
  ["paint", "color put on paper or walls", "vowel-team"],
  ["chair", "something people sit on", "vowel-team"],
  ["stair", "one step in a staircase", "vowel-team"],
  ["light", "something that helps us see", "consonant-team"],
  ["night", "the dark time after day", "consonant-team"],
  ["right", "correct", "consonant-team"],
  ["write", "to make words with a pencil", "silent-w"],
  ["clock", "something that shows time", "blend"],
  ["black", "a dark color", "blend"],
  ["truck", "a vehicle for carrying things", "blend"],
  ["dress", "clothing", "double-letter"],
  ["grass", "green plants on the ground", "double-letter"],
  ["cross", "to go from one side to another", "double-letter"],
  ["smile", "a happy face", "silent-e"],
  ["brave", "not giving up when something is hard", "silent-e"],
  ["stone", "a small rock", "silent-e"],
  ["slide", "playground equipment", "silent-e"],
  ["globe", "a round map of Earth", "silent-e"],
  ["shine", "to give light", "silent-e"],
  ["lunch", "a midday meal", "digraph-ch"],
  ["bench", "a long seat", "digraph-ch"],
  ["shell", "a hard covering", "digraph-sh"],
  ["brush", "a tool with bristles", "digraph-sh"],
  ["three", "the number after two", "digraph-th"],
  ["thank", "to show you are grateful", "digraph-th"],
  ["whale", "a very large ocean animal", "digraph-wh"],
  ["wheel", "a round part that rolls", "digraph-wh"],
  ["phone", "something used to call people", "digraph-ph"],
  ["photo", "a picture", "digraph-ph"],
];

const scienceFacts = [
  { skill: "plants", question: "What does a seed grow into?", correct: "Plant", distractors: ["Rock", "Cloud", "Spoon"], hint: "A seed can sprout.", explanation: "A seed can grow into a plant." },
  { skill: "magnets", question: "Which object is pulled by a magnet?", correct: "Paper clip", distractors: ["Apple", "Crayon", "Leaf"], hint: "It is made of metal.", explanation: "A paper clip can be pulled by a magnet." },
  { skill: "animal-life-cycles", question: "What is a baby frog called?", correct: "Tadpole", distractors: ["Kitten", "Calf", "Chick"], hint: "It swims before it grows legs.", explanation: "A baby frog is called a tadpole." },
  { skill: "weather", question: "Which weather has water falling from clouds?", correct: "Rain", distractors: ["Sunny", "Windy", "Foggy"], hint: "You may use an umbrella.", explanation: "Rain is water falling from clouds." },
  { skill: "body-systems", question: "What do lungs help you do?", correct: "Breathe", distractors: ["Draw", "Jump", "Taste"], hint: "You use them when you inhale.", explanation: "Lungs help us breathe." },
  { skill: "materials", question: "Which material is clear and used in windows?", correct: "Glass", distractors: ["Wood", "Cloth", "Paper"], hint: "You can see through it.", explanation: "Glass is clear and used in windows." },
  { skill: "matter", question: "What happens to ice when it gets warm?", correct: "It melts", distractors: ["It sings", "It grows fur", "It turns into sand"], hint: "Warmth changes it to liquid water.", explanation: "Ice melts into water when it gets warm." },
  { skill: "animal-groups", question: "Which animal group has scales and lays eggs?", correct: "Fish", distractors: ["Dogs", "Birds", "Horses"], hint: "Many of them swim.", explanation: "Fish have scales and lay eggs." },
  { skill: "plant-parts", question: "Which part of a plant takes in water?", correct: "Roots", distractors: ["Petals", "Fruit", "Stem"], hint: "This part is usually in soil.", explanation: "Roots take in water from soil." },
  { skill: "animal-needs", question: "What do animals need to live?", correct: "Food and water", distractors: ["Glue and paper", "Shoes and hats", "Books and crayons"], hint: "Think about basic needs.", explanation: "Animals need food and water to live." },
  { skill: "tools", question: "Which tool can measure how hot or cold something is?", correct: "Thermometer", distractors: ["Ruler", "Clock", "Compass"], hint: "It uses degrees.", explanation: "A thermometer measures temperature." },
  { skill: "habitats", question: "What is a habitat?", correct: "A place where an animal lives", distractors: ["A kind of snack", "A school supply", "A type of shoe"], hint: "Animals find food and shelter there.", explanation: "A habitat is a place where an animal lives." },
  { skill: "senses", question: "Which sense helps Samaira hear music?", correct: "Hearing", distractors: ["Taste", "Smell", "Touch"], hint: "Use your ears.", explanation: "Hearing is the sense that helps us hear music." },
  { skill: "earth", question: "What gives Earth light during the day?", correct: "The Sun", distractors: ["A pencil", "A fish", "A backpack"], hint: "It is bright in the sky.", explanation: "The Sun gives Earth light during the day." },
  { skill: "sound", question: "What makes sound when it vibrates?", correct: "A guitar string", distractors: ["A quiet sock", "A still rock", "A closed book"], hint: "Vibrate means move back and forth quickly.", explanation: "A guitar string can vibrate and make sound." },
  { skill: "water-cycle", question: "What can clouds bring to the ground?", correct: "Rain", distractors: ["Chairs", "Pencils", "Shoes"], hint: "It is water from the sky.", explanation: "Clouds can bring rain to the ground." },
  { skill: "light", question: "Which object makes its own light?", correct: "Flashlight", distractors: ["Blanket", "Pillow", "Rock"], hint: "It can shine in the dark.", explanation: "A flashlight makes light." },
  { skill: "shadows", question: "What do you need to make a shadow?", correct: "Light and something blocking it", distractors: ["Milk and cereal", "Soap and a towel", "A pencil and glue"], hint: "A shadow happens when light is blocked.", explanation: "A shadow forms when something blocks light." },
  { skill: "push-pull", question: "Which action is a push?", correct: "Pressing a door closed", distractors: ["Pulling a wagon", "Smelling a flower", "Reading a sign"], hint: "A push moves something away.", explanation: "Pressing a door closed is a push." },
  { skill: "motion", question: "What can make a ball start moving?", correct: "A kick", distractors: ["A quiet sound", "A color", "A nap"], hint: "A force can start motion.", explanation: "A kick can make a ball move." },
  { skill: "gravity", question: "What pulls things down toward Earth?", correct: "Gravity", distractors: ["Music", "Paint", "Glue"], hint: "It helps things fall.", explanation: "Gravity pulls things down toward Earth." },
  { skill: "seasons", question: "Which season is often cold?", correct: "Winter", distractors: ["Summer", "Spring", "Lunch"], hint: "Snow can happen in this season.", explanation: "Winter is often cold." },
  { skill: "day-night", question: "When do we usually see the Moon best?", correct: "At night", distractors: ["Inside a drawer", "Under lunch", "During a nap only"], hint: "The sky is dark then.", explanation: "We usually see the Moon best at night." },
  { skill: "rocks", question: "Which item is a rock?", correct: "Pebble", distractors: ["Sock", "Juice", "Cloud"], hint: "A small rock has a special name.", explanation: "A pebble is a small rock." },
  { skill: "soil", question: "What can help plants grow?", correct: "Soil", distractors: ["Plastic wrap", "A shoe", "A fork"], hint: "Roots can grow in it.", explanation: "Soil can help plants grow." },
  { skill: "insects", question: "How many legs does an insect have?", correct: "Six", distractors: ["Two", "Four", "Ten"], hint: "Count three pairs.", explanation: "An insect has six legs." },
  { skill: "birds", question: "What helps most birds fly?", correct: "Wings", distractors: ["Wheels", "Fins", "Shoes"], hint: "Birds flap them.", explanation: "Wings help most birds fly." },
  { skill: "fish", question: "What helps fish breathe in water?", correct: "Gills", distractors: ["Feathers", "Leaves", "Hands"], hint: "Fish use these instead of lungs underwater.", explanation: "Gills help fish breathe in water." },
  { skill: "mammals", question: "Which animal is a mammal?", correct: "Dog", distractors: ["Goldfish", "Frog", "Butterfly"], hint: "Many mammals have fur.", explanation: "A dog is a mammal." },
  { skill: "reptiles", question: "Which animal is a reptile?", correct: "Lizard", distractors: ["Robin", "Cow", "Bee"], hint: "Many reptiles have scales.", explanation: "A lizard is a reptile." },
  { skill: "amphibians", question: "Which animal can live part of life in water and part on land?", correct: "Frog", distractors: ["Cat", "Eagle", "Horse"], hint: "It starts as a tadpole.", explanation: "A frog is an amphibian." },
  { skill: "healthy-food", question: "Which food helps your body grow strong?", correct: "Vegetables", distractors: ["Only candy", "Paper", "Clay"], hint: "Think of healthy food.", explanation: "Vegetables can help your body grow strong." },
  { skill: "hygiene", question: "What should you use to wash your hands?", correct: "Soap and water", distractors: ["Sand and crayons", "Paint and glue", "Leaves and coins"], hint: "It helps remove germs.", explanation: "Soap and water help clean hands." },
  { skill: "teeth", question: "What helps keep teeth clean?", correct: "Brushing", distractors: ["Jumping", "Whispering", "Painting"], hint: "Use a toothbrush.", explanation: "Brushing helps keep teeth clean." },
  { skill: "heart", question: "What does your heart help move through your body?", correct: "Blood", distractors: ["Pencils", "Shoes", "Clouds"], hint: "It pumps inside your body.", explanation: "Your heart helps move blood." },
  { skill: "skeleton", question: "What helps support your body?", correct: "Bones", distractors: ["Leaves", "Rainbows", "Sand"], hint: "Your skeleton is made of them.", explanation: "Bones help support your body." },
  { skill: "temperature", question: "What means something is very warm?", correct: "Hot", distractors: ["Cold", "Tiny", "Dark"], hint: "Soup can feel this way.", explanation: "Hot means very warm." },
  { skill: "states-liquid", question: "Which one is a liquid?", correct: "Water", distractors: ["Rock", "Chair", "Pencil"], hint: "It can pour.", explanation: "Water is a liquid." },
  { skill: "states-solid", question: "Which one is a solid?", correct: "Block", distractors: ["Air", "Rain", "Steam"], hint: "It keeps its shape.", explanation: "A block is a solid." },
  { skill: "states-gas", question: "Which one is a gas?", correct: "Air", distractors: ["Book", "Apple", "Cup"], hint: "You breathe it.", explanation: "Air is a gas." },
  { skill: "observe", question: "Which tool helps you see tiny things better?", correct: "Magnifying glass", distractors: ["Lunch box", "Spoon", "Sock"], hint: "It makes things look larger.", explanation: "A magnifying glass helps you see tiny things." },
  { skill: "measure-length", question: "Which tool measures length?", correct: "Ruler", distractors: ["Thermometer", "Cup", "Bell"], hint: "It can show inches or centimeters.", explanation: "A ruler measures length." },
  { skill: "measure-time", question: "Which tool tells time?", correct: "Clock", distractors: ["Magnet", "Leaf", "Rock"], hint: "It has numbers or hands.", explanation: "A clock tells time." },
  { skill: "recycling", question: "Which item can often be recycled?", correct: "Paper", distractors: ["Dirty tissue", "Banana peel", "Mud"], hint: "Many classrooms recycle this.", explanation: "Paper can often be recycled." },
  { skill: "natural-resources", question: "Which natural resource comes from trees?", correct: "Wood", distractors: ["Plastic toy", "Metal spoon", "Glass cup"], hint: "Trees can be used to make it.", explanation: "Wood comes from trees." },
  { skill: "water-safety", question: "What should you wear on a boat for safety?", correct: "Life jacket", distractors: ["Party hat", "Heavy boots", "Backpack"], hint: "It helps you float.", explanation: "A life jacket helps keep you safe on a boat." },
  { skill: "sun-safety", question: "What helps protect skin from strong sunlight?", correct: "Sunscreen", distractors: ["Glue", "Chalk", "Juice"], hint: "People rub it on skin.", explanation: "Sunscreen helps protect skin from sunlight." },
  { skill: "animal-coverings", question: "What covers a bird's body?", correct: "Feathers", distractors: ["Scales", "Bark", "Glass"], hint: "Birds have these.", explanation: "Feathers cover a bird's body." },
  { skill: "plant-needs", question: "What do plants need from the Sun?", correct: "Light", distractors: ["Shoes", "Music", "Pencils"], hint: "It helps plants make food.", explanation: "Plants need light from the Sun." },
  { skill: "living-nonliving", question: "Which one is living?", correct: "Tree", distractors: ["Rock", "Chair", "Pencil"], hint: "It grows.", explanation: "A tree is living." },
];

function idFor(subject, number) {
  return `g2-${subject.toLowerCase()}-${String(number).padStart(3, "0")}`;
}

function rotateChoices(correct, distractors, seed) {
  const values = [];
  [correct, ...distractors].forEach((value) => {
    const text = String(value);
    if (text && !values.includes(text)) {
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
  let fillerIndex = 0;
  while (values.length < 4) {
    const candidate = spellingWords[(seed + fillerIndex) % spellingWords.length][0];
    if (!values.includes(candidate)) {
      values.push(candidate);
    }
    fillerIndex += 1;
  }
  values.length = 4;
  const shift = seed % values.length;
  const choices = [...values.slice(shift), ...values.slice(0, shift)];
  return { choices, answerIndex: choices.indexOf(String(correct)) };
}

function mathQuestion(n) {
  const mode = n % 10;
  const round = Math.floor(n / 10);
  const name = familyNames[n % familyNames.length];
  const helper = familyNames[(n + 1) % familyNames.length];
  const place = readingPassageParts.places[n % readingPassageParts.places.length];
  const object = ["stickers", "shells", "cards", "blocks", "beads", "crayons", "buttons", "coins"][n % 8];

  if (mode === 0) {
    const a = 12 + round;
    const b = 5 + ((round * 7) % 35);
    const correct = a + b;
    return { skill: "two-digit-addition", question: `What is ${a} + ${b}?`, ...rotateChoices(correct, [correct - 2, correct + 1, correct + 4], n), hint: "Add the ones, then the tens.", explanation: `${a} + ${b} = ${correct}.` };
  }
  if (mode === 1) {
    const b = 4 + ((round * 5) % 28);
    const correct = 10 + round;
    const a = correct + b;
    return { skill: "two-digit-subtraction", question: `What is ${a} - ${b}?`, ...rotateChoices(correct, [correct + 2, Math.max(0, correct - 2), correct + 5], n), hint: "Subtract carefully from the larger number.", explanation: `${a} - ${b} = ${correct}.` };
  }
  if (mode === 2) {
    const value = 20 + ((round * 7) % 80);
    const correct = Math.floor(value / 10);
    return { skill: "place-value-tens", question: `How many tens are in ${value}?`, ...rotateChoices(correct, [correct + 1, value % 10, Math.max(0, correct - 1)], n), hint: "The first digit tells the tens.", explanation: `${value} has ${correct} tens.` };
  }
  if (mode === 3) {
    const value = 21 + ((round * 9) % 79);
    const correct = value % 10;
    return { skill: "place-value-ones", question: `How many ones are in ${value}?`, ...rotateChoices(correct, [correct + 1, Math.max(0, correct - 1), Math.floor(value / 10)], n), hint: "The last digit tells the ones.", explanation: `${value} has ${correct} ones.` };
  }
  if (mode === 4) {
    const step = [2, 5, 10][round % 3];
    const start = step * (2 + round);
    const correct = start + step;
    return { skill: `skip-counting-${step}`, question: `Skip count by ${step}. What comes after ${start}?`, ...rotateChoices(correct, [correct - 1, correct + step, correct + step + 1], n), hint: `Add ${step} each time.`, explanation: `${start} is followed by ${correct} when skip counting by ${step}.` };
  }
  if (mode === 5) {
    const a = 7 + round;
    const b = 3 + ((round * 2) % 22);
    const correct = a + b;
    return { skill: "addition-word-problems", question: `${name} collected ${a} ${object} and ${helper} collected ${b} ${object} at the ${place}. How many ${object} did they collect in all?`, ...rotateChoices(correct, [correct - 1, correct + 2, correct + 4], n), hint: "The story asks how many in all.", explanation: `${a} + ${b} = ${correct} ${object}.` };
  }
  if (mode === 6) {
    const b = 2 + ((round * 3) % 18);
    const correct = 6 + round;
    const a = correct + b;
    return { skill: "subtraction-word-problems", question: `${name} had ${a} ${object}. ${name} gave ${b} ${object} to ${helper}. How many ${object} are left?`, ...rotateChoices(correct, [correct + 1, Math.max(0, correct - 1), correct + 3], n), hint: "Giving away means subtract.", explanation: `${a} - ${b} = ${correct} ${object}.` };
  }
  if (mode === 7) {
    const tens = 2 + (round % 7);
    const ones = (round * 3) % 10;
    const correct = tens * 10 + ones;
    return { skill: "expanded-form", question: `What number is ${tens} tens and ${ones} ones?`, ...rotateChoices(correct, [correct + 1, Math.max(0, correct - 1), tens + ones], n), hint: "Tens are groups of 10.", explanation: `${tens} tens and ${ones} ones make ${correct}.` };
  }
  if (mode === 8) {
    const a = 20 + ((round * 5) % 75);
    const b = 20 + ((round * 7 + 11) % 75);
    const correct = a > b ? ">" : a < b ? "<" : "=";
    return { skill: "compare-numbers", question: `Which symbol makes this true: ${a} __ ${b}?`, ...rotateChoices(correct, [...[">", "<", "="].filter((item) => item !== correct), "not sure"], n), hint: "Compare the tens first.", explanation: `${a} ${correct} ${b} is true.` };
  }
  const start = 10 + round;
  const add = 4 + ((round * 4) % 20);
  const take = 2 + ((round * 3) % Math.min(18, start + add - 1));
  const correct = start + add - take;
  return { skill: "mixed-add-subtract", question: `${name} had ${start} ${object}, got ${add} more, then used ${take}. How many ${object} does ${name} have now?`, ...rotateChoices(correct, [correct - 2, correct + 2, correct + 5], n), hint: "Add first, then subtract.", explanation: `${start} + ${add} - ${take} = ${correct}.` };
}

function readingQuestion(n) {
  const mode = n % 5;
  const round = Math.floor(n / 5);
  const parts = readingPassageParts;
  const name = parts.names[round % parts.names.length];
  const helper = parts.names[(round + 5) % parts.names.length];
  const place = parts.places[Math.floor(round / 2) % parts.places.length];
  const object = parts.objects[Math.floor(round / 3) % parts.objects.length];
  const action = parts.actions[round % parts.actions.length];
  const feeling = parts.feelings[Math.floor(round / 7) % parts.feelings.length];

  if (mode === 0) {
    const passage = `${name} went to the ${place}. ${name} ${action} a ${object}. Then ${helper} helped and ${name} felt ${feeling}.`;
    return {
      skill: "reading-comprehension",
      question: `Read: "${passage}" What did ${name} ${actionBaseForms.get(action)} at the ${place}?`,
      choices: [object, "a lunch box", "a rainy cloud", "a toy truck"],
      answerIndex: 0,
      hint: `Look for what ${name} ${action}.`,
      explanation: `The story says ${name} ${action} a ${object}.`,
    };
  }
  if (mode === 1) {
    const word = sightWords[n % sightWords.length];
    const sentenceStarters = ["I read the word", "Point to the word", "Find the word", "Choose the word", "Tap the word", "Which choice says"];
    const starter = sentenceStarters[round % sentenceStarters.length];
    const placeHint = parts.places[round % parts.places.length];
    const question = starter === "Which choice says" ? `Which choice says "${word}" on the ${placeHint} card?` : `${starter} "${word}" on the ${placeHint} card.`;
    return { skill: "sight-words", question, ...rotateChoices(word, [sightWords[(n + 1) % sightWords.length], sightWords[(n + 2) % sightWords.length], sightWords[(n + 3) % sightWords.length]], n), hint: "Look at each letter from left to right.", explanation: `The word is "${word}".` };
  }
  if (mode === 2) {
    const [topic, correct] = sentenceTopics[round % sentenceTopics.length];
    const fragments = [`Near the ${topic}.`, "After the bell.", "Because it was.", "Running very fast."].filter((item) => item !== correct);
    return { skill: "sentence-meaning", question: `Which choice is a complete sentence about ${topic} for ${name}?`, choices: [correct, ...fragments].slice(0, 4), answerIndex: 0, hint: "A complete sentence tells a full idea.", explanation: `"${correct}" is a complete sentence.` };
  }
  if (mode === 3) {
    const [question, correct, distractors, hint, explanation] = vocabQuestions[round % vocabQuestions.length];
    const opener = ["Samaira asks", "Sahir reads", "Nitisha points to the word", "Vaibhav asks about words"][Math.floor(round / vocabQuestions.length) % 4];
    const context = parts.objects[round % parts.objects.length];
    const vocabPlace = parts.places[Math.floor(round / parts.objects.length) % parts.places.length];
    return { skill: "reading-vocabulary", question: `${opener} near the ${context} at the ${vocabPlace}: ${question}`, ...rotateChoices(correct, distractors, n), hint, explanation };
  }
  const cause = [`${name} practiced every day with a ${object}`, `${helper} shared the ${object} and tools at the ${place}`, `rain fell at the ${place} near the ${object}`, `${name} listened carefully beside the ${object}`][round % 4];
  const effect = [`${name} got better`, "the project was finished", "everyone used umbrellas", `${name} knew what to do`][round % 4];
  return {
    skill: "cause-effect",
    question: `Read: "On day ${round + 1}, ${cause}, so ${effect}." What happened because ${cause}?`,
    choices: [effect, "the moon disappeared", "the book became lunch", "the room flew away"],
    answerIndex: 0,
    hint: "The effect comes after the word so.",
    explanation: `Because ${cause}, ${effect}.`,
  };
}

function scienceQuestion(n) {
  const item = scienceFacts[n % scienceFacts.length];
  const name = familyNames[Math.floor(n / scienceFacts.length) % familyNames.length];
  const place = readingPassageParts.places[n % readingPassageParts.places.length];
  const mode = Math.floor(n / scienceFacts.length) % 8;
  const openings = [
    item.question,
    `${name} is learning science. ${item.question}`,
    `${name} asks: ${item.question}`,
    `At home, ${name} wonders: ${item.question}`,
    `At the ${place}, ${name} observes nature. ${item.question}`,
    `${name} and ${familyNames[(n + 1) % familyNames.length]} talk science. ${item.question}`,
    `During a Grade 2 experiment, ${name} thinks: ${item.question}`,
    `${name} checks a science notebook. ${item.question}`,
  ];
  return { skill: item.skill, question: openings[mode], ...rotateChoices(item.correct, item.distractors, n), hint: item.hint, explanation: item.explanation };
}

function misspellings(word) {
  const options = [
    `${word.slice(0, -1)}e`,
    word.replace(/[aeiou]/, ""),
    `${word}${word.at(-1)}`,
    word.replace(/([a-z])\1/, "$1"),
    word.replace(/c/g, "k"),
    word.replace(/y$/, "ie"),
  ];
  return options.filter((item, index, list) => item && item !== word && list.indexOf(item) === index);
}

function spellingQuestion(n) {
  const [word, clue, skill] = spellingWords[n % spellingWords.length];
  const words = spellingWords.map(([item]) => item);
  const helper = familyNames[(n + 1) % familyNames.length];
  const place = readingPassageParts.places[n % readingPassageParts.places.length];
  const templates = [
    `Which spelling should Samaira choose for this clue: ${clue}?`,
    `Samaira is writing a word for this clue: ${clue}. Which spelling is correct?`,
    `Samaira sees this clue at the ${place}: ${clue}. Which word is spelled correctly?`,
    `${helper} says the word "${word}" aloud for Samaira. Which choice spells it correctly?`,
  ];
  return { skill: `spelling-${skill}`, question: templates[Math.floor(n / spellingWords.length) % templates.length], ...rotateChoices(word, [...misspellings(word), words[(n + 11) % words.length]], n), hint: "Look at each letter and listen for the sounds in the word.", explanation: `"${word}" is spelled correctly.` };
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
writeFileSync(resolve("src/data/questionBank.json"), JSON.stringify(questions, null, 2));
writeFileSync(tsPath, `import type { Question } from "../types";\n\nexport const starterQuestions: Question[] = [];\n`);

rmSync(resolve("public/question-packs"), { recursive: true, force: true });

const jsonPath = resolve("public/question-packs/grade-2-pack.json");
mkdirSync(dirname(jsonPath), { recursive: true });
writeFileSync(jsonPath, JSON.stringify({ title: "Samaira Grade 2 Question Pack", grade, questions }, null, 2));
writeFileSync(resolve("public/question-packs/samaira-grade-2-pack.json"), JSON.stringify({ title: "Samaira Grade 2 Question Pack", grade, questions }, null, 2));

console.log(`Generated ${questions.length} questions.`);
