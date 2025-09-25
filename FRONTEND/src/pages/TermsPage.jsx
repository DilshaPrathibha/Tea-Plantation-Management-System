import React from 'react';

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-3xl font-bold text-white mb-6">Terms of Service</h1>
        
        <div className="bg-base-100 rounded-lg shadow p-6 space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">Acceptance of Terms</h2>
            <p className="text-base-content/80 leading-relaxed">
              By accessing and using CeylonLeaf plantation management system, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">System Usage</h2>
            <p className="text-base-content/80 leading-relaxed">
              Users must comply with all applicable laws and regulations when using our system. Unauthorized access, data manipulation, or system abuse is strictly prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">User Responsibilities</h2>
            <p className="text-base-content/80 leading-relaxed">
              Users are responsible for maintaining the confidentiality of their account information and for all activities that occur under their account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Limitation of Liability</h2>
            <p className="text-base-content/80 leading-relaxed">
              CeylonLeaf shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Contact Information</h2>
            <p className="text-base-content/80 leading-relaxed">
              For questions about these Terms of Service, please contact us at legal@ceylonleaf.com or +94 11 234 5678.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;