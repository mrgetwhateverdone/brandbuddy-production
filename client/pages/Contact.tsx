import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ArrowLeft, Send, Check } from 'lucide-react';
import { SignInButton } from '@clerk/clerk-react';

/**
 * This part of the code creates the contact form page with Formspree integration
 * Users can submit inquiries which will be sent to dj@heftiq.com
 */
export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // This part of the code handles form submission to Formspree
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch('https://formspree.io/f/movlbjnz', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        setIsSubmitted(true);
        form.reset();
      } else {
        const data = await response.json();
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // This part of the code handles Clerk authentication for demo access

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-md w-full bg-white p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Thank you for your message!
          </h2>
          
          <p className="text-gray-600 mb-6">
            We've received your inquiry and will get back to you within 24 hours. 
            In the meantime, feel free to explore our demo.
          </p>
          
          <div className="space-y-3">
            <SignInButton mode="modal">
              <Button 
                className="w-full bg-red-600 hover:bg-red-700 !text-white"
              >
                Try Demo Now
              </Button>
            </SignInButton>
            
            <Button 
              variant="outline" 
              asChild
              className="w-full"
            >
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>
            
            <div className="flex items-center">
              <div className="text-2xl font-bold text-red-600">Brand Buddy</div>
              <div className="ml-2 text-sm text-gray-500">Brand Operations Platform</div>
            </div>
            
            <SignInButton mode="modal">
              <Button 
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Get Demo
              </Button>
            </SignInButton>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Get Started with Brand Buddy
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Tell us about your brand operations needs and we'll show you how Brand Buddy can help 
            optimize your brand performance and drive growth.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Contact Form */}
          <Card className="bg-white p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Send us a message
            </h2>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors placeholder:text-gray-400"
                  placeholder="Your full name"
                  disabled={isSubmitting}
                />
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors placeholder:text-gray-400"
                  placeholder="your.email@company.com"
                  disabled={isSubmitting}
                />
              </div>

              {/* Company Field */}
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  name="company"
                  id="company"
                  className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors placeholder:text-gray-400"
                  placeholder="Your company name"
                  disabled={isSubmitting}
                />
              </div>

              {/* Message Field */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  name="message"
                  id="message"
                  rows={6}
                  required
                  className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors resize-vertical placeholder:text-gray-400"
                  placeholder="Tell us about your brand operations needs, current challenges, or what you'd like to learn about Brand Buddy..."
                  disabled={isSubmitting}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 text-lg"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Sending Message...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Send className="w-5 h-5 mr-2" />
                    Send Message
                  </div>
                )}
              </Button>
            </form>

            <p className="text-sm text-gray-500 mt-4 text-center">
              We'll respond within 24 hours
            </p>
          </Card>

          {/* Information Panel */}
          <div className="space-y-8">
            {/* Why Choose Brand Buddy */}
            <Card className="bg-red-50 border-red-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Why Choose Brand Buddy?
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <span>Real-time visibility into brand operations</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <span>AI-powered brand insights and predictions</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <span>Optimize brand performance by up to 30%</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <span>Setup in minutes, not months</span>
                </li>
              </ul>
            </Card>

            {/* Quick Demo Option */}
            <Card className="bg-green-50 border-green-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Want to see it in action?
              </h3>
              <p className="text-gray-700 mb-4">
                Skip the wait and explore Brand Buddy immediately with our interactive demo. 
                See real data, test features, and experience the platform firsthand.
              </p>
              <SignInButton mode="modal">
                <Button
                  className="w-full bg-red-600 hover:bg-red-700 !text-white"
                >
                  Try Demo Now
                </Button>
              </SignInButton>
            </Card>

            {/* Contact Info */}
            <Card className="bg-gray-50 border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Get in Touch
              </h3>
              <div className="space-y-2 text-gray-700">
                <p>
                  <span className="font-medium">Response Time:</span> Within 24 hours
                </p>
                <p>
                  <span className="font-medium">Demo Setup:</span> 15 minutes
                </p>
                <p>
                  <span className="font-medium">Implementation:</span> Same day
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
