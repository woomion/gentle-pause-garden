
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-cream dark:bg-[#200E3B] transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-taupe dark:text-[#F9F5EB] hover:text-black dark:hover:text-white transition-colors mb-6"
          >
            <ArrowLeft size={20} />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-black dark:text-[#F9F5EB] mb-2">Privacy Policy</h1>
          <p className="text-gray-600 dark:text-gray-300">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Content */}
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <div className="space-y-8 text-black dark:text-[#F9F5EB]">
            
            {/* Introduction */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Introduction</h2>
              <p className="mb-4">
                Pocket Pause ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our web application designed to help you make more conscious spending decisions.
              </p>
              <p>
                By using Pocket Pause, you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Information We Collect</h2>
              
              <h3 className="text-lg font-medium mb-2">Account Information</h3>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Email address (for account creation and authentication)</li>
                <li>First name (optional, for personalization)</li>
                <li>Password (encrypted and stored securely through Supabase Auth)</li>
              </ul>

              <h3 className="text-lg font-medium mb-2">Paused Items Data</h3>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Item names and descriptions</li>
                <li>Store names and item prices</li>
                <li>Product URLs and images (if provided)</li>
                <li>Your emotional state when pausing items</li>
                <li>Personal notes and reflections</li>
                <li>Pause duration preferences</li>
                <li>Review and decision history</li>
              </ul>

              <h3 className="text-lg font-medium mb-2">Usage Data</h3>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>App usage patterns and preferences</li>
                <li>Notification settings</li>
                <li>Theme preferences (light/dark mode)</li>
              </ul>

              <h3 className="text-lg font-medium mb-2">Technical Data</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Browser type and version</li>
                <li>Device information</li>
                <li>IP address (for security and fraud prevention)</li>
                <li>Session data and authentication tokens</li>
              </ul>
            </section>

            {/* How We Use Your Information */}
            <section>
              <h2 className="text-xl font-semibold mb-4">How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>To provide and maintain the Pocket Pause service</li>
                <li>To authenticate your account and ensure security</li>
                <li>To store and sync your paused items across devices</li>
                <li>To send gentle reminder notifications (if enabled)</li>
                <li>To personalize your experience with the app</li>
                <li>To analyze usage patterns and improve our service</li>
                <li>To respond to your inquiries and provide customer support</li>
                <li>To detect and prevent fraud or unauthorized access</li>
              </ul>
            </section>

            {/* Data Storage and Security */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Data Storage and Security</h2>
              <p className="mb-4">
                Your data is stored securely using Supabase, a trusted backend-as-a-service platform that provides:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>End-to-end encryption for data in transit and at rest</li>
                <li>Row-level security (RLS) policies ensuring you can only access your own data</li>
                <li>Secure authentication powered by industry-standard protocols</li>
                <li>Regular security audits and compliance with data protection standards</li>
                <li>Data hosting in secure, SOC 2 compliant data centers</li>
              </ul>
              <p>
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>

            {/* Data Sharing */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Data Sharing and Disclosure</h2>
              <p className="mb-4">
                We do not sell, trade, or otherwise transfer your personal information to third parties, except in the following circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Service Providers:</strong> We may share data with Supabase and other trusted service providers who assist in operating our application</li>
                <li><strong>Legal Requirements:</strong> We may disclose your information if required by law or in response to valid legal requests</li>
                <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction</li>
                <li><strong>Safety and Security:</strong> We may disclose information to protect the rights, property, or safety of Pocket Pause, our users, or others</li>
              </ul>
            </section>

            {/* Your Rights and Choices */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Your Rights and Choices</h2>
              <p className="mb-4">You have the following rights regarding your personal data:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Access:</strong> You can access and review your personal data through your account</li>
                <li><strong>Correction:</strong> You can update or correct your personal information at any time</li>
                <li><strong>Deletion:</strong> You can delete your account and all associated data</li>
                <li><strong>Export:</strong> You can request a copy of your data in a portable format</li>
                <li><strong>Notification Controls:</strong> You can enable or disable push notifications at any time</li>
                <li><strong>Withdraw Consent:</strong> You can withdraw consent for data processing by deleting your account</li>
              </ul>
              <p>
                To exercise these rights, please contact us or use the settings available in your account.
              </p>
            </section>

            {/* Guest Mode */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Guest Mode</h2>
              <p>
                Pocket Pause offers a guest mode that allows you to use the app without creating an account. In guest mode:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Your paused items are stored locally on your device only</li>
                <li>No personal data is collected or transmitted to our servers</li>
                <li>Data is not synced across devices and will be lost if you clear your browser data</li>
                <li>You can upgrade to a full account at any time to enable cloud sync</li>
              </ul>
            </section>

            {/* Cookies and Local Storage */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Cookies and Local Storage</h2>
              <p className="mb-4">
                Pocket Pause uses browser local storage and session storage to:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Maintain your login session and authentication state</li>
                <li>Store your preferences (theme, notification settings)</li>
                <li>Cache paused items for offline access and better performance</li>
                <li>Remember your welcome flow completion status</li>
              </ul>
              <p className="mt-4">
                We do not use tracking cookies or third-party analytics cookies.
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Children's Privacy</h2>
              <p>
                Pocket Pause is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
              </p>
            </section>

            {/* Changes to Privacy Policy */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Changes to This Privacy Policy</h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
              <p className="mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Through the feedback form in the app settings</li>
                <li>By email at: [Your Contact Email]</li>
              </ul>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                This privacy policy is designed to be transparent about our data practices while ensuring your personal information remains secure and private.
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
