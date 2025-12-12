# Mail Inbox AI API Documentation

This document provides an overview of the available API endpoints for the Mail Inbox AI application.

## Endpoints

### 1. Add IMAP Client

*   **Method:** `POST`
*   **Path:** `/imap-clients`
*   **Description:** Adds a new IMAP client configuration to the application. Once added, the application will start syncing emails from this account.
*   **Request Body:**

    ```json
    {
      "user": "your-email@example.com",
      "password": "your-password",
      "host": "imap.example.com",
      "port": 993,
      "tls": true
    }
    ```

*   **Example:**

    ```bash
    curl -X POST -H 'Content-Type: application/json' -d \
    {
      "user": "your-email@example.com",
      "password": "your-password",
      "host": "imap.example.com",
      "port": 993,
      "tls": true
    } http://localhost:3000/imap-clients
    ```

*   **Success Response:**

    ```json
    {
      "message": "IMAP client added and sync started"
    }
    ```

### 2. List Emails

*   **Method:** `GET`
*   **Path:** `/emails`
*   **Description:** Lists all the emails that have been synced and indexed. You can filter the emails by `account`, `folder`, and `category`.
*   **Query Parameters:**
    *   `account` (optional): The email account to filter by (e.g., `your-email@example.com`).
    *   `folder` (optional): The folder to filter by (e.g., `INBOX`).
    *   `category` (optional): The category to filter by. Possible values are `Interested`, `Meeting Booked`, `Not Interested`, `Spam`, `Out of Office`, `None`.

*   **Example:**

    ```bash
    # Get all emails
    curl http://localhost:3000/emails

    # Get emails for a specific account
    curl http://localhost:3000/emails?account=your-email@example.com

    # Get emails with the 'Interested' category
    curl http://localhost:3000/emails?category=Interested
    ```

*   **Success Response:**

    ```json
    [
      {
        "account": "your-email@example.com",
        "from": "\"John Doe\" <john.doe@example.com>",
        "to": "\"Your Name\" <your-email@example.com>",
        "subject": "Following up",
        "text": "Hi, just wanted to follow up on our conversation.",
        "html": "<p>Hi, just wanted to follow up on our conversation.</p>",
        "date": "2025-11-04T10:00:00.000Z",
        "folder": "INBOX",
        "category": "Interested"
      }
    ]
    ```

### 3. Search Emails

*   **Method:** `GET`
*   **Path:** `/search`
*   **Description:** Searches for emails across all indexed content, including the sender, recipient, subject, and body.
*   **Query Parameters:**
    *   `q` (required): The search query.

*   **Example:**

    ```bash
    curl http://localhost:3000/search?q=important
    ```

*   **Success Response:**

    ```json
    [
      {
        "account": "your-email@example.com",
        "from": "\"Jane Smith\" <jane.smith@example.com>",
        "to": "\"Your Name\" <your-email@example.com>",
        "subject": "Important project update",
        "text": "Here is an important update on the project.",
        "html": "<p>Here is an important update on the project.</p>",
        "date": "2025-11-04T11:00:00.000Z",
        "folder": "INBOX",
        "category": "None"
      }
    ]
    ```