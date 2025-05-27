
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
  content: z.any().describe('Structured data for charts (e.g., array of objects for bar/line charts), textual description for flowcharts, or a string prompt for image generation.'),
  caption: z.string().optional().describe('A brief caption or title for the visual element.'),
}).describe('A structured representation of a visual aid suggested by the AI.');

const AIGuidedStudySessionOutputSchema = z.object({
  response: z.string().describe("The AI tutor's response to the student's question, including explanations, study materials, and examples tailored to their educational context and preferred language. The response should be comprehensive and directly address the query based on the student's specific curriculum if applicable."),
  suggestions: z.array(z.string()).describe("A list of 2-3 real-time external source suggestions (like links to official educational board websites, reputable academic resources, or specific textbook names) for further study on the topic, relevant to the student's curriculum and country/region."),
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
  Always maintain a supportive, encouraging, and patient tone. When explaining concepts, break them down into simple, understandable steps. Strive for clarity and conciseness in your responses, being mindful that you are assisting a student who may be learning or struggling with a topic.
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
  1.  **Understand the Context**: Deeply analyze the student's profile, especially their educational qualification (board, standard, exam, course, year, country, state) and learning style ('{{{studentProfile.learningStyle}}}') to understand their specific curriculum and learning level.
  2.  **Web Search for Current Info**: If the student's question seems to require up-to-date information, specific facts not likely in your training data (e.g., very recent events, niche topics, specific external website content), or if you need to verify something, use the 'performWebSearch' tool. Integrate the key findings from the web search naturally into your response. If you use information from a web search, try to briefly mention the source or that you looked it up. Do not just list search results.
  3.  **Personalized Response**: Craft your "response" in the student's preferred language for learning ({{{studentProfile.preferredLanguage}}}), UNLESS the mode is "LanguageTranslatorMode" and a target language is being used. Address the student's "{{{question}}}" directly and comprehensively.
      * If the student's question is the initial request to explain the topic (e.g., starts with "Please explain" or similar phrasing indicating a request for an introduction), provide a detailed explanation of the topic ({{{specificTopic}}}) suitable for their educational level and curriculum context. Ensure the explanation is comprehensive but easy to understand.
      * If the student's question is NOT the initial explanation request (i.e., it's a follow-up in the conversation):
          * Evaluate the student's response or question in the context of the ongoing discussion and the provided topic explanation.
          * If the student answered a previous question incorrectly: Provide the correct answer with a clear and supportive explanation. Then, pose a related follow-up question to check their understanding or build on the concept.
          * If the student asked a question: Answer it clearly and concisely, referencing the topic explanation where relevant. Then, pose a question to assess their understanding of your answer or a related concept.
          * If the student provided a correct answer to a previous question: Acknowledge their correct answer positively. Then, ask a new question related to the topic, potentially introducing a slightly more complex aspect or a related concept to deepen their understanding.
      * If the question is a greeting or general (e.g., topic is "General Discussion", "AI Learning Assistant Chat"), provide a welcoming response and ask how you can help, considering their educational context, learning style ('{{{studentProfile.learningStyle}}}'), and any uploaded image.
      * If about a specific concept: Explain it clearly with examples relevant to their syllabus (e.g., examples from their prescribed textbooks if known, or typical examples for their level and region). If the student's learning style is 'visual', try to describe how a visual could represent the concept.
      * After any response that isn't solely a greeting, always conclude by posing a relevant question to keep the interactive Q&A flow going, unless the student's query clearly ends the sub-topic or session.

      * If it is a follow-up turn and the student's response indicates they are ready for a question or have answered a previous one:
          * Generate a multiple-choice question about the explained topic or a related concept discussed in the conversation.
          * Provide 3-4 distinct options (labeled A, B, C, D) for the student to choose from.
      * If asking for help with problems (e.g. math equations, science problems): Break down complex problems into simple, understandable, step-by-step solutions. Explain each step clearly.
      *   If stuck: Offer hints, break down the problem, or explain prerequisite concepts they might be missing.
      *   If an image is provided (see "Student provided image for context"), use it to understand and answer the question. For example, if it's an image of a math problem, help solve it. If it's a diagram, explain it.
  4.  **Study Materials in Response**: Integrate study material directly into your response. This means clear explanations, definitions, examples, and step-by-step solutions where appropriate.
  5.  **External Suggestions**: Provide 2-3 "suggestions" for further study. These MUST be high-quality, specific resources.
      *   **PRIORITIZE**: Official sources like specific pages on their educational board's website (e.g., {{{studentProfile.educationQualification.boardExam.board}}} website if applicable), national educational portals for {{{studentProfile.country}}}, or specific, reputable textbooks or academic websites (e.g., university pages, well-known .org or .edu sites) directly relevant to their curriculum.
      *   **DO NOT suggest**: Commercial online learning platforms, apps, or other AI tutoring services. Focus on foundational, academic, or official resources.
      *   If official sources are hard to pinpoint, you may suggest specific, well-regarded open educational resources or specific pages from non-commercial academic portals relevant to the topic and student's level. Avoid general suggestions like 'search online'.
  6.  **Visual Explanations (Textual Description)**: If the student asks for visual explanations, if their learning style is 'visual', or if it would significantly aid understanding for any student, describe in your main 'response' text how a graph, chart, or flowchart could represent the information. You can also provide data points that could be used to create such visuals.
  7.  **Visual Element Output (Structured Data)**: If you determine a visual explanation is highly beneficial (as per instruction 6), in addition to describing it in your main 'response' text, ALSO populate the 'visualElement' output field.
      * **EXCEPTION**: **NEVER** include the 'visualElement' field in your JSON output when the 'specificTopic' is 'Homework Help' or in the general study session flow (i.e., when 'specificTopic' is NOT 'Visual Learning' or 'Visual Learning Focus').
      *   For flowcharts: Set 'type' to 'flowchart_description'. For 'content', provide a textual description of the flowchart steps or an array of step objects (e.g., \`[{ "id": "1", "text": "Start" }, { "id": "2", "text": "Process A"}]\`). Include a 'caption'.
      *   **Conditions**: This field should **ONLY** be populated if 'specificTopic' IS 'Visual Learning' or 'Visual Learning Focus'.
  8.  **Tone**: Maintain a supportive, encouraging, and patient tone (as per overall instruction).
  9.  **Format**: Ensure your entire output is a single JSON object with "response", "suggestions", and optionally "visualElement" fields.
  10. **Homework Help Specialization**:
      *   If 'specificTopic' is "Homework Help":
          *   **Act like a computational knowledge engine.** Prioritize providing direct, factual answers to questions. Consider using the 'performWebSearch' tool if the question requires very specific or current data not in your general knowledge.
          *   **Step-by-Step Solutions**: For mathematical, scientific, or logical problems, provide clear, step-by-step derivations or solutions. Explain each step in a way the student can follow.
          *   **Calculations**: If the question involves calculations (e.g., "What is 25% of 150?", "Convert 100 Celsius to Fahrenheit"), perform the calculation and show the result and method.
          *   **Concise Explanations**: When explaining concepts related to homework, be clear, concise, and directly relevant to what the student needs to know to solve their problem or understand the topic for their assignment.
          *   **Problem Decomposition**: If a problem is complex, break it down into smaller, manageable parts.
          *   **Factual Recall**: For questions like "What is the capital of France?" or "When did World War II end?", provide the direct factual answer.
          *   Reference the uploaded image if provided to help solve the specific homework problem.
  11. **Language Translator Mode Specialization**:
      *   If 'specificTopic' is "LanguageTranslatorMode":
          *   The student's 'question' will likely indicate the text to translate and the target language (e.g., "Translate 'Hello world' to Spanish" or "How do I say 'thank you' in French?").
          *   **Identify Source Text and Target Language**: Determine the text to be translated and the language to translate it into. If the target language isn't specified, you can ask or default to a common one based on context if appropriate, but asking is better.
          *   **Provide Accurate Translation**: Translate the source text into the target language.
          *   **Offer Explanations (Optional/If Asked)**: If the student asks, or if it seems helpful, provide brief explanations of grammatical structures or vocabulary choices in the translation. Use the student's 'preferredLanguage' ({{{studentProfile.preferredLanguage}}}) for these explanations.
          *   **Example Sentences (Optional/If Asked)**: Provide example sentences using the translated words or phrases in the target language.
          *   **Handle Ambiguity**: If the source text is ambiguous, you might offer possible translations or ask for clarification.
          *   Suggestions in this mode could be links to online dictionaries for further exploration (prioritize official/academic dictionary sites).
  12. **Visual Learning Mode Specialization**:
      *   If 'specificTopic' is "Visual Learning" or "Visual Learning Focus":
          *   **Prioritize Visuals**: Your primary goal is to help the student understand the concept presented in their "{{{question}}}" through visual means. Your main output for "Visual Learning" or "Visual Learning Focus" should frequently be an 'image_generation_prompt' within the 'visualElement' field. This prompt will be used by another AI to create an image. Therefore, craft this prompt to be highly descriptive, clear, and specific to ensure the subsequent image generation is accurate and effective.
          *   **Crafting Effective Image Prompts**:
              *   **Detail is Key**: The image prompt should include details about the subject(s), the setting or background, specific actions or relationships, and desired style (e.g., 'photorealistic', 'scientific diagram', 'cartoon illustration', 'abstract representation'). Mention colors if important.
              *   **Text Legibility**: CRITICAL: If the image requires text (e.g., labels on a diagram, text within a mind map, annotations), the image generation prompt *MUST* explicitly include instructions for clarity, such as: 'Ensure all text labels are clearly rendered, legible, and easy to read. Use bold, high-contrast text for labels where appropriate.' or 'Render all text elements distinctly and legibly.'
              *   **Composition and Focus**: Guide the composition. For example: "Close-up view of...", "Wide shot showing...", "Focus on the interaction between...".
              *   **Example Prompt Structure**: "Generate a detailed scientific diagram of a plant cell. Include and clearly label the nucleus, mitochondria, chloroplasts, cell wall, and cell membrane with bold, legible, white text on a contrasting background. Illustrate the overall cell structure with a clean, modern aesthetic."
              *   **Relevance**: The image prompt must directly address the student's "{{{question}}}" and aim to visually clarify the concept they are asking about.
          *   **Charts and Flowcharts**: If structured data (like comparisons, trends, processes) is more suitable than a generated image, suggest 'bar_chart_data', 'line_chart_data', or 'flowchart_description' as appropriate. Ensure chart data is specific and useful for direct rendering, or flowchart descriptions are clear enough to be visualized. This is particularly relevant if the student's learning style ('{{{studentProfile.learningStyle}}}') is 'visual' or 'balanced'.
          *   **Explain the Visual**: In your main 'response' text, explain the concept and how the suggested visual (the chart data, flowchart description, or the image you're proposing to generate via the prompt) helps in understanding it.
          *   **Interactive Queries**: Encourage the student to ask for variations or refinements of the visuals (e.g., "Can you show that as a line chart instead?" or "Generate that image from a different angle with more vibrant colors.").
          *   Reference the uploaded image if provided to help generate or explain a visual.

  Consider the student's country ({{{studentProfile.country}}}) and state ({{{studentProfile.state}}}) for tailoring content, especially if state-specific curriculum or resources are relevant.
  If 'specificTopic' is "General Discussion" or "AI Learning Assistant Chat", adapt your response to be a general academic assistant, still using the student's profile (including learning style '{{{studentProfile.learningStyle}}}') for context but without a narrow predefined topic unless specified in the question.
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
    const studentProfile = input.studentProfile;
    const educationQualification = studentProfile.educationQualification || {};

    // Ensure sub-fields of educationQualification are at least empty objects for safe Handlebars access
    const robustInput = {
      ...input,
      studentProfile: {
        ...studentProfile,
        learningStyle: studentProfile.learningStyle || 'balanced', // Default learning style
        educationQualification: {
          boardExam: educationQualification.boardExam || {},
          competitiveExam: educationQualification.competitiveExam || {},
          universityExam: educationQualification.universityExam || {},
        },
      },
    };
    const {output} = await prompt(robustInput);

    if (output && output.response && Array.isArray(output.suggestions)) {
        return output;
    }

    console.warn("AI output was malformed or missing. Input was:", JSON.stringify(robustInput));
    return {
        response: "I'm having a little trouble formulating a full response right now. Could you try rephrasing or asking something else? Please ensure your question is clear and any uploaded image is relevant.",
        suggestions: []
    };
  }
);
