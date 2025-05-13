'use server';
/**
 * @fileOverview A Genkit flow to retrieve lessons for a given subject based on the student's profile.
 *
 * - getLessonsForSubject - A function that initiates the flow to get lessons.
 * - GetLessonsForSubjectInput - The input type for the getLessonsForSubject function.
 * - GetLessonsForSubjectOutput - The return type for the getLessonsForSubject function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
// Assuming UserProfile type is defined elsewhere and matches this structure
// import type { UserProfile } from '@/types'; 

const UserProfileSchema = z.object({
  name: z.string(),
  age: z.number().or(z.string()), // age can be string from form
  gender: z.string(),
  country: z.string(),
  state: z.string(),
  preferredLanguage: z.string(),
  educationCategory: z.string().describe("The primary education focus, e.g., 'board', 'competitive', 'university'."),
  educationQualification: z.object({
    boardExams: z.object({ 
        board: z.string().optional().describe('The specific education board (e.g., CBSE, State Board Name).'), 
        standard: z.string().optional().describe('The student\'s current standard or grade (e.g., 10th, 12th).') 
    }).optional(),
    competitiveExams: z.object({ 
        examType: z.string().optional().describe('The category of competitive exam.'), 
        specificExam: z.string().optional().describe('The name of the specific competitive exam.') 
    }).optional(),
    universityExams: z.object({ 
        universityName: z.string().optional().describe('The name of the university.'), 
        collegeName: z.string().optional().describe('The name of the college, if applicable.'), 
        course: z.string().optional().describe('The student\'s course or major.'), 
        currentYear: z.string().optional().describe('The student\'s current year of university study.') 
    }).optional(),
  }).describe('Detailed educational qualifications.'),
});


const GetLessonsForSubjectInputSchema = z.object({
  subjectName: z.string().describe('The name of the subject for which lessons are requested (e.g., "Physics for 12th Standard CBSE").'),
  studentProfile: UserProfileSchema.describe('The detailed profile of the student.'),
});
export type GetLessonsForSubjectInput = z.infer<typeof GetLessonsForSubjectInputSchema>;

const LessonSchema = z.object({
  name: z.string().describe('The name of the lesson or module (e.g., "Optics", "Calculus", "Indian National Movement").'),
  description: z.string().optional().describe('A brief description of what the lesson covers, relevant to the student\'s syllabus.'),
});

const GetLessonsForSubjectOutputSchema = z.object({
  lessons: z.array(LessonSchema).describe('A list of lessons or modules for the given subject, tailored to the student\'s specific educational context and syllabus (e.g., based on their board, standard, country, or exam type).'),
});
export type GetLessonsForSubjectOutput = z.infer<typeof GetLessonsForSubjectOutputSchema>;

export async function getLessonsForSubject(input: GetLessonsForSubjectInput): Promise<GetLessonsForSubjectOutput> {
  return getLessonsForSubjectFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getLessonsForSubjectPrompt',
  input: {schema: GetLessonsForSubjectInputSchema},
  output: {schema: GetLessonsForSubjectOutputSchema},
  prompt: `You are an AI curriculum specialist. Your task is to generate a list of relevant lessons (or modules/units) for a specific subject, tailored to a student's detailed educational profile.
  These lessons should reflect what would typically be found in the official syllabus or curriculum for their context.

  Subject: {{{subjectName}}}

  Student Profile:
  Name: {{{studentProfile.name}}}
  Age: {{{studentProfile.age}}}
  Country: {{{studentProfile.country}}}
  State/Province: {{{studentProfile.state}}}
  Preferred Language for Study: {{{studentProfile.preferredLanguage}}}
  Primary Education Focus: {{{studentProfile.educationCategory}}}

  Detailed Education Qualification:
  {{#with studentProfile.educationQualification}}
    {{#if boardExams.board}}
    Board: {{{boardExams.board}}}
    Standard/Grade: {{{boardExams.standard}}}
    Context: School curriculum for {{{boardExams.standard}}} standard under {{{boardExams.board}}}.
    {{/if}}
    {{#if competitiveExams.examType}}
    Competitive Exam Category: {{{competitiveExams.examType}}}
    Specific Exam: {{{competitiveExams.specificExam}}}
    Context: Syllabus for {{{competitiveExams.specificExam}}} ({{{competitiveExams.examType}}}).
    {{/if}}
    {{#if universityExams.universityName}}
    University: {{{universityExams.universityName}}}
    {{#if universityExams.collegeName}}College: {{{universityExams.collegeName}}}{{/if}}
    Course/Major: {{{universityExams.course}}}
    Current Year: {{{universityExams.currentYear}}}
    Context: Curriculum for {{{universityExams.course}}}, year {{{universityExams.currentYear}}} at {{{universityExams.universityName}}}.
    {{/if}}
  {{/with}}

  Based on the subject "{{{subjectName}}}" and the student's specific educational context (considering their board, standard, country, state, exam, or university course details), generate a list of 5-10 key lessons or modules.
  Each lesson must have a 'name' and an optional 'description'.
  For example, if subject is "Mathematics" for a "10th Standard" student under "CBSE" board in "India", lessons might include "Real Numbers", "Polynomials", "Pair of Linear Equations in Two Variables", "Quadratic Equations", "Arithmetic Progressions", "Triangles", "Coordinate Geometry", "Introduction to Trigonometry", "Circles", "Statistics", "Probability".
  If the subject is "General Awareness" for "Banking" competitive exams, lessons could be "Indian Financial System", "Current Affairs (Last 6 months)", "Banking Terminology", "Static GK (India-focused)".

  Return the lessons as a JSON object with a "lessons" array.
  Prioritize accuracy based on the provided educational details.
  `,
  config: {
    temperature: 0.2, 
  }
});

const getLessonsForSubjectFlow = ai.defineFlow(
  {
    name: 'getLessonsForSubjectFlow',
    inputSchema: GetLessonsForSubjectInputSchema,
    outputSchema: GetLessonsForSubjectOutputSchema,
  },
  async (input) => {
    // Ensure age is a number for the profile if it's a string
    const profileWithNumericAge = {
      ...input.studentProfile,
      age: Number(input.studentProfile.age) || 0, // Default to 0 if conversion fails
    };

    const {output} = await prompt({ ...input, studentProfile: profileWithNumericAge });
    return output || { lessons: [] };
  }
);

