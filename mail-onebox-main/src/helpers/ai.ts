
import Groq from 'groq-sdk';
import { EmailCategory } from '../models/email';
import { searchKnowledge } from './knowledge';
import { getEmbedding } from './embedding';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY environment variable is not set.');
}

const groqClient = new Groq({
  apiKey: GROQ_API_KEY,
});

const categories = Object.values(EmailCategory).join(', ');

export const categorizeEmail = async (emailContent: string): Promise<EmailCategory> => {
  try {
    const chatCompletion = await groqClient.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an email categorization assistant. Categorize the following email into one of these categories: ${categories}. Only respond with the category name.`,
        },
        { role: 'user', content: emailContent },
      ],
      model: 'llama3-8b-8192', // A recommended model from Groq
    });

    const category = chatCompletion?.choices[0]?.message?.content?.trim() as EmailCategory;

    if (Object.values(EmailCategory).includes(category)) {
      return category;
    }

    return EmailCategory.None;
  } catch (error) {
    console.error('Error categorizing email:', error);
    return EmailCategory.None;
  }
};

export const generateReply = async (emailContent: string): Promise<string> => {
    try {
        // 1. Retrieve relevant context from the knowledge base
        const context = await searchKnowledge(emailContent, 1);
        const retrievedKnowledge = context.length > 0 ? context.join('\n') : "No specific instructions found.";

        console.log(`Generating reply for email with retrieved context: "${retrievedKnowledge}"`);

        // 2. Generate a reply using the email and the retrieved context
        const chatCompletion = await groqClient.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `You are an expert email assistant. Your task is to draft a helpful and concise reply to an incoming email.
Use the following context to inform your reply.
---
CONTEXT:
${retrievedKnowledge}
---
Now, draft a reply for the following email. Be professional and friendly. Do not mention that you used context to generate the reply. Just provide the reply itself.`,
                },
                { role: 'user', content: emailContent },
            ],
            model: 'llama3-8b-8192', // A recommended model from Groq
        });

        return chatCompletion?.choices[0]?.message?.content?.trim() || '';
    } catch (error) {
        console.error('Error generating reply:', error);
        return '';
    }
};
