const sessionSize = 15;

const defaultFavorites = {
  colors: ["pink", "blue"],
  animals: ["rabbit"],
  activities: ["drawing", "reading"],
  places: ["park", "library"],
  foods: ["pancakes"],
  styles: ["family", "nature"],
  readingLevel: "normal",
};

const samairaProfile = {
  id: "profile-samaira",
  name: "Samaira",
  age: 7,
  grade: 2,
  parentNames: ["Vaibhav", "Nitisha"],
  siblingNames: ["Sahir"],
  favorites: defaultFavorites,
  avatarColor: "#ff5b85",
};

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function makeDefaultProfileStore(legacy) {
  return {
    activeProfileId: samairaProfile.id,
    profiles: [samairaProfile],
    progressByProfile: {
      [samairaProfile.id]: {
        score: legacy.score,
        history: legacy.history,
        recentIds: legacy.recentIds,
      },
    },
  };
}

function firstOrDefault(items, fallback) {
  return items.find(Boolean) ?? fallback;
}

function profileNameMap(profile) {
  return new Map([
    ["Samaira", profile.name],
    ["Sahir", firstOrDefault(profile.siblingNames, "Sahir")],
    ["Vaibhav", firstOrDefault(profile.parentNames, "Vaibhav")],
    ["Nitisha", profile.parentNames[1] || firstOrDefault(profile.parentNames, "Nitisha")],
  ]);
}

function replaceFamilyNames(text, profile) {
  const replacements = profileNameMap(profile);
  return text.replace(/\b(Samaira|Sahir|Vaibhav|Nitisha)\b/g, (match) => replacements.get(match) ?? match);
}

function favoriteFor(profile, key, fallback, seed) {
  const values = profile.favorites[key];
  if (!values.length) {
    return fallback;
  }
  const index = Math.abs(seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)) % values.length;
  return values[index];
}

function personalizeQuestion(question, profile) {
  const favoriteActivity = favoriteFor(profile, "activities", "reading", question.id);
  let text = replaceFamilyNames(question.question, profile);
  if (question.subject === "Math" && question.skill?.includes("addition") && text.startsWith("What is")) {
    text = `${profile.name} is practicing math after ${favoriteActivity}. ${text}`;
  }
  return { ...question, question: text };
}

const legacy = {
  score: { stars: 1330, sessions: 2 },
  history: [{ id: "old-run", date: "2026-08-01T00:00:00.000Z", subject: "Math", score: 12, total: sessionSize, starsEarned: 120, missedQuestionIds: [], missedSkills: [] }],
  recentIds: ["g2-math-001"],
};
const migrated = makeDefaultProfileStore(legacy);
assert(migrated.activeProfileId === "profile-samaira", "Legacy data should migrate to Samaira.");
assert(migrated.progressByProfile["profile-samaira"].score.stars === 1330, "Samaira stars should preserve legacy score.");
assert(migrated.progressByProfile["profile-samaira"].history.length === 1, "Samaira history should preserve legacy history.");

const sahir = {
  id: "profile-sahir",
  name: "Sahir",
  age: 7,
  grade: 2,
  parentNames: ["Vaibhav", "Nitisha"],
  siblingNames: ["Samaira"],
  favorites: { ...defaultFavorites, activities: ["soccer"], animals: ["dog"], foods: ["pizza"], places: ["zoo"], colors: ["green"], styles: ["sports"] },
  avatarColor: "#0c8df0",
};
const store = {
  ...migrated,
  activeProfileId: sahir.id,
  profiles: [...migrated.profiles, sahir],
  progressByProfile: {
    ...migrated.progressByProfile,
    [sahir.id]: { score: { stars: 1250, sessions: 0 }, history: [], recentIds: [] },
  },
};

store.progressByProfile[sahir.id] = {
  score: { stars: 1370, sessions: 1 },
  history: [{ id: "sahir-run", date: "2026-08-01T00:00:00.000Z", subject: "Science", score: 12, total: sessionSize, starsEarned: 120, missedQuestionIds: [], missedSkills: [] }],
  recentIds: ["g2-science-001"],
};

assert(store.progressByProfile["profile-samaira"].score.stars === 1330, "Updating Sahir should not change Samaira stars.");
assert(store.progressByProfile[sahir.id].history[0].subject === "Science", "Sahir history should stay separate.");

const sample = {
  id: "g2-math-005",
  subject: "Math",
  skill: "addition-word-problems",
  question: "Samaira read 7 pages and Sahir read 3 pages. How many pages did they read in all?",
};
const personalized = personalizeQuestion(sample, sahir);
assert(personalized.question.includes("Sahir"), "Personalized question should include active child name.");
assert(personalized.question.includes("Samaira"), "Personalized question should include sibling replacement.");
assert(!/\bGrade 3\b/i.test(personalized.question), "Personalization should not change grade level.");

console.log("Profile QC passed.");
