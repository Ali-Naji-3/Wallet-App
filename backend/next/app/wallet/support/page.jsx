'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Send, Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import Link from 'next/link';

export default function SupportPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Get user email from localStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const userStr = localStorage.getItem('fxwallet_user');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.email) {
            setFormData(prev => ({ ...prev, email: user.email }));
          }
        }
      } catch (e) {
        // Ignore errors
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent any event bubbling
    
    // Prevent form from submitting normally
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    
    // Client-side validation
    if (!formData.email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    if (!formData.message.trim()) {
      toast.error('Please enter your message');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Validate message length
    if (formData.message.trim().length < 10) {
      toast.error('Message must be at least 10 characters long');
      return;
    }

    setSubmitting(true);
    
    try {
      const response = await apiClient.post(ENDPOINTS.SUPPORT.SUBMIT_REQUEST, {
        email: formData.email.trim(),
        subject: formData.subject.trim() || 'Support Request',
        message: formData.message.trim(),
      });

      const data = response.data;

      if (data.success) {
        console.log('[Support Page] Request submitted successfully, ticket_id:', data.ticket_id);
        
        // Show success message with email status
        let successMessage = `Your request has been received (Ticket #${data.ticket_id}). We'll get back to you as soon as possible.`;
        
        if (data.email_sent) {
          successMessage += ' An email notification has been sent to our support team.';
        } else if (data.email_error) {
          console.warn('[Support Page] Email notification failed:', data.email_error);
          // Don't show error to user - request was still saved successfully
        }
        
        toast.success('Support request submitted successfully!', {
          description: successMessage,
          duration: 6000,
        });
        
        // Set submitted state to show confirmation page
        setSubmitted(true);
        
        // Clear form (keep email for reference)
        setFormData({
          email: formData.email, // Keep email
          subject: '',
          message: '',
        });
      } else {
        // Handle API error response
        const errorMessage = data.message || 'Failed to submit support request';
        const errorCode = data.error || 'UNKNOWN_ERROR';
        console.error('[Support Page] API returned error:', { errorCode, errorMessage, data });
        toast.error('Submission Failed', {
          description: errorMessage,
          duration: 6000,
        });
      }
    } catch (error) {
      console.error('[Support Page] Error submitting support request:', error);
      
      // Extract error message from response
      let errorMessage = 'Failed to submit support request. Please try again.';
      
      if (error.response) {
        // Server responded with error
        const responseData = error.response.data;
        errorMessage = responseData?.message || errorMessage;
        
        // Log detailed error for debugging
        console.error('[Support Page] Error response:', {
          status: error.response.status,
          data: responseData,
          error: responseData?.error,
        });
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'Network error. Please check your connection and try again.';
        console.error('[Support Page] No response received:', error.request);
      } else {
        // Error setting up request
        errorMessage = 'An error occurred. Please try again.';
        console.error('[Support Page] Request setup error:', error.message);
      }
      
      toast.error('Submission Failed', {
        description: errorMessage,
        duration: 6000,
      });
      
      // CRITICAL: Don't redirect or reload page on error
      // Stay on support page so user can try again
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
                  <CheckCircle className="h-8 w-8 text-emerald-400" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Request Submitted!</h2>
                <p className="text-gray-400">
                  Your support request has been received. We'll get back to you at <strong className="text-white">{formData.email}</strong> as soon as possible.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData(prev => ({ ...prev, subject: '', message: '' }));
                  }}
                  variant="outline"
                  className="flex-1 border-gray-700 text-gray-300 hover:text-white"
                >
                  Submit Another
                </Button>
                      <Link href="/login" className="flex-1">
                  <Button className="w-full bg-amber-500 hover:bg-amber-600 text-gray-900">
                    Back to Login
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Contact Support</h1>
            <p className="text-sm text-gray-400 mt-1">
              Need help? Send us a message and we'll get back to you as soon as possible.
            </p>
          </div>
        </div>

        {/* Support Form */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Submit Support Request</CardTitle>
            <CardDescription className="text-gray-400">
              Fill out the form below and our support team will assist you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Your Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                    className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-amber-500 focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-gray-300">Subject (Optional)</Label>
                <Input
                  id="subject"
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message" className="text-gray-300">Message</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Please describe your issue or question in detail..."
                  rows={6}
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-amber-500 focus:border-amber-500 resize-none"
                  required
                />
                <p className="text-xs text-gray-500">
                  Include as much detail as possible to help us assist you better.
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={submitting || !formData.email.trim() || !formData.message.trim()}
                className="w-full bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold h-11"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Support Request
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-400 mb-1">
                  Response Time
                </p>
                <p className="text-sm text-gray-400">
                  We typically respond within 24-48 hours. For urgent matters, please include "URGENT" in your subject line.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

