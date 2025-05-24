
'use server';
/**
 * @fileOverview This file defines a Genkit flow for conducting conversational Q&A sessions with a student.
 *
 * - conversationalQAndA - A function that initiates and manages the conversational Q&A flow.
 * - ConversationalQAndAInput - The input type for the conversationalQAndA function.
 * - ConversationalQAndAOutput - The return type for the conversationalQAndA function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
// Removed unused performWebSearch import

const ConversationalQAndAInputSchema = z.object({
  studentProfile: z.object({
    name: z.string().describe("The student's name."),
    age: z.number().describe("The student's age."),
    gender: z.string().describe("The student's gender."),
    country: z.string().describe("The student's country."),
    state: z.string().describe("The student's state/province."),
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
        collegeName: z.string().optional().describe('The name of the college, if applicable.'),
        course: z.string().optional().describe("The student's course of study (e.g., B.Sc. Physics)."),
        currentYear: z.string().optional().describe("The student's current year of study (e.g., 1st, 2nd)."),
      }).optional(),
    }).optional().describe("The student's detailed educational background, specifying board, exam, or university details. All sub-fields are optional."),
  }).describe("The student profile information from the onboarding form."),
  subject: z.string().optional().describe('The main subject of study (e.g., "Physics for 12th Standard CBSE").'),
  lesson: z.string().optional().describe('The lesson within the subject (e.g., "Optics").'),
  topic: z.string().optional().describe('The specific topic of focus (e.g., "Refraction of Light").'),
  question: z.string().describe("The student's question or request for the study session."),
  conversationHistory: z.string().optional().describe("The history of the current conversation to provide context."),
  photoDataUri: z.string().optional().nullable().describe("An optional photo uploaded by the student, as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type ConversationalQAndAInput = z.infer<typeof ConversationalQAndAInputSchema>;

const ConversationalQAndAOutputSchema = z.object({
  response: z.string().describe("The AI tutor's response to the student's question, including explanations, study materials, and examples. This can also be a follow-up question from the AI."),
  suggestions: z.array(z.string()).describe("A list of 2-3 suggestions (like links to official educational board websites, reputable academic resources, or specific textbook names) for further study on the topic, relevant to the student's curriculum and country/region."),
});
export type ConversationalQAndAOutput = z.infer<typeof ConversationalQAndAOutputSchema>;

export async function conversationalQAndA(input: ConversationalQAndAInput): Promise<ConversationalQAndAOutput> {
  return conversationalQAndAFlow(input);
}

const prompt = ai.definePrompt({
  name: 'conversationalQAndAPrompt',
  input: {schema: ConversationalQAndAInputSchema},
  output: {schema: ConversationalQAndAOutputSchema},
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: `You are an expert AI Tutor and Learning Assistant. Your goal is to provide a personalized, supportive, and effective conversational Q&A session.
  Maintain a supportive, encouraging, and patient tone. Break down complex concepts into simple, understandable steps.
  Tailor your explanations, examples, and suggestions to the student's educational level, curriculum, country, and preferred language.

  Student Profile:
  Name: {{{studentProfile.name}}}
  Age: {{{studentProfile.age}}}
  Country: {{{studentProfile.country}}}
  Preferred Language for Explanations: {{{studentProfile.preferredLanguage}}}

  Educational Context:
  {{#with studentProfile.educationQualification}}
    {{#if boardExam.board}}Focus: Board Exam - {{{boardExam.board}}}{{#if boardExam.standard}}, Standard {{{boardExam.standard}}}{{/if}}. Curriculum: {{{boardExam.board}}} syllabus.{{/if}}
    {{#if competitiveExam.examType}}Focus: Competitive Exam - {{{competitiveExam.examType}}}{{#if competitiveExam.specificExam}}, Specific: {{{competitiveExam.specificExam}}}{{/if}}. Curriculum: Syllabus for {{{competitiveExam.specificExam}}}{{/if}}
    {{#if universityExam.universityName}}Focus: University - {{{universityExam.universityName}}}, Course: {{{universityExam.course}}}{{#if universityExam.currentYear}}, Year {{{universityExam.currentYear}}}{{/if}}. Curriculum: {{{universityExam.course}}} syllabus.{{/if}}
  {{else}}
    Focus: General knowledge appropriate for age and location.
  {{/with}}

  Current Study Focus (if any):
  {{#if subject}}Subject: {{{subject}}}{{/if}}
  {{#if lesson}}Lesson: {{{lesson}}}{{/if}}
  {{#if topic}}Topic: {{{topic}}}{{/if}}

  Conversation History (if any):
  {{{conversationHistory}}}

  Student's Latest Question/Input: "{{{question}}}"

  {{#if photoDataUri}}
  Student provided image for context:
  {{media url=photoDataUri}}
  {{/if}}

  Instructions:
  1.  **Understand and Respond**: Analyze the student's question in the context of their profile, the ongoing conversation, and any provided image.
      *   If it's a new topic/question: Provide a clear explanation, examples, and if appropriate, ask a follow-up question to gauge understanding.
      *   If it's a response to your previous question: Evaluate their answer.
          *   Correct: Acknowledge and ask a slightly more advanced or related question.
          *   Incorrect/Partially Correct: Gently provide the correct answer with explanation, then ask a clarifying or simpler related question.
      *   If the student asks for an in-depth tutorial: Provide detailed explanation, examples. If a visual aid could help, describe what it would look like (e.g., "A bar chart showing X vs Y would be helpful here").
  2.  **Study Material Integration**: Weave explanations, definitions, and examples directly into your response.
  3.  **External Suggestions**: Provide 2-3 high-quality, specific "suggestions" for further study (official educational board websites, national portals, reputable academic resources, specific textbooks). Avoid commercial platforms or other AI tutors.
  4.  **Image Context**: If an image is provided, use it to understand and answer the question.
  5.  **Language**: Respond in the student's preferred language ({{{studentProfile.preferredLanguage}}}).
  6.  **Conversational Flow**: Maintain a natural, conversational flow. End your response with a question to encourage interaction, unless the student's input clearly indicates an end to the current line of inquiry.
  7. **Format**: Ensure your output is a single JSON object with "response" and "suggestions".
  `,
  config: {
    temperature: 0.6, // Slightly increased for more conversational responses
     safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
    ],
  }
});

const conversationalQAndAFlow = ai.defineFlow(
  {
    name: 'conversationalQAndAFlow',
    inputSchema: ConversationalQAndAInputSchema,
    outputSchema: ConversationalQAndAOutputSchema,
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
    if (output && output.response && Array.isArray(output.suggestions)) {
        return output;
    }
    // Fallback response if AI output is malformed
    return {
        response: "I'm having a little trouble understanding that. Could you try rephrasing or asking something else?",
        suggestions: []
    };
  }
);
