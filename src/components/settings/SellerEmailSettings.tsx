import { Mail, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SellerEmailSettingsProps {
  userId: string;
  isSeller: boolean;
}

export function SellerEmailSettings({ userId, isSeller }: SellerEmailSettingsProps) {
  return (
    <Card className="bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Custom Email
          <Badge variant="secondary" className="bg-muted text-muted-foreground ml-2">
            Coming Soon
          </Badge>
        </CardTitle>
        <CardDescription>
          Send emails to your customers from your own email address.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-6 rounded-lg border border-border bg-muted/30 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Clock className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium mb-2">Custom Email Integration</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            We're working on allowing sellers to send emails from their own domain. 
            This feature will be available soon.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
