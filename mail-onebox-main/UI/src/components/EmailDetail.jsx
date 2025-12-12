import { Calendar, Mail, User, Folder, Tag } from 'lucide-react';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Card, CardContent } from './ui/card';

const EmailDetail = ({ email, getCategoryColor }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">{email.subject || '(No Subject)'}</h2>
          {email.category && email.category !== 'None' && (
            <Badge 
              className={`${getCategoryColor(email.category)} text-white`}
            >
              {email.category}
            </Badge>
          )}
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <p className="font-semibold text-sm">
                  {extractName(email.from)}
                </p>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {extractEmailAddress(email.from)}
              </p>
            </div>
          </div>

          <div className="grid gap-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">To:</span>
              <span className="truncate">{extractEmailAddress(email.to)}</span>
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">Date:</span>
              <span>{formatDate(email.date)}</span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Folder className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">Folder:</span>
              <Badge variant="outline">{email.folder}</Badge>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Tag className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">Account:</span>
              <span className="truncate text-xs">{email.account}</span>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Message Content
        </h3>
        
        {email.html ? (
          <Card>
            <CardContent className="pt-6">
              <div 
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: email.html }}
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="whitespace-pre-wrap text-sm">
                {email.text || '(No content)'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EmailDetail;
