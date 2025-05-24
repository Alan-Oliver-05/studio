
'use server';
/**
 * @fileOverview This file defines a Genkit flow for providing in-depth tutorials on a specific topic.
 *
 * - inDepthTutorials - A function that initiates and manages the in-depth tutorials flow.
 * - InDepthTutorialsInput - The input type for the inDepthTutorials function.
 * - InDepthTutorialsOutput - The return type for the inDepthTutorials function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InDepthTutorialsInputSchema = z.object({
  studentProfile: z.object({
    name: z.string().describe("The student's name."),
    age: z.number().describe("The student's age."),
    preferredLanguage: z.string().describe("The student's preferred language for the tutorial."),
    educationQualification: z.object({ // Simplified for tutorial context, full profile might be overkill here but useful
      boardExam: z.object({ standard: z.string().optional() }).optional(),
      competitiveExam: z.object({ examType: z.string().optional() }).optional(),
      universityExam: z.object({ course: z.string().optional(), currentYear: z.string().optional() }).optional(),
    }).optional().describe("Student's general educational level or context."),
  }).describe("The student profile information."),
  topic: z.string().describe('The topic for the in-depth tutorial (e.g., "Photosynthesis", "Newton\'s Laws of Motion").'),
  specificAspect: z.string().optional().describe('A specific aspect of the topic the student wants to focus on (e.g., "the Calvin cycle in photosynthesis", "the second law").'),
  visualAidsRequested: z.boolean().optional().default(false).describe('Whether the student wants suggestions for visual aids.'),
});
export type InDepthTutorialsInput = z.infer<typeof InDepthTutorialsInputSchema>;

const VisualAidSuggestionSchema = z.object({
  type: z.enum(['image_prompt', 'diagram_description', 'chart_data_example', 'flowchart_steps']).describe('Type of visual aid suggested.'),
  description: z.string().describe('A brief description of what the visual aid should illustrate.'),
  content: z.string().optional().describe('A detailed prompt for image generation, a textual description for a diagram/flowchart, or example data structure for a chart.'),
});

const InDepthTutorialsOutputSchema = z.object({
  tutorialTitle: z.string().describe("A clear title for the tutorial, e.g., 'In-depth Tutorial: Photosynthesis'."),
  introduction: z.string().describe('A brief introduction to the topic and what will be covered.'),
  detailedExplanation: z.string().describe('The main in-depth explanation of the topic, broken into logical sections or steps if appropriate. This should be comprehensive and easy to understand for the student\'s level.'),
  examples: z.array(z.string()).optional().describe('One or more relevant examples to illustrate key concepts. Each example should be clearly explained.'),
  keyTakeaways: z.array(z.string()).optional().describe('A few bullet points summarizing the most important points of the tutorial.'),
  visualAidSuggestions: z.array(VisualAidSuggestionSchema).optional().describe('If visual aids were requested, an array of suggestions for visuals that could enhance understanding.'),
  furtherStudyPrompts: z.array(z.string()).optional().describe('2-3 prompts or questions for the student to consider for further study or to test their understanding.'),
});
export type InDepthTutorialsOutput = z.infer<typeof InDepthTutorialsOutputSchema>;

export async function inDepthTutorials(input: InDepthTutorialsInput): Promise<InDepthTutorialsOutput> {
  return inDepthTutorialsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'inDepthTutorialsPrompt',
  input: {schema: InDepthTutorialsInputSchema},
  output: {schema: InDepthTutorialsOutputSchema},
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: `You are an expert AI Tutor tasked with creating an in-depth tutorial.

  Student Profile:
  Name: {{{studentProfile.name}}}
  Age: {{{studentProfile.age}}}
  Preferred Language: {{{studentProfile.preferredLanguage}}}
  Education Level Hint: {{#with studentProfile.educationQualification}}{{#if boardExam.standard}}School (Standard {{{boardExam.standard}}}){{else if competitiveExam.examType}}Competitive Exam ({{{competitiveExam.examType}}}){{else if universityExam.course}}University ({{{universityExam.course}}}{{#if universityExam.currentYear}}, Year {{{universityExam.currentYear}}}{{/if}}){{else}}General Learner{{/if}}{{else}}General Learner{{/with}}

  Tutorial Topic: {{{topic}}}
  {{#if specificAspect}}Specific Focus: {{{specificAspect}}}{{/if}}

  Instructions:
  Provide the tutorial content in "{{{studentProfile.preferredLanguage}}}".
  The tutorial should be comprehensive, clear, and engaging for the student's likely educational level.
  Structure your response according to the InDepthTutorialsOutputSchema.

  1.  **tutorialTitle**: Create a fitting title, like "In-depth Tutorial: {{{topic}}}".
  2.  **introduction**: Briefly introduce the topic and what the tutorial will cover. If a 'specificAspect' is given, acknowledge it.
  3.  **detailedExplanation**: This is the core. Explain the '{{{topic}}}' (and '{{{specificAspect}}}' if provided) in detail. Use simple language, break down complex parts, and use paragraphs for readability.
  4.  **examples**: Provide 1-3 clear examples that illustrate the concepts explained. Explain each example.
  5.  **keyTakeaways**: List 2-4 bullet points summarizing the main points.
  6.  {{#if visualAidsRequested}}**visualAidSuggestions**: Suggest 1-2 relevant visual aids. For each:
      *   'type': Choose from 'image_prompt', 'diagram_description', 'chart_data_example', 'flowchart_steps'.
      *   'description': Briefly explain what the visual should show.
      *   'content': If 'image_prompt', provide a detailed prompt. If 'diagram_description' or 'flowchart_steps', provide a textual outline. If 'chart_data_example', give a small example of how data might be structured (e.g., JSON array of objects).
  {{/if}}
  7.  **furtherStudyPrompts**: Offer 2-3 thought-provoking questions or prompts to encourage the student to think further or test their understanding.

  Ensure the entire output is a single JSON object.
  `,
  config: {
    temperature: 0.5,
     safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  }
});

const inDepthTutorialsFlow = ai.defineFlow(
  {
    name: 'inDepthTutorialsFlow',
    inputSchema: InDepthTutorialsInputSchema,
    outputSchema: InDepthTutorialsOutputSchema,
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

    if (output && output.tutorialTitle && output.introduction && output.detailedExplanation) {
        return { // Ensure all fields are present, defaulting optionals if AI misses them
            tutorialTitle: output.tutorialTitle,
            introduction: output.introduction,
            detailedExplanation: output.detailedExplanation,
            examples: output.examples || [],
            keyTakeaways: output.keyTakeaways || [],
            visualAidSuggestions: input.visualAidsRequested ? (output.visualAidSuggestions || []) : undefined,
            furtherStudyPrompts: output.furtherStudyPrompts || [],
        };
    }
    // Fallback
    return {
        tutorialTitle: `Tutorial: ${input.topic}`,
        introduction: `This tutorial will cover ${input.topic}.`,
        detailedExplanation: "I'm having trouble generating the full tutorial content right now. Please try again shortly or ask a specific question about the topic.",
        examples: [],
        keyTakeaways: [],
        furtherStudyPrompts: [`What is the most interesting part of ${input.topic} to you?`]
    };
  }
);
