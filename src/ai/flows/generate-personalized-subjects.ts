
// src/ai/flows/generate-personalized-subjects.ts
'use server';
/**
 * @fileOverview Generates personalized subjects and study materials for a student based on their profile.
 *
 * - generatePersonalizedSubjects - A function that generates personalized subjects and study materials.
 * - GeneratePersonalizedSubjectsInput - The input type for the generatePersonalizedSubjects function.
 * - GeneratePersonalizedSubjectsOutput - The return type for the generatePersonalizedSubjects function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePersonalizedSubjectsInputSchema = z.object({
  name: z.string().describe('The name of the student.'),
  age: z.number().describe('The age of the student.'),
  gender: z.string().describe('The gender of the student.'),
  country: z.string().describe('The country of the student.'),
  state: z.string().describe('The state of the student.'),
  preferredLanguage: z.string().describe('The preferred language of the student.'),
  educationQualification: z.object({
    boardExams: z.object({
      board: z.string().optional().describe('The specific education board (e.g., CBSE, State Board Name).'),
      standard: z.string().optional().describe('The student\'s current standard or grade (e.g., 10th, 12th).'),
    }).optional(),
    competitiveExams: z.object({
      examType: z.string().optional().describe('The category of competitive exam (e.g., Engineering Entrance, Civil Services).'),
      specificExam: z.string().optional().describe('The name of the specific competitive exam (e.g., JEE Main, UPSC CSE).'),
    }).optional(),
    universityExams: z.object({
      universityName: z.string().optional().describe('The name of the university.'),
      collegeName: z.string().optional().describe('The name of the college, if applicable.'),
      course: z.string().optional().describe('The student\'s course or major (e.g., Bachelor of Science in Computer Science).'),
      currentYear: z.string().optional().describe('The student\'s current year of university study (e.g., 1st, 2nd).'),
    }).optional(),
  }).describe('The education qualification of the student, detailing their specific area of study.'),
});
export type GeneratePersonalizedSubjectsInput = z.infer<typeof GeneratePersonalizedSubjectsInputSchema>;

const GeneratePersonalizedSubjectsOutputSchema = z.object({
  subjects: z.array(
    z.object({
      name: z.string().describe('The name of the subject (e.g., Physics, Algebra, Indian History).'),
      description: z.string().describe('A brief description of the subject tailored to the student\'s context.'),
      studyMaterials: z.array(z.string()).describe('A list of key topics or areas within the subject, suitable for the student\'s level and educational context.'),
    })
  ).describe('A list of personalized subjects and study materials, highly relevant to the student\'s specific educational background and syllabus.'),
});
export type GeneratePersonalizedSubjectsOutput = z.infer<typeof GeneratePersonalizedSubjectsOutputSchema>;

export async function generatePersonalizedSubjects(input: GeneratePersonalizedSubjectsInput): Promise<GeneratePersonalizedSubjectsOutput> {
  return generatePersonalizedSubjectsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePersonalizedSubjectsPrompt',
  input: {schema: GeneratePersonalizedSubjectsInputSchema},
  output: {schema: GeneratePersonalizedSubjectsOutputSchema},
  prompt: `You are an expert AI curriculum analyst. Your primary and most critical task is to meticulously analyze the provided student profile and generate a definitive, consistent list of academic subjects and key study topics.
Your output for a given profile MUST be deterministic. For the exact same student profile, you MUST return the exact same list of subjects. This consistency is paramount.

Carefully analyze every detail in the student's profile: their age, location (country and state), and most importantly, their specific educational qualification. The subjects you generate MUST strictly align with the official curriculum or syllabus for that context.

Student Profile:
Name: {{{name}}}
Age: {{{age}}}
Gender: {{{gender}}}
Country: {{{country}}}
State/Province: {{{state}}}
Preferred Language for Study: {{{preferredLanguage}}}

Education Qualification Details:
{{#if educationQualification.boardExams.board}}
Focus: School Board Exams
Board: {{{educationQualification.boardExams.board}}}
Standard/Grade: {{{educationQualification.boardExams.standard}}}
Context: The official curriculum for the {{{educationQualification.boardExams.board}}} board for standard {{{educationQualification.boardExams.standard}}} in {{{country}}}.
{{/if}}
{{#if educationQualification.competitiveExams.examType}}
Focus: Competitive Exam Preparation
Category: {{{educationQualification.competitiveExams.examType}}}
Specific Exam: {{{educationQualification.competitiveExams.specificExam}}}
Context: The official syllabus for the {{{educationQualification.competitiveExams.specificExam}}} exam in {{{country}}}.
{{/if}}
{{#if educationQualification.universityExams.universityName}}
Focus: University Curriculum
University: {{{educationQualification.universityExams.universityName}}}
Course/Major: {{{educationQualification.universityExams.course}}}
Current Year: {{{educationQualification.universityExams.currentYear}}}
Context: The official curriculum for the {{{educationQualification.universityExams.course}}} program, year {{{educationQualification.universityExams.currentYear}}}, at {{{educationQualification.universityExams.universityName}}} in {{{country}}}.
{{/if}}

Based on your meticulous analysis of the profile:
1.  Generate a list of subjects. For each subject:
    a.  Provide a 'name' that is precise and reflects the student's context. Examples: "Physics for 12th Standard CBSE", "Mathematics for JEE Main", "Thermodynamics for B.E. Mechanical - 2nd Year".
    b.  Provide a concise 'description' tailored to the student and their curriculum.
    c.  List key 'studyMaterials' (these are core topics or chapters) that are directly from the official syllabus for that context. For recognized exams like "JEE Main" or "UPSC CSE", these must be the main sections tested.

Output must be in the specified JSON format. Consider the student's 'country' ({{{country}}}) and 'state' ({{{state}}}) to infer regional curriculum variations. Be concise, accurate, and strictly relevant. If the education focus is not clear, provide general knowledge subjects appropriate for the student's age and location, but still maintain consistency.
  `,
  config: {
    temperature: 0.05, // Lowered temperature for maximum consistency and curriculum focus
  }
});

const generatePersonalizedSubjectsFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedSubjectsFlow',
    inputSchema: GeneratePersonalizedSubjectsInputSchema,
    outputSchema: GeneratePersonalizedSubjectsOutputSchema,
  },
  async input => {
    try {
        const {output} = await prompt(input);
        if (output && Array.isArray(output.subjects)) {
            const validSubjects = output.subjects.filter(
                subject => subject && typeof subject.name === 'string' && typeof subject.description === 'string' && Array.isArray(subject.studyMaterials)
            );
            if (validSubjects.length !== output.subjects.length) {
                console.warn("Some subjects were filtered due to missing fields. Original count:", output.subjects.length, "Valid count:", validSubjects.length);
            }
            return { subjects: validSubjects };
        }
        console.warn("AI output for subjects was malformed or missing. Input was:", JSON.stringify(input));
        return { subjects: [] };
    } catch (err) {
       console.error("Error in generatePersonalizedSubjectsFlow:", err);
       let errorMessage = err instanceof Error ? err.message : String(err);
       
       if (errorMessage.includes("API_KEY_SERVICE_BLOCKED") || (errorMessage.includes("403") && errorMessage.includes("generativelanguage.googleapis.com"))) {
          errorMessage = `The AI model request was blocked. This is almost always because the "Vertex AI API" is not enabled in your Google Cloud project. Please go to your project's "Enabled APIs & services" page and ensure "Vertex AI API" is active. See Step 4 in HOW_TO_GET_KEYS.md.`;
       } else if (errorMessage.includes("API key not valid")) {
          errorMessage = `The provided Google API Key is not valid. Please double-check your .env file and the key in your Google Cloud Console.`
       } else if (errorMessage.includes("PERMISSION_DENIED")) {
           errorMessage = `The AI model request was denied. This is likely due to API key restrictions. Please check Step 6 in HOW_TO_GET_KEYS.md to ensure your API key has no application or API restrictions.`
       }

       // Re-throw a more user-friendly error that can be caught by the UI
       throw new Error(`Failed to generate subjects. Reason: ${errorMessage}`);
    }
  }
);
    
    
    
    



