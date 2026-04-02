import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_KEY } from '../config';

const genAI = new GoogleGenerativeAI(GEMINI_KEY);

export async function generateTopicSummary(topicName, subjectName) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Give a 5-point MBBS exam summary for ${topicName} from 
${subjectName}. Include: 1) Key concept 2) Best mnemonic 3) Clinical 
correlation 4) Exam tip 5) Highest yield point. 
Format as numbered list. Keep each point under 2 sentences.`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    return 'Failed to generate summary. Please try again.';
  }
}

export async function generateQuiz(topicName, subjectName) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Generate 5 MCQs for MBBS students about ${topicName} 
from ${subjectName}. Return ONLY valid JSON array, no markdown, no extra text.
Format exactly: [{"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],
"correctIndex":0,"explanation":"..."}]`;
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g,'').trim();
    return JSON.parse(text);
  } catch (err) {
    throw new Error('Quiz generation failed. Please try again.');
  }
}