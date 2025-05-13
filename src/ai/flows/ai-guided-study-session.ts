'use server';
/**
 * @fileOverview This file defines a Genkit flow for conducting AI-guided study sessions.
 *
 * - aiGuidedStudySession - A function that initiates and manages the AI-guided study session flow.
 * - AIGuidedStudySessionInput - The input type for the aiGuidedStudySession function.
 * - AIGuidedStudySessionOutput - The return type for the aiGuidedStudySession function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIGuidedStudySessionInputSchema = z.object({
  studentProfile: z.object({
    name: z.string().describe('The student\'s name.'),
    age: z.number().describe('The student\'s age.'),
    gender: z.string().describe('The student\'s gender.'),
    country: z.string().describe('The student\'s country.'),
    state: z.string().describe('The student\'s state/province.'),
    preferredLanguage: z.string().describe('The student\'s preferred language for learning.'),
    educationQualification: z.object({
      boardExam: z.object({
        board: z.string().describe('The board exam name (e.g., CBSE, State Board Name).'),
        standard: z.string().describe('The student\'s current standard (e.g., 10th, 12th).'),
      }).optional(),
      competitiveExam: z.object({
        examType: z.string().describe('The type of competitive exam (e.g., JEE, NEET, UPSC).'),
        specificExam: z.string().describe('The specific competitive exam or job position (e.g., JEE Main, UPSC CSE).'),
      }).optional(),
      universityExam: z.object({
        universityName: z.string().describe('The name of the university.'),
        collegeName: z.string().optional().describe('The name of the college, if applicable.'),
        course: z.string().describe('The student\'s course of study (e.g., B.Sc. Physics).'),
        currentYear: z.string().describe('The student\'s current year of study (e.g., 1st, 2nd).'),
      }).optional(),
    }).describe('The student\'s detailed educational background, specifying board, exam, or university details.'),
  }).describe('The student profile information from the onboarding form.'),
  subject: z.string().optional().describe('The main subject of study (e.g., "Physics for 12th Standard CBSE").'),
  lesson: z.string().optional().describe('The lesson within the subject (e.g., "Optics").'),
  specificTopic: z.string().describe('The specific topic of focus (e.g., "Refraction of Light", or "General Discussion" if it is a general tutor query not tied to a pre-selected subject/lesson/topic path).'),
  question: z.string().describe('The student\'s question or request for the study session.'),
});
export type AIGuidedStudySessionInput = z.infer<typeof AIGuidedStudySessionInputSchema>;

const AIGuidedStudySessionOutputSchema = z.object({
  response: z.string().describe('The AI tutor\'s response to the student\'s question, including explanations, study materials, and examples tailored to their educational context and preferred language. The response should be comprehensive and directly address the query based on the student\'s specific curriculum if applicable.'),
  suggestions: z.array(z.string()).describe('A list of 2-3 real-time external source suggestions (like links to official educational board websites, reputable academic resources, or specific textbook names) for further study on the topic, relevant to the student\'s curriculum and country/region.'),
});
export type AIGuidedStudySessionOutput = z.infer<typeof AIGuidedStudySessionOutputSchema>;

export async function aiGuidedStudySession(input: AIGuidedStudySessionInput): Promise<AIGuidedStudySessionOutput> {
  return aiGuidedStudySessionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiGuidedStudySessionPrompt',
  input: {schema: AIGuidedStudySessionInputSchema},
  output: {schema: AIGuidedStudySessionOutputSchema},
  prompt: `You are an expert AI Tutor. Your goal is to provide a personalized and effective study session for a student based on their detailed profile and specific query.
  Tailor your explanations, examples, and suggestions to their educational level, curriculum (e.g., specific board, standard, exam syllabus, or university course), country, and preferred language.

  Student Profile:
  Name: {{{studentProfile.name}}}
  Age: {{{studentProfile.age}}}
  Gender: {{{studentProfile.gender}}}
  Country: {{{studentProfile.country}}}
  State/Province: {{{studentProfile.state}}}
  Preferred Language for Learning: {{{studentProfile.preferredLanguage}}}

  Educational Context:
  {{#with studentProfile.educationQualification}}
    {{#if boardExam.board}}
    Studying for: Board Exam
    Board: {{{boardExam.board}}}
    Standard/Grade: {{{boardExam.standard}}}
    Curriculum Focus: Material relevant to the {{{boardExam.board}}} syllabus for {{{boardExam.standard}}} standard in {{{studentProfile.country}}}.
    {{/if}}
    {{#if competitiveExam.examType}}
    Preparing for: Competitive Exam
    Exam Type: {{{competitiveExam.examType}}}
    Specific Exam: {{{competitiveExam.specificExam}}}
    Curriculum Focus: Material relevant to the syllabus of {{{competitiveExam.specificExam}}} ({{{competitiveExam.examType}}}) in {{{studentProfile.country}}}.
    {{/if}}
    {{#if universityExam.universityName}}
    Attending: University
    University: {{{universityExam.universityName}}}
    {{#if universityExam.collegeName}}College: {{{universityExam.collegeName}}}{{/if}}
    Course: {{{universityExam.course}}}
    Year: {{{universityExam.currentYear}}}
    Curriculum Focus: Material relevant to the {{{universityExam.course}}} curriculum for year {{{universityExam.currentYear}}} at {{{universityExam.universityName}}} in {{{studentProfile.country}}}.
    {{/if}}
  {{/with}}

  Current Study Focus:
  {{#if subject}}Subject: {{{subject}}}{{/if}}
  {{#if lesson}}Lesson: {{{lesson}}}{{/if}}
  Topic: {{{specificTopic}}}

  Student's Question/Request: "{{{question}}}"

  Instructions for AI Tutor:
  1.  **Understand the Context**: Deeply analyze the student's profile, especially their educational qualification (board, standard, exam, course, year, country, state) to understand their specific curriculum and learning level.
  2.  **Personalized Response**: Craft your "response" in the student's preferred language ({{{studentProfile.preferredLanguage}}}). Address the student's "{{{question}}}" directly and comprehensively.
      *   If the question is a greeting or general, provide a welcoming response and ask how you can help with the specified topic, considering their educational context.
      *   If about a specific concept: Explain it clearly with examples relevant to their syllabus (e.g., examples from their prescribed textbooks if known, or typical examples for their level and region).
      *   If asking for problems: Provide a few relevant problems aligning with their curriculum's difficulty.
      *   If stuck: Offer hints, break down the problem, or explain prerequisite concepts they might be missing.
  3.  **Study Materials in Response**: Integrate study material directly into your response. This means clear explanations, definitions, examples, and step-by-step solutions where appropriate.
  4.  **External Suggestions**: Provide 2-3 "suggestions" for further study. These should be high-quality, specific external resources.
      *   Preferably, suggest official sources like specific pages on their educational board's website (e.g., {{{studentProfile.educationQualification.boardExam.board}}} website if applicable), national educational portals for {{{studentProfile.country}}}, or specific, reputable textbooks or academic websites known to be used for their curriculum.
      *   If official sources are hard to pinpoint, suggest well-regarded open educational resources or university course pages relevant to the topic and student's level.
      *   Example: For a CBSE student in India, you might suggest a link to NCERT textbook PDFs or relevant sections on the CBSE academic website.
  5.  **Tone**: Maintain a supportive, encouraging, and patient tone.
  6.  **Format**: Ensure your entire output is a single JSON object with "response" and "suggestions" fields.

  Consider the student's country ({{{studentProfile.country}}}) and state ({{{studentProfile.state}}}) for tailoring content, especially if state-specific curriculum or resources are relevant.
  If 'specificTopic' is "General Discussion", "Homework Help", or similar, adapt your response to be a general academic assistant, still using the student's profile for context but without a narrow predefined topic.
  `,
  config: {
    temperature: 0.4, // Slightly higher for more conversational and varied responses, but still grounded.
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

const aiGuidedStudySessionFlow = ai.defineFlow(
  {
    name: 'aiGuidedStudySessionFlow',
    inputSchema: AIGuidedStudySessionInputSchema,
    outputSchema: AIGuidedStudySessionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    // Ensure a valid output structure even if AI fails to provide one
    if (output && output.response && Array.isArray(output.suggestions)) {
        return output;
    }
    // Fallback response if AI output is malformed
    return {
        response: "I'm having a little trouble formulating a full response right now. Could you try rephrasing or asking something else about the topic? Please ensure your question is clear.",
        suggestions: []
    };
  }
);

