import { AlertTriangle, Ban, Shield, XCircle, Package, FileWarning, Link2Off } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const restrictedContent = [
  {
    icon: FileWarning,
    title: 'Intellectual Property Infringement',
    description: 'No pirated software, "cracked" games, stolen eBooks, or courses you did not create.',
  },
  {
    icon: Ban,
    title: 'Adult Content',
    description: 'No pornographic imagery, videos, or sexually explicit services.',
  },
  {
    icon: XCircle,
    title: 'Illegal/Harmful Data',
    description: 'No malware, hacking tools, or databases containing private personal information (doxing).',
  },
  {
    icon: AlertTriangle,
    title: 'Financial/Medical Scams',
    description: 'No "Get Rich Quick" schemes, predatory investment advice, or unregulated medical/health advice.',
  },
  {
    icon: Link2Off,
    title: 'Deceptive Services',
    description: 'No "Follower" or "Like" selling services for social media.',
  },
];

export default function ProhibitedItems() {
  return (
    <div className="min-h-screen bg-background py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-destructive" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">Prohibited Items & Usage Policy</h1>
        </div>
        <p className="text-lg text-muted-foreground mb-8">
          Last updated: February 7, 2026
        </p>

        <div className="space-y-8">
          {/* Intro */}
          <section className="space-y-4">
            <p className="text-muted-foreground">
              To maintain our status as a secure digital marketplace, the following items are strictly 
              prohibited. <strong className="text-foreground">SellsPay is a 100% Digital-Only platform.</strong>
            </p>
          </section>

          {/* Physical Goods Ban */}
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-destructive">
                <Package className="w-6 h-6" />
                #1. THE PHYSICAL GOODS BAN (ZERO TOLERANCE)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-foreground">NO Physical Products:</strong>
                    <p className="text-muted-foreground">
                      You may not sell any item that requires physical shipping (e.g., clothing, 
                      electronics, books, jewelry, handmade goods).
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-foreground">NO Drop-shipping:</strong>
                    <p className="text-muted-foreground">
                      You may not use SellsPay to facilitate the sale of physical items held by third parties.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-destructive shrink-0" />
                  <div>
                    <strong className="text-destructive font-semibold">CONSEQUENCE:</strong>
                    <p className="text-muted-foreground mt-1">
                      Any account found listing a physical product will be{' '}
                      <strong className="text-foreground">permanently banned immediately</strong>. 
                      All pending payouts will be frozen to cover potential chargebacks, and there is{' '}
                      <strong className="text-foreground">no reconsideration process</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Restricted Digital Content */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <Ban className="w-6 h-6 text-amber-500" />
              #2. RESTRICTED DIGITAL CONTENT
            </h2>
            
            <div className="grid gap-4">
              {restrictedContent.map((item) => (
                <Card key={item.title} className="bg-card/50 border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                        <item.icon className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{item.title}</h3>
                        <p className="text-muted-foreground text-sm">{item.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Enforcement */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Enforcement</h2>
            <p className="text-muted-foreground">
              Violation of these policies will result in immediate action, including but not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Immediate suspension of your seller account</li>
              <li>Freezing of all pending payouts</li>
              <li>Permanent ban from the platform with no appeal process (for physical goods violations)</li>
              <li>Forfeiture of funds to cover chargebacks and platform damages</li>
              <li>Potential legal action for severe violations</li>
            </ul>
          </section>

          {/* Why We're Strict */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Why We're This Strict
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                As the <strong className="text-foreground">Merchant of Record</strong>, SellsPay is 
                responsible for all transactions on the platform. When sellers violate these policies:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong className="text-foreground">Payment processors</strong> may freeze or terminate our account
                </li>
                <li>
                  <strong className="text-foreground">Chargebacks</strong> from "Item Not Received" disputes 
                  (common with physical goods) damage our payment processing reputation
                </li>
                <li>
                  <strong className="text-foreground">Legal liability</strong> falls on SellsPay for illegal content
                </li>
              </ul>
              <p>
                These strict policies protect both the platform and legitimate sellers who follow the rules.
              </p>
            </CardContent>
          </Card>

          {/* Report Violation */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Report a Violation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                If you see a product that violates these policies, please report it immediately to{' '}
                <span className="text-foreground font-medium">abuse@sellspay.com</span>.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="mailto:abuse@sellspay.com">
                  <Button variant="outline">Report Violation</Button>
                </a>
                <Link to="/terms">
                  <Button variant="ghost">View Terms of Service</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
