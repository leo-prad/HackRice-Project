import { GoogleGenAI } from "@google/genai";
import type { AnalyzedSkill, QuestAnalysis } from "@gitventure/shared";
import type { GitHubComment, GitHubIssue, GitHubRepo } from "./github.js";
import { issueLabels } from "./github.js";

const SYSTEM_PROMPT = `You analyze open source GitHub issues for GitVenture, a game engine that turns issues into quests.

Rate the work required to close the issue on five independent 0-10 axes:
- technical_complexity: depth of engineering skill required. 1 = docs typo, 5 = multi-file bug fix, 9 = race condition or memory corruption.
- scope: how much code has to change. 1 = one line, 5 = a handful of files, 9 = spans subsystems.
- codebase_context: how much of the repository you must understand first. 1 = self contained, 9 = deep architectural familiarity.
- verification_difficulty: how hard it is to prove the fix works. 1 = obvious, 5 = write a unit test, 9 = no reliable repro.
- ambiguity: how underspecified the issue is. 1 = exact instructions, 9 = unresolved disagreement about the right approach.

Then list 2 to 4 skills the contributor exercises. Use short canonical names a developer would recognize
("Python", "React", "TypeScript", "Concurrency", "Testing", "SQL", "Documentation", "Networking", "CSS", "APIs", "Performance").
required_level is 1-10 on the same difficulty scale. weight is that skill's share of the work; weights must sum to about 1.

Then list 2 to 4 concrete objectives phrased as actions ("Diagnose the cache invalidation path", "Pass the affected tests").

Judge the work, not the writing. A terse issue can be very hard, and a long issue can be trivial.
When repository structure, relevant code, or tests are provided, weigh them heavily for codebase_context and verification_difficulty.
Do not return XP or difficulty.`;

export interface QuestAnalysisResult {
  analysis: QuestAnalysis;
  skills: AnalyzedSkill[];
  source: "llm" | "heuristic";
}

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    technical_complexity: { type: "number", minimum: 0, maximum: 10 },
    scope: { type: "number", minimum: 0, maximum: 10 },
    codebase_context: { type: "number", minimum: 0, maximum: 10 },
    verification_difficulty: { type: "number", minimum: 0, maximum: 10 },
    ambiguity: { type: "number", minimum: 0, maximum: 10 },
    skills: {
      type: "array",
      minItems: 1,
      maxItems: 4,
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          required_level: { type: "integer", minimum: 1, maximum: 10 },
          weight: { type: "number", minimum: 0, maximum: 1 },
        },
        required: ["name", "required_level", "weight"],
        additionalProperties: false,
      },
    },
    objectives: { type: "array", minItems: 1, maxItems: 5, items: { type: "string" } },
    reasoning_summary: { type: "string" },
  },
  required: ["technical_complexity", "scope", "codebase_context", "verification_difficulty", "ambiguity", "skills", "objectives", "reasoning_summary"],
  additionalProperties: false,
} as const;

interface RawAnalysis {
  technical_complexity?: number;
  scope?: number;
  codebase_context?: number;
  verification_difficulty?: number;
  ambiguity?: number;
  skills?: Array<{ name?: string; required_level?: number; weight?: number }>;
  objectives?: string[];
  reasoning_summary?: string;
}

export interface AnalysisInput {
  issue: GitHubIssue;
  repository: GitHubRepo;
  readme: string;
  comments: GitHubComment[];
  daysOpen: number;
  architecture?: string[];
  codeFiles?: Array<{ path: string; content: string }>;
  testFiles?: Array<{ path: string; content: string }>;
}

const clampAxis = (value: unknown): number => {
  const numeric = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return Math.min(10, Math.max(0, Math.round(numeric * 10) / 10));
};

export const normalizeSkillName = (raw: string): string => {
  const trimmed = raw.trim().replace(/\s+/g, " ").slice(0, 40);
  if (!trimmed) return "";
  if (trimmed.length <= 3 || /[A-Z]/.test(trimmed.slice(1))) return trimmed;
  return trimmed.replace(/\b[a-z]/g, (char) => char.toUpperCase());
};

function dedupeSkills(skills: AnalyzedSkill[]): AnalyzedSkill[] {
  const byName = new Map<string, AnalyzedSkill>();
  for (const skill of skills) {
    const name = normalizeSkillName(skill.name);
    if (!name) continue;
    const existing = byName.get(name.toLowerCase());
    if (existing) existing.weight += skill.weight;
    else byName.set(name.toLowerCase(), { ...skill, name });
  }
  return Array.from(byName.values()).slice(0, 4);
}

function buildPrompt(input: AnalysisInput): string {
  const { issue, repository, readme, comments, daysOpen, architecture, codeFiles, testFiles } = input;
  const labels = issueLabels(issue).join(", ") || "none";
  const codeBlocks = (codeFiles ?? [])
    .slice(0, 3)
    .map((file) => `File ${file.path}:\n${file.content}`)
    .join("\n\n");
  const testBlocks = (testFiles ?? [])
    .slice(0, 2)
    .map((file) => `Test ${file.path}:\n${file.content}`)
    .join("\n\n");
  return [
    `Repository: ${repository.full_name} (${repository.language ?? "unknown language"}, ${repository.stargazers_count} stars, ${repository.open_issues_count} open issues)`,
    repository.description ? `Repository description: ${repository.description}` : "",
    architecture?.length ? `Top-level structure:\n${architecture.join(", ")}` : "",
    readme ? `Repository overview:\n${readme}` : "",
    `Issue #${issue.number}: ${issue.title}`,
    `Labels: ${labels}`,
    `Opened: ${daysOpen} days ago`,
    `Comments: ${issue.comments}`,
    "",
    `Body:\n${(issue.body ?? "").slice(0, 4000)}`,
    comments.length ? `Top comments:\n${comments.slice(0, 3).map((comment) => (comment.body ?? "").slice(0, 500)).join("\n\n")}` : "",
    codeBlocks ? `Relevant code:\n${codeBlocks}` : "",
    testBlocks ? `Relevant tests:\n${testBlocks}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

const LABEL_SIGNALS: ReadonlyArray<[RegExp, Partial<QuestAnalysis>, AnalyzedSkill[]]> = [
  [/typo|docs|documentation|readme/i, { technicalComplexity: 1, scope: 1, codebaseContext: 1, verificationDifficulty: 1, ambiguity: 1 }, [{ name: "Documentation", requiredLevel: 1, weight: 1 }]],
  [/good.?first.?issue|beginner|easy|starter/i, { technicalComplexity: 2, scope: 2, codebaseContext: 2, verificationDifficulty: 2, ambiguity: 2 }, []],
  [/test|testing|coverage/i, { technicalComplexity: 4, scope: 3, codebaseContext: 4, verificationDifficulty: 3, ambiguity: 3 }, [{ name: "Testing", requiredLevel: 3, weight: 1 }]],
  [/performance|memory|leak|concurren|race|deadlock|thread/i, { technicalComplexity: 8, scope: 5, codebaseContext: 8, verificationDifficulty: 9, ambiguity: 6 }, [{ name: "Concurrency", requiredLevel: 7, weight: 0.6 }, { name: "Performance", requiredLevel: 6, weight: 0.4 }]],
  [/security|vulnerab|cve/i, { technicalComplexity: 8, scope: 4, codebaseContext: 7, verificationDifficulty: 7, ambiguity: 5 }, [{ name: "Security", requiredLevel: 7, weight: 1 }]],
  [/refactor|architect|redesign|migration/i, { technicalComplexity: 7, scope: 8, codebaseContext: 8, verificationDifficulty: 6, ambiguity: 6 }, [{ name: "Refactoring", requiredLevel: 6, weight: 1 }]],
  [/bug|defect|regression|crash/i, { technicalComplexity: 5, scope: 4, codebaseContext: 5, verificationDifficulty: 5, ambiguity: 4 }, [{ name: "Debugging", requiredLevel: 4, weight: 1 }]],
  [/feature|enhancement|proposal/i, { technicalComplexity: 6, scope: 6, codebaseContext: 5, verificationDifficulty: 5, ambiguity: 6 }, []],
];

/** Deterministic scorer used when the LLM is unavailable, so a demo board never shows empty rows. */
export function heuristicAnalysis(input: AnalysisInput): QuestAnalysisResult {
  const { issue, repository, daysOpen } = input;
  const haystack = `${issueLabels(issue).join(" ")} ${issue.title}`;
  const bodyLength = (issue.body ?? "").length;

  let axes: QuestAnalysis = {
    technicalComplexity: 5,
    scope: 4,
    codebaseContext: 5,
    verificationDifficulty: 4,
    ambiguity: 5,
    objectives: [],
    reasoningSummary: "",
  };
  let skills: AnalyzedSkill[] = [];

  for (const [pattern, signal, signalSkills] of LABEL_SIGNALS) {
    if (!pattern.test(haystack)) continue;
    axes = { ...axes, ...signal };
    skills = signalSkills.map((skill) => ({ ...skill }));
    break;
  }

  // Long threads and stale issues usually mean unresolved disagreement.
  if (issue.comments >= 8) axes.ambiguity = Math.min(10, axes.ambiguity + 2);
  if (daysOpen > 180) axes.ambiguity = Math.min(10, axes.ambiguity + 1);
  if (bodyLength < 120) axes.ambiguity = Math.min(10, axes.ambiguity + 1);
  if (repository.stargazers_count > 10_000) axes.verificationDifficulty = Math.min(10, axes.verificationDifficulty + 1);

  if (repository.language) skills.unshift({ name: repository.language, requiredLevel: Math.max(1, Math.round(axes.technicalComplexity)), weight: skills.length ? 1 : 1.5 });
  if (!skills.length) skills.push({ name: "Debugging", requiredLevel: 4, weight: 1 });

  return {
    analysis: {
      ...axes,
      objectives: ["Reproduce and diagnose the reported behavior", "Implement the change", "Verify it with the project's tests", "Open a pull request that closes the issue"],
      reasoningSummary: "Scored from issue labels, age, and discussion volume because AI analysis was unavailable.",
    },
    skills: dedupeSkills(skills),
    source: "heuristic",
  };
}

export async function analyzeIssue(input: AnalysisInput): Promise<QuestAnalysisResult> {
  if (!process.env.GEMINI_API_KEY) return heuristicAnalysis(input);
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.interactions.create({
      model: process.env.GEMINI_MODEL ?? "gemini-3.6-flash",
      system_instruction: SYSTEM_PROMPT,
      input: buildPrompt(input),
      generation_config: { thinking_level: "low" },
      response_format: { type: "text", mime_type: "application/json", schema: RESPONSE_SCHEMA },
    });
    const raw = JSON.parse(response.output_text ?? "{}") as RawAnalysis;
    const skills = dedupeSkills(
      (raw.skills ?? [])
        .filter((skill) => typeof skill?.name === "string" && skill.name.trim())
        .map((skill) => ({
          name: skill.name!,
          requiredLevel: Math.min(10, Math.max(1, Math.round(skill.required_level ?? 1))),
          weight: typeof skill.weight === "number" && skill.weight > 0 ? skill.weight : 0.25,
        })),
    );
    const objectives = (raw.objectives ?? []).filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim().slice(0, 160)).slice(0, 5);
    if (!skills.length || !objectives.length) throw new Error("Analysis was missing skills or objectives");

    return {
      analysis: {
        technicalComplexity: clampAxis(raw.technical_complexity),
        scope: clampAxis(raw.scope),
        codebaseContext: clampAxis(raw.codebase_context),
        verificationDifficulty: clampAxis(raw.verification_difficulty),
        ambiguity: clampAxis(raw.ambiguity),
        objectives,
        reasoningSummary: (raw.reasoning_summary ?? "").trim().slice(0, 400),
      },
      skills,
      source: "llm",
    };
  } catch (error) {
    console.warn(`AI analysis failed for ${input.repository.full_name}#${input.issue.number}, using heuristic:`, error instanceof Error ? error.message : error);
    return heuristicAnalysis(input);
  }
}
