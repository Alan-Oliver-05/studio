
'use server';

/**
 * @fileOverview This file defines a Genkit flow for interactive question and answer sessions with a student,
 * acting as a focused RAG-like tutor for a specific topic.
 *
 * - interactiveQAndA - A function that initiates and manages the interactive Q&A flow.
 * - InteractiveQAndAInput - The input type for the interactiveQAndA function.
 * - InteractiveQAndAOutput - The return type for the interactiveQAndA function.
 */

import {ai} from '@/ai/genkit';
import {z}
from 'genkit';

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
});
export type InteractiveQAndAInput = z.infer<typeof InteractiveQAndAInputSchema>;

const InteractiveQAndAOutputSchema = z.object({
  question: z.string().describe('The next question posed by the AI tutor, strictly relevant to the topic and previous interaction, acting as if retrieved from the topic\'s content.'),
  feedback: z.string().optional().describe('Concise feedback on the student\'s answer (if provided). This should be encouraging and explain correctness or errors based SOLELY on the topic\'s content.'),
  isCorrect: z.boolean().optional().describe('Indicates if the student\'s last answer was correct, based on the topic. Null if no answer was provided.'),
  suggestions: z.array(z.string()).optional().describe("A list of 1-2 highly specific suggestions for sub-topics or related concepts within the CURRENT topic for further study."),
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
  prompt: `You are a Focused Topic AI Tutor. Your primary goal is to conduct a RAG-style interactive Q&A session.
  Your KNOWLEDGE BASE for this session is STRICTLY LIMITED to the provided:
  Subject: {{{subject}}}
  Lesson: {{{lesson}}}
  Topic: {{{topic}}}

  You MUST act as if you are retrieving all information, questions, and feedback SOLELY from the content defined by this Subject-Lesson-Topic hierarchy. DO NOT use external knowledge.

  Student Profile:
  Name: {{{studentProfile.name}}}
  Age: {{{studentProfile.age}}}
  Country: {{{studentProfile.country}}}
  Preferred Language: {{{studentProfile.preferredLanguage}}}
  Educational Context: (Use this to tailor question difficulty and examples, still within the topic's scope)
  {{#with studentProfile.educationQualification}}
    {{#if boardExam.board}}Board: {{{boardExam.board}}}{{#if boardExam.standard}}, Standard: {{{boardExam.standard}}}{{/if}}{{/if}}
    {{#if competitiveExam.examType}}Exam: {{{competitiveExam.examType}}}{{#if competitiveExam.specificExam}} ({{{competitiveExam.specificExam}}}){{/if}}{{/if}}
    {{#if universityExam.universityName}}University: {{{universityExam.universityName}}}, Course: {{{universityExam.course}}}{{#if universityExam.currentYear}}, Year: {{{universityExam.currentYear}}}{{/if}}{{/if}}
  {{else}}General knowledge for age {{{studentProfile.age}}}, within the scope of '{{{topic}}}'.{{/with}}

  Conversation Context:
  {{#if conversationHistory}}Recent History (last few turns): {{{conversationHistory}}}{{/if}}
  {{#if previousQuestion}}Previous AI Question: "{{{previousQuestion}}}"{{/if}}
  {{#if studentAnswer}}Student's Answer to Previous Question: "{{{studentAnswer}}}"{{/if}}

  Your Task (Strictly follow these rules):
  1.  **Information Retrieval (Simulated)**: Before responding, internally "retrieve" relevant facts or concepts ONLY from the defined '{{{topic}}}' within '{{{lesson}}}' and '{{{subject}}}'.
  2.  **If a 'studentAnswer' is provided**:
      *   Evaluate if the answer is correct based *only* on the '{{{topic}}}' content. Set 'isCorrect' (true/false).
      *   Provide concise 'feedback' in {{{studentProfile.preferredLanguage}}}. If incorrect, explain why using information *only* from '{{{topic}}}' and provide the correct concept/answer from '{{{topic}}}'. Be encouraging.
      *   Then, formulate a new, single, clear 'question' directly related to the '{{{topic}}}'. This question should build upon the previous interaction or explore a new facet of '{{{topic}}}'.
  3.  **If NO 'studentAnswer' is provided (or it's the start of Q&A for this topic)**:
      *   Set 'isCorrect' to null or omit it. 'feedback' can be a brief welcoming message or null.
      *   Formulate an initial, single, clear 'question' about the '{{{topic}}}', appropriate for the student's profile and derived *only* from the '{{{topic}}}' content.
  4.  **Question Style**: Questions must be clear, targeted, and assess understanding of '{{{topic}}}'. They can be multiple-choice (provide options A, B, C, D), fill-in-the-blank, or short answer. Ensure questions are answerable from the presumed content of '{{{topic}}}'.
  5.  **Conciseness & Focus**: Your responses (feedback and questions) must be concise and directly relevant to '{{{topic}}}'. Ask ONE question at a time.
  6.  **Suggestions**: Optionally provide 1-2 'suggestions' for further study, but these MUST be sub-topics or related concepts *within the current '{{{topic}}}' itself*. Do not suggest going outside '{{{topic}}}'.
  7.  **Language**: All 'question' and 'feedback' must be in {{{studentProfile.preferredLanguage}}}.
  8.  **JSON Output**: Ensure the entire output is a single, valid JSON object matching the output schema.
  9.  **Awareness**: Maintain awareness of the conversation flow. If the student seems confused, simplify. If they are doing well, you can subtly increase complexity *within the topic*.
  10. **No External Knowledge**: Reiterate: Do NOT use any information outside of what can be reasonably assumed to be part of '{{{topic}}}' as defined by '{{{subject}}}' and '{{{lesson}}}'.
  `,
  config: {
    temperature: 0.3, // Lower temperature for more focused, factual Q&A based on "retrieved" context.
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
  async input => {
    const robustInput = { // Ensure nested objects exist for Handlebars
      ...input,
      studentProfile: {
        ...input.studentProfile,
        educationQualification: {
          boardExam: input.studentProfile.educationQualification?.boardExam || {},
          competitiveExam: input.studentProfile.educationQualification?.competitiveExam || {},
          universityExam: input.studentProfile.educationQualification?.universityExam || {},
        },
      },
    };

    const {output} = await prompt(robustInput);

    if (output && output.question) { // Ensure at least a question is present
        return {
            question: output.question,
            feedback: output.feedback || undefined,
            isCorrect: output.isCorrect === undefined ? undefined : output.isCorrect,
            suggestions: output.suggestions || [],
        };
    }
    
    // Fallback response if AI output is malformed
    console.warn("Interactive Q&A: AI output was malformed or missing question. Input:", JSON.stringify(robustInput));
    return {
        question: `I'm having a bit of trouble formulating a question right now about ${input.topic}. Could you perhaps ask me something about it instead, or suggest where we should start? (Ensure your question is related to the topic: ${input.topic})`,
        feedback: "Apologies, I couldn't process the last interaction fully.",
        isCorrect: undefined,
        suggestions: []
    };
  }
);

