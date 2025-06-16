
'use server';
/**
 * @fileOverview This file defines a Genkit flow for conducting AI-guided study sessions.
 *
 * - aiGuidedStudySession - A function that initiates and manages the AI-guided study session flow.
 * - AIGuidedStudySessionInput - The input type for the aiGuidedStudySession function.
 * - AIGuidedStudySessionOutput - The return type for the aiGuidedStudySession function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { performWebSearch } from '@/ai/tools/web-search-tool';
import type { LearningStyle, InitialNodeData } from '@/types';

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
        subjectSegment: z.string().optional().describe("The student's subject segment or stream for 11th/12th (e.g., Science, Commerce, Arts)."),
      }).optional(),
      competitiveExam: z.object({
        examType: z.string().optional().describe('The type of competitive exam (e.g., JEE, NEET, UPSC).'),
        specificExam: z.string().optional().describe('The specific competitive exam or job position (e.g., JEE Main, UPSC CSE).'),
        stage: z.string().optional().describe("The student's current stage within the competitive exam or professional certification, if applicable."),
        examDate: z.string().optional().describe("The student's upcoming exam date for the competitive exam, if provided (YYYY-MM-DD format)."),
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
  specificTopic: z.string().describe('The specific topic of focus (e.g., "Refraction of Light", "General Discussion", "AI Learning Assistant Chat", "Homework Help", "LanguageTranslatorMode", "Language Text Translation", "Language Conversation Practice", "Language Camera Translation", "Language Document Translation", "Visual Learning - Graphs & Charts", "Visual Learning - Conceptual Diagrams", "Visual Learning - Mind Maps", "PDF Content Summarization & Q&A").'),
  question: z.string().describe("The student's question or request for the study session."),
  photoDataUri: z.string().optional().nullable().describe("An optional photo (or document content as image) uploaded by the student, as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  originalFileName: z.string().optional().nullable().describe("The name of the original file uploaded by the user, if applicable (e.g., for document translation mode or PDF summarization)."),
  // New fields for conversation practice setup
  conversationScenario: z.string().optional().describe("The scenario for language conversation practice."),
  userLanguageRole: z.string().optional().describe("The user's role and language in the conversation (e.g., 'English-speaking tourist')."),
  aiLanguageRole: z.string().optional().describe("The AI's role and language in the conversation (e.g., 'French-speaking shopkeeper')."),
  conversationDifficulty: z.enum(['basic', 'intermediate', 'advanced']).optional().describe("The difficulty level for the conversation practice."),
});
export type AIGuidedStudySessionInput = z.infer<typeof AIGuidedStudySessionInputSchema>;

const InitialNodeDataSchema = z.object({
  id: z.string(),
  text: z.string(),
  parentId: z.string().optional(),
  type: z.enum(['root', 'leaf', 'detail']).optional().default('leaf'),
  aiGenerated: z.boolean().optional().default(true),
  x: z.number().optional(),
  y: z.number().optional(),
  color: z.string().optional(),
}).describe("Schema for a single node in the initial mind map structure.");


const VisualElementContentSchema = z.any().or(z.object({
    initialTopic: z.string().optional().describe("The initial central topic for the mind map canvas, often from the user's query."),
    initialNodes: z.array(InitialNodeDataSchema).optional().describe("An array of nodes to pre-populate the mind map canvas, typically generated from AI analysis of an uploaded document/image."),
})).describe('Structured data for charts, a string prompt for image generation, or configuration for an interactive mind map canvas including optional initial nodes.');


const VisualElementSchema = z.object({
  type: z.enum(['bar_chart_data', 'line_chart_data', 'flowchart_description', 'image_generation_prompt', 'interactive_mind_map_canvas']).describe('The type of visual element suggested.'),
  content: VisualElementContentSchema,
  caption: z.string().optional().describe('A brief caption or title for the visual element.'),
}).describe("A structured representation of a visual aid suggested by the AI. For textual Mind Map requests via AI Learning Assistant Chat, this MUST be null. For interactive mind map canvas requests via Visual Learning page (topic 'Visual Learning - Mind Maps'), type is 'interactive_mind_map_canvas'. If a document/image is uploaded with this request, 'content' can include 'initialNodes' to pre-populate the canvas.");


const AIGuidedStudySessionOutputSchema = z.object({
  response: z.string().describe("The AI tutor's response to the student's question, including explanations, study materials, and examples tailored to their educational context and preferred language. If an 'interactive_mind_map_canvas' is being set up from an uploaded document, this response should inform the user about the auto-generated initial structure. For Q&A about the map, this contains the textual explanation. For PDF Summarization, this is the summary or answer to a question about the PDF."),
  suggestions: z.array(z.string()).describe("A list of 2-3 real-time external source suggestions (like links to official educational board websites, reputable academic resources, or specific textbook names) for further study on the topic, relevant to the student's curriculum and country/region, ideally informed by web search results. For PDF Summarization, these could be suggested follow-up questions."),
  visualElement: VisualElementSchema.optional().nullable().describe("An optional visual element to aid understanding. For interactive mind map canvas requests (via Visual Learning - Mind Maps mode), this MUST have type 'interactive_mind_map_canvas'. If based on an uploaded file, its 'content' field can include an 'initialNodes' array."),
});
export type AIGuidedStudySessionOutput = z.infer<typeof AIGuidedStudySessionOutputSchema>;

const PromptInputSchema = AIGuidedStudySessionInputSchema.extend({
    isAiLearningAssistantChat: z.boolean().optional(),
    isHomeworkHelp: z.boolean().optional(),
    isLanguageTranslatorMode: z.boolean().optional(),
    isLanguageTextTranslationMode: z.boolean().optional(),
    isLanguageConversationMode: z.boolean().optional(),
    isLanguageCameraMode: z.boolean().optional(),
    isLanguageDocumentTranslationMode: z.boolean().optional(),
    isVisualLearningFocus: z.boolean().optional(),
    isVisualLearningGraphs: z.boolean().optional(),
    isVisualLearningDiagrams: z.boolean().optional(),
    isVisualLearningMindMaps: z.boolean().optional(),
    isPdfProcessingMode: z.boolean().optional(), // New flag for PDF
    isInitialPdfSummarizationRequest: z.boolean().optional(), // New flag for PDF
    isCurriculumSpecificMode: z.boolean().optional(),
});

const aiGuidedStudySessionPromptText =
`
You are EduAI Tutor, an expert AI Learning Assistant. Your main task is to provide a personalized, supportive,and effective study session for a student based on their detailed profile and specific query.
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
  {{#if boardExam.subjectSegment}}Segment/Stream: {{{boardExam.subjectSegment}}}{{/if}}
  Curriculum Focus: Material relevant to the {{{boardExam.board}}} syllabus{{#if boardExam.standard}} for {{{boardExam.standard}}} standard{{/if}}{{#if boardExam.subjectSegment}} ({{{boardExam.subjectSegment}}}){{/if}} in {{{studentProfile.country}}}.
  {{/if}}
  {{#if competitiveExam.examType}}
  Preparing for: Competitive Exam
  Exam Type: {{{competitiveExam.examType}}}
  {{#if competitiveExam.specificExam}}Specific Exam: {{{competitiveExam.specificExam}}}{{/if}}
  {{#if competitiveExam.stage}}Current Stage: {{{competitiveExam.stage}}}{{/if}}
  {{#if competitiveExam.examDate}}Upcoming Exam Date: {{{competitiveExam.examDate}}}{{/if}}
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
{{#if originalFileName}}Original Document Name (for context): {{{originalFileName}}}{{/if}}

Student's Question/Request: "{{{question}}}"

{{#if photoDataUri}}
Student provided an image/document for context ({{{photoDataUri}}}).
{{#unless isVisualLearningMindMaps}}
{{media url=photoDataUri}}
{{/unless}}
{{/if}}

Instructions for AI Tutor:

{{#if isAiLearningAssistantChat}}
You are an AI Tutor Agent, a personalized educational assistant.
Provide a welcoming response. If the student's question is general, proactively offer assistance related to their specific educational context and curriculum.
For example:
    {{#if studentProfile.educationQualification.boardExam.board}} "Hello {{{studentProfile.name}}}! I see you're preparing for your {{{studentProfile.educationQualification.boardExam.board}}} exams in {{{studentProfile.educationQualification.boardExam.standard}}} standard{{#if studentProfile.educationQualification.boardExam.subjectSegment}} ({{{studentProfile.educationQualification.boardExam.subjectSegment}}}){{/if}}. How can I assist you with a topic from your syllabus today?"
    {{else if studentProfile.educationQualification.competitiveExam.examType}} "Hello {{{studentProfile.name}}}! I'm here to help you prepare for your {{{studentProfile.educationQualification.competitiveExam.examType}}} exam ({{{studentProfile.educationQualification.competitiveExam.specificExam}}}).{{#if studentProfile.educationQualification.competitiveExam.examDate}} I see your exam is on {{{studentProfile.educationQualification.competitiveExam.examDate}}}.{{/if}} Is there a particular section of the syllabus you'd like to focus on?"
    {{else if studentProfile.educationQualification.universityExam.universityName}} "Hello {{{studentProfile.name}}}! Welcome! I can help you with your studies for {{{studentProfile.educationQualification.universityExam.course}}} at {{{studentProfile.educationQualification.universityExam.universityName}}}. What topic from your curriculum can I assist with?"
    {{else}} "Hello {{{studentProfile.name}}}! How can I assist you with your learning goals today?"{{/if}}
If the student explicitly requests a 'mind map' of the discussed topic, or based on an uploaded document or image:
1.  Analyze Content: Identify a central idea and key subtopics.
2.  Format Response as Textual Mind Map: Use Markdown-like formatting (headings, bullet points).
    Example: '# Mind Map: [Central Idea]\n\n## [Branch 1]\n  * [Sub-branch 1.1]\n\n## [Branch 2]\n  * [Sub-branch 2.1]'
3.  'visualElement' output MUST be null for these textual mind maps.
For all other requests, act as a general AI Learning Assistant. 'visualElement' can be used for diagrams/charts if appropriate for explanation, but not for textual mind maps.

{{else if isHomeworkHelp}}
You are an AI Tutor specializing in Homework Help.
Prioritize direct answers and step-by-step solutions for: "{{{question}}}".
If factual, provide the answer. If a problem, provide solution steps.
Refer to student's context: {{#with studentProfile.educationQualification}}{{#if boardExam.board}}Board: {{{boardExam.board}}}, Standard: {{{boardExam.standard}}}{{/if}}{{#if competitiveExam.examType}}Exam: {{{competitiveExam.specificExam}}} ({{{competitiveExam.examType}}}){{#if competitiveExam.examDate}}, Date: {{{competitiveExam.examDate}}}{{/if}}{{/if}}{{#if universityExam.universityName}}University: {{{universityExam.universityName}}}, Course: {{{universityExam.course}}}{{/if}}{{/with}}.
If image provided, use it as primary source.
Use 'performWebSearch' tool if needed for facts/formulas relevant to curriculum.
'suggestions' can be related problems. 'visualElement' unlikely unless requested.

{{else if isPdfProcessingMode}}
  You are an AI assistant specialized in processing PDF documents.
  The user has provided a document named '{{{originalFileName}}}'. Assume you have read and understood this document. Your task is to assist the user with it.

  {{#if isInitialPdfSummarizationRequest}}
  The user's initial request is: "{{{question}}}" (This is likely a request to summarize the document).
  1.  Provide a comprehensive summary of the document '{{{originalFileName}}}'.
      Your summary should cover:
      *   Main purpose or thesis of the document.
      *   Key arguments, findings, or sections.
      *   Important data points or examples, if any.
      *   Overall conclusions or takeaways.
  2.  For 'suggestions', provide 2-3 insightful questions the user might want to ask next about the content of '{{{originalFileName}}}' based on your summary. These should encourage deeper exploration of the document.
  Example 'response': "The document '{{{originalFileName}}}' primarily discusses [main topic]... It argues that [key argument]... Key findings include [finding 1] and [finding 2]... The document concludes by [conclusion]."
  Example 'suggestions': ["What methodology was used to arrive at these findings in '{{{originalFileName}}}'?", "Can you elaborate on the implications of [specific point from summary] mentioned in '{{{originalFileName}}}'?"]
  'visualElement' MUST be null.
  {{else}}
  The user is asking a specific question about the document '{{{originalFileName}}}': "{{{question}}}"
  1.  Answer this question based on your understanding of the content of '{{{originalFileName}}}'. Be concise and directly address the query.
  2.  For 'suggestions', provide 1-2 related follow-up questions the user could ask, or suggest exploring a related concept from '{{{originalFileName}}}'.
  Example 'response': "Regarding your question about [specific aspect] in '{{{originalFileName}}}', the document states that [answer based on document content]..."
  Example 'suggestions': ["How does this compare to [another concept] also discussed in '{{{originalFileName}}}'?", "What are the counter-arguments to this point within '{{{originalFileName}}}'?"]
  'visualElement' MUST be null.
  {{/if}}

{{else if isLanguageTranslatorMode}}
You are an AI Language Translator. Student's preferred language: '{{{studentProfile.preferredLanguage}}}'. Request: "{{{question}}}".
{{#if photoDataUri}}
Image uploaded. Extract text. Translate.
Target language: If query specifies, use it. Else, if extracted is preferred, translate to English. Else, translate TO preferred.
'response' MUST be: "Extracted Text ([Language]): [Text]\nTranslated Text ([Language]): [Text]"
{{else}}
No image. Translate text in '{{{question}}}'.
Target language: If query is preferred, translate to English (or specified). Else, translate TO preferred.
'response' MUST be: "Translated Text ([Language]): [Text]"
{{/if}}
'suggestions' can be dictionary links. 'visualElement' MUST be null.

{{else if isLanguageTextTranslationMode}}
You are an AI Language Translator for text. Preferred lang: '{{{studentProfile.preferredLanguage}}}'. Question: "{{{question}}}"
1. Identify core text from '{{{question}}}'.
2. Translate. Determine source/target based on query & preferred lang.
3. If '{{{question}}}' asks for grammar/usage, provide after translation.
'response': "Original Text ([Source]): [Original]\nTranslated Text ([Target]): [Translated]\n(Optional) Explanation: [Brief explanation]"
'suggestions' can be related phrases. 'visualElement' null.

{{else if isLanguageConversationMode}}
You are an AI Language Conversation Partner.
Student Profile Preferred Language: {{{studentProfile.preferredLanguage}}}.
Student's setup for this conversation:
Scenario: {{{conversationScenario}}}
Student Role & Language: {{{userLanguageRole}}}
AI (Your) Role & Language: {{{aiLanguageRole}}}
Difficulty: {{{conversationDifficulty}}}

Based on this setup:
1.  Adopt your assigned role ({{{aiLanguageRole}}}) and speak in your assigned language.
2.  Initiate the conversation based on the scenario '{{{conversationScenario}}}'. Your first response should be a natural starting line for someone in your role. For example, if you are a shopkeeper, you might greet the customer and ask how you can help. If you are a friend, you might start with a greeting and an opening question related to the scenario.
3.  Keep your responses natural for a dialogue, not overly long. Tailor vocabulary and sentence complexity to the '{{{conversationDifficulty}}}' level.
4.  Wait for the student's response (which will come in a subsequent 'question' field from them).

Your 'response' field should contain ONLY your dialogue part for this turn.
'suggestions' can be phrases the student might use next or cultural tips relevant to the scenario and languages. 'visualElement' must be null.

{{else if isLanguageCameraMode}}
You are an AI Language Translator for image text. Preferred lang: '{{{studentProfile.preferredLanguage}}}'. Textual input: "{{{question}}}"
{{#if photoDataUri}}
Image uploaded.
1. Extract text from image. If none, state that.
2. Translate. Target: If '{{{question}}}' specifies, use it. Else if extracted is preferred, to English. Else, TO preferred.
3. 'response' MUST be: "Extracted Text ([Language]): [Text or 'No text detected']\nTranslated Text ([Target]): [Text or 'N/A']"
{{else}}
No image. 'response': "Please upload an image for camera translation."
{{/if}}
'suggestions' about image quality. 'visualElement' null.

{{else if isLanguageDocumentTranslationMode}}
You are an AI Language Translator for document text. Preferred lang: '{{{studentProfile.preferredLanguage}}}'.
{{#if originalFileName}}Document name: '{{{originalFileName}}}'.{{/if}}
Request with text: "{{{question}}}"
Translate text from '{{{question}}}'. Determine source/target from query & preferred.
Your 'response' MUST contain ONLY the translated text. No extra phrases.
'suggestions' can be empty. 'visualElement' null.

{{else if isVisualLearningFocus}}
  {{#if isVisualLearningGraphs}}
  Act as Data Visualization Expert. Request: '{{{question}}}'
  'response': "Okay, I can help visualize [concept] with a [chart type] comparing [items]. This chart will show..."
  'visualElement.type': 'bar_chart_data' or 'line_chart_data'.
  'visualElement.content': structured chart data e.g., '[{ "name": "A", "value": 10 }, ...]'.
  'visualElement.caption': "Chart: [Concept] - [Items]".
  {{else if isVisualLearningDiagrams}}
  Act as Process Visualization Expert. Request: '{{{question}}}'
  'response': "I'll create a diagram for [process/system]. It will show key stages: [Stage 1], [Stage 2]..."
  'visualElement.type': 'image_generation_prompt'.
  'visualElement.content': detailed prompt for image model for diagram, all text labels must be sharp & legible.
  'visualElement.caption': "Diagram of [Process or System]".
  {{else if isVisualLearningMindMaps}}
  Act as Knowledge Organization Facilitator for mind map/flowchart on '{{{question}}}'.
    {{#if photoDataUri}}
    Student UPLOADED document/image.
    1. Analyze uploaded content (from {{media url=photoDataUri}}). Extract 3-5 key concepts.
    2. 'visualElement.content' MUST be object with 'initialTopic' (string, e.g., "Key Ideas from '{{{question}}}'") AND 'initialNodes' (array of node objects: {id, text, parentId?, type?, aiGenerated?}). Define a 'root' node.
    3. 'response': "I've analyzed your upload and created an initial mind map structure on the canvas. Modify it or ask questions."
    4. 'visualElement.type': 'interactive_mind_map_canvas'.
    5. 'visualElement.caption': "Interactive Mind Map from Uploaded Content".
    {{else}}
    Student wants to create MANUALLY or from typed topic '{{{question}}}'.
    1. 'response': "Great! I've set up an interactive canvas for your mind map/flowchart on '{{{question}}}'."
    2. 'visualElement.type': 'interactive_mind_map_canvas'.
    3. 'visualElement.content': object like '{ "initialTopic": "{{{question}}}" }'. No 'initialNodes'.
    4. 'visualElement.caption': "Interactive Mind Map for {{{question}}}".
    {{/if}}
  For subsequent Q&A about the mind map/content, answer textually. Do NOT generate textual mind map outlines or image prompts when 'isVisualLearningMindMaps' is true.
  {{else}}
  You are Visual Learning Studio AI. Guide user: "I can help create Graphs & Charts, Conceptual Diagrams, or Mind Maps/Flowcharts. What visual for '{{{question}}}'?"
  'visualElement' null unless clear implicit request for diagram/chart.
  {{/if}}
{{else}}
  1. Understand curriculum: Board: {{{studentProfile.educationQualification.boardExam.board}}}, Standard: {{{studentProfile.educationQualification.boardExam.standard}}}, Exam: {{{studentProfile.educationQualification.competitiveExam.specificExam}}}, Course: {{{studentProfile.educationQualification.universityExam.course}}}, Country: {{{studentProfile.country}}}.
  2. Web Search (if academic & curriculum-related): Use 'performWebSearch' for official syllabus/resources for '{{{specificTopic}}}' or '{{{question}}}'. Integrate findings. Mention source context.
  3. Personalized Response (in '{{{studentProfile.preferredLanguage}}}'): Address '{{{question}}}' based on "retrieved" curriculum.
      {{#if subject}}{{#if lesson}}
      *   Multiple-Choice Question (MCQ): Conclude 'response' with ONE relevant MCQ (3-4 options A, B, C, D) on curriculum content just discussed.
      Example: "...Snell's Law?\\nA) n1/sin(θ2)=n2/sin(θ1)\\nB) n1*sin(θ1)=n2*sin(θ2)..."
      {{/if}}{{/if}}
      {{#if studentProfile.educationQualification.competitiveExam.examDate}}
      *   Motivational Nudge (if exam date present & relevant): Brief, positive phrase, e.g., "Keep up the great work for your exam on {{{studentProfile.educationQualification.competitiveExam.examDate}}}!"
      {{/if}}
  4. External Suggestions: 2-3 specific, high-quality resources (official board/university sites, reputable OERs) from web search. NO commercial platforms.
  5. Visual Explanations (if learningStyle is 'visual' & question suits chart/diagram, NOT mind map):
      *   Describe visual in text. Populate 'visualElement' (type 'bar_chart_data' or 'image_generation_prompt'). Curriculum-aligned.
  If student answers MCQ, evaluate, feedback, new explanation/MCQ on related sub-topic from "retrieved" curriculum.
{{/if}}
`;

const prompt = ai.definePrompt({
  name: 'aiGuidedStudySessionPrompt',
  input: {schema: PromptInputSchema},
  output: {schema: AIGuidedStudySessionOutputSchema},
  model: 'googleai/gemini-1.5-flash-latest',
  tools: [performWebSearch],
  prompt: aiGuidedStudySessionPromptText,
  config: {
    temperature: 0.4,
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
  },
});

export async function aiGuidedStudySession(input: AIGuidedStudySessionInput): Promise<AIGuidedStudySessionOutput> {
  return aiGuidedStudySessionFlow(input);
}

const aiGuidedStudySessionFlow = ai.defineFlow(
  {
    name: 'aiGuidedStudySessionFlow',
    inputSchema: AIGuidedStudySessionInputSchema,
    outputSchema: AIGuidedStudySessionOutputSchema,
  },
  async (input: AIGuidedStudySessionInput) => {
    const studentProfile = input.studentProfile;
    const educationQualification = studentProfile.educationQualification || {};
    const specificTopicFromInput = input.specificTopic;

    const isBaseLanguageTranslatorMode = specificTopicFromInput === "LanguageTranslatorMode";
    const isLanguageMode = isBaseLanguageTranslatorMode || 
                           specificTopicFromInput === "Language Text Translation" ||
                           specificTopicFromInput === "Language Conversation Practice" ||
                           specificTopicFromInput === "Language Camera Translation" ||
                           specificTopicFromInput === "Language Document Translation";
    
    const isPdfMode = specificTopicFromInput === "PDF Content Summarization & Q&A";
    const initialPdfSummarizationTrigger = "Summarize the PDF:";

    const promptInput: z.infer<typeof PromptInputSchema> = {
      ...input,
      studentProfile: {
        ...studentProfile,
        learningStyle: studentProfile.learningStyle || 'balanced',
        educationQualification: {
          boardExam: educationQualification.boardExam || {subjectSegment: ""},
          competitiveExam: educationQualification.competitiveExam || { examType: undefined, specificExam: undefined, stage: undefined, examDate: undefined },
          universityExam: educationQualification.universityExam || {},
        },
      },
      isAiLearningAssistantChat: specificTopicFromInput === "AI Learning Assistant Chat" || specificTopicFromInput === "General Discussion",
      isHomeworkHelp: specificTopicFromInput === "Homework Help",
      
      isLanguageTranslatorMode: isBaseLanguageTranslatorMode, 
      isLanguageTextTranslationMode: specificTopicFromInput === "Language Text Translation",
      isLanguageConversationMode: specificTopicFromInput === "Language Conversation Practice",
      isLanguageCameraMode: specificTopicFromInput === "Language Camera Translation",
      isLanguageDocumentTranslationMode: specificTopicFromInput === "Language Document Translation",

      isVisualLearningFocus: specificTopicFromInput.startsWith("Visual Learning"),
      isVisualLearningGraphs: specificTopicFromInput === "Visual Learning - Graphs & Charts",
      isVisualLearningDiagrams: specificTopicFromInput === "Visual Learning - Conceptual Diagrams",
      isVisualLearningMindMaps: specificTopicFromInput === "Visual Learning - Mind Maps",
      
      isPdfProcessingMode: isPdfMode,
      isInitialPdfSummarizationRequest: isPdfMode && input.question.toLowerCase().startsWith(initialPdfSummarizationTrigger.toLowerCase()),

      isCurriculumSpecificMode: !["AI Learning Assistant Chat", "General Discussion", "Homework Help"].includes(specificTopicFromInput) && !isLanguageMode && !specificTopicFromInput.startsWith("Visual Learning") && !isPdfMode,
      
      conversationScenario: input.conversationScenario,
      userLanguageRole: input.userLanguageRole,
      aiLanguageRole: input.aiLanguageRole,
      conversationDifficulty: input.conversationDifficulty,
    };

    const {output} = await prompt(promptInput);

    if (output && output.response && Array.isArray(output.suggestions)) {
        if (output.visualElement === undefined) {
          if (promptInput.isAiLearningAssistantChat && input.question.toLowerCase().includes("mind map")) {
              output.visualElement = null;
          } else {
              output.visualElement = null;
          }
        } else if (output.visualElement && promptInput.isVisualLearningMindMaps) {
            if (output.visualElement.type !== 'interactive_mind_map_canvas') {
                 output.visualElement.type = 'interactive_mind_map_canvas';
            }
            if (typeof output.visualElement.content !== 'object' || output.visualElement.content === null) {
                const defaultInitialTopic = input.photoDataUri ? "Analysis of Uploaded Content" : (input.question || "My Ideas");
                output.visualElement.content = { initialTopic: defaultInitialTopic };
            } else {
                if (!('initialTopic' in output.visualElement.content) || output.visualElement.content.initialTopic === undefined) {
                    output.visualElement.content.initialTopic = input.photoDataUri ? "Analysis of Uploaded Content" : (input.question || "My Ideas");
                }
            }

            if (output.visualElement.content && 'initialNodes' in output.visualElement.content && output.visualElement.content.initialNodes !== undefined) {
                if (!Array.isArray(output.visualElement.content.initialNodes)) {
                    console.warn("AI provided initialNodes but not as an array. Clearing initialNodes.");
                    output.visualElement.content.initialNodes = undefined;
                }
            } else if (typeof output.visualElement.content === 'object' && output.visualElement.content !== null && !('initialNodes' in output.visualElement.content)) {
                 output.visualElement.content.initialNodes = undefined;
            }
        }
        
        if(isPdfMode) { // For PDF mode, visualElement should always be null
            output.visualElement = null;
        }

        const nonMCQModes = ["Homework Help", "LanguageTranslatorMode", "AI Learning Assistant Chat", "General Discussion", "Language Text Translation", "Language Conversation Practice", "Language Camera Translation", "Language Document Translation", "PDF Content Summarization & Q&A"];
        const isVisualLearningMode = promptInput.isVisualLearningFocus;

        const shouldHaveMCQ = !nonMCQModes.includes(specificTopicFromInput) && 
                              !isVisualLearningMode &&
                              (input.subject && input.subject.trim() !== "") && 
                              (input.lesson && input.lesson.trim() !== "");


        if (shouldHaveMCQ && !output.response.match(/\b([A-D])\)\s/i) && !output.response.match(/\b[A-D]\.\s/i)) {
          console.warn(`MCQ expected for topic "${specificTopicFromInput}" (Subject: ${input.subject}, Lesson: ${input.lesson}) but not found in response: "${output.response.substring(0,100)}..."`);
        }
        return output;
    }

    console.warn(`AI output was malformed or missing for topic: "${specificTopicFromInput}". Input was:`, JSON.stringify(promptInput));
    return {
        response: "I'm having a little trouble formulating a full response right now. Could you try rephrasing or asking something else? Please ensure your question is clear and any uploaded image/document context is relevant.",
        suggestions: [],
        visualElement: null
    };
  }
);

