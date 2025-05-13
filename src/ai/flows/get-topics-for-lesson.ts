'use server';
/**
 * @fileOverview A Genkit flow to retrieve topics for a given lesson and subject, based on the student's profile.
 *
 * - getTopicsForLesson - A function that initiates the flow to get topics.
 * - GetTopicsForLessonInput - The input type for the getTopicsForLesson function.
 * - GetTopicsForLessonOutput - The return type for the getTopicsForLesson function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
// import type { UserProfile } from '@/types'; // Assuming UserProfile type is defined

const UserProfileSchema = z.object({
  name: z.string(),
  age: z.number().or(z.string()),
  gender: z.string(),
  country: z.string(),
  state: z.string(),
  preferredLanguage: z.string(),
  educationCategory: z.string().describe("The primary education focus, e.g., 'board', 'competitive', 'university'."),
  educationQualification: z.object({
    boardExams: z.object({ 
        board: z.string().optional().describe('The specific education board.'), 
        standard: z.string().optional().describe('The student\'s current standard/grade.') 
    }).optional(),
    competitiveExams: z.object({ 
        examType: z.string().optional().describe('The category of competitive exam.'), 
        specificExam: z.string().optional().describe('The name of the specific exam.') 
    }).optional(),
    universityExams: z.object({ 
        universityName: z.string().optional().describe('The name of the university.'), 
        collegeName: z.string().optional().describe('The name of the college.'), 
        course: z.string().optional().describe('The student\'s course/major.'), 
        currentYear: z.string().optional().describe('The student\'s current year of study.') 
    }).optional(),
  }).describe('Detailed educational qualifications.'),
});

const GetTopicsForLessonInputSchema = z.object({
  subjectName: z.string().describe('The name of the overall subject (e.g., "Physics for 12th Standard CBSE").'),
  lessonName: z.string().describe('The name of the lesson for which topics are requested (e.g., "Optics").'),
  studentProfile: UserProfileSchema.describe('The detailed profile of the student.'),
});
export type GetTopicsForLessonInput = z.infer<typeof GetTopicsForLessonInputSchema>;

const TopicSchema = z.object({
  name: z.string().describe('The name of the specific topic within the lesson (e.g., "Refraction of Light", "Lenses").'),
  description: z.string().optional().describe('A brief description of the topic, focusing on what the student needs to learn as per their syllabus.'),
});

const GetTopicsForLessonOutputSchema = z.object({
  topics: z.array(TopicSchema).describe('A list of specific topics within the lesson, tailored to the student\'s educational level, board, syllabus, or exam requirements.'),
});
export type GetTopicsForLessonOutput = z.infer<typeof GetTopicsForLessonOutputSchema>;

export async function getTopicsForLesson(input: GetTopicsForLessonInput): Promise<GetTopicsForLessonOutput> {
  return getTopicsForLessonFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getTopicsForLessonPrompt',
  input: {schema: GetTopicsForLessonInputSchema},
  output: {schema: GetTopicsForLessonOutputSchema},
  prompt: `You are an AI curriculum specialist. Your task is to break down a given lesson into specific, granular topics suitable for a student based on their detailed educational profile.
  These topics should align with what would typically be covered under that lesson in their official syllabus or curriculum.

  Overall Subject: {{{subjectName}}}
  Lesson to Break Down: {{{lessonName}}}

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

  Based on the lesson '{{{lessonName}}}' (part of subject '{{{subjectName}}}') and the student's specific educational context, generate a list of 5-10 specific topics.
  Each topic must have a 'name' and an optional 'description'.
  For example, for lesson "Polynomials" in subject "Mathematics" for a "10th Standard CBSE" student, topics might include "Geometrical Meaning of the Zeroes of a Polynomial", "Relationship between Zeroes and Coefficients of a Polynomial", "Division Algorithm for Polynomials".
  For lesson "Thermodynamics" in subject "Physics" for a "Mechanical Engineering, 1st Year" university student, topics might include "Basic Concepts and Zeroth Law", "First Law of Thermodynamics", "Second Law of Thermodynamics", "Entropy", "Thermodynamic Cycles".

  Return the topics as a JSON object with a "topics" array.
  Ensure the topics are granular enough for focused Q&A sessions and are directly relevant to the student's syllabus.
  `,
  config: {
    temperature: 0.2,
  }
});

const getTopicsForLessonFlow = ai.defineFlow(
  {
    name: 'getTopicsForLessonFlow',
    inputSchema: GetTopicsForLessonInputSchema,
    outputSchema: GetTopicsForLessonOutputSchema,
  },
  async (input) => {
     const profileWithNumericAge = {
      ...input.studentProfile,
      age: Number(input.studentProfile.age) || 0,
    };
    const {output} = await prompt({...input, studentProfile: profileWithNumericAge });
    return output || { topics: [] };
  }
);

