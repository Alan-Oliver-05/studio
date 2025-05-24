
'use server';

/**
 * @fileOverview This file defines a Genkit flow for interactive question and answer sessions with a student,
 * acting as a focused RAG-like tutor for a specific topic, with a multi-stage approach.
 *
 * - interactiveQAndA - A function that initiates and manages the interactive Q&A flow.
 * - InteractiveQAndAInput - The input type for the interactiveQAndA function.
 * - InteractiveQAndAOutput - The return type for the interactiveQAndA function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { QAS_Stage } from '@/types'; // Ensure QAS_Stage is imported if defined in types.ts

const InteractiveQAndAInputSchema = z.object({
  studentProfile: z.object({
    name: z.string().describe("The student's name."),
    age: z.number().describe("The student's age."),
    country: z.string().describe("The student's country."),
    preferredLanguage: z.string().describe("The student's preferred language for learning."),
    educationQualification: z.object({
      boardExam: z.object({
        board: z.string().optional().describe('The board exam name (e.g., CBSE, State Board Name).'),
        standard: z.string().optional().describe("The student's current standard (e.g., 10th, 12th)."),
      }).optional(),
      competitiveExam: z.object({
        examType: z.string().optional().describe('The type of competitive exam (e.g., JEE, NEET, UPSC).'),
        specificExam: z.string().optional().describe('The specific competitive exam or job position (e.g., JEE Main, UPSC CSE).'),
      }).optional(),
      universityExam: z.object({
        universityName: z.string().optional().describe('The name of the university.'),
        course: z.string().optional().describe("The student's course of study (e.g., B.Sc. Physics)."),
        currentYear: z.string().optional().describe("The student's current year of study (e.g., 1st, 2nd)."),
      }).optional(),
    }).optional().describe("The student's detailed educational background. All sub-fields are optional."),
  }).describe("The student profile information."),
  subject: z.string().describe('The subject of the lesson (e.g., Physics).'),
  lesson: z.string().describe('The specific lesson within the subject (e.g., Optics).'),
  topic: z.string().describe('The specific topic within the lesson for the Q&A (e.g., Refraction of Light). This is your primary knowledge base for this session.'),
  studentAnswer: z.string().optional().nullable().describe('The student\'s answer to the previous question from the AI tutor.'),
  previousQuestion: z.string().optional().nullable().describe('The previous question asked by the AI tutor to provide context.'),
  conversationHistory: z.string().optional().nullable().describe('A brief history of the current Q&A session to maintain context. Focus on the last few turns.'),
  currentStage: z.enum(['initial_material', 'deeper_material', 'out_of_syllabus', 'completed']).default('initial_material').optional()
    .describe("The current stage of the Q&A session for this topic. Default to 'initial_material' if not provided by the client."),
  questionsAskedInStage: z.number().default(0).optional()
    .describe("Number of questions already asked by AI in the current stage for this topic. Default to 0 if not provided."),
});
export type InteractiveQAndAInput = z.infer<typeof InteractiveQAndAInputSchema>;

const InteractiveQAndAOutputSchema = z.object({
  question: z.string().describe('The next question posed by the AI tutor, or a concluding remark if stage is "completed".'),
  feedback: z.string().optional().describe('Concise feedback on the student\'s answer (if provided).'),
  isCorrect: z.boolean().optional().describe('Indicates if the student\'s last answer was correct. Null if no answer was provided or not applicable.'),
  suggestions: z.array(z.string()).optional().describe("A list of 1-2 specific suggestions for further study within the current topic/stage."),
  nextStage: z.enum(['initial_material', 'deeper_material', 'out_of_syllabus', 'completed']).optional()
    .describe("The stage the AI suggests moving to next. If omitted, assume current stage continues. 'completed' means this topic session is finished."),
  isStageComplete: z.boolean().optional()
    .describe("True if the AI believes the current stage's objectives have been met and it's time to transition (or has transitioned).")
});
export type InteractiveQAndAOutput = z.infer<typeof InteractiveQAndAOutputSchema>;

export async function interactiveQAndA(input: InteractiveQAndAInput): Promise<InteractiveQAndAOutput> {
  return interactiveQAndAFlow(input);
}

const prompt = ai.definePrompt({
  name: 'interactiveQAndAPrompt',
  input: {schema: InteractiveQAndAInputSchema},
  output: {schema: InteractiveQAndAOutputSchema},
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: `You are a Focused Topic AI Tutor implementing a multi-stage Q&A strategy.
  Your KNOWLEDGE BASE for stages 'initial_material' and 'deeper_material' is STRICTLY LIMITED to:
  Subject: {{{subject}}}
  Lesson: {{{lesson}}}
  Topic: {{{topic}}}

  Student Profile:
  Name: {{{studentProfile.name}}}
  Age: {{{studentProfile.age}}}
  Country: {{{studentProfile.country}}}
  Preferred Language: {{{studentProfile.preferredLanguage}}}
  Educational Context: {{#with studentProfile.educationQualification}}{{#if boardExam.board}}Board: {{{boardExam.board}}}{{#if boardExam.standard}}, Standard: {{{boardExam.standard}}}{{/if}}{{/if}}{{#if competitiveExam.examType}}Exam: {{{competitiveExam.examType}}}{{#if competitiveExam.specificExam}} ({{{competitiveExam.specificExam}}}){{/if}}{{/if}}{{#if universityExam.universityName}}University: {{{universityExam.universityName}}}, Course: {{{universityExam.course}}}{{#if universityExam.currentYear}}, Year: {{{universityExam.currentYear}}}{{/if}}{{/if}}{{else}}General knowledge for age {{{studentProfile.age}}}, within '{{{topic}}}'.{{/with}}

  Conversation Context:
  {{#if conversationHistory}}Recent History (last few turns): {{{conversationHistory}}}{{/if}}
  {{#if previousQuestion}}Previous AI Question: "{{{previousQuestion}}}"{{/if}}
  {{#if studentAnswer}}Student's Answer to Previous Question: "{{{studentAnswer}}}"{{/if}}

  Current Q&A Stage: {{{currentStage}}}
  Questions Asked by AI in This Stage (before this turn): {{questionsAskedInStage}}

  Your Task:
  1.  **If a 'studentAnswer' is provided**: Evaluate it based *only* on the '{{{topic}}}' content (for 'initial_material' and 'deeper_material' stages). Set 'isCorrect'. Provide concise 'feedback' in {{{studentProfile.preferredLanguage}}}.
  2.  **If NO 'studentAnswer' is provided (e.g., start of a new stage after AI transition, or very first question of session)**: Set 'isCorrect' to null. 'feedback' can be null or a brief stage intro like "Let's start with some foundational questions." or "Now, let's explore this topic more deeply.".

  Stage-Specific Questioning Strategy:

  {{#if (eq currentStage "initial_material")}}
  **Current Stage: Initial Material Review (Target: 3-4 questions total in this stage)**
  *   Objective: Test foundational understanding of core concepts from '{{{topic}}}'.
  *   Action:
      *   If {{questionsAskedInStage}} < 3: Ask a new multiple-choice question (MCQ) about a core concept. Set 'nextStage' to 'initial_material' and 'isStageComplete' to false.
      *   If {{questionsAskedInStage}} >= 3: You've asked enough for this stage. Set 'nextStage' to 'deeper_material' and 'isStageComplete' to true. Your 'question' field should then contain the *first* question for the 'deeper_material' stage.
  {{else if (eq currentStage "deeper_material")}}
  **Current Stage: Deeper Material Analysis (Target: 2-3 questions total in this stage)**
  *   Objective: Ask analytical or connecting MCQs about '{{{topic}}}', requiring more than simple recall, but still within the material.
  *   Action:
      *   If {{questionsAskedInStage}} < 2: Ask a new analytical MCQ. Set 'nextStage' to 'deeper_material' and 'isStageComplete' to false.
      *   If {{questionsAskedInStage}} >= 2: You've asked enough. Set 'nextStage' to 'out_of_syllabus' and 'isStageComplete' to true. Your 'question' field should be the *first* question for 'out_of_syllabus'.
  {{else if (eq currentStage "out_of_syllabus")}}
  **Current Stage: Beyond the Syllabus (Target: 1-2 questions total in this stage)**
  *   Objective: Ask 1-2 MCQs or short-answer questions connecting '{{{topic}}}' to broader concepts or related fields.
  *   Action:
      *   If {{questionsAskedInStage}} < 1: Ask a new "beyond syllabus" question. Set 'nextStage' to 'out_of_syllabus' and 'isStageComplete' to false.
      *   If {{questionsAskedInStage}} >= 1: You've asked enough. Set 'nextStage' to 'completed' and 'isStageComplete' to true. Your 'question' field should be a concluding remark about the topic '{{{topic}}}'.
  {{else if (eq currentStage "completed")}}
  **Topic Completed**
  *   Your 'question' should be a polite concluding remark for the topic '{{{topic}}}' (e.g., "We've covered the key aspects of {{{topic}}}. Well done!"). Do not ask a new question.
  *   Set 'nextStage' to 'completed' and 'isStageComplete' to true. Feedback and suggestions are optional.
  {{/if}}

  Additional Rules:
  *   **Question Style (CRITICAL for 'initial_material' & 'deeper_material')**: Primarily use MCQs with 3-4 distinct options. For 'out_of_syllabus', MCQs or direct short answer questions are fine.
  *   **Conciseness & Focus**: ONE question at a time.
  *   **Suggestions**: After feedback (if any) and asking a new question (unless stage is 'completed'), provide 1-2 'suggestions' for related aspects *within the current topic '{{{topic}}}'* relevant to the current stage's objective.
  *   **Language**: All 'question', 'feedback', 'suggestions' in {{{studentProfile.preferredLanguage}}}.
  *   **Output**: Ensure a single, valid JSON object matching output schema. Always populate 'nextStage'. If the current stage's question target is met or you deem it covered, set 'isStageComplete' to true; otherwise, false.
  *   **RAG Simulation**: For 'initial_material' & 'deeper_material', act as if retrieving info ONLY from '{{{topic}}}'. For 'out_of_syllabus', you may draw on related general knowledge.
  *   **Transition Question**: When 'isStageComplete' is true and 'nextStage' is different from 'currentStage' (and not 'completed'), the 'question' field in your output MUST be the *first* question for that 'nextStage'. Feedback (if any) should still be for the student's last answer in the *previous* stage.
  `,
  config: {
    temperature: 0.25, // Slightly lower for more focused, RAG-like behavior in early stages.
     safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  }
});

const interactiveQAndAFlow = ai.defineFlow(
  {
    name: 'interactiveQAndAFlow',
    inputSchema: InteractiveQAndAInputSchema,
    outputSchema: InteractiveQAndAOutputSchema,
  },
  async (inputUnsafe) => {
    // Ensure studentProfile.educationQualification and its sub-objects exist for Handlebars
    // Also ensure currentStage and questionsAskedInStage have defaults if not provided by client.
    const input = {
      ...inputUnsafe,
      studentProfile: {
        ...inputUnsafe.studentProfile,
        educationQualification: {
          boardExam: inputUnsafe.studentProfile.educationQualification?.boardExam || {},
          competitiveExam: inputUnsafe.studentProfile.educationQualification?.competitiveExam || {},
          universityExam: inputUnsafe.studentProfile.educationQualification?.universityExam || {},
        },
      },
      currentStage: inputUnsafe.currentStage || 'initial_material',
      questionsAskedInStage: inputUnsafe.questionsAskedInStage || 0,
    };

    const {output} = await prompt(input);

    if (output && output.question) {
        return {
            question: output.question,
            feedback: output.feedback || undefined,
            isCorrect: output.isCorrect === undefined ? undefined : output.isCorrect,
            suggestions: output.suggestions || [],
            nextStage: output.nextStage || input.currentStage, // Default to current stage if AI doesn't specify next
            isStageComplete: output.isStageComplete || false,
        };
    }
    
    console.warn("Interactive Q&A: AI output was malformed or missing question. Input:", JSON.stringify(input));
    return {
        question: `I'm having a bit of trouble formulating a question for the stage '${input.currentStage}' about ${input.topic}. Could you perhaps ask me something about it instead, or suggest where we should start?`,
        feedback: "Apologies, I couldn't process the last interaction fully.",
        isCorrect: undefined,
        suggestions: [],
        nextStage: input.currentStage, // Fallback to current stage
        isStageComplete: false, // Assume stage is not complete on error
    };
  }
);
