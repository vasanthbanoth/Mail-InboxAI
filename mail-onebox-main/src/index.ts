import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { connectDB, createEmailIndex, createKnowledgeIndex } from './database';
import { syncImapAccount } from './helpers/imap';
import { ImapConfig } from './models/imap';
import { addKnowledge } from './helpers/knowledge';
import elasticsearchClient from './helpers/elasticsearch';

// FIXME: This is an in-memory store. Configurations will be lost on server restart.
// Consider persisting this data in a database like MongoDB.
const imapConfigs: ImapConfig[] = [];

connectDB();
createEmailIndex(); // Creates the 'emails' index
createKnowledgeIndex(); // Creates the 'knowledge_base' index

const app = new Elysia()
  .use(cors({
    origin: '*'
  }))
  .use(swagger()) // Add swagger for API documentation
  .post('/imap-clients', ({ body }) => {
    const newConfig = body as ImapConfig;
    imapConfigs.push(newConfig);
    syncImapAccount(newConfig);
    return { message: 'IMAP client added and sync started' };
  }, {
    body: t.Object({
        user: t.String(),
        password: t.String(),
        host: t.String(),
        port: t.Number(),
        tls: t.Boolean(),
    })
  })
  .post('/knowledge', async ({ body }) => {
    const { text } = body;
    await addKnowledge(text);
    return { message: 'Knowledge added successfully.' };
  }, {
    body: t.Object({
        text: t.String(),
    })
  })
  .get('/emails', async ({ query }) => {
    const { account, folder, category, page = '1', limit = '20' } = query;
    const must: object[] = [];

    if (account) {
      must.push({ term: { "account.keyword": account } });
    }

    if (folder) {
      must.push({ term: { "folder.keyword": folder } });
    }

    if (category) {
      must.push({ term: { "category.keyword": category } });
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const from = (pageNum - 1) * limitNum;

    const result = await elasticsearchClient.search({
      index: 'emails',
      query: {
        bool: {
          must: must.length > 0 ? must : { match_all: {} },
        },
      },
      sort: [{ date: { order: 'desc' } }],
      from,
      size: limitNum,
    });

    const total = typeof result.hits.total === 'number' ? result.hits.total : result.hits.total?.value ?? 0;

    return {
      emails: result.hits.hits.map((hit) => hit._source),
      total: total,
      page: pageNum,
      limit: limitNum,
      hasMore: from + limitNum < total,
    };
  })
  .get('/search', async ({ query }) => {
    const { q } = query;

    if (!q) {
      return { message: 'Query parameter \'q\' is required' };
    }

    const result = await elasticsearchClient.search({
      index: 'emails',
      query: {
        multi_match: {
          query: q as string,
          fields: ['from', 'to', 'subject', 'text', 'html'],
        },
      },
    });

    return result.hits.hits.map((hit) => hit._source);
  })
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);