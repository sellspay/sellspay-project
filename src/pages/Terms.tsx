export default function Terms() {
  return (
    <div className="min-h-screen bg-background py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold text-foreground mb-8">Terms of Service</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-lg">
            Last updated: January 25, 2026
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>
              By accessing and using SellsPay ("the Platform"), you agree to be bound by these 
              Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">2. Description of Service</h2>
            <p>
              SellsPay is a marketplace platform that connects creators with digital products, 
              tools, and services for video editing and content creation. We provide:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>A marketplace for buying and selling digital products (presets, LUTs, templates, overlays, sound effects, etc.)</li>
              <li>AI-powered audio tools (voice isolation, music splitting, SFX generation)</li>
              <li>A credits-based system for accessing Pro Tools</li>
              <li>Creator subscription plans for exclusive content access</li>
              <li>Community features including forums and creator spotlights</li>
              <li>Editor-for-hire services connecting clients with professional editors</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">3. User Accounts</h2>
            <p>
              To access certain features, you must create an account. You are responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Providing accurate and complete information</li>
              <li>Enabling two-factor authentication for enhanced security (recommended for sellers)</li>
            </ul>
            <p>
              Username changes are limited to once every 60 days. Your previous username is reserved for 14 days 
              in case you want to revert.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">4. Creator & Seller Terms</h2>
            <p>
              To sell products on Sellspay, you must apply and be approved as a Creator. As a seller, you agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Only sell products you have the legal right to distribute</li>
              <li>Provide accurate descriptions and preview media for your products</li>
              <li>Respond to customer inquiries in a timely manner</li>
              <li>Pay the platform commission of 5% on all sales</li>
              <li>Set a minimum price of $4.99 USD for all paid products</li>
              <li>Complete identity verification with your chosen payment provider (Stripe Connect)</li>
            </ul>
            
            <h3 className="text-xl font-medium text-foreground mt-4">Product Pricing</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>All paid products must be priced at $4.99 USD or higher</li>
              <li>Free products and subscription-only products are allowed</li>
              <li>Prices are displayed and charged in USD</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">5. Creator Subscription Plans</h2>
            <p>
              Creators may offer subscription plans providing exclusive access to their products:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Subscribers gain access to designated products as determined by the creator</li>
              <li>Products may offer subscriber discounts or be exclusively available to subscribers</li>
              <li>Subscriptions are billed monthly and auto-renew until canceled</li>
              <li>The 5% platform commission applies to subscription revenue</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">6. Payment Terms for Sellers</h2>
            
            <h3 className="text-xl font-medium text-foreground mt-4">Revenue Split</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Sellers receive 95% of each sale after Stripe processing fees</li>
              <li>Sellspay retains a 5% platform commission</li>
              <li>Stripe processing fees (approximately 2.9% + $0.30) are deducted from the seller's share</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mt-4">Payout Methods</h3>
            <p>Sellers may choose from the following payout methods:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Stripe Connect:</strong> Available in 45+ countries, direct bank deposits</li>
              <li><strong>Payoneer:</strong> Available globally, supports local currency withdrawals in 150+ countries</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mt-4">Payout Fees</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Standard payouts (Stripe): Free, 1-3 business days</li>
              <li>Instant payouts (Stripe): 3% fee, immediate transfer</li>
              <li>Payoneer payouts: Free from Sellspay; Payoneer may charge their own withdrawal fees</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mt-4">Minimum Payout & Holding Period</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Minimum withdrawal: $10 USD</li>
              <li>Earnings are held for 7 days before becoming available for withdrawal</li>
              <li>This holding period allows for refund processing and fraud prevention</li>
              <li>Balances below $10 will accumulate until the minimum is reached</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mt-4">Pending Earnings</h3>
            <p>
              If you have not completed Stripe onboarding, your earnings will be held securely by the platform. 
              Once you connect your Stripe account, all pending earnings become available for withdrawal 
              (subject to the 7-day holding period).
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">7. Editor Services Terms</h2>
            <p>For users offering editor-for-hire services:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must apply and be approved as an Editor</li>
              <li>Accurately represent your skills, experience, and availability</li>
              <li>Set your own hourly rates (displayed to clients)</li>
              <li>Sellspay takes a 5% platform fee on all editor bookings</li>
              <li>The remaining 95% (minus Stripe fees) is transferred to your connected Stripe account</li>
              <li>Disputes between editors and clients will be mediated by Sellspay</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">8. Pro Tools & Credits</h2>
            <p>
              Sellspay offers AI-powered audio tools that operate on a credits system:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>New users receive 3 free credits upon registration</li>
              <li>Additional credits can be purchased via subscription packages</li>
              <li>One-time credit top-ups are also available</li>
              <li>Credits are non-refundable and non-transferable</li>
              <li>Each tool usage deducts credits based on processing requirements</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">9. Tax Compliance</h2>
            
            <h3 className="text-xl font-medium text-foreground mt-4">Seller Responsibilities</h3>
            <p>Sellers are responsible for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Reporting income to appropriate tax authorities in your jurisdiction</li>
              <li>Providing accurate tax identification when required by your payment provider</li>
              <li>Complying with local tax laws and regulations</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mt-4">Platform Reporting (US Sellers)</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Stripe issues 1099-K forms to US sellers exceeding IRS thresholds</li>
              <li>Tax information is reported as required by law</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mt-4">International Sellers</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Stripe and Payoneer may collect VAT, GST, or withhold taxes per local regulations</li>
              <li>You are responsible for understanding tax implications in your country</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">10. Intellectual Property</h2>
            <p>
              All content on Sellspay, including but not limited to text, graphics, logos, 
              and software, is the property of Sellspay or its content suppliers and is 
              protected by intellectual property laws.
            </p>
            <p>
              Products sold on the marketplace remain the intellectual property of their respective creators. 
              Buyers receive a license to use purchased products as specified by the creator, typically for 
              personal and commercial projects, but not for redistribution or resale.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">11. Prohibited Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on the rights of others or sell content you don't own</li>
              <li>Upload malicious content, viruses, or harmful software</li>
              <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
              <li>Resell or redistribute purchased products without authorization</li>
              <li>Engage in fraudulent transactions or initiate unjustified chargebacks</li>
              <li>Create multiple accounts to abuse platform features, promotions, or credits</li>
              <li>Manipulate reviews, likes, or follower counts</li>
              <li>Harass other users in comments or community forums</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">12. Refunds and Disputes</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Refund requests must be made within 14 days of purchase</li>
              <li>Digital products are generally non-refundable once downloaded</li>
              <li>Refunds may be issued for products that don't match their description or are defective</li>
              <li>Creator subscription refunds are not available after the billing period has started</li>
              <li>Sellspay reserves the right to mediate disputes between buyers and sellers</li>
              <li>Unjustified chargebacks may result in account suspension</li>
            </ul>
            <p className="mt-2">
              Please see our <a href="/refunds" className="text-primary hover:underline">Refund Policy</a> for complete details.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">13. Account Suspension & Termination</h2>
            <p>
              Sellspay reserves the right to suspend or terminate accounts that violate these terms. 
              Grounds for suspension include but are not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Selling pirated, stolen, or unauthorized content</li>
              <li>Fraudulent transactions or chargeback abuse</li>
              <li>Harassment of other users</li>
              <li>Creating multiple accounts to abuse platform features</li>
            </ul>
            <p>
              Suspended sellers forfeit any pending earnings. You may delete your account at any time 
              through your account settings.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">14. Limitation of Liability</h2>
            <p>
              Sellspay shall not be liable for any indirect, incidental, special, 
              consequential, or punitive damages resulting from your use of the platform. 
              We do not guarantee the quality, accuracy, or suitability of products sold by third-party creators.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">15. Changes to Terms</h2>
            <p>
              We may update these Terms of Service from time to time. We will notify users of 
              significant changes via email or platform notification. Continued use of the 
              platform after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">16. Contact Information</h2>
            <p>
              For questions about these Terms of Service, please contact us at:
            </p>
            <p className="text-foreground">support@sellspay.com</p>
          </section>
        </div>
      </div>
    </div>
  );
}