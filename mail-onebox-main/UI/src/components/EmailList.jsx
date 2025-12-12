import { useEffect, useRef } from 'react';
import { Mail, User, Loader2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';

const EmailList = ({ emails, selectedEmail, onSelectEmail, getCategoryColor, onLoadMore, hasMore, loading }) => {
  const scrollAreaRef = useRef(null);
  const observerRef = useRef(null);
  const loadMoreTriggerRef = useRef(null);
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const extractEmailAddress = (emailStr) => {
    const match = emailStr.match(/<([^>]+)>/);
    return match ? match[1] : emailStr;
  };

  const extractName = (emailStr) => {
    const match = emailStr.match(/^"?([^"<]+)"?\s*</);
    if (match) return match[1].trim();
    return extractEmailAddress(emailStr);
  };
  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    const plainText = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...' 
      : plainText;
  };

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (!loadMoreTriggerRef.current || !hasMore || loading) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(loadMoreTriggerRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, onLoadMore]);

  if (emails.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-muted-foreground">
        <Mail className="h-16 w-16 mb-4 opacity-50" />
        <p className="text-lg font-medium">No emails found</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px]" ref={scrollAreaRef}>
      <div className="divide-y">
        {emails.map((email, index) => (
          <button
            key={index}
            onClick={() => onSelectEmail(email)}
            className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
              selectedEmail === email ? 'bg-muted' : ''
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">
                      {extractName(email.from)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {extractEmailAddress(email.from)}
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0 flex flex-col items-end gap-1">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(email.date)}
                  </span>
                  {email.category && email.category !== 'None' && (
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getCategoryColor(email.category)} text-white`}
                    >
                      {email.category}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="font-medium text-sm line-clamp-1">{email.subject || '(No Subject)'}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {truncateText(email.text || email.html)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {email.folder}
                </Badge>
                <span className="text-xs text-muted-foreground truncate">
                  {email.account}
                </span>
              </div>
            </div>
          </button>
        ))}
        <div ref={loadMoreTriggerRef} />
      </div>

      {loading && (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!hasMore && emails.length > 0 && (
        <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
          No more emails to load
        </div>
      )}
    </ScrollArea>
  );
};

export default EmailList;
