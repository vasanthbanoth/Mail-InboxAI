import elasticsearchClient from './elasticsearch';
import { getEmbedding } from './embedding';

/**
 * Adds a new piece of knowledge to the 'knowledge_base' index in Elasticsearch.
 * @param text The text content of the knowledge to add.
 */
export const addKnowledge = async (text: string) => {
  const embedding = await getEmbedding(text);

  await elasticsearchClient.index({
    index: 'knowledge_base',
    document: {
      text,
      embedding,
      createdAt: new Date(),
    },
  });
};

/**
 * Searches for relevant knowledge in the 'knowledge_base' index using a query string.
 * @param query The query string to search for.
 * @param size The number of results to return.
 * @returns An array of text content from the search results.
 */
export const searchKnowledge = async (query: string, size = 10) => {
  const embedding = await getEmbedding(query);

  const response = await elasticsearchClient.search({
    index: 'knowledge_base',
    body: {
      query: {
        script_score: {
          query: { match_all: {} },
          script: {
            source: "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
            params: {
              query_vector: embedding,
            },
          },
        },
      },
      size: size,
    },
  });

  return response.hits.hits.map((hit: any) => hit._source.text);
};