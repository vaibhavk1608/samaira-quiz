import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  Download,
  FileUp,
  FlaskConical,
  FolderOpen,
  Home,
  Lock,
  LogOut,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Upload,
  XCircle,
} from "lucide-react";
import "./App.css";
import { starterQuestions } from "./data/questionBank";
import type { Question, QuestionPack, QuizRun, Subject } from "./types";

const STORAGE_KEY = "samaira-quiz-questions";
const RECENT_KEY = "samaira-quiz-recent";
const SCORE_KEY = "samaira-quiz-score";
const HISTORY_KEY = "samaira-quiz-history";
const PARENT_PIN = "2468";
const SESSION_SIZE = 15;
const subjects: Subject[] = ["Math", "Reading", "Science", "Spelling"];
const starterIds = new Set(starterQuestions.map((question) => question.id));
const blockedQuestionPattern = /\b(?:x|times|divided|multiply|multiplication|division|equal-groups)\b/i;

type Screen = "home" | "quiz" | "results" | "parent";
type QuizAnswer = {
  questionId: string;
  selectedIndex: number;
  correct: boolean;
};

type StoredScore = {
  stars: number;
  sessions: number;
};

const subjectMeta: Record<Subject, { className: string; icon: React.ComponentType<{ size?: number }> }> = {
  Math: { className: "math", icon: Brain },
  Reading: { className: "reading", icon: BookOpen },
  Science: { className: "science", icon: FlaskConical },
  Spelling: { className: "spelling", icon: Sparkles },
};

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function makeQuestionId(question: Omit<Question, "id"> | Question, index: number) {
  if ("id" in question && question.id) {
    return question.id;
  }
  const slug = `${question.grade}-${question.subject}-${question.question}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 70);
  return `imported-${slug}-${index}`;
}

function normalizePack(pack: QuestionPack): Question[] {
  if (!pack || !Array.isArray(pack.questions)) {
    throw new Error("This file needs a questions array.");
  }

  return pack.questions.map((item, index) => {
    const grade = item.grade ?? pack.grade;
    const subject = item.subject ?? pack.subject;
    if (grade !== 2) {
      throw new Error(`Question ${index + 1} needs grade 2.`);
    }
    if (!subjects.includes(subject as Subject)) {
      throw new Error(`Question ${index + 1} needs a valid subject.`);
    }
    if (!item.question || !Array.isArray(item.choices) || item.choices.length !== 4) {
      throw new Error(`Question ${index + 1} needs a question and four choices.`);
    }
    if (!Number.isInteger(item.answerIndex) || item.answerIndex < 0 || item.answerIndex > 3) {
      throw new Error(`Question ${index + 1} needs answerIndex from 0 to 3.`);
    }

    return {
      id: makeQuestionId({ ...item, grade, subject: subject as Subject }, index),
      grade,
      subject: subject as Subject,
      question: String(item.question),
      choices: item.choices.map(String),
      answerIndex: item.answerIndex,
      hint: item.hint ? String(item.hint) : "Think about what the question is asking.",
      explanation: item.explanation ? String(item.explanation) : "Nice effort. Review the correct answer and try another one.",
      skill: item.skill ? String(item.skill) : undefined,
      source: "imported",
    };
  });
}

function mergeQuestions(existing: Question[], incoming: Question[]) {
  const byId = new Map(existing.map((question) => [question.id, question]));
  incoming.filter(isAllowedQuestion).forEach((question) => byId.set(question.id, question));
  return Array.from(byId.values());
}

function isAllowedQuestion(question: Question) {
  return question.grade === 2 && !blockedQuestionPattern.test(`${question.question} ${question.skill ?? ""}`);
}

function questionPattern(question: Question) {
  return question.question
    .replace(/^(Review: |Think: |Try this: )/, "")
    .replace(/^(Samaira|Sahir|Vaibhav|Nitisha) (is learning science|asks|wonders).*? /, "")
    .replace(/\b\d+\b/g, "#")
    .toLowerCase();
}

function pickSession(questions: Question[], subject: Subject, recentIds: string[]) {
  const pool = questions.filter((question) => question.subject === subject);
  const practice = pool.filter((question) => question.source === "practice" && !recentIds.includes(question.id));
  const fresh = pool.filter((question) => !recentIds.includes(question.id));
  const usable = practice.length >= 4 ? [...practice, ...fresh] : fresh.length >= SESSION_SIZE ? fresh : pool;
  const uniqueByPrompt = new Map<string, Question>();
  [...usable]
    .sort(() => Math.random() - 0.5)
    .forEach((question) => {
      const key = `${question.subject}:${question.question}`;
      if (!uniqueByPrompt.has(key)) {
        uniqueByPrompt.set(key, question);
      }
    });
  const skillCounts = new Map<string, number>();
  const patternCounts = new Map<string, number>();
  const selected: Question[] = [];
  const maxSkillCount = subject === "Science" ? 1 : subject === "Reading" ? 5 : subject === "Spelling" ? 4 : 3;
  Array.from(uniqueByPrompt.values()).forEach((question) => {
    const skill = question.skill ?? question.subject;
    const pattern = questionPattern(question);
    const skillCount = skillCounts.get(skill) ?? 0;
    const patternCount = patternCounts.get(pattern) ?? 0;
    if (selected.length < SESSION_SIZE && skillCount < maxSkillCount && patternCount < 1) {
      selected.push(question);
      skillCounts.set(skill, skillCount + 1);
      patternCounts.set(pattern, patternCount + 1);
    }
  });
  const unique = Array.from(uniqueByPrompt.values());
  const fallback = [...usable].sort(() => Math.random() - 0.5);
  const selectedIds = new Set(selected.map((question) => question.id));
  const fill = [...unique, ...fallback].filter((question) => !selectedIds.has(question.id));
  return (selected.length >= SESSION_SIZE ? selected : [...selected, ...fill]).slice(0, SESSION_SIZE);
}

function extractNumbers(text: string) {
  return Array.from(text.matchAll(/\d+/g), (match) => Number(match[0]));
}

function choiceSet(correct: number | string, distractors: Array<number | string>, seed: number) {
  const values = [correct, ...distractors].map(String).slice(0, 4);
  const shift = seed % values.length;
  const choices = [...values.slice(shift), ...values.slice(0, shift)];
  return { choices, answerIndex: choices.indexOf(String(correct)) };
}

function makePracticeId(base: Question, index: number, existingIds: Set<string>) {
  let id = `practice-${base.id}-${index}`;
  let suffix = 1;
  while (existingIds.has(id)) {
    id = `practice-${base.id}-${index}-${suffix}`;
    suffix += 1;
  }
  existingIds.add(id);
  return id;
}

function generatePracticeQuestions(missed: Question[], existingQuestions: Question[]) {
  const existingIds = new Set(existingQuestions.map((question) => question.id));
  const generated: Question[] = [];

  missed.slice(0, 5).forEach((base, missedIndex) => {
    if (base.subject === "Math") {
      const numbers = extractNumbers(base.question);
      const a = Math.max(1, Math.min(18, numbers[0] ?? 6));
      const b = Math.max(1, Math.min(12, numbers[1] ?? 3));
      const variants = [
        { question: `What is ${a} + ${b}?`, correct: a + b, skill: base.skill ?? "addition-under-20", hint: `Start at ${a} and count up ${b}.`, explanation: `${a} + ${b} = ${a + b}.` },
        { question: `What is ${a + b} - ${b}?`, correct: a, skill: base.skill ?? "subtraction-under-20", hint: "Use the related subtraction fact.", explanation: `${a + b} - ${b} = ${a}.` },
      ];
      variants.forEach((variant, index) => {
        generated.push({
          id: makePracticeId(base, index, existingIds),
          grade: base.grade,
          subject: "Math",
          source: "practice",
          skill: variant.skill,
          question: variant.question,
          ...choiceSet(variant.correct, [Number(variant.correct) + 1, Math.max(0, Number(variant.correct) - 1), Number(variant.correct) + 2], missedIndex + index),
          hint: variant.hint,
          explanation: variant.explanation,
        });
      });
      return;
    }

    if (base.subject === "Spelling" || base.subject === "Reading") {
      const quoted = base.explanation.match(/"([^"]+)"/)?.[1] ?? base.choices[base.answerIndex];
      const correct = quoted || base.choices[base.answerIndex];
      generated.push({
        id: makePracticeId(base, 0, existingIds),
        grade: base.grade,
        subject: base.subject,
        source: "practice",
        skill: base.skill ?? (base.subject === "Spelling" ? "spelling-review" : "reading-review"),
        question: base.subject === "Spelling" ? "Which word is spelled correctly?" : `Which word matches "${correct}"?`,
        ...choiceSet(correct, [`${correct}e`, correct.slice(0, -1), `${correct}${correct.at(-1)}`].filter(Boolean), missedIndex),
        hint: "Look at each letter carefully.",
        explanation: `"${correct}" is the correct answer.`,
      });
      return;
    }

    generated.push({
      id: makePracticeId(base, 0, existingIds),
      grade: base.grade,
      subject: "Science",
      source: "practice",
      skill: base.skill ?? "science-review",
      question: `Review: ${base.question}`,
      choices: base.choices,
      answerIndex: base.answerIndex,
      hint: base.hint,
      explanation: base.explanation,
    });
  });

  return generated;
}

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [questions, setQuestions] = useState<Question[]>(() => {
    const imported = safeRead<Question[]>(STORAGE_KEY, []);
    return mergeQuestions(starterQuestions, imported.filter(isAllowedQuestion));
  });
  const [recentIds, setRecentIds] = useState<string[]>(() => safeRead<string[]>(RECENT_KEY, []));
  const [score, setScore] = useState<StoredScore>(() => safeRead<StoredScore>(SCORE_KEY, { stars: 1250, sessions: 0 }));
  const [history, setHistory] = useState<QuizRun[]>(() => safeRead<QuizRun[]>(HISTORY_KEY, []));
  const [session, setSession] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [parentUnlocked, setParentUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [parentMessage, setParentMessage] = useState("Import AirDropped JSON packs or sync the hosted packs.");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const counts = useMemo(() => {
    return subjects.reduce(
      (result, subject) => {
        result[subject] = questions.filter((question) => question.subject === subject).length;
        return result;
      },
      {} as Record<Subject, number>,
    );
  }, [questions]);

  const progress = useMemo(() => {
    const recent = history.slice(0, 10);
    const average = recent.length ? Math.round((recent.reduce((sum, run) => sum + run.score / run.total, 0) / recent.length) * 100) : 0;
    const bySubject = subjects.map((subject) => {
      const runs = history.filter((run) => run.subject === subject);
      const correct = runs.reduce((sum, run) => sum + run.score, 0);
      const total = runs.reduce((sum, run) => sum + run.total, 0);
      return { subject, percent: total ? Math.round((correct / total) * 100) : 0, runs: runs.length };
    });
    const practiced = bySubject.filter((item) => item.runs > 0);
    const strongest = practiced.length ? [...practiced].sort((a, b) => b.percent - a.percent)[0].subject : "None yet";
    const needsPractice = practiced.length ? [...practiced].sort((a, b) => a.percent - b.percent)[0].subject : "Take a quiz";
    return { recent, average, strongest, needsPractice, bySubject };
  }, [history]);

  const currentQuestion = session[currentIndex];
  const correctCount = answers.filter((answer) => answer.correct).length;

  function persistQuestions(nextQuestions: Question[]) {
    const importedOnly = nextQuestions.filter((question) => !starterIds.has(question.id));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(importedOnly));
    setQuestions(nextQuestions);
  }

  function persistRecent(nextRecent: string[]) {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(nextRecent));
    setRecentIds(nextRecent);
  }

  function persistScore(nextScore: StoredScore) {
    window.localStorage.setItem(SCORE_KEY, JSON.stringify(nextScore));
    setScore(nextScore);
  }

  function persistHistory(nextHistory: QuizRun[]) {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
    setHistory(nextHistory);
  }

  function startQuiz(subject: Subject) {
    const nextSession = pickSession(questions, subject, recentIds);
    setSession(nextSession);
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedIndex(null);
    setShowHint(false);
    setScreen("quiz");
  }

  function chooseAnswer(index: number) {
    if (!currentQuestion || selectedIndex !== null) {
      return;
    }
    const correct = index === currentQuestion.answerIndex;
    const nextAnswers = [...answers, { questionId: currentQuestion.id, selectedIndex: index, correct }];
    setSelectedIndex(index);
    setAnswers(nextAnswers);
  }

  function nextQuestion() {
    if (currentIndex + 1 >= session.length) {
      const earned = correctCount * 10;
      const missed = session.filter((question) => answers.some((answer) => answer.questionId === question.id && !answer.correct));
      const practiceQuestions = generatePracticeQuestions(missed, questions);
      if (practiceQuestions.length > 0) {
        persistQuestions(mergeQuestions(questions, practiceQuestions));
      }
      const run: QuizRun = {
        id: `run-${Date.now()}`,
        date: new Date().toISOString(),
        subject: session[0]?.subject ?? "Math",
        score: correctCount,
        total: SESSION_SIZE,
        starsEarned: earned,
        missedQuestionIds: missed.map((question) => question.id),
        missedSkills: Array.from(new Set(missed.map((question) => question.skill).filter(Boolean) as string[])),
      };
      const nextRecent = [...session.map((question) => question.id), ...recentIds].slice(0, 120);
      persistRecent(nextRecent);
      persistScore({ stars: score.stars + earned, sessions: score.sessions + 1 });
      persistHistory([run, ...history].slice(0, 100));
      setScreen("results");
      return;
    }
    setCurrentIndex(currentIndex + 1);
    setSelectedIndex(null);
    setShowHint(false);
  }

  async function importFile(file: File) {
    try {
      const text = await file.text();
      const pack = JSON.parse(text) as QuestionPack;
      const normalized = normalizePack(pack);
      const next = mergeQuestions(questions, normalized);
      persistQuestions(next);
      setParentMessage(`Imported ${normalized.length} questions from ${file.name}.`);
    } catch (error) {
      setParentMessage(error instanceof Error ? error.message : "That file could not be imported.");
    }
  }

  async function syncHostedPacks() {
    try {
      const base = import.meta.env.BASE_URL;
      const urls = [`${base}question-packs/samaira-grade-2-pack.json`];
      const packs = await Promise.all(
        urls.map(async (url) => {
          const response = await fetch(url, { cache: "no-store" });
          if (!response.ok) {
            throw new Error(`Could not load ${url}`);
          }
          return (await response.json()) as QuestionPack;
        }),
      );
      const incoming = packs.flatMap(normalizePack);
      const next = mergeQuestions(questions, incoming);
      persistQuestions(next);
      setParentMessage(`Synced ${incoming.length} hosted questions.`);
    } catch (error) {
      setParentMessage(error instanceof Error ? error.message : "Sync could not finish.");
    }
  }

  function unlockParent() {
    if (pin === PARENT_PIN) {
      setParentUnlocked(true);
      setParentMessage("Parent Mode unlocked.");
      setPin("");
      return;
    }
    setParentMessage("That PIN did not match.");
  }

  return (
    <main className={`app-shell screen-${screen}`}>
      <div className="sky">
        <div className="sun" aria-hidden="true">
          <span />
        </div>
        <div className="cloud cloud-one" aria-hidden="true" />
        <div className="cloud cloud-two" aria-hidden="true" />
      </div>

      {screen === "home" && (
        <section className="home-screen">
          <header className="top-bar">
            <button type="button" className="icon-button" aria-label="Open Parent Mode" onClick={() => setScreen("parent")}>
              <Lock size={26} />
            </button>
            <div className="score-pills">
              <span className="pill">
                <Star size={22} fill="currentColor" /> {score.stars}
              </span>
              <span className="pill heart">3</span>
            </div>
          </header>

          <div className="hero-copy">
            <div className="avatar" aria-label="Samaira profile">
              <span>S</span>
            </div>
            <h1>Hi Samaira!</h1>
            <p>Ready to learn and have fun?</p>
            <span className="learning-badge">Grade 2 practice</span>
          </div>

          <div className="subject-grid">
            {subjects.map((subject) => {
              const Icon = subjectMeta[subject].icon;
              return (
                <article className={`subject-card ${subjectMeta[subject].className}`} key={subject}>
                  <h2>{subject}</h2>
                  <div className="subject-icon" aria-hidden="true">
                    <Icon size={72} />
                  </div>
                  <p>{counts[subject]} mixed questions</p>
                  <button type="button" onClick={() => startQuiz(subject)}>
                    Start
                  </button>
                </article>
              );
            })}
          </div>
          <div className="ground" aria-hidden="true" />
        </section>
      )}

      {screen === "quiz" && currentQuestion && (
        <section className="quiz-screen">
          <header className="quiz-header">
            <button type="button" className="icon-button light" aria-label="Back to home" onClick={() => setScreen("home")}>
              <ArrowLeft size={28} />
            </button>
            <h1>{currentQuestion.subject} Quiz</h1>
            <div className="score-pills compact">
              <span className="pill">
                <Star size={20} fill="currentColor" /> {score.stars}
              </span>
            </div>
          </header>

          <div className="progress-row">
            <div className="progress-track">
              <span style={{ width: `${((currentIndex + 1) / SESSION_SIZE) * 100}%` }} />
            </div>
            <p>
              Question {currentIndex + 1} of {SESSION_SIZE}
            </p>
          </div>

          <div className="question-card">
            <h2>{currentQuestion.question}</h2>
            <div className="answers-grid">
              {currentQuestion.choices.map((choice, index) => {
                const isChosen = selectedIndex === index;
                const isCorrect = selectedIndex !== null && index === currentQuestion.answerIndex;
                const isWrong = isChosen && !isCorrect;
                return (
                  <button
                    type="button"
                    key={choice}
                    className={`answer answer-${index} ${isCorrect ? "correct" : ""} ${isWrong ? "wrong" : ""}`}
                    onClick={() => chooseAnswer(index)}
                    disabled={selectedIndex !== null}
                  >
                    {selectedIndex !== null && isCorrect && <CheckCircle2 size={26} />}
                    {isWrong && <XCircle size={26} />}
                    {choice}
                  </button>
                );
              })}
            </div>

            <div className={`lesson-box ${selectedIndex !== null ? (selectedIndex === currentQuestion.answerIndex ? "correct-feedback" : "wrong-feedback") : ""}`}>
              {selectedIndex === null ? (
                <>
                  <button type="button" className="hint-button" onClick={() => setShowHint(!showHint)}>
                    <Sparkles size={20} /> Hint
                  </button>
                  {showHint && <p>{currentQuestion.hint}</p>}
                </>
              ) : (
                <>
                  <div className="feedback-copy">
                    <strong>{selectedIndex === currentQuestion.answerIndex ? "Correct!" : "Good try!"}</strong>
                    <p>
                      {selectedIndex === currentQuestion.answerIndex
                        ? currentQuestion.explanation
                        : `The correct answer is "${currentQuestion.choices[currentQuestion.answerIndex]}". ${currentQuestion.explanation}`}
                    </p>
                  </div>
                  <button type="button" className="next-button" onClick={nextQuestion}>
                    {currentIndex + 1 >= session.length ? "See Results" : "Next Question"}
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {screen === "results" && (
        <section className="results-screen">
          <div className="confetti" aria-hidden="true" />
          <h1>Great job, Samaira!</h1>
          <p>
            You answered {correctCount} out of {SESSION_SIZE} questions correctly!
          </p>
          <div className="stars-row" aria-label={`${correctCount} correct`}>
            <Star size={96} fill="currentColor" />
            <Trophy size={124} />
            <Star size={96} fill="currentColor" />
          </div>
          <div className="coin-reward">
            <Star size={28} fill="currentColor" /> +{correctCount * 10}
          </div>
          <div className="result-actions">
            <button type="button" className="purple-action" onClick={() => setScreen("home")}>
              <Home size={24} /> Home
            </button>
            <button
              type="button"
              className="green-action"
              onClick={() => {
                const subject = session[0]?.subject ?? "Math";
                startQuiz(subject);
              }}
            >
              <RefreshCcw size={24} /> Next Quiz
            </button>
          </div>
        </section>
      )}

      {screen === "parent" && (
        <section className="parent-screen">
          <header className="parent-header">
            <button type="button" className="icon-button light" aria-label="Back to home" onClick={() => setScreen("home")}>
              <ArrowLeft size={28} />
            </button>
            <h1>
              <ShieldCheck size={44} /> Parent Mode
            </h1>
          </header>

          {!parentUnlocked ? (
            <div className="parent-card pin-card">
              <Lock size={52} />
              <h2>Enter Parent PIN</h2>
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                placeholder="PIN"
                aria-label="Parent PIN"
              />
              <button type="button" onClick={unlockParent}>
                Unlock
              </button>
              <p>{parentMessage}</p>
            </div>
          ) : (
            <>
              <div className="parent-card parent-tools">
                <article>
                  <Upload size={70} />
                  <h2>Import File</h2>
                  <p>Import AirDropped JSON questions.</p>
                  <button type="button" onClick={() => fileInputRef.current?.click()}>
                    <FolderOpen size={22} /> Import File
                  </button>
                  <input
                    ref={fileInputRef}
                    className="hidden-input"
                    type="file"
                    accept="application/json,.json"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void importFile(file);
                      }
                      event.currentTarget.value = "";
                    }}
                  />
                </article>
                <article>
                  <Download size={70} />
                  <h2>Export Backup</h2>
                  <p>Save all content and settings.</p>
                  <button
                    type="button"
                    onClick={() =>
                      downloadJson("samaira-quiz-backup.json", {
                        title: "Samaira Quiz Backup",
                        questions,
                      })
                    }
                  >
                    <FileUp size={22} /> Export Backup
                  </button>
                </article>
              </div>
              <div className="parent-card progress-card">
                <div className="progress-summary">
                  <h2>
                    <BarChart3 size={28} /> Progress
                  </h2>
                  <div className="metric-row">
                    <span>
                      <strong>{history.length}</strong>
                      Runs
                    </span>
                    <span>
                      <strong>{progress.average}%</strong>
                      Recent avg
                    </span>
                    <span>
                      <strong>{progress.strongest}</strong>
                      Strongest
                    </span>
                    <span>
                      <strong>{progress.needsPractice}</strong>
                      Practice
                    </span>
                  </div>
                </div>
                <div className="subject-progress">
                  {progress.bySubject.map((item) => (
                    <div className="subject-progress-row" key={item.subject}>
                      <span>{item.subject}</span>
                      <div className="mini-track">
                        <i style={{ width: `${item.percent}%` }} />
                      </div>
                      <b>{item.runs ? `${item.percent}%` : "-"}</b>
                    </div>
                  ))}
                </div>
                <div className="recent-runs">
                  {progress.recent.length === 0 ? (
                    <p>No quiz runs yet.</p>
                  ) : (
                    progress.recent.slice(0, 5).map((run) => (
                      <p key={run.id}>
                        {run.subject}: {run.score}/{run.total} on {new Date(run.date).toLocaleDateString()}
                      </p>
                    ))
                  )}
                </div>
                <button type="button" className="sync-button" onClick={() => void syncHostedPacks()}>
                  <RefreshCcw size={22} /> Sync Hosted Packs
                </button>
              </div>
              <div className="parent-status">
                <Lock size={18} />
                <p>{parentMessage}</p>
                <button type="button" className="link-button" onClick={() => setParentUnlocked(false)}>
                  <LogOut size={18} /> Lock
                </button>
              </div>
            </>
          )}
        </section>
      )}
    </main>
  );
}

export default App;
