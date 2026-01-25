import { AlertCircle, CheckCircle, XCircle, HelpCircle, CreditCard, Clock, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const refundEligible = [
  'Product file is corrupted, incomplete, or cannot be downloaded',
  'Product does not match its description or preview media',
  'Technical issues preventing product use (with proof)',
  'Duplicate purchase made by mistake (same product purchased twice)',
];

const refundNotEligible = [
  'Change of mind after purchase or download',
  'Product has been downloaded and used in a project',
  'More than 14 days have passed since purchase',
  'Creator subscription fees after the billing period has started',
  'Credit purchases (Pro Tools credits are non-refundable)',
  'Free products (nothing to refund)',
  'Dissatisfaction with subjective quality (e.g., "I don\'t like the style")',
];

export default function Refunds() {
  return (
    <div className="min-h-screen bg-background py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold text-foreground mb-4">Refund Policy</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Last updated: January 25, 2026
        </p>

        <div className="space-y-8">
          {/* Overview */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Overview</h2>
            <p className="text-muted-foreground">
              EditorsParadise is a marketplace for digital products including presets, LUTs, templates, 
              sound effects, and other creative assets. Due to the nature of digital goods, all sales 
              are generally final once a product has been downloaded. However, we understand that issues 
              can arise, and we're committed to resolving legitimate concerns.
            </p>
          </section>

          {/* Refund Window */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                14-Day Refund Window
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                You have <strong>14 days from the date of purchase</strong> to request a refund for eligible products. 
                Requests made after this window will not be accepted. The 14-day period begins at the 
                time of successful payment, not download.
              </p>
            </CardContent>
          </Card>

          {/* Digital Products Notice */}
          <Card className="bg-amber-500/10 border-amber-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Digital Products Disclaimer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Because digital products can be instantly copied after download, we cannot offer refunds 
                for products that have been downloaded and used. We encourage buyers to carefully review 
                product descriptions, preview images, and demo videos before purchasing.
              </p>
            </CardContent>
          </Card>

          {/* Eligible */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              Eligible for Refund
            </h2>
            <ul className="space-y-3">
              {refundEligible.map((item) => (
                <li key={item} className="flex items-start gap-3 text-muted-foreground">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Not Eligible */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <XCircle className="h-6 w-6 text-red-500" />
              Not Eligible for Refund
            </h2>
            <ul className="space-y-3">
              {refundNotEligible.map((item) => (
                <li key={item} className="flex items-start gap-3 text-muted-foreground">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Subscriptions */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Creator Subscriptions</h2>
            <p className="text-muted-foreground">
              Creator subscription plans provide access to exclusive content from individual creators. 
              Subscription refunds are handled as follows:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                <strong>Before accessing any content:</strong> Full refund may be issued within 24 hours of purchase
              </li>
              <li>
                <strong>After accessing subscription content:</strong> No refund available for the current billing period
              </li>
              <li>
                <strong>Cancellation:</strong> You may cancel anytime to prevent future charges, but no prorated refunds are provided
              </li>
            </ul>
          </section>

          {/* Pro Tools Credits */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Pro Tools Credits</h2>
            <p className="text-muted-foreground">
              Credits purchased for our AI-powered Pro Tools (voice isolation, music splitting, SFX generation, etc.) 
              are non-refundable. This includes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Monthly credit subscription packages</li>
              <li>One-time credit top-ups</li>
              <li>Unused credits (credits do not expire but cannot be refunded)</li>
            </ul>
          </section>

          {/* How to Request */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">How to Request a Refund</h2>
            <ol className="list-decimal pl-6 space-y-3 text-muted-foreground">
              <li>
                Email <span className="text-foreground font-medium">support@editorsparadise.org</span> with 
                the subject line "Refund Request"
              </li>
              <li>
                Include your order ID or purchase confirmation email
              </li>
              <li>
                Describe the issue in detail (e.g., file won't open, product doesn't match description)
              </li>
              <li>
                Attach screenshots or screen recordings if applicable
              </li>
              <li>
                We'll review your request and respond within <strong>2-3 business days</strong>
              </li>
            </ol>
          </section>

          {/* Processing Time */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <CreditCard className="h-6 w-6" />
              Refund Processing
            </h2>
            <p className="text-muted-foreground">
              Once approved, refunds are typically processed within <strong>5-7 business days</strong>. 
              The refund will be credited to your original payment method (the card or account used for purchase). 
              Your bank or payment provider may take additional time to reflect the refund in your account.
            </p>
          </section>

          {/* For Creators */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="h-6 w-6" />
              For Creators / Sellers
            </h2>
            <p className="text-muted-foreground">
              If a refund is issued for one of your products:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>The sale amount will be deducted from your available balance or next payout</li>
              <li>If your balance is insufficient, the amount will be held against future earnings</li>
              <li>Creators with high refund rates may have their accounts reviewed</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              To minimize refund requests, we encourage creators to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Provide accurate, detailed product descriptions</li>
              <li>Include high-quality preview images and demo videos</li>
              <li>Ensure all files are complete and properly formatted</li>
              <li>Respond promptly to customer questions</li>
            </ul>
          </section>

          {/* Chargebacks */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Chargebacks & Disputes</h2>
            <p className="text-muted-foreground">
              We strongly encourage you to contact us before initiating a chargeback with your bank or 
              credit card company. Chargebacks without prior contact may result in:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Account suspension or permanent ban</li>
              <li>Loss of access to all previously purchased products</li>
              <li>Ineligibility for future purchases on the platform</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Most issues can be resolved quickly by contacting our support team first.
            </p>
          </section>

          {/* Contact */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Need Help?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                If you have questions about our refund policy or need assistance with a 
                refund request, please contact our support team at{' '}
                <span className="text-foreground font-medium">support@editorsparadise.org</span>.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" asChild>
                  <a href="mailto:support@editorsparadise.org">Contact Support</a>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/faq">View FAQ</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}