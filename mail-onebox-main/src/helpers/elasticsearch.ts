import { Client } from '@elastic/elasticsearch';
import { HttpConnection } from '@elastic/transport';

const elasticsearchClient = new Client({
  node: 'http://localhost:9200',
  Connection: HttpConnection,
});

export default elasticsearchClient;