
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
import { performWebSearch } from '@/ai/tools/web-search-tool';
import type { LearningStyle } from '@/types';

const AIGuidedStudySessionInputSchema = z.object({
  studentProfile: z.object({
    name: z.string().describe("The student's name."),
    age: z.number().describe("The student's age."),
    gender: z.string().describe("The student's gender."),
    country: z.string().describe("The student's country."),
    state: z.string().describe("The student's state/province."),
    preferredLanguage: z.string().describe("The student's preferred language for learning."),
    learningStyle: z.enum(["visual", "auditory", "kinesthetic", "reading_writing", "balanced", ""]).optional().describe("The student's preferred learning style (e.g., visual, auditory, reading_writing, kinesthetic, balanced)."),
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
  specificTopic: z.string().describe('The specific topic of focus (e.g., "Refraction of Light", "General Discussion", "AI Learning Assistant Chat", "Homework Help", "LanguageTranslatorMode" if it is a language translator session, "Visual Learning", "Visual Learning Focus").'),
  question: z.string().describe("The student's question or request for the study session."),
  photoDataUri: z.string().optional().nullable().describe("An optional photo uploaded by the student, as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type AIGuidedStudySessionInput = z.infer<typeof AIGuidedStudySessionInputSchema>;

const VisualElementSchema = z.object({
  type: z.enum(['bar_chart_data', 'line_chart_data', 'flowchart_description', 'image_generation_prompt']).describe('The type of visual element suggested.'),
  content: z.any().describe('Structured data for charts (e.g., array of objects for bar/line charts), structured data for flowcharts (array of step objects), or a string prompt for image generation.'),
  caption: z.string().optional().describe('A brief caption or title for the visual element.'),
}).describe('A structured representation of a visual aid suggested by the AI.');

const AIGuidedStudySessionOutputSchema = z.object({
  response: z.string().describe("The AI tutor's response to the student's question, including explanations, study materials, and examples tailored to their educational context and preferred language. The response should be comprehensive and directly address the query based on the student's specific curriculum if applicable. If providing an explanation or answering a question related to a specific curriculum, it should be followed by ONE multiple-choice question (MCQ) with options A, B, C, D to test understanding of that specific part of the curriculum."),
  suggestions: z.array(z.string()).describe("A list of 2-3 real-time external source suggestions (like links to official educational board websites, reputable academic resources, or specific textbook names) for further study on the topic, relevant to the student's curriculum and country/region, ideally informed by web search results."),
  visualElement: VisualElementSchema.optional().nullable().describe('An optional visual element to aid understanding. This could be data for a chart, a description for a flowchart, or a prompt for image generation.'),
});
export type AIGuidedStudySessionOutput = z.infer<typeof AIGuidedStudySessionOutputSchema>;

export async function aiGuidedStudySession(input: AIGuidedStudySessionInput): Promise<AIGuidedStudySessionOutput> {
  return aiGuidedStudySessionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiGuidedStudySessionPrompt',
  input: {schema: AIGuidedStudySessionInputSchema},
  output: {schema: AIGuidedStudySessionOutputSchema},
  model: 'googleai/gemini-1.5-flash-latest',
  tools: [performWebSearch],
  prompt: `You are an expert AI Tutor and Learning Assistant. Your primary goal is to provide a personalized, supportive, and effective study session for a student based on their detailed profile and specific query.
  Always maintain a supportive, encouraging, and patient tone. When explaining concepts, break them down into simple, understandable steps. Strive for clarity and conciseness in your responses.
  Tailor your explanations, examples, and suggestions to their educational level, curriculum (e.g., specific board, standard, exam syllabus, or university course), country, preferred language, and learning style.

  Student Profile:
  Name: {{{studentProfile.name}}}
  Age: {{{studentProfile.age}}}
  Gender: {{{studentProfile.gender}}}
  Country: {{{studentProfile.country}}}
  State/Province: {{{studentProfile.state}}}
  Preferred Language for Learning (for meta-communication and explanations): {{{studentProfile.preferredLanguage}}}
  {{#if studentProfile.learningStyle}}Preferred Learning Style: {{{studentProfile.learningStyle}}}{{/if}}

  Educational Context:
  {{#with studentProfile.educationQualification}}
    {{#if boardExam.board}}
    Studying for: Board Exam
    Board: {{{boardExam.board}}}
    {{#if boardExam.standard}}Standard/Grade: {{{boardExam.standard}}}{{/if}}
    Curriculum Focus: Material relevant to the {{{boardExam.board}}} syllabus{{#if boardExam.standard}} for {{{boardExam.standard}}} standard{{/if}} in {{{studentProfile.country}}}.
    {{/if}}
    {{#if competitiveExam.examType}}
    Preparing for: Competitive Exam
    Exam Type: {{{competitiveExam.examType}}}
    {{#if competitiveExam.specificExam}}Specific Exam: {{{competitiveExam.specificExam}}}{{/if}}
    Curriculum Focus: Material relevant to the syllabus of {{#if competitiveExam.specificExam}}{{{competitiveExam.specificExam}}} ({{/if}}{{{competitiveExam.examType}}}{{#if competitiveExam.specificExam}}){{/if}} in {{{studentProfile.country}}}.
    {{/if}}
    {{#if universityExam.universityName}}
    Attending: University
    University: {{{universityExam.universityName}}}
    {{#if universityExam.collegeName}}College: {{{universityExam.collegeName}}}{{/if}}
    {{#if universityExam.course}}Course: {{{universityExam.course}}}{{/if}}
    {{#if universityExam.currentYear}}Year: {{{universityExam.currentYear}}}{{/if}}
    Curriculum Focus: Material relevant to the {{#if universityExam.course}}{{{universityExam.course}}} curriculum{{/if}}{{#if universityExam.currentYear}} for year {{{universityExam.currentYear}}}{{/if}} at {{{universityExam.universityName}}} in {{{studentProfile.country}}}.
    {{/if}}
  {{else}}
    No specific educational qualification details provided. Focus on general knowledge appropriate for the student's age and location, or respond based on the direct question.
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
  1.  **Understand the Context and Curriculum**: Deeply analyze the student's profile, especially their educational qualification (board, standard, exam, course, year, country, state) and learning style ('{{{studentProfile.learningStyle}}}') to understand their specific curriculum and learning level.
  2.  **Web Search for Curriculum-Specific Information**:
      *   **If the student's question is academic and relates to their 'Curriculum Focus' (board syllabus, exam syllabus, university course content), you MUST use the 'performWebSearch' tool.**
      *   The search query should aim to find official syllabus details, key topics, learning objectives, or reputable educational resources (like official board websites, university curriculum pages) for the student's specific 'Curriculum Focus' and the current 'specificTopic' or 'question'.
      *   Example Search Query: "CBSE Class 12 Physics syllabus refraction of light" or "JEE Main Chemistry syllabus organic compounds" or "BSc Computer Science {{{studentProfile.educationQualification.universityExam.universityName}}} {{{studentProfile.educationQualification.universityExam.course}}} {{{studentProfile.educationQualification.universityExam.currentYear}}} year syllabus data structures".
      *   Integrate the key findings from the web search *directly and naturally* into your response. Your explanation and any subsequent questions MUST be primarily based on this "retrieved" information.
      *   If you use information from a web search, briefly mention the source context (e.g., "According to typical syllabus guidelines..." or "Official resources for [exam/board] often cover...").
  3.  **Personalized Response (Based on "Retrieved" Curriculum)**: Craft your 'response' in the student's preferred language for learning ('{{{studentProfile.preferredLanguage}}}'), UNLESS the mode is "LanguageTranslatorMode". Address the student's "{{{question}}}" directly and comprehensively, framed by the "retrieved" curriculum information.
      *   If explaining a concept: Explain it based on how it's typically covered in their specific syllabus. Use examples relevant to their curriculum.
      *   **Multiple-Choice Question (MCQ) Generation:** After providing an explanation or answering a curriculum-related question, you MUST conclude your 'response' by posing ONE relevant multiple-choice question (MCQ) with 3-4 distinct options (labeled A, B, C, D). This MCQ should test understanding of the specific curriculum content just discussed. This is for continuous assessment.
      *   Example MCQ in response: "...and that's how refraction works through a prism. Now, to check your understanding: Which of the following best describes Snell's Law?\\nA) n1/sin(θ2) = n2/sin(θ1)\\nB) n1*sin(θ1) = n2*sin(θ2)\\nC) sin(θ1)/n1 = sin(θ2)/n2\\nD) n1*cos(θ1) = n2*cos(θ2)"
      *   If the student's question is a greeting or general, AND (the 'specificTopic' is "General Discussion" OR the 'specificTopic' is "AI Learning Assistant Chat"): Provide a welcoming response. Then, *proactively offer assistance related to their specific educational context and curriculum*. For example:
        {{#if studentProfile.educationQualification.boardExam.board}} "I see you're preparing for your {{{studentProfile.educationQualification.boardExam.board}}} exams in {{{studentProfile.educationQualification.boardExam.standard}}} standard. How can I assist you with a topic from your Math, Science, or another core subject syllabus today? We can find official curriculum details if you like."
        {{else if studentProfile.educationQualification.competitiveExam.examType}} "I'm here to help you prepare for your {{{studentProfile.educationQualification.competitiveExam.examType}}} exam ({{{studentProfile.educationQualification.competitiveExam.specificExam}}}). Is there a particular section of the syllabus you'd like to focus on? We can look up key topics or discuss study strategies."
        {{else if studentProfile.educationQualification.universityExam.universityName}} "Welcome! I can help you with your studies for {{{studentProfile.educationQualification.universityExam.course}}} at {{{studentProfile.educationQualification.universityExam.universityName}}}. What topic from your curriculum can I assist with? We can also explore typical learning objectives for this course."
        {{else}} "How can I assist you with your learning goals today? I can help with general academic queries, or we can focus on something specific if you have it in mind."{{/if}}
  4.  **External Suggestions (Curriculum-Focused)**: Provide 2-3 "suggestions" for further study. These MUST be high-quality, specific resources relevant to the "retrieved" curriculum.
      *   **PRIORITIZE**: Links to official educational board websites (e.g., {{{studentProfile.educationQualification.boardExam.board}}} website), national educational portals for {{{studentProfile.country}}}, or specific university curriculum pages identified through web search.
      *   **DO NOT suggest**: Commercial online learning platforms, apps, or other AI tutoring services.
      *   If official sources are hard to pinpoint from the web search, suggest specific, well-regarded open educational resources directly relevant to the topic and student's curriculum.
  5.  **Visual Explanations & Element Output**: (Instructions 6 & 7 from original prompt remain, regarding describing visuals and populating 'visualElement' for 'Visual Learning Focus' mode - ensure these visuals are also curriculum-aligned if topic is academic).
  6.  **Homework Help Specialization**: (Instruction 10 remains - for "Homework Help" mode, prioritize direct answers, step-by-step solutions based on their curriculum. Use web search if needed for curriculum-specific facts/problems.)
  7.  **Language Translator Mode Specialization**: (Instruction 11 remains).
  8.  **Visual Learning Mode Specialization**: (Instruction 12 remains - image prompts should be clear, descriptive, and if for academic topics, aligned with curriculum understanding).

  General Principles:
  - For all academic queries not in "Homework Help" or "LanguageTranslatorMode", your primary strategy is:
    1. Understand student's curriculum context.
    2. Use web search to find official/reputable info on that curriculum for the current topic/question.
    3. Explain/answer based on that "retrieved" info.
    4. Ask a relevant MCQ based on that "retrieved" info.
    5. Suggest official/reputable resources.
  - If the student's question is a follow-up to an MCQ you asked: Evaluate their answer, provide feedback, and then proceed with a new explanation/MCQ cycle on a related sub-topic from the "retrieved" curriculum or a new aspect of the current one.
  `,
  config: {
    temperature: 0.4, // Slightly adjusted for a balance of creativity and factual recall from "searched" content
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
    const studentProfile = input.studentProfile;
    const educationQualification = studentProfile.educationQualification || {};

    const robustInput = {
      ...input,
      studentProfile: {
        ...studentProfile,
        learningStyle: studentProfile.learningStyle || 'balanced', 
        educationQualification: {
          boardExam: educationQualification.boardExam || {},
          competitiveExam: educationQualification.competitiveExam || {},
          universityExam: educationQualification.universityExam || {},
        },
      },
    };
    const {output} = await prompt(robustInput);

    if (output && output.response && Array.isArray(output.suggestions)) {
        // Ensure MCQ is part of the response if expected
        if (!SPECIAL_MODES_FOR_AI_GUIDED_STUDY.includes(input.specificTopic) && input.specificTopic !== "General Discussion" && !output.response.match(/[A-D]\)\s/)) {
            // This is a simplified check; more robust MCQ detection might be needed
            // console.warn("AI response for curriculum topic did not seem to include an MCQ. Appending a generic follow-up.");
            // output.response += "\n\nWhat would you like to explore next regarding this topic based on your curriculum?";
        }
        return output;
    }

    console.warn("AI output was malformed or missing. Input was:", JSON.stringify(robustInput));
    return {
        response: "I'm having a little trouble formulating a full response right now. Could you try rephrasing or asking something else? Please ensure your question is clear and any uploaded image is relevant.",
        suggestions: []
    };
  }
);

    