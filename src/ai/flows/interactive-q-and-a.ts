
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
import type { QAS_Stage, LearningStyle } from '@/types'; // Ensure QAS_Stage is imported if defined in types.ts

const InteractiveQAndAInputSchema = z.object({
  studentProfile: z.object({
    name: z.string().describe("The student's name."),
    age: z.number().describe("The student's age."),
    country: z.string().describe("The student's country."),
    preferredLanguage: z.string().describe("The student's preferred language for learning."),
    learningStyle: z.enum(["visual", "auditory", "kinesthetic", "reading_writing", "balanced", ""]).optional().describe("The student's preferred learning style."),
    educationQualification: z.object({
      boardExam: z.object({
        board: z.string().optional().describe('The board exam name (e.g., CBSE, State Board Name).'),
        standard: z.string().optional().describe("The student's current standard (e.g., 10th, 12th)."),
      }).optional(),
      competitiveExam: z.object({
        examType: z.string().optional().describe('The type of competitive exam (e.g., JEE, NEET, UPSC).'),
        specificExam: z.string().optional().describe('The specific competitive exam or job position (e.g., JEE Main, UPSC CSE).'),
        stage: z.string().optional().describe('The current stage within a professional certification, if applicable.'),
        examDate: z.string().optional().describe("The student's upcoming exam date (YYYY-MM-DD format)."),
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
  studentAnswer: z.string().optional().nullable().describe('The student\'s answer to the previous question from the AI tutor. Null if this is the first question of a stage/session.'),
  previousQuestion: z.string().optional().nullable().describe('The previous question asked by the AI tutor to provide context.'),
  conversationHistory: z.string().optional().nullable().describe('A brief history of the current Q&A session to maintain context. Focus on the last few turns.'),
  currentStage: z.enum(['initial_material', 'deeper_material', 'out_of_syllabus', 'completed']).default('initial_material').optional()
    .describe("The current stage of the Q&A session for this topic. Client ensures this is accurate."),
  questionsAskedInStage: z.number().default(0).optional()
    .describe("Number of questions the user has ALREADY ANSWERED for the currentStage. If 0, AI is asking the first question of this stage."),
});
export type InteractiveQAndAInput = z.infer<typeof InteractiveQAndAInputSchema>;

const InteractiveQAndAOutputSchema = z.object({
  question: z.string().describe('The next question posed by the AI tutor, or a concluding remark if stage is "completed". If a multiple-choice question, include options A, B, C, D.'),
  feedback: z.string().optional().describe('Concise and encouraging feedback on the student\'s answer (if provided). Should be positive for correct answers or explanatory for incorrect ones. For new stages, it can be an introduction. This field MUST always be populated with a non-empty string unless the stage is "completed" and no final feedback is generated.'),
  isCorrect: z.boolean().optional().describe('Indicates if the student\'s last answer was correct. Null if no answer was provided or not applicable.'),
  suggestions: z.array(z.string()).optional().describe("A list of 1-2 specific suggestions for further study within the current topic/stage, such as related sub-topics or concepts the student might ask about next within the current topic."),
  nextStage: z.enum(['initial_material', 'deeper_material', 'out_of_syllabus', 'completed'])
    .describe("The stage the AI determines should be next. This MUST always be populated."),
  isStageComplete: z.boolean()
    .describe("True if the current stage's objectives have been met and it's time to transition to 'nextStage'. This MUST always be populated.")
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
  For these first two stages ('initial_material' and 'deeper_material'), you MUST NOT introduce any information, concepts, or terms not explicitly found or directly inferable from THIS specific '{{{topic}}}' material. All questions and evaluations must be based SOLELY on this provided context.

  Student Profile:
  Name: {{{studentProfile.name}}}
  Age: {{{studentProfile.age}}}
  Country: {{{studentProfile.country}}}
  Preferred Language: {{{studentProfile.preferredLanguage}}}
  Educational Context: {{#with studentProfile.educationQualification}}{{#if boardExam.board}}Board: {{{boardExam.board}}}{{#if boardExam.standard}}, Standard: {{{boardExam.standard}}}{{/if}}{{/if}}{{#if competitiveExam.examType}}Exam: {{{competitiveExam.examType}}}{{#if competitiveExam.specificExam}} ({{{competitiveExam.specificExam}}}){{/if}}{{#if competitiveExam.stage}}, Stage: {{{competitiveExam.stage}}}{{/if}}{{#if competitiveExam.examDate}}, Due: {{{competitiveExam.examDate}}}{{/if}}{{/if}}{{#if universityExam.universityName}}University: {{{universityExam.universityName}}}, Course: {{{universityExam.course}}}{{#if universityExam.currentYear}}, Year: {{{universityExam.currentYear}}}{{/if}}{{/if}}{{else}}General knowledge for age {{{studentProfile.age}}}, within '{{{topic}}}'.{{/with}}

  Conversation Context:
  {{#if conversationHistory}}Recent History (last few turns): {{{conversationHistory}}}{{/if}}
  {{#if previousQuestion}}Previous AI Question: "{{{previousQuestion}}}"{{/if}}
  {{#if studentAnswer}}Student's Answer to Previous Question: "{{{studentAnswer}}}"{{/if}}

  Current Q&A Stage: {{{currentStage}}}
  User has answered {{questionsAskedInStage}} questions in THIS Current Stage.

  Your Task:
  1.  **Feedback Generation (if 'studentAnswer' is provided)**:
      *   Evaluate 'studentAnswer' based ONLY on '{{{topic}}}' content (for 'initial_material' & 'deeper_material' stages). Set 'isCorrect'.
      *   'feedback' field MUST contain short, positive affirmation if correct, or gentle explanation/clarification if incorrect/partial. Ensure feedback is NOT null/empty.
      *   All 'feedback' in {{{studentProfile.preferredLanguage}}}.

  2.  **Feedback Generation (if NO 'studentAnswer' is provided - e.g., start of session/new stage)**:
      *   Set 'isCorrect' to null.
      *   'feedback' field MUST contain a brief stage introduction for '{{{topic}}}' relevant to '{{{currentStage}}}'. (e.g., "Let's start with foundational questions on '{{{topic}}}'.") Ensure feedback is NOT null/empty.

  3.  **Question Style**: Ask ONE multiple-choice question (MCQ) at a time, relevant to '{{{currentStage}}}' objective for '{{{topic}}}'.
      *   'question' field MUST include the MCQ and 3-4 distinct options (A, B, C, D). Example: "Which is a primary color?\\nA) Green\\nB) Orange\\nC) Blue\\nD) Purple"

  4.  **Conciseness & Focus**: Maintain concise, focused interaction.

  5.  **Suggestions**: After feedback/question (unless 'nextStage' is 'completed'), provide 1-2 'suggestions' for related aspects *within '{{{topic}}}'* for current stage.

  6.  **Language**: All 'question', 'feedback', 'suggestions' in {{{studentProfile.preferredLanguage}}}.

  7.  **Output Control**: CRITICAL: You MUST populate 'nextStage' and 'isStageComplete' in your JSON output.
      *   'isStageComplete': true if you are transitioning to a new stage OR if the entire topic Q&A is now 'completed'. False otherwise.
      *   'nextStage': The stage you are now targeting with your question, or 'completed'.

  8.  **RAG Simulation**: For 'initial_material' & 'deeper_material', act as if retrieving info ONLY from '{{{topic}}}'. For 'out_of_syllabus', you may draw on related general knowledge.

  Stage-Specific Logic:
  (You are currently in '{{{currentStage}}}'. User has answered {{questionsAskedInStage}} questions for this stage.)

  {{#if isInitialMaterialStage}}
  **Current Stage: Initial Material Review (Target: 3 questions total). User has answered {{questionsAskedInStage}} questions in this stage. Objective: Test foundational understanding of '{{{topic}}}'.**
  *   If {{questionsAskedInStage}} < 3: Ask the next foundational MCQ about '{{{topic}}}'. Set 'nextStage' to 'initial_material' and 'isStageComplete' to false.
  *   If {{questionsAskedInStage}} >= 3: 'initial_material' stage is complete. Your 'feedback' is for the student's 3rd answer. Your 'question' MUST be the *first* MCQ for 'deeper_material' stage. Set 'nextStage' to 'deeper_material' and 'isStageComplete' to true.
  {{/if}}

  {{#if isDeeperMaterialStage}}
  **Current Stage: Deeper Material Analysis (Target: 2 questions total). User has answered {{questionsAskedInStage}} questions in this stage. Objective: Ask analytical MCQs about '{{{topic}}}'.**
  *   If {{questionsAskedInStage}} < 2: Ask the next analytical MCQ about '{{{topic}}}'. Set 'nextStage' to 'deeper_material' and 'isStageComplete' to false.
  *   If {{questionsAskedInStage}} >= 2: 'deeper_material' stage is complete. Your 'feedback' is for the student's 2nd answer. Your 'question' MUST be the *first* MCQ for 'out_of_syllabus' stage. Set 'nextStage' to 'out_of_syllabus' and 'isStageComplete' to true.
  {{/if}}

  {{#if isOutOfSyllabusStage}}
  **Current Stage: Beyond the Syllabus (Target: 1 question total). User has answered {{questionsAskedInStage}} questions in this stage. Objective: Ask 1 MCQ connecting '{{{topic}}}' to broader concepts.**
  *   If {{questionsAskedInStage}} < 1: Ask the 1st "beyond syllabus" MCQ. Set 'nextStage' to 'out_of_syllabus' and 'isStageComplete' to false.
  *   If {{questionsAskedInStage}} >= 1: 'out_of_syllabus' stage is complete. Your 'feedback' is for the student's 1st answer. Your 'question' MUST be a concluding remark for '{{{topic}}}' (e.g., "We've covered the key aspects of {{{topic}}}. Well done!"). Set 'nextStage' to 'completed' and 'isStageComplete' to true.
  {{/if}}

  {{#if isCompletedStage}}
  **Topic Completed**
  *   If 'studentAnswer' was provided (meaning user answered the last 'out_of_syllabus' question): Provide 'feedback' for that answer. 'question' should be your concluding remark: "We've covered the key aspects of {{{topic}}}. Well done! You can select a new topic or use the 'New Q&A on This Topic' button to review it again."
  *   If NO 'studentAnswer' (this state normally reached after above): 'feedback' is "Great job completing this topic session!". 'question' same concluding remark.
  *   Always set 'nextStage' to 'completed' and 'isStageComplete' to true. 'suggestions' empty.
  {{/if}}
  `,
  config: {
    temperature: 0.15,
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
    // Ensure nested educationQualification objects exist to prevent Handlebars errors
    const baseInput = {
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

    const stageEnhancedInput = {
      ...baseInput,
      isInitialMaterialStage: baseInput.currentStage === 'initial_material',
      isDeeperMaterialStage: baseInput.currentStage === 'deeper_material',
      isOutOfSyllabusStage: baseInput.currentStage === 'out_of_syllabus',
      isCompletedStage: baseInput.currentStage === 'completed',
    };

    const {output} = await prompt(stageEnhancedInput);

    if (output && output.question && output.nextStage !== undefined && output.isStageComplete !== undefined) {
        let feedbackString = (output.feedback && output.feedback.trim() !== "") ? output.feedback.trim() : undefined;
        
        if (!feedbackString && !(stageEnhancedInput.isCompletedStage && output.nextStage === 'completed')) {
            if (!inputUnsafe.studentAnswer) { // If no student answer, it's start of a stage/session
                 switch(stageEnhancedInput.currentStage) {
                    case 'initial_material': feedbackString = `Let's start with some foundational questions on '${stageEnhancedInput.topic}'.`; break;
                    case 'deeper_material': feedbackString = `Great! Now, let's explore '${stageEnhancedInput.topic}' a bit more deeply.`; break;
                    case 'out_of_syllabus': feedbackString = `Okay, let's see how '${stageEnhancedInput.topic}' connects to broader ideas.`; break;
                    default: feedbackString = "Let's continue!";
                 }
            } else { // Student provided an answer, but AI didn't give feedback (which it should)
                feedbackString = "Okay, let's move to the next question."; // Generic fallback
            }
        }


        return {
            question: output.question,
            feedback: feedbackString,
            isCorrect: output.isCorrect, // Keep as is, can be undefined
            suggestions: output.suggestions || [],
            nextStage: output.nextStage,
            isStageComplete: output.isStageComplete,
        };
    }

    console.warn("Interactive Q&A: AI output was malformed or missing critical fields. Input:", JSON.stringify(stageEnhancedInput), "Output:", JSON.stringify(output));
    // Ensure to return a valid structure even on internal error.
    // Provide a default question or error message for the user.
    return {
        question: `I'm having a bit of trouble with the stage logic for '${stageEnhancedInput.currentStage}' about ${stageEnhancedInput.topic}. Could you ask a question, or should we try to restart this topic?`,
        feedback: "Apologies, there was an issue with processing the Q&A stage. Please try again.",
        isCorrect: undefined,
        suggestions: [],
        nextStage: stageEnhancedInput.currentStage, // Stay in current stage on error
        isStageComplete: false, // Don't complete stage on error
    };
  }
);
    
