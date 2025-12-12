import { spawn } from 'child_process';
import path from 'path';

/**
 * Generates an embedding for a given text by calling a Python script.
 * @param text The text to embed.
 */
export const getEmbedding = (text: string): Promise<number[]> => {
  return new Promise((resolve, reject) => {
    if (!text || text.trim() === '') {
      console.warn('Skipping embedding for empty text.');
      resolve(null);
      return;
    }

    const pythonScript = path.join(__dirname, 'generate_embedding.py');
    const pythonProcess = spawn('python', [pythonScript, text]);

    let result = '';
    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Error from Python script: ${data}`);
      reject(data.toString());
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        return reject(`Python script exited with code ${code}`);
      }
      try {
        const embedding = JSON.parse(result);
        resolve(embedding);
      } catch (error) {
        reject('Failed to parse embedding from Python script');
      }
    });
  });
};
