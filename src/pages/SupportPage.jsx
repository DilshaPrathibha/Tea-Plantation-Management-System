import React from 'react';

const SupportPage = () => {
  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-3xl font-bold text-white mb-6">Support Center</h1>
        
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Contact Support */}
          <div className="bg-base-100 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact Support
            </h2>
            <div className="space-y-3">
              <p className="text-base-content/80">Email: support@ceylonleaf.com</p>
              <p className="text-base-content/80">Phone: +94 11 234 5678</p>
              <p className="text-base-content/80">Hours: Monday - Friday, 8:00 AM - 6:00 PM (GMT+5:30)</p>
            </div>
          </div>

          {/* Technical Support */}
          <div className="bg-base-100 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Technical Support
            </h2>
            <div className="space-y-3">
              <p className="text-base-content/80">For system issues, bugs, or technical assistance</p>
              <p className="text-base-content/80">Email: tech@ceylonleaf.com</p>
              <p className="text-base-content/80">Priority support available for critical issues</p>
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-base-100 rounded-lg shadow p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">How do I reset my password?</h3>
                <p className="text-base-content/80 text-sm">Click on "Forgot Password" on the login page and follow the instructions sent to your email.</p>
              </div>
              <div>
                <h3 className="font-medium mb-1">Can I access the system on mobile devices?</h3>
                <p className="text-base-content/80 text-sm">Yes, our system is fully responsive and works on tablets and mobile devices.</p>
              </div>
              <div>
                <h3 className="font-medium mb-1">How do I report data discrepancies?</h3>
                <p className="text-base-content/80 text-sm">Use the report feature in your dashboard or contact technical support with detailed information.</p>
              </div>
              <div>
                <h3 className="font-medium mb-1">What browsers are supported?</h3>
                <p className="text-base-content/80 text-sm">We support modern browsers including Chrome, Firefox, Safari, and Edge (latest versions).</p>
              </div>
            </div>
          </div>

          {/* Training Resources */}
          <div className="bg-base-100 rounded-lg shadow p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Training Resources
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="p-3 border border-base-300 rounded">
                <h4 className="font-medium">User Manual</h4>
                <p className="text-sm text-base-content/80">Complete guide for system usage</p>
              </div>
              <div className="p-3 border border-base-300 rounded">
                <h4 className="font-medium">Video Tutorials</h4>
                <p className="text-sm text-base-content/80">Step-by-step video guides</p>
              </div>
              <div className="p-3 border border-base-300 rounded">
                <h4 className="font-medium">Webinar Sessions</h4>
                <p className="text-sm text-base-content/80">Live training sessions</p>
              </div>
              <div className="p-3 border border-base-300 rounded">
                <h4 className="font-medium">Best Practices</h4>
                <p className="text-sm text-base-content/80">Industry recommendations</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;