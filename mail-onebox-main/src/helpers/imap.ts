import Imap from 'node-imap';
import { simpleParser } from 'mailparser';
import { ImapConfig } from '../models/imap';
import { Email, EmailCategory } from '../models/email';
import elasticsearchClient from './elasticsearch';
import { categorizeEmail, generateReply } from './ai';
import { fireWebhook, sendSlackNotification } from './notifications';

const indexEmail = async (email: Email) => {
  try {
    await elasticsearchClient.index({
      index: 'emails',
      body: email,
    });
  } catch (error) {
    console.error('Error indexing email:', error);
  }
};

const processMessage = async (msg: Imap.ImapMessage, config: ImapConfig) => {
  msg.on('body', (stream, info) => {
    simpleParser(stream, async (err, parsed) => {
      if (err) throw err;

      const category = await categorizeEmail(parsed.text || '');
      const suggestedReply = await generateReply(parsed.text || '');

      const email: Email = {
        account: config.user,
        from: parsed.from?.text || '',
        to: parsed.to?.text || '',
        subject: parsed.subject || '',
        text: parsed.text || '',
        html: parsed.html || '',
        date: parsed.date?.toISOString() || new Date().toISOString(),
        folder: 'INBOX',
        category,
        suggestedReply,
      };

      await indexEmail(email);

      await sendSlackNotification(email);
      await fireWebhook(email);
    });
  });
};

const syncImapAccount = (config: ImapConfig) => {
  const imap = new Imap(config);
  let isIdling = false;

  const openInbox = (cb: (err: Error, box: any) => void) => {
    imap.openBox('INBOX', false, cb);
  };

  const startIdle = () => {
    if (isIdling) return;
    
    console.log(`[${config.user}] Starting IDLE mode...`);
    imap.idle((err: any) => {
      if (err) {
        console.error(`[${config.user}] IDLE error:`, err);
        setTimeout(startIdle, 5000); // Retry after 5 seconds
        return;
      }
      isIdling = true;
      console.log(`[${config.user}] Now in IDLE mode, waiting for new mail...`);
    });
  };

  const stopIdle = (callback: () => void) => {
    if (!isIdling) {
      callback();
      return;
    }
    
    console.log(`[${config.user}] Stopping IDLE mode...`);
    imap.done((err: any) => {
      if (err) console.error(`[${config.user}] Error ending IDLE:`, err);
      isIdling = false;
      callback();
    });
  };

  imap.once('ready', () => {
    console.log(`[${config.user}] IMAP connection ready`);
    openInbox((err, box) => {
      if (err) {
        console.error(`[${config.user}] Error opening inbox:`, err);
        return;
      }

      console.log(`[${config.user}] Inbox opened, syncing last 30 days...`);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      imap.search(['ALL', ['SINCE', thirtyDaysAgo]], (err, results) => {
        if (err) {
          console.error(`[${config.user}] Search error:`, err);
          startIdle();
          return;
        }

        if (results.length === 0) {
          console.log(`[${config.user}] No emails found in the last 30 days.`);
          startIdle();
          return;
        }

        console.log(`[${config.user}] Found ${results.length} emails, fetching...`);
        const f = imap.fetch(results, { bodies: '' });

        f.on('message', (msg, seqno) => processMessage(msg, config));

        f.once('error', (err: any) => {
          console.error(`[${config.user}] Fetch error:`, err);
        });

        f.once('end', () => {
          console.log(`[${config.user}] Initial sync complete!`);
          startIdle();
        });
      });
    });
  });

  // Handle new mail notification from IDLE
  imap.on('mail', (numNewMsgs: number) => {
    console.log(`[${config.user}] 🔔 New mail detected! (${numNewMsgs} new messages)`);
    
    stopIdle(() => {
      imap.search(['UNSEEN'], (err, results) => {
        if (err) {
          console.error(`[${config.user}] Error searching for unseen:`, err);
          startIdle();
          return;
        }

        if (!results || results.length === 0) {
          console.log(`[${config.user}] No unseen messages found`);
          startIdle();
          return;
        }

        console.log(`[${config.user}] Fetching ${results.length} unseen messages...`);
        const f = imap.fetch(results, { bodies: '', markSeen: false });
        
        f.on('message', (msg, seqno) => processMessage(msg, config));
        
        f.once('error', (err: any) => {
          console.error(`[${config.user}] Fetch error:`, err);
          startIdle();
        });

        f.once('end', () => {
          console.log(`[${config.user}] ✅ New messages processed!`);
          startIdle();
        });
      });
    });
  });

  // Handle updates (EXISTS, EXPUNGE, etc.)
  imap.on('update', (seqno: number, info: any) => {
    console.log(`[${config.user}] Mailbox updated:`, seqno, info);
  });

  imap.once('error', (err: any) => {
    console.error(`[${config.user}] IMAP error:`, err);
    isIdling = false;
    // Attempt to reconnect after 10 seconds
    setTimeout(() => {
      console.log(`[${config.user}] Attempting to reconnect...`);
      imap.connect();
    }, 10000);
  });

  imap.once('end', () => {
    console.log(`[${config.user}] Connection ended`);
    isIdling = false;
  });

  imap.once('close', (hadError: boolean) => {
    console.log(`[${config.user}] Connection closed`, hadError ? 'with error' : '');
    isIdling = false;
  });

  console.log(`[${config.user}] Connecting to IMAP server...`);
  imap.connect();
};

export { syncImapAccount };