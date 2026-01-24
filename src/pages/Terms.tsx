export default function Terms() {
  return (
    <div className="min-h-screen bg-background py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold text-foreground mb-8">Terms of Service</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-lg">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>
              By accessing and using EditorsParadise ("the Platform"), you agree to be bound by these 
              Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">2. Description of Service</h2>
            <p>
              EditorsParadise is a marketplace platform that connects creators with digital products, 
              tools, and services for video editing and content creation. We provide:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>A marketplace for buying and selling digital products</li>
              <li>Audio and video editing tools</li>
              <li>AI-powered creative tools</li>
              <li>Community features and resources</li>
              <li>Editor-for-hire services</li>
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
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">4. Creator Terms</h2>
            <p>
              If you sell products on EditorsParadise, you agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Only sell products you have the right to distribute</li>
              <li>Provide accurate descriptions of your products</li>
              <li>Respond to customer inquiries in a timely manner</li>
              <li>Pay the platform fee of 5% on all sales</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">5. Payment Terms for Sellers</h2>
            
            <h3 className="text-xl font-medium text-foreground mt-4">Payout Methods</h3>
            <p>Sellers may choose from the following payout methods:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Stripe Connect:</strong> Available in 45+ countries, direct bank deposits</li>
              <li><strong>Payoneer:</strong> Available globally, supports local currency withdrawals in 150+ countries</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mt-4">Payout Fees</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Standard payouts (Stripe): Free, 1-3 business days</li>
              <li>Instant payouts (Stripe): 3% fee, immediate</li>
              <li>Payoneer payouts: Free from EditorsParadise; Payoneer may charge withdrawal fees (see Payoneer terms)</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mt-4">Payout Eligibility</h3>
            <p>To receive payouts, sellers must:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Complete identity verification with chosen payment provider</li>
              <li>Maintain accurate banking/payout information</li>
              <li>Comply with applicable tax reporting requirements</li>
              <li>Have a seller account in good standing</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mt-4">Minimum Payout Threshold</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Minimum withdrawal: $10 USD (or equivalent)</li>
              <li>Balance below minimum will roll over to next payout period</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mt-4">Payout Schedule</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Earnings are available for withdrawal after a 7-day holding period</li>
              <li>This period allows for refund processing and fraud prevention</li>
              <li>Payouts are processed based on your selected payment provider's schedule</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">6. Editor Services Terms</h2>
            <p>For users offering editor-for-hire services:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must accurately represent your skills and availability</li>
              <li>EditorsParadise takes a 5% platform fee on all editor bookings</li>
              <li>Remaining 95% is transferred to your connected payout account</li>
              <li>Disputes between editors and clients will be mediated by EditorsParadise</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">7. Tax Compliance</h2>
            
            <h3 className="text-xl font-medium text-foreground mt-4">Seller Responsibilities</h3>
            <p>Sellers are responsible for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Reporting income to appropriate tax authorities</li>
              <li>Providing accurate tax identification when required</li>
              <li>Complying with local tax laws in their jurisdiction</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mt-4">Platform Reporting (US Sellers)</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>We issue 1099-K forms to US sellers exceeding IRS thresholds</li>
              <li>Tax information is reported as required by law</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mt-4">International Sellers</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>We may collect tax identification (VAT, GST) as required</li>
              <li>Payoneer and Stripe may withhold taxes per local regulations</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">8. Intellectual Property</h2>
            <p>
              All content on EditorsParadise, including but not limited to text, graphics, logos, 
              and software, is the property of EditorsParadise or its content suppliers and is 
              protected by intellectual property laws.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">9. Prohibited Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on the rights of others</li>
              <li>Upload malicious content or software</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Resell or redistribute purchased products without authorization</li>
              <li>Engage in fraudulent transactions or chargebacks</li>
              <li>Create multiple accounts to abuse platform features</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">10. Refunds and Disputes</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Refund requests must be made within 14 days of purchase</li>
              <li>Digital products may be subject to different refund policies as stated by the seller</li>
              <li>EditorsParadise reserves the right to mediate disputes between buyers and sellers</li>
              <li>Chargebacks may result in account suspension</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">11. Limitation of Liability</h2>
            <p>
              EditorsParadise shall not be liable for any indirect, incidental, special, 
              consequential, or punitive damages resulting from your use of the platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">12. Changes to Terms</h2>
            <p>
              We may update these Terms of Service from time to time. We will notify users of 
              significant changes via email or platform notification. Continued use of the 
              platform after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">13. Contact Information</h2>
            <p>
              For questions about these Terms of Service, please contact us at:
            </p>
            <p className="text-foreground">support@editorsparadise.org</p>
          </section>
        </div>
      </div>
    </div>
  );
}
