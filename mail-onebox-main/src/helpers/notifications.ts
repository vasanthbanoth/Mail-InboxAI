
import { Email } from '../models/email';

const SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/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';
const WEBHOOK_SITE_URL = 'https://webhook.site/91ab01cf-e198-4ebd-b9b5-02da15dd7494';

export const sendSlackNotification = async (email: Email) => {
  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*New Interested Email*\nFrom: ${email.from}\nSubject: ${email.subject}`,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: email.text.substring(0, 500),
            },
          },
        ],
      }),
    });
  } catch (error) {
    console.error('Error sending Slack notification:', error);
  }
};

export const fireWebhook = async (email: Email) => {
  try {
    await fetch(WEBHOOK_SITE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(email),
    });
  } catch (error) {
    console.error('Error firing webhook:', error);
  }
};
