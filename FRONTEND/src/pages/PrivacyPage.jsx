import React from 'react';

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-3xl font-bold text-white mb-6">Privacy Policy</h1>
        
        <div className="bg-base-100 rounded-lg shadow p-6 space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">Information We Collect</h2>
            <p className="text-base-content/80 leading-relaxed">
              CeylonLeaf collects information necessary to provide tea plantation management services, including user account information, field data, production records, and system usage analytics.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">How We Use Your Information</h2>
            <p className="text-base-content/80 leading-relaxed">
              We use your information to provide plantation management services, generate reports, improve our systems, and communicate with users about system updates and important notifications.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Data Security</h2>
            <p className="text-base-content/80 leading-relaxed">
              We implement industry-standard security measures to protect your data, including encryption, access controls, and regular security audits.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
            <p className="text-base-content/80 leading-relaxed">
              If you have questions about this Privacy Policy, please contact us at privacy@ceylonleaf.com or +94 11 234 5678.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;