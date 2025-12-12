import elasticsearchClient from './helpers/elasticsearch';
import { getEmbedding } from './helpers/embedding';

export const connectDB = async () => {
  try {
    await elasticsearchClient.ping();
    console.log('Elasticsearch connected');
  } catch (error) {
    console.error('Elasticsearch connection error:', error);
    process.exit(1); // This is good, exit if DB connection fails
  }
};

export const createEmailIndex = async () => {
  const indexName = 'emails';
  
  try { // <-- Add try block
    const indexExists = await elasticsearchClient.indices.exists({ index: indexName });

    if (!indexExists) {
      await elasticsearchClient.indices.create({
        index: indexName,
        body: {
          mappings: {
            properties: {
              account: { type: 'keyword' },
              from: { type: 'text' },
              to: { type: 'text' },
              subject: { type: 'text' },
              text: { type: 'text' },
              html: { type: 'text' },
              date: { type: 'date' },
              folder: { type: 'keyword' },
              category: { type: 'keyword' },
              suggestedReply: { type: 'text' },
            },
          },
        },
      });
      console.log(`Index '${indexName}' created`);
    } else {
      // Added this log so you know it's working
      console.log(`Index '${indexName}' already exists.`);
    }
  } catch (error) { // <-- Add catch block
    console.error(`Error creating index '${indexName}':`, error);
    // Don't exit, just log the error
  }
};

export const createKnowledgeIndex = async () => {
  const indexName = 'knowledge_base';
  try {
    const indexExists = await elasticsearchClient.indices.exists({ index: indexName });

    if (!indexExists) {
      console.log(`Index '${indexName}' does not exist. Attempting to create...`);
      // We need to get the embedding dimension from the model first.
      let embeddingDim = 0;
      try {
        const dummyEmbedding = await getEmbedding('test');
        embeddingDim = dummyEmbedding.length;
      } catch (error) {
        console.warn('Could not get embedding dimension. Knowledge base functionality will be disabled.');
        console.warn('Please make sure you have Python and the required packages installed.');
      }

      if (embeddingDim > 0) {
        await elasticsearchClient.indices.create({
          index: indexName,
          body: {
            mappings: {
              properties: {
                text: { type: 'text' },
                embedding: { type: 'dense_vector', dims: embeddingDim },
              },
            },
          },
        });
        console.log(`Index '${indexName}' created with embedding dimension ${embeddingDim}`);
      } else {
        console.warn(`Skipping creation of index '${indexName}' due to missing embedding dimension.`);
      }
    } else {
      console.log(`Index '${indexName}' already exists.`);
    }
  } catch (error) {
    console.error('Error in createKnowledgeIndex:', error);
  }
};