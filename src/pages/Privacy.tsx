export default function Privacy() {
  return (
    <div className="min-h-screen bg-background py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold text-foreground mb-8">Privacy Policy</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-lg">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">1. Introduction</h2>
            <p>
              SellsPay ("we", "our", or "us") is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, and share information about you 
              when you use our platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">2. Information We Collect</h2>
            <h3 className="text-xl font-medium text-foreground">Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Account information (name, email, password)</li>
              <li>Profile information (bio, avatar, social links)</li>
              <li>Payment information (processed securely via our payment partners)</li>
              <li>Content you upload or create</li>
            </ul>
            
            <h3 className="text-xl font-medium text-foreground mt-4">Information Collected Automatically</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Device and browser information</li>
              <li>IP address and location data</li>
              <li>Usage data and analytics</li>
              <li>Cookies and similar technologies</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send promotional communications (with your consent)</li>
              <li>Respond to your comments and questions</li>
              <li>Protect against fraudulent or illegal activity</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">4. Payment Processing Partners</h2>
            <p>We use the following third-party payment processors to facilitate transactions:</p>
            
            <h3 className="text-xl font-medium text-foreground mt-4">Stripe</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Purpose:</strong> Payment processing and seller payouts</li>
              <li><strong>Data collected:</strong> Name, email, bank account details, tax identification</li>
              <li><strong>Data location:</strong> United States, EU</li>
              <li><strong>Privacy policy:</strong> <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://stripe.com/privacy</a></li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mt-4">Payoneer</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Purpose:</strong> Alternative payout method for international sellers</li>
              <li><strong>Data collected:</strong> Name, email, payout preferences, bank details</li>
              <li><strong>Data location:</strong> Various (global presence)</li>
              <li><strong>Privacy policy:</strong> <a href="https://www.payoneer.com/legal/privacy-policy/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://www.payoneer.com/legal/privacy-policy/</a></li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">5. Financial Information</h2>
            <p>We collect and process the following financial data:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Bank account details (account numbers, routing numbers) - stored by our payment partners</li>
              <li>Payment history and transaction records</li>
              <li>Tax identification numbers (where required by law)</li>
              <li>Payout preferences and methods</li>
            </ul>
            <p className="mt-4">This data is:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Encrypted in transit and at rest</li>
              <li>Shared only with payment processors for transaction execution</li>
              <li>Retained as required by financial regulations (typically 7 years)</li>
              <li>Never sold to third parties</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">6. Information Sharing</h2>
            <p>We may share your information with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Service providers who assist in our operations</li>
              <li>Payment processors (Stripe, Payoneer) for transaction processing</li>
              <li>Law enforcement when required by law</li>
              <li>Other users (only your public profile information)</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">7. International Data Transfers</h2>
            <p>
              For users outside the United States, your payment data may be transferred 
              to and processed in:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>United States (Stripe headquarters)</li>
              <li>European Union (Stripe EU operations)</li>
              <li>Other jurisdictions where Payoneer operates</li>
            </ul>
            <p className="mt-4">These transfers are protected by:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Standard Contractual Clauses (SCCs)</li>
              <li>Adequacy decisions where applicable</li>
              <li>Our payment partners' data protection agreements</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">8. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your 
              personal information against unauthorized access, alteration, disclosure, or 
              destruction. This includes:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>SSL/TLS encryption for all data in transit</li>
              <li>Encryption at rest for sensitive data</li>
              <li>Regular security audits and assessments</li>
              <li>Access controls and authentication requirements</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">9. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Data portability</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">10. Cookies</h2>
            <p>
              We use cookies and similar tracking technologies to collect and track information 
              about your activity on our platform. You can control cookies through your browser 
              settings.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">11. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at:
            </p>
            <p className="text-foreground">privacy@sellspay.com</p>
          </section>
        </div>
      </div>
    </div>
  );
}