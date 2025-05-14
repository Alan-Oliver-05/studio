
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
  specificTopic: z.string().describe('The specific topic of focus (e.g., "Refraction of Light", or "General Discussion", "AI Learning Assistant Chat", "Homework Help" if it is a general tutor query not tied to a pre-selected subject/lesson/topic path).'),
  question: z.string().describe('The student\'s question or request for the study session.'),
  photoDataUri: z.string().optional().describe("An optional photo uploaded by the student, as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type AIGuidedStudySessionInput = z.infer<typeof AIGuidedStudySessionInputSchema>;

const VisualElementSchema = z.object({
  type: z.enum(['bar_chart_data', 'line_chart_data', 'flowchart_description', 'image_generation_prompt']).describe('The type of visual element suggested.'),
  content: z.any().describe('Structured data for charts (e.g., array of objects for bar/line charts), textual description for flowcharts, or a string prompt for image generation.'),
  caption: z.string().optional().describe('A brief caption or title for the visual element.'),
}).describe('A structured representation of a visual aid suggested by the AI.');

const AIGuidedStudySessionOutputSchema = z.object({
  response: z.string().describe('The AI tutor\'s response to the student\'s question, including explanations, study materials, and examples tailored to their educational context and preferred language. The response should be comprehensive and directly address the query based on the student\'s specific curriculum if applicable.'),
  suggestions: z.array(z.string()).describe('A list of 2-3 real-time external source suggestions (like links to official educational board websites, reputable academic resources, or specific textbook names) for further study on the topic, relevant to the student\'s curriculum and country/region.'),
  visualElement: VisualElementSchema.optional().describe('An optional visual element to aid understanding. This could be data for a chart, a description for a flowchart, or a prompt for image generation.'),
});
export type AIGuidedStudySessionOutput = z.infer<typeof AIGuidedStudySessionOutputSchema>;

export async function aiGuidedStudySession(input: AIGuidedStudySessionInput): Promise<AIGuidedStudySessionOutput> {
  return aiGuidedStudySessionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiGuidedStudySessionPrompt',
  input: {schema: AIGuidedStudySessionInputSchema},
  output: {schema: AIGuidedStudySessionOutputSchema},
  prompt: `You are an expert AI Tutor and Learning Assistant. Your goal is to provide a personalized and effective study session for a student based on their detailed profile and specific query.
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

  {{#if photoDataUri}}
  Student provided image for context:
  {{media url=photoDataUri}}
  {{/if}}

  Instructions for AI Tutor:
  1.  **Understand the Context**: Deeply analyze the student's profile, especially their educational qualification (board, standard, exam, course, year, country, state) to understand their specific curriculum and learning level.
  2.  **Personalized Response**: Craft your "response" in the student's preferred language ({{{studentProfile.preferredLanguage}}}). Address the student's "{{{question}}}" directly and comprehensively.
      *   If the question is a greeting or general (e.g., topic is "General Discussion", "AI Learning Assistant Chat"), provide a welcoming response and ask how you can help, considering their educational context and any uploaded image.
      *   If about a specific concept: Explain it clearly with examples relevant to their syllabus (e.g., examples from their prescribed textbooks if known, or typical examples for their level and region).
      *   If asking for help with problems (e.g. math equations, science problems): Break down complex problems into simple, understandable, step-by-step solutions. Explain each step clearly.
      *   If stuck: Offer hints, break down the problem, or explain prerequisite concepts they might be missing.
      *   If an image is provided (see "Student provided image for context"), use it to understand and answer the question. For example, if it's an image of a math problem, help solve it. If it's a diagram, explain it.
  3.  **Study Materials in Response**: Integrate study material directly into your response. This means clear explanations, definitions, examples, and step-by-step solutions where appropriate.
  4.  **External Suggestions**: Provide 2-3 "suggestions" for further study. These should be high-quality, specific external resources.
      *   Preferably, suggest official sources like specific pages on their educational board's website (e.g., {{{studentProfile.educationQualification.boardExam.board}}} website if applicable), national educational portals for {{{studentProfile.country}}}, or specific, reputable textbooks or academic websites known to be used for their curriculum.
      *   If official sources are hard to pinpoint, suggest well-regarded open educational resources or university course pages relevant to the topic and student's level.
  5.  **Visual Explanations (Textual Description)**: If the student asks for visual explanations or if it would significantly aid understanding, describe in your main 'response' text how a graph, chart, or flowchart could represent the information. You can also provide data points that could be used to create such visuals.
  6.  **Visual Element Output (Structured Data)**: If you determine a visual explanation is highly beneficial (as per instruction 5), in addition to describing it in your main 'response' text, ALSO populate the 'visualElement' output field.
      *   For charts (bar, line): Set 'type' to 'bar_chart_data' or 'line_chart_data'. For 'content', provide an array of data objects suitable for charting (e.g., \`[{ "name": "Category A", "value": 30 }, { "name": "Category B", "value": 50 }]\`). Include a 'caption'.
      *   For flowcharts: Set 'type' to 'flowchart_description'. For 'content', provide a textual description of the flowchart steps or an array of step objects (e.g., \`[{ "id": "1", "text": "Start" }, { "id": "2", "text": "Process A"}]\`). Include a 'caption'.
      *   If you believe an image would be best: Set 'type' to 'image_generation_prompt'. For 'content', provide a concise, descriptive prompt string for an image generation model (e.g., "a diagram illustrating the water cycle with labels for evaporation, condensation, precipitation"). Include a 'caption'.
      *   This 'visualElement' field is intended for the application to potentially render the visual. If no visual is strongly appropriate, leave 'visualElement' undefined.
  7.  **Tone**: Maintain a supportive, encouraging, and patient tone.
  8.  **Format**: Ensure your entire output is a single JSON object with "response", "suggestions", and optionally "visualElement" fields.

  Consider the student's country ({{{studentProfile.country}}}) and state ({{{studentProfile.state}}}) for tailoring content, especially if state-specific curriculum or resources are relevant.
  If 'specificTopic' is "General Discussion", "AI Learning Assistant Chat", "Homework Help", or similar, adapt your response to be a general academic assistant, still using the student's profile for context but without a narrow predefined topic unless specified in the question.
  `,
  config: {
    temperature: 0.5, 
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
    
    if (output && output.response && Array.isArray(output.suggestions)) {
        // visualElement is optional, so we don't need to check for its presence for a valid output
        return output;
    }
    
    console.warn("AI output was malformed or missing. Input was:", JSON.stringify(input)); // Log malformed input for debugging
    // Fallback response if AI output is malformed
    return {
        response: "I'm having a little trouble formulating a full response right now. Could you try rephrasing or asking something else about the topic? Please ensure your question is clear and any uploaded image is relevant.",
        suggestions: []
        // visualElement will be undefined here by default
    };
  }
);

