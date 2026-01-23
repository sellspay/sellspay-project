import { AlertCircle, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const refundEligible = [
  'Product does not match the description',
  'Technical issues preventing product use',
  'Duplicate purchase by mistake',
  'Product file is corrupted or incomplete',
];

const refundNotEligible = [
  'Change of mind after purchase',
  'Product was used before requesting refund',
  'More than 14 days since purchase',
  'Subscription services after the billing period has started',
];

export default function Refunds() {
  return (
    <div className="min-h-screen bg-background py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold text-foreground mb-4">Refund Policy</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <div className="space-y-8">
          {/* Overview */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Overview</h2>
            <p className="text-muted-foreground">
              At EditorsParadise, we want you to be completely satisfied with your purchases. 
              If you're not happy with a product, we're here to help. This policy outlines 
              when and how you can request a refund.
            </p>
          </section>

          {/* Refund Window */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                14-Day Refund Window
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                You have 14 days from the date of purchase to request a refund for eligible products. 
                Refund requests made after this period will not be accepted.
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

          {/* How to Request */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">How to Request a Refund</h2>
            <ol className="list-decimal pl-6 space-y-3 text-muted-foreground">
              <li>
                Go to your <span className="text-foreground">Purchase History</span> in your account settings
              </li>
              <li>
                Find the order you want to refund and click <span className="text-foreground">"Request Refund"</span>
              </li>
              <li>
                Select a reason for your refund request and provide any relevant details
              </li>
              <li>
                Submit your request - we'll review it within 2-3 business days
              </li>
            </ol>
          </section>

          {/* Processing Time */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Refund Processing</h2>
            <p className="text-muted-foreground">
              Once approved, refunds are typically processed within 5-7 business days. 
              The refund will be credited to your original payment method. Please note 
              that your bank or payment provider may take additional time to reflect 
              the refund in your account.
            </p>
          </section>

          {/* Creator Refunds */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">For Creators</h2>
            <p className="text-muted-foreground">
              If a refund is issued for one of your products, the corresponding amount 
              will be deducted from your next payout. We encourage creators to ensure 
              accurate product descriptions and provide quality files to minimize refund 
              requests.
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
                refund request, please contact our support team.
              </p>
              <Button variant="outline">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
