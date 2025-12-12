import { useState, useEffect, useRef } from 'react';
import { Mail, Search, Plus, RefreshCw, Inbox } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';
import EmailList from '../components/EmailList';
import EmailDetail from '../components/EmailDetail';
import AddImapDialog from '../components/AddImapDialog';

const API_BASE_URL = 'http://localhost:3000';

const Dashboard = () => {
  const [emails, setEmails] = useState([]);
  const [allEmails, setAllEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [isAddImapOpen, setIsAddImapOpen] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [isSearchMode, setIsSearchMode] = useState(false);

  const categories = ['all', 'Interested', 'Meeting Booked', 'Not Interested', 'Spam', 'Out of Office', 'None'];
  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    fetchEmails(1, true);
    
    // Poll for new emails every 30 seconds as a fallback
    pollingIntervalRef.current = setInterval(() => {
      checkForNewEmails();
    }, 30000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Reset and fetch when filters change
    setPage(1);
    setEmails([]);
    fetchEmails(1, true);
  }, [selectedCategory, selectedAccount]);

  const checkForNewEmails = async () => {
    try {
      const params = new URLSearchParams({ page: '1', limit: '20' });
      
      if (selectedAccount !== 'all') params.append('account', selectedAccount);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);

      const response = await fetch(`${API_BASE_URL}/emails?${params}`);
      if (!response.ok) return;
      
      const data = await response.json();
      
      // Check if there are new emails
      if (data.emails.length > 0 && emails.length > 0) {
        const latestEmailDate = new Date(emails[0].date);
        const newEmails = data.emails.filter(email => 
          new Date(email.date) > latestEmailDate
        );
        
        if (newEmails.length > 0) {
          toast.success(`${newEmails.length} new email(s) received!`);
          setEmails(prev => [...newEmails, ...prev]);
          setAllEmails(prev => [...newEmails, ...prev]);
          setTotal(prev => prev + newEmails.length);
        }
      }
    } catch (error) {
      console.error('Error checking for new emails:', error);
    }
  };

  const fetchEmails = async (pageNum = 1, reset = false) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams({ 
        page: pageNum.toString(), 
        limit: '20' 
      });
      
      if (selectedAccount !== 'all') params.append('account', selectedAccount);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);

      const response = await fetch(`${API_BASE_URL}/emails?${params}`);
      if (!response.ok) throw new Error('Failed to fetch emails');
      
      const data = await response.json();
      
      if (reset) {
        setEmails(data.emails);
        setAllEmails(data.emails);
      } else {
        setEmails(prev => [...prev, ...data.emails]);
        setAllEmails(prev => [...prev, ...data.emails]);
      }
      
      setHasMore(data.hasMore);
      setTotal(data.total);
      setPage(pageNum);
      
      // Extract unique accounts from all emails
      const allEmailsList = reset ? data.emails : [...emails, ...data.emails];
      const uniqueAccounts = [...new Set(allEmailsList.map(email => email.account))];
      setAccounts(uniqueAccounts);
      
      setIsSearchMode(false);
    } catch (error) {
      toast.error('Failed to fetch emails: ' + error.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore && !isSearchMode) {
      fetchEmails(page + 1, false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setLoading(true);
    setIsSearchMode(true);
    try {
      const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setEmails(data);
      setHasMore(false); // No pagination in search mode
      toast.success(`Found ${data.length} emails`);
    } catch (error) {
      toast.error('Search failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearchMode(false);
    setPage(1);
    setEmails([]);
    fetchEmails(1, true);
  };

  const handleRefresh = () => {
    setPage(1);
    setEmails([]);
    setSearchQuery('');
    setIsSearchMode(false);
    fetchEmails(1, true);
  };

  const getCategoryCount = (category) => {
    if (category === 'all') return total;
    return allEmails.filter(email => email.category === category).length;
  };
  const getCategoryColor = (category) => {
    const colors = {
      'Interested': 'bg-green-500',
      'Meeting Booked': 'bg-blue-500',
      'Not Interested': 'bg-gray-500',
      'Spam': 'bg-red-500',
      'Out of Office': 'bg-yellow-500',
      'None': 'bg-slate-500'
     };
    return colors[category] || 'bg-slate-500';
  };


  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="flex h-16 items-center px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Mail Inbox AI</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setIsAddImapOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-6 px-4 md:px-6">
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Interested</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {getCategoryCount('Interested')}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Meetings Booked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {getCategoryCount('Meeting Booked')}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Spam</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {getCategoryCount('Spam')}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-12">
          <div className="md:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Search & Filter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Search emails..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button size="sm" onClick={handleSearch} disabled={loading}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  {isSearchMode && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={clearSearch}
                    >
                      Clear Search
                    </Button>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <label htmlFor="account-select" className="text-sm font-medium">Account</label>
                  <select
                    id="account-select"
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className="w-full p-2 border rounded-md bg-background"
                  >
                    <option value="all">All Accounts</option>
                    {accounts.map(account => (
                      <option key={account} value={account}>{account}</option>
                    ))}
                  </select>
                </div>

                <Separator />

                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <div className="space-y-1">
                    {categories.map(category => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? 'secondary' : 'ghost'}
                        size="sm"
                        className="w-full justify-between"
                        onClick={() => setSelectedCategory(category)}
                      >
                        <span className="capitalize">{category}</span>
                        <Badge variant="secondary" className="ml-auto">
                          {getCategoryCount(category)}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-9">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>
                    {isSearchMode ? 'Search Results' : 'Emails'}
                  </CardTitle>
                  <CardDescription>
                    {emails.length} of {total} {total === 1 ? 'email' : 'emails'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <EmailList 
                    emails={emails}
                    selectedEmail={selectedEmail}
                    onSelectEmail={setSelectedEmail}
                    getCategoryColor={getCategoryColor}
                    onLoadMore={loadMore}
                    hasMore={hasMore}
                    loading={loadingMore}
                  />
                </CardContent>
              </Card>

              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Email Details</CardTitle>
                  <CardDescription>
                    {selectedEmail ? 'View email content' : 'Select an email to view'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    {selectedEmail ? (
                      <EmailDetail email={selectedEmail} getCategoryColor={getCategoryColor} />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <Inbox className="h-16 w-16 mb-4 opacity-50" />
                        <p>No email selected</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <AddImapDialog 
        open={isAddImapOpen}
        onOpenChange={setIsAddImapOpen}
        onSuccess={() => {
          handleRefresh();
          toast.success('IMAP account added successfully! Syncing emails...');
        }}
      />
    </div>
  );
};

export default Dashboard;
