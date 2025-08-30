
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';

const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
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
          <p className="text-gray-600 dark:text-gray-300">Last updated: August 2025</p>
        </div>

        {/* Content */}
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <div className="space-y-8 text-black dark:text-[#F9F5EB]">
            
            {/* Introduction */}
            <section>
              <p className="mb-4">
                Pocket Pause ("we," "our," or "us") is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information when you use Pocket Pause — a simple tool to support more intentional, conscious spending decisions.
              </p>
              <p>
                By using Pocket Pause, you agree to this policy.
              </p>
            </section>

            {/* What We Collect */}
            <section>
              <h2 className="text-xl font-semibold mb-4">What We Collect</h2>
              <p className="mb-4">
                We collect only what we need to help you use Pocket Pause effectively and securely.
              </p>
              
              <h3 className="text-lg font-medium mb-2">If you create an account:</h3>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Email address (for login and account recovery)</li>
                <li>First name (optional, used for personalization)</li>
                <li>Password (securely encrypted and stored via Supabase Auth)</li>
              </ul>

              <h3 className="text-lg font-medium mb-2">If you use the app features:</h3>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Paused item names, descriptions, prices, store names</li>
                <li>Links or images (if you choose to include them)</li>
                <li>Decision history</li>
              </ul>

              <h3 className="text-lg font-medium mb-2">If you use the app generally:</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>App usage patterns (like theme preference, notification settings)</li>
                <li>Technical data (browser, device type, IP address — for security purposes)</li>
              </ul>
            </section>

            {/* How Your Data Is Used */}
            <section>
              <h2 className="text-xl font-semibold mb-4">How Your Data Is Used</h2>
              <p className="mb-4">We use your information to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide and maintain Pocket Pause</li>
                <li>Keep your account secure</li>
                <li>Save and sync your paused items across devices (if logged in)</li>
                <li>Support a personalized, private experience</li>
                <li>Help you reflect on your choices</li>
                <li>Send you reminder notifications (if turned on)</li>
                <li>Improve the app through anonymous usage patterns</li>
                <li>Protect against fraud or unauthorized use</li>
              </ul>
            </section>

            {/* How Your Data Is Protected */}
            <section>
              <h2 className="text-xl font-semibold mb-4">How Your Data Is Protected</h2>
              <p className="mb-4">
                Pocket Pause uses Supabase, a secure backend platform with:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>End-to-end encryption (in transit and at rest)</li>
                <li>Row-Level Security (you can only access your own data)</li>
                <li>Secure authentication (industry-standard)</li>
                <li>Hosting in SOC 2-compliant data centers</li>
              </ul>
              <p>
                We also take care to implement safeguards that keep your data private and protected.
              </p>
            </section>

            {/* We Don't Sell or Share Your Info */}
            <section>
              <h2 className="text-xl font-semibold mb-4">We Don't Sell or Share Your Info</h2>
              <p className="mb-4">
                We never sell or trade your personal information. Your data will only be shared:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>With trusted service providers (like Supabase) to run the app</li>
                <li>If legally required (e.g., court order)</li>
                <li>In rare business transitions (e.g., if Pocket Pause merges or is acquired)</li>
                <li>To protect our rights, users, or platform from harm or fraud</li>
              </ul>
            </section>

            {/* Guest Mode */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Guest Mode</h2>
              <p className="mb-4">
                You can use Pocket Pause in Guest Mode — no login needed. In guest mode:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Nothing is stored on our servers</li>
                <li>Paused items stay only on your device (not synced)</li>
                <li>Data may be lost if you clear your browser or change devices</li>
                <li>You can upgrade to a full account anytime to save your data across devices.</li>
              </ul>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Your Rights</h2>
              <p className="mb-4">You're always in control. You can:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Access your data</li>
                <li>Edit or update your info</li>
                <li>Delete your account at any time</li>
                <li>Request a downloadable copy of your data</li>
                <li>Turn notifications on or off</li>
                <li>Withdraw consent by deleting your account</li>
              </ul>
              <p>
                These options are available in your account settings, or you can reach out directly.
              </p>
            </section>

            {/* Cookies & Local Storage */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Cookies & Local Storage</h2>
              <p className="mb-4">
                We use local storage (not tracking cookies) to:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Keep you logged in</li>
                <li>Remember your theme and notification preferences</li>
                <li>Improve load time and offline access</li>
                <li>Save progress in the welcome flow</li>
              </ul>
              <p className="mt-4">
                We do not use third-party ad trackers or analytics cookies.
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Children's Privacy</h2>
              <p>
                Pocket Pause is not designed for children under 13. We don't knowingly collect data from anyone under 13. If you believe we have, please contact us and we'll promptly delete it.
              </p>
            </section>

            {/* Policy Changes */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Policy Changes</h2>
              <p>
                We may update this policy occasionally. When we do, we'll post the new version here and update the date at the top. We encourage you to check back from time to time.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Contact</h2>
              <p className="mb-4">
                Have questions or want to reach us?
              </p>
              <p>You can contact us:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Through the feedback form in the app settings</li>
                <li>By email: [Insert email]</li>
              </ul>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
