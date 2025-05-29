import { ai } from \'@/ai/genkit\';
import { z } from \'genkit\';
import { UserProfile as UserProfileType } from "@/types"; // Assuming UserProfileType is defined in types.ts

const GenerateMcqInputSchema = z.object({
  subject: z.string().describe("The subject of the multiple-choice questions."),
  topic: z.string().describe("The specific topic for the multiple-choice questions."),
  difficulty: z.enum(["easy", "medium", "hard"]).optional().describe("The desired difficulty level of the questions."),
  numberOfQuestions: z.number().int().positive().optional().describe("The number of multiple-choice questions to generate."),
  contextText: z.string().optional().describe("Optional text content to base the questions on."),
  studentProfile: z.object({
    name: z.string().describe("The student\'s name."),
    age: z.number().describe("The student\'s age."),
    gender: z.string().describe("The student\'s gender."),
    country: z.string().describe("The student\'s country."),
    state: z.string().describe("The student\'s state/province."),
    preferredLanguage: z.string().describe("The student\'s preferred language for learning."),
    educationQualification: z.object({
      boardExam: z.object({
        board: z.string().optional().describe('The board exam name (e.g., CBSE, State Board Name).'),
        standard: z.string().optional().describe("The student\'s current standard (e.g., 10th, 12th)."),
      }).optional(),
      competitiveExam: z.object({
        examType: z.string().optional().describe('The type of competitive exam (e.g., JEE, NEET, UPSC).'),
        specificExam: z.string().optional().describe('The specific competitive exam or job position (e.g., JEE Main, UPSC CSE).'),
      }).optional(),
      universityExam: z.object({
        universityName: z.string().optional().describe('The name of the university.'),
        collegeName: z.string().optional().describe('The name of the college, if applicable.'),
        course: z.string().optional().describe("The student\'s course of study (e.g., B.Sc. Physics)."),
        currentYear: z.string().optional().describe("The student\'s current year of study (e.g., 1st, 2nd)."),
      }).optional(),
    }).optional().describe("The student\'s detailed educational background, specifying board, exam, or university details. All sub-fields are optional."),
  }).optional().describe("The student profile information to tailor questions."),
});

const McqOutputSchema = z.object({
  questionText: z.string().describe("The text of the multiple-choice question."),
  options: z.array(z.string()).describe("An array of possible answer options."),
  correctAnswer: z.string().describe("The correct answer option."),
  explanation: z.string().optional().describe("An explanation for the correct answer."),
});

const GenerateMcqOutputSchema = z.object({
    mcqs: z.array(McqOutputSchema).describe("An array of generated multiple-choice questions."),
});

const generateMcqPrompt = ai.definePrompt({
  name: 'generateMcqPrompt',
  input: { schema: GenerateMcqInputSchema },
  output: { schema: GenerateMcqOutputSchema },
  model: 'googleai/gemini-1.5-flash-latest', // Use a powerful model for question generation
  prompt: `You are an expert in creating high-quality multiple-choice questions (MCQs) for educational purposes. Your task is to generate MCQs based on the provided subject, topic, and optional context text, tailored to the student's profile if available.

Subject: {{{subject}}}
Topic: {{{topic}}}

{{#if difficulty}}
Desired Difficulty: {{{difficulty}}}
{{/if}}

{{#if numberOfQuestions}}
Number of Questions to Generate: {{{numberOfQuestions}}}
{{else}}
Default Number of Questions: 3
{{/if}}

{{#if contextText}}
Context Text to Base Questions On:
"""
{{{contextText}}}
"""
{{/if}}

{{#if studentProfile}}
Student Profile (for tailoring questions):
Name: {{{studentProfile.name}}}
Education: {{{json studentProfile.educationQualification}}}
{{/if}}

Instructions:
1. Generate ${input.numberOfQuestions || 3} multiple-choice questions relevant to the provided subject, topic, and context text.
2. Ensure each question has 3-4 distinct and plausible options.
3. Provide the correct answer for each question.
4. Optionally, provide a brief explanation for the correct answer.
5. Your output MUST be a JSON object strictly adhering to the following schema. Do NOT include any other text or formatting outside the JSON object.

Output JSON Schema:
${JSON.stringify(GenerateMcqOutputSchema.passthrough().json(), null, 2)}
`,
});

export const generateMcq = ai.defineFlow(
  {
    name: \'generateMcq\',
    inputSchema: GenerateMcqInputSchema as any, // Cast to any to resolve potential type issues
    outputSchema: GenerateMcqOutputSchema as any, // Cast to any to resolve potential type issues
  },
  async (input) => {
    const { output } = await generateMcqPrompt.generate({
      input: input,
      config: {
        temperature: 0.7, // Adjust temperature for creativity
      },
    });
    return output?.toJson() || { mcqs: [] }; // Directly return toJson() or empty array if output is null/undefined
  },
);