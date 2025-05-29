
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
  prompt: `You are an AI education platform. Your primary task is to generate a list of highly relevant academic subjects and key study topics for a student, meticulously based on their detailed profile.
  The subjects MUST strictly align with typical official curricula or syllabuses for the student's specific educational context (country, state, language, board, standard, exam type, or university course). Prioritize accuracy and relevance above all.
  CRITICAL: For the exact same student profile input, you MUST consistently return the exact same list of subjects and their descriptions. Avoid any variations unless the input profile itself changes. This consistency is paramount.

  Student Profile:
  Name: {{{name}}}
  Age: {{{age}}}
  Gender: {{{gender}}}
  Country: {{{country}}}
  State/Province: {{{state}}}
  Preferred Language for Study: {{{preferredLanguage}}}

  Education Qualification Details:
  {{#if educationQualification.boardExams.board}}
  Board: {{{educationQualification.boardExams.board}}}
  Standard/Grade: {{{educationQualification.boardExams.standard}}}
  Focus: School curriculum (Board Exams) for {{{educationQualification.boardExams.board}}}, standard {{{educationQualification.boardExams.standard}}} in {{{country}}}.
  {{/if}}
  {{#if educationQualification.competitiveExams.examType}}
  Competitive Exam Category: {{{educationQualification.competitiveExams.examType}}}
  Specific Exam: {{{educationQualification.competitiveExams.specificExam}}}
  Focus: Competitive Exam Preparation for {{{educationQualification.competitiveExams.specificExam}}} ({{{educationQualification.competitiveExams.examType}}}) in {{{country}}}.
  {{/if}}
  {{#if educationQualification.universityExams.universityName}}
  University: {{{educationQualification.universityExams.universityName}}}
  {{#if educationQualification.universityExams.collegeName}}College: {{{educationQualification.universityExams.collegeName}}}{{/if}}
  Course/Major: {{{educationQualification.universityExams.course}}}
  Current Year: {{{educationQualification.universityExams.currentYear}}}
  Focus: University Curriculum for {{{educationQualification.universityExams.course}}}, year {{{educationQualification.universityExams.currentYear}}} at {{{educationQualification.universityExams.universityName}}} in {{{country}}}.
  {{/if}}

  Based on this precise profile, please carefully generate a list of subjects. For each subject:
  1.  Provide a "name" that precisely reflects the educational context and, if applicable, the specific exam. Examples:
      *   If a board exam: "Physics for {{{educationQualification.boardExams.standard}}} Standard {{{educationQualification.boardExams.board}}}"
      *   If a competitive exam (e.g., specificExam = "JEE Main"): "Mathematics for JEE Main", "Chemistry for JEE Main"
      *   If a university course: "Thermodynamics for {{{educationQualification.universityExams.course}}}, Year {{{educationQualification.universityExams.currentYear}}} - {{{educationQualification.universityExams.universityName}}}"
      *   If a general competitive exam category (e.g., examType = "Banking") and no specificExam: "Quantitative Aptitude for Banking Exams - {{{country}}}", "Reasoning Ability for Banking Exams - {{{country}}}"
  2.  Provide a concise "description" for the subject, tailored to this student and their curriculum focus. If a specific exam like "{{{educationQualification.competitiveExams.specificExam}}}" is mentioned, the description MUST directly reflect preparation for that exam.
  3.  List key "studyMaterials" (which are core topics, chapters, or sections) directly relevant to their specific syllabus or exam pattern.
      *   If 'educationQualification.competitiveExams.specificExam' is provided and recognized (like "JEE Main", "UPSC CSE", "NEET UG", "CAT", "CA", "CMA", "CS", "CPA", "CFA", "ACCA", "FRM"): the 'studyMaterials' MUST be the main sections/subjects tested in THAT PARTICULAR EXAM for {{{country}}}. For example, for "JEE Main", list Mathematics, Physics, Chemistry. For "UPSC CSE Prelims", list topics like Current Events, History of India, Indian and World Geography, etc.
      *   If only a general competitive exam category (e.g., 'examType' = "Banking") is given without a 'specificExam', list general sections common to that category of exams in {{{country}}}.
      *   For board or university courses, list core chapters or units from the typical syllabus for that level and subject.

  Output must be in the specified JSON format for the student's benefit.
  Consider the student's 'country' ({{{country}}}) and 'state' ({{{state}}}) to infer regional curriculum variations if applicable (e.g., for state boards in India or state-specific competitive exams).
  The output language for subject names and descriptions should be English, but the content focus must be based on the student's curriculum (derived from their profile, including {{{preferredLanguage}}} if relevant to the curriculum itself).
  Double-check that the generated subjects and topics are standard and accurate for the specified education level and region. Be concise and directly relevant.
  If no specific education focus is clear (e.g., educationCategory is "other" with no details, or essential details for a category are missing), provide general knowledge subjects appropriate for the student's age and location, still maintaining consistency for that specific "other" profile.
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
    const {output} = await prompt(input);
    // Ensure a valid output structure, returning empty subjects if AI fails or output is malformed
    if (output && Array.isArray(output.subjects)) {
        // Further ensure each subject has the required fields to prevent downstream errors
        const validSubjects = output.subjects.filter(
            subject => subject && typeof subject.name === 'string' && typeof subject.description === 'string' && Array.isArray(subject.studyMaterials)
        );
        if (validSubjects.length !== output.subjects.length) {
            console.warn("Some subjects were filtered due to missing fields. Original count:", output.subjects.length, "Valid count:", validSubjects.length);
        }
        return { subjects: validSubjects };
    }
    // Fallback if output is not as expected
    console.warn("AI output for subjects was malformed or missing. Input was:", JSON.stringify(input));
    return { subjects: [] };
  }
);
    
    
    
    
