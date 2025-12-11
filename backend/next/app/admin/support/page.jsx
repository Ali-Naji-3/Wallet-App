'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  HelpCircle, 
  Mail, 
  Phone, 
  Send, 
  Search,
  User,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Clock,
  Users,
  MessageSquare,
  AlertTriangle,
  Shield,
  Ban,
  FileX,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import apiClient from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Link from 'next/link';

export default function SupportPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('email'); // 'email' or 'phone'
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sending, setSending] = useState(false);
  const [recentEmails, setRecentEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [supportRequestEmail, setSupportRequestEmail] = useState('');
  const [savingRequest, setSavingRequest] = useState(false);
  const [supportRequests, setSupportRequests] = useState([]);
  const [emailConfigured, setEmailConfigured] = useState(true); // Assume configured by default
  const [stats, setStats] = useState({
    totalSent: 0,
    todaySent: 0,
    pendingUsers: 0,
  });

  // Fetch recent email history
  const fetchRecentEmails = async () => {
    try {
      const { data } = await apiClient.get(ENDPOINTS.ADMIN_SUPPORT.RECENT_EMAILS);
      setRecentEmails(data.emails || []);
      setStats(data.stats || stats);
    } catch (error) {
      console.error('Error fetching recent emails:', error);
    }
  };

  // Fetch support requests
  const fetchSupportRequests = async () => {
    try {
      const { data } = await apiClient.get(ENDPOINTS.ADMIN_SUPPORT.GET_REQUESTS);
      setSupportRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching support requests:', error);
    }
  };

  useEffect(() => {
    fetchRecentEmails();
    fetchSupportRequests();
    // Check email configuration on page load
    checkEmailConfiguration();
  }, []);

  // Check if email service is configured
  const checkEmailConfiguration = async () => {
    // We'll detect this from the first email send attempt or recent emails
    // For now, assume it's configured - will be updated on first send attempt
  };

  // Save support request email
  const handleSaveSupportRequest = async (e) => {
    e.preventDefault();
    
    if (!supportRequestEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(supportRequestEmail.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSavingRequest(true);
    try {
      const { data } = await apiClient.post(ENDPOINTS.ADMIN_SUPPORT.SAVE_REQUEST, {
        email: supportRequestEmail.trim(),
      });

      if (data.success) {
        toast.success(`Support request saved for ${supportRequestEmail.trim()}`);
        setSupportRequestEmail('');
        fetchSupportRequests(); // Refresh the list
      } else {
        toast.error(data.message || 'Failed to save support request');
      }
    } catch (error) {
      console.error('Error saving support request:', error);
      toast.error(error.response?.data?.message || 'Failed to save support request');
    } finally {
      setSavingRequest(false);
    }
  };

  // Search for users
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter an email or phone number');
      return;
    }

    setLoading(true);
    try {
      const { data } = await apiClient.get(ENDPOINTS.ADMIN_SUPPORT.SEARCH, {
        params: {
          query: searchQuery.trim(),
          type: searchType,
        },
      });

      if (data.users && data.users.length > 0) {
        setSearchResults(data.users);
        if (data.users.length === 1) {
          setSelectedUser(data.users[0]);
        }
      } else {
        setSearchResults([]);
        setSelectedUser(null);
        toast.info('No users found with that email or phone number');
      }
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error(error.response?.data?.message || 'Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  // Send verification email
  const handleSendEmail = async (user = selectedUser) => {
    if (!user) {
      toast.error('Please select a user first');
      return;
    }

    setSending(true);
    
    try {
      console.log('[Admin Support] Sending verification email to:', user.email);
      
      const response = await apiClient.post(ENDPOINTS.ADMIN_SUPPORT.SEND_VERIFICATION, {
        userId: user.id,
        email: user.email,
      });

      const data = response.data;

      if (data.success) {
        console.log('[Admin Support] Email sent successfully');
        toast.success(`Verification email sent successfully to ${user.email}`, {
          description: 'The user will receive an email with verification instructions.',
          duration: 5000,
        });
        setSelectedUser(null);
        setSearchQuery('');
        setSearchResults([]);
        fetchRecentEmails(); // Refresh recent emails
      } else {
        // Handle API error response
        const errorMessage = data.message || 'Failed to send email';
        const errorCode = data.error || 'UNKNOWN_ERROR';
        console.error('[Admin Support] Email send failed:', { errorCode, errorMessage, data });
        
        // Special handling for EMAIL_NOT_CONFIGURED
        if (errorCode === 'EMAIL_NOT_CONFIGURED') {
          setEmailConfigured(false); // Update state to show warning
          toast.error('Email Service Not Configured', {
            description: errorMessage,
            duration: 10000, // Longer duration for important config message
          });
        } else {
          toast.error('Email Send Failed', {
            description: errorMessage,
            duration: 6000,
          });
        }
      }
    } catch (error) {
      console.error('[Admin Support] ===== EMAIL SEND ERROR =====');
      console.error('[Admin Support] Error type:', error?.constructor?.name);
      console.error('[Admin Support] Error message:', error?.message);
      console.error('[Admin Support] Error response:', error?.response);
      console.error('[Admin Support] Error response data:', error?.response?.data);
      console.error('[Admin Support] Error stack:', error?.stack);
      
      // Extract error message from response
      let errorMessage = 'Failed to send verification email. Please try again.';
      let errorCode = 'UNKNOWN_ERROR';
      
      if (error.response) {
        // Server responded with error
        const responseData = error.response.data;
        errorMessage = responseData?.message || errorMessage;
        errorCode = responseData?.error || errorCode;
        
        // Handle specific error codes
        if (errorCode === 'UNAUTHORIZED' || error.response.status === 401) {
          errorMessage = 'You are not authorized to perform this action. Please log in again.';
        } else if (errorCode === 'EMAIL_NOT_CONFIGURED') {
          setEmailConfigured(false); // Update state to show warning and disable button
          errorMessage = responseData?.message || 'Email service is not configured. Please configure SMTP settings in the backend.';
        } else if (errorCode === 'EMAIL_ERROR') {
          errorMessage = responseData?.message || 'Failed to send email. Please check SMTP configuration.';
        } else if (errorCode === 'USER_NOT_FOUND') {
          errorMessage = 'User not found. Please search for the user again.';
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'Network error. Please check your connection and try again.';
        console.error('[Admin Support] No response received:', error.request);
      } else {
        // Error setting up request
        errorMessage = 'An error occurred while sending the request. Please try again.';
        console.error('[Admin Support] Request setup error:', error.message);
      }
      
      toast.error('Email Send Failed', {
        description: errorMessage,
        duration: 6000,
      });
      
      // CRITICAL: Don't redirect or reload page on error
      // Stay on support page so admin can try again
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={`p-6 space-y-6 ${isDark ? '' : 'bg-gray-50'}`}>
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Support & Verification
        </h1>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Send identity verification emails to clients and manage support requests
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className={isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-500/10">
              <Mail className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Sent</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.totalSent}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className={isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Clock className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Sent Today</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.todaySent}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className={isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10">
              <Users className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Pending Verification</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.pendingUsers}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Support Request Email Input Section */}
      <Card className={isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}>
        <CardHeader>
          <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
            Support Request
          </CardTitle>
          <CardDescription className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Enter the email address of someone who requested support
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveSupportRequest} className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="support-email" className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  Enter your email
                </Label>
                <div className="relative mt-2">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="support-email"
                    type="email"
                    value={supportRequestEmail}
                    onChange={(e) => setSupportRequestEmail(e.target.value)}
                    placeholder="customer@example.com"
                    className={`pl-10 ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}`}
                    required
                  />
                </div>
              </div>
              <div className="flex items-end">
                <Button
                  type="submit"
                  disabled={savingRequest || !supportRequestEmail.trim()}
                  className="bg-amber-500 hover:bg-amber-600 text-gray-900"
                >
                  {savingRequest ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Save Request
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Saved Support Requests */}
      {supportRequests.length > 0 && (
        <Card className={isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}>
          <CardHeader>
            <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
              Saved Support Requests
            </CardTitle>
            <CardDescription className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              Emails from customers who requested support
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {supportRequests.map((request) => (
                <div
                  key={request.id}
                  className={`p-4 rounded-lg border ${
                    isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-blue-500/20">
                        <Mail className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {request.email}
                        </p>
                        {request.subject && (
                          <p className={`text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {request.subject}
                          </p>
                        )}
                        {request.message && (
                          <p className={`text-xs mt-1 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {request.message}
                          </p>
                        )}
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          {format(new Date(request.created_at), 'PPP p')}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={`${
                        request.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-400'
                          : request.status === 'resolved'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {request.status || 'pending'}
                      </Badge>
                      {request.user_id && (
                        <Badge variant="outline" className="text-xs">
                          User ID: {request.user_id}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Configuration Warning */}
      {!emailConfigured && (
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-400 mb-1">
                  Email Service Not Configured
                </p>
                <p className="text-sm text-gray-400">
                  SMTP settings are not configured. Please set SMTP_USER, SMTP_PASS, SMTP_HOST, and SMTP_PORT environment variables in the backend to enable email sending.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Section */}
      <Card className={isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}>
        <CardHeader>
          <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
            Send Verification Email
          </CardTitle>
          <CardDescription className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Search for a user by email or phone number and send them a verification email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-3">
            <div className="flex-1">
              <Label className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                {searchType === 'email' ? 'Email Address' : 'Phone Number'}
              </Label>
              <div className="relative mt-2">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {searchType === 'email' ? (
                    <Mail className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Phone className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <Input
                  type={searchType === 'email' ? 'email' : 'tel'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={searchType === 'email' ? 'user@example.com' : '+1234567890'}
                  className={`pl-10 ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                onClick={() => setSearchType(searchType === 'email' ? 'phone' : 'email')}
                className={isDark ? 'border-gray-700' : 'border-gray-300'}
              >
                {searchType === 'email' ? <Phone className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
              </Button>
              <Button
                onClick={handleSearch}
                disabled={loading || !searchQuery.trim()}
                className="bg-amber-500 hover:bg-amber-600 text-gray-900"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Search
              </Button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <Label className={isDark ? 'text-gray-400' : 'text-gray-600'}>Search Results</Label>
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedUser?.id === user.id
                      ? 'border-amber-500 bg-amber-500/10'
                      : user.has_issues
                      ? 'border-red-500/50 bg-red-500/5'
                      : isDark
                      ? 'border-gray-700 hover:border-gray-600 bg-gray-800'
                      : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                  }`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`p-2 rounded-full ${
                        user.has_issues 
                          ? 'bg-red-500/20' 
                          : 'bg-amber-500/20'
                      }`}>
                        {user.has_issues ? (
                          <AlertTriangle className="h-5 w-5 text-red-400" />
                        ) : (
                          <User className="h-5 w-5 text-amber-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {user.full_name || 'No Name'}
                          </p>
                          {user.has_issues && (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                              Has Issues
                            </Badge>
                          )}
                        </div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {user.email}
                        </p>
                        {user.phone && (
                          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            {user.phone}
                          </p>
                        )}
                        {/* Show issues preview */}
                        {user.has_issues && user.issues && user.issues.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {user.issues.slice(0, 2).map((issue, idx) => (
                              <p key={idx} className="text-xs text-red-400 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {issue.title}
                              </p>
                            ))}
                            {user.issues.length > 2 && (
                              <p className="text-xs text-red-400">
                                +{user.issues.length - 2} more issue(s)
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          user.is_verified
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }
                      >
                        {user.is_verified ? 'Verified' : 'Not Verified'}
                      </Badge>
                      {!user.is_active && (
                        <Badge className="bg-red-500/20 text-red-400">
                          Frozen
                        </Badge>
                      )}
                      {selectedUser?.id === user.id && (
                        <CheckCircle className="h-5 w-5 text-amber-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Selected User Actions */}
          {selectedUser && (
            <div className="space-y-4">
              {/* Account Issues Alert */}
              {selectedUser.has_issues && selectedUser.issues && selectedUser.issues.length > 0 && (
                <div className={`p-4 rounded-lg border-2 ${
                  selectedUser.issues.some(i => i.severity === 'high')
                    ? 'bg-red-500/10 border-red-500/50'
                    : 'bg-amber-500/10 border-amber-500/50'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      selectedUser.issues.some(i => i.severity === 'high')
                        ? 'bg-red-500/20'
                        : 'bg-amber-500/20'
                    }`}>
                      <AlertTriangle className={`h-5 w-5 ${
                        selectedUser.issues.some(i => i.severity === 'high')
                          ? 'text-red-400'
                          : 'text-amber-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold mb-2 ${
                        selectedUser.issues.some(i => i.severity === 'high')
                          ? 'text-red-400'
                          : 'text-amber-400'
                      }`}>
                        Account Issues Detected
                      </p>
                      <div className="space-y-2">
                        {selectedUser.issues.map((issue, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg ${
                              issue.severity === 'high'
                                ? 'bg-red-500/10 border border-red-500/30'
                                : issue.severity === 'medium'
                                ? 'bg-amber-500/10 border border-amber-500/30'
                                : 'bg-blue-500/10 border border-blue-500/30'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {issue.type === 'frozen' && <Ban className="h-4 w-4 text-red-400 mt-0.5" />}
                              {issue.type === 'kyc_rejected' && <FileX className="h-4 w-4 text-red-400 mt-0.5" />}
                              {issue.type === 'kyc_pending' && <Clock className="h-4 w-4 text-amber-400 mt-0.5" />}
                              {issue.type === 'not_verified' && <Shield className="h-4 w-4 text-blue-400 mt-0.5" />}
                              <div className="flex-1">
                                <p className={`font-medium text-sm ${
                                  issue.severity === 'high'
                                    ? 'text-red-400'
                                    : issue.severity === 'medium'
                                    ? 'text-amber-400'
                                    : 'text-blue-400'
                                }`}>
                                  {issue.title}
                                </p>
                                <p className={`text-sm mt-1 ${
                                  isDark ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  {issue.message}
                                </p>
                                {issue.kycId && (
                                  <p className={`text-xs mt-1 ${
                                    isDark ? 'text-gray-500' : 'text-gray-500'
                                  }`}>
                                    KYC ID: {issue.kycId}
                                    {issue.submittedAt && ` • Submitted: ${format(new Date(issue.submittedAt), 'PPP')}`}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* User Info Card */}
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-amber-50'} border border-amber-500/30`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Selected User
                      </p>
                      <Link
                        href={`/admin/users/${selectedUser.id}`}
                        className="text-xs text-amber-500 hover:text-amber-600 underline"
                      >
                        View Details →
                      </Link>
                    </div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {selectedUser.email}
                    </p>
                    {selectedUser.full_name && (
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        Name: {selectedUser.full_name}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge
                        className={
                          selectedUser.is_verified
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }
                      >
                        {selectedUser.is_verified ? 'Verified' : 'Not Verified'}
                      </Badge>
                      <Badge
                        className={
                          selectedUser.is_active
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        }
                      >
                        {selectedUser.is_active ? 'Active' : 'Frozen'}
                      </Badge>
                      {selectedUser.kyc_status && (
                        <Badge
                          className={
                            selectedUser.kyc_status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : selectedUser.kyc_status === 'rejected'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }
                        >
                          KYC: {selectedUser.kyc_status}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedUser(null)}
                    className={isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSendEmail(selectedUser)}
                    disabled={sending || !emailConfigured}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!emailConfigured ? 'Email service is not configured. Please configure SMTP settings.' : ''}
                  >
                    {sending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Verification Email
                      </>
                    )}
                  </Button>
                  <Link href={`/admin/users/${selectedUser.id}`}>
                    <Button
                      variant="outline"
                      className={isDark ? 'border-gray-700' : 'border-gray-300'}
                    >
                      <User className="h-4 w-4 mr-2" />
                      View User
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className={`p-4 rounded-lg ${isDark ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200'} border`}>
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-900'}`}>
                  Automatic Email Sending
                </p>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                  When a new client submits a "Verify Your Identity" request, they will automatically receive a verification email. You can also manually send verification emails using this tool.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Emails */}
      <Card className={isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}>
        <CardHeader>
          <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
            Recent Verification Emails
          </CardTitle>
          <CardDescription className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            View recently sent verification emails
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentEmails.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className={`h-12 w-12 mx-auto mb-3 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                No verification emails sent yet
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentEmails.map((email) => (
                <div
                  key={email.id}
                  className={`p-4 rounded-lg border ${
                    isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-amber-500/20">
                        <Mail className="h-5 w-5 text-amber-400" />
                      </div>
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {email.user_name || email.user_email}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {email.user_email}
                        </p>
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          {format(new Date(email.sent_at), 'PPP p')}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={
                        email.status === 'sent'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : email.status === 'failed'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }
                    >
                      {email.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

