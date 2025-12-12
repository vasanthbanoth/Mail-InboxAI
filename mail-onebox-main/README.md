# Mail Inbox AI

Mail Inbox AI is a full-stack application designed to create an intelligent, unified inbox. It connects to one or more IMAP email accounts, syncs emails in real-time, indexes them in Elasticsearch for powerful searching, and uses AI (via Groq) to automatically categorize new emails and draft context-aware replies.

The system is composed of a **Bun/Elysia.js backend** for data processing and a **React/Vite frontend** for the user dashboard.

-----

## Architecture

The application is split into two main parts: a backend server and a frontend UI.

### Backend (Root Directory)

  * **Framework:** [Elysia.js](https://elysiajs.com/)
  * **Runtime:** [Bun](https://bun.sh/)
  * **Database:** [Elasticsearch](https://www.elastic.co/) (running on `http://localhost:9200`)
  * **AI Services:** [Groq](https://groq.com/) (using the `llama3-8b-8192` model)
  * **Email Handling:**
      * `node-imap`: For connecting to IMAP servers and monitoring for new mail using `IDLE`.
      * `mailparser`: For parsing raw email streams.
  * **Embeddings:**
      * A Python script (`src/helpers/generate_embedding.py`) is spawned to generate vector embeddings using the `jinaai/jina-embeddings-v2-base-en` model from Hugging Face.
  * **Notifications:** Sends webhooks to Slack and Webhook.site on new email events.

### Frontend (`UI/` Directory)

  * **Framework:** [React 19](https://react.dev/)
  * **Bundler:** [Vite](https://vitejs.dev/)
  * **Styling:** [Tailwind CSS](https://tailwindcss.com/)
  * **UI Kit:** [shadcn/ui](https://ui.shadcn.com/)
  * **Main Component:** The app is a single-page dashboard (`src/pages/Dashboard.jsx`) that provides all functionality.
  * **API Communication:** The frontend makes HTTP requests to the backend API at `http://localhost:3000`.

-----

## Features

  * **Multi-Account IMAP Sync:** Add multiple IMAP accounts. The system syncs the last 30 days of email and then watches for new mail in real-time using `IDLE`.
  * **AI Email Categorization:** Every incoming email is processed by Groq (Llama 3) to be categorized into one of: `Interested`, `Meeting Booked`, `Not Interested`, `Spam`, `Out of Office`, or `None`.
  * **Persistent Search Index:** All emails are indexed in an Elasticsearch `emails` index, allowing for fast full-text search.
  * **Context-Aware AI Replies (RAG):** The system includes a `knowledge_base` index in Elasticsearch. You can add contextual information (like company info, FAQs, etc.) via the `POST /knowledge` endpoint. When generating a reply, the AI first performs a vector search (`cosineSimilarity`) on this knowledge base to find relevant context and includes it in the prompt to Groq.
  * **Notifications:** Automatically fires webhooks to Slack and other services for new emails.
  * **Unified Dashboard:** A single-pane-of-glass UI to view all emails from all accounts. Features include:
      * Filtering by account and AI category.
      * Full-text search.
      * Infinite scroll pagination.
      * Email detail view with safe HTML rendering.
      * Polling fallback (30s) to check for new mail.

-----

## Setup and Running

### Prerequisites

1.  **[Bun](https://bun.sh/):** The backend runtime.
2.  **[Elasticsearch](https://www.elastic.co/guide/en/elasticsearch/reference/current/install-elasticsearch.html):** Must be running locally (default: `http://localhost:9200`).
3.  **[Python 3](https://www.python.org/):** Required for the embedding script.
4.  **Python Dependencies:** Install the required `transformers` library:
    ```bash
    pip install transformers
    ```
5.  **Groq API Key:**
      * Get an API key from [Groq](https://console.groq.com/keys).
      * Create a `.env` file in the root of the project.
      * Add your key to it:
        ```
        GROQ_API_KEY=your_groq_api_key_here
        ```

### 1\. Backend (Root)

From the project's root directory:

```bash
# 1. Install dependencies
bun install

# 2. Run the development server
# This will also create the 'emails' and 'knowledge_base' indices
# in Elasticsearch on startup if they don't exist.
bun run dev
```

The backend server will be running at `http://localhost:3000`.

### 2\. Frontend (UI)

In a separate terminal, navigate to the `UI/` directory:

```bash
# 1. Enter the UI directory
cd UI

# 2. Install dependencies
bun install

# 3. Run the development server
bun run dev
```

The React application will be available at `http://localhost:5173` (or another port if 5173 is in use). Open this URL in your browser to use the application.

-----
