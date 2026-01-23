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
            <h2 className="text-2xl font-semibold text-foreground">5. Intellectual Property</h2>
            <p>
              All content on EditorsParadise, including but not limited to text, graphics, logos, 
              and software, is the property of EditorsParadise or its content suppliers and is 
              protected by intellectual property laws.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">6. Prohibited Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on the rights of others</li>
              <li>Upload malicious content or software</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Resell or redistribute purchased products without authorization</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">7. Limitation of Liability</h2>
            <p>
              EditorsParadise shall not be liable for any indirect, incidental, special, 
              consequential, or punitive damages resulting from your use of the platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">8. Contact Information</h2>
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
