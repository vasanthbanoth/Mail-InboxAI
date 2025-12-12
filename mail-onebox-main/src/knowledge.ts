import elasticsearchClient from './helpers/elasticsearch';
import { getEmbedding } from './helpers/embedding';

const KNOWLEDGE_INDEX = 'knowledge_base';

/**
 * Adds a new piece of knowledge to the vector database.
 * It generates an embedding for the text and stores both.
 * @param text The knowledge text to add (e.g., an instruction or agenda).
 */
export const addKnowledge = async (text: string) => {
  console.log(`Adding new knowledge: "${text}"`);
  const embedding = await getEmbedding(text);

  await elasticsearchClient.index({
    index: KNOWLEDGE_INDEX,
    document: {
      text,
      embedding,
    },
    refresh: true, // Make it immediately available for search
  });
  console.log('Knowledge added successfully.');
};

/**
 * Searches the knowledge base for the most relevant documents to a given query text.
 * @param queryText The text to search with.
 * @param k The number of top results to return.
 */
export const searchKnowledge = async (queryText: string, k = 1) => {
  const queryEmbedding = await getEmbedding(queryText);

  const result = await elasticsearchClient.search({
    index: KNOWLEDGE_INDEX,
    body: {
      query: {
        script_score: {
          query: { match_all: {} },
          script: {
            source: "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
            params: {
              query_vector: queryEmbedding,
            },
          },
        },
      },
      size: k,
    },
  });

  return result.hits.hits.map((hit: any) => hit._source.text);
};