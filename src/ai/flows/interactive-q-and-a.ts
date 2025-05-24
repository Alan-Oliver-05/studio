
'use server';

/**
 * @fileOverview This file defines a Genkit flow for interactive question and answer sessions with a student.
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
    // gender: z.string().optional().describe("The student's gender."), // Optional field
    country: z.string().describe("The student's country."),
    // state: z.string().optional().describe("The student's state/province."), // Optional field
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
        // collegeName: z.string().optional().describe('The name of the college, if applicable.'), // Optional field
        course: z.string().optional().describe("The student's course of study (e.g., B.Sc. Physics)."),
        currentYear: z.string().optional().describe("The student's current year of study (e.g., 1st, 2nd)."),
      }).optional(),
    }).optional().describe("The student's detailed educational background. All sub-fields are optional."),
  }).describe("The student profile information."),
  subject: z.string().describe('The subject of the lesson (e.g., Physics).'),
  lesson: z.string().describe('The specific lesson within the subject (e.g., Optics).'),
  topic: z.string().describe('The specific topic within the lesson for the Q&A (e.g., Refraction of Light).'),
  studentAnswer: z.string().optional().nullable().describe('The student\'s answer to the previous question from the AI tutor.'),
  previousQuestion: z.string().optional().nullable().describe('The previous question asked by the AI tutor to provide context.'),
  conversationHistory: z.string().optional().nullable().describe('A brief history of the current Q&A session to maintain context.'),
});
export type InteractiveQAndAInput = z.infer<typeof InteractiveQAndAInputSchema>;

const InteractiveQAndAOutputSchema = z.object({
  question: z.string().describe('The next question posed by the AI tutor, relevant to the topic and previous interaction.'),
  feedback: z.string().optional().describe('Feedback on the student\'s answer (if provided). This should be encouraging and explain correctness or errors.'),
  isCorrect: z.boolean().optional().describe('Indicates if the student\'s last answer was correct. Null if no answer was provided.'),
  suggestions: z.array(z.string()).optional().describe("A list of 2-3 specific suggestions for further study on the topic, relevant to the student's curriculum and country/region."),
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
  prompt: `You are an AI Tutor conducting an interactive Q&A session. Your goal is to test and improve the student's understanding of a specific topic.

  Student Profile:
  Name: {{{studentProfile.name}}}
  Age: {{{studentProfile.age}}}
  Country: {{{studentProfile.country}}}
  Preferred Language: {{{studentProfile.preferredLanguage}}}
  Educational Context: (Use this to tailor question difficulty and examples)
  {{#with studentProfile.educationQualification}}
    {{#if boardExam.board}}Board: {{{boardExam.board}}}{{#if boardExam.standard}}, Standard: {{{boardExam.standard}}}{{/if}}{{/if}}
    {{#if competitiveExam.examType}}Exam: {{{competitiveExam.examType}}}{{#if competitiveExam.specificExam}} ({{{competitiveExam.specificExam}}}){{/if}}{{/if}}
    {{#if universityExam.universityName}}University: {{{universityExam.universityName}}}, Course: {{{universityExam.course}}}{{#if universityExam.currentYear}}, Year: {{{universityExam.currentYear}}}{{/if}}{{/if}}
  {{else}}General knowledge for age {{{studentProfile.age}}}.{{/with}}

  Current Subject: {{{subject}}}
  Current Lesson: {{{lesson}}}
  Current Topic: {{{topic}}}

  Conversation Context:
  {{#if conversationHistory}}History: {{{conversationHistory}}}{{/if}}
  {{#if previousQuestion}}Previous AI Question: "{{{previousQuestion}}}"{{/if}}
  {{#if studentAnswer}}Student's Answer to Previous Question: "{{{studentAnswer}}}"{{/if}}

  Your Task:
  1.  **If a 'studentAnswer' is provided**:
      *   Evaluate if the answer is correct for the 'previousQuestion'. Set 'isCorrect' (true/false).
      *   Provide concise 'feedback' in {{{studentProfile.preferredLanguage}}}. If incorrect, explain why and provide the correct concept/answer. Be encouraging.
      *   Then, formulate a new 'question' related to the 'topic', building upon the previous interaction or exploring a new facet.
  2.  **If NO 'studentAnswer' is provided (or it's the start of Q&A for this topic)**:
      *   Set 'isCorrect' to null or omit it. 'feedback' can be a welcoming message or null.
      *   Formulate an initial 'question' about the 'topic' ({{{topic}}}), appropriate for the student's profile.
  3.  **Question Style**: Questions should be clear, targeted, and assess understanding. They can be multiple-choice (provide options A, B, C, D), fill-in-the-blank, or short answer.
  4.  **Suggestions**: Optionally provide 1-2 'suggestions' for further study if relevant (e.g., specific sub-topics, related concepts). These should be very brief and actionable.
  5.  **Language**: All 'question' and 'feedback' must be in {{{studentProfile.preferredLanguage}}}.
  6.  **JSON Output**: Ensure the entire output is a single, valid JSON object matching the output schema.
  `,
  config: {
    temperature: 0.5, // Slightly lower for more focused questions/feedback
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
            isCorrect: output.isCorrect === undefined ? undefined : output.isCorrect, // Handle null/undefined for isCorrect
            suggestions: output.suggestions || [],
        };
    }
    
    // Fallback response if AI output is malformed
    console.warn("Interactive Q&A: AI output was malformed or missing question. Input:", JSON.stringify(robustInput));
    return {
        question: `I'm having a bit of trouble formulating a question right now about ${input.topic}. Could you perhaps ask me something about it instead, or suggest where we should start?`,
        feedback: "Apologies, I couldn't process the last interaction fully.",
        isCorrect: undefined,
        suggestions: []
    };
  }
);
