import { useState, useEffect } from "react";
import { Search, Save, Globe, Check, X, Edit2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CountryEligibility {
  country_code: string;
  country_name: string;
  connect_eligible: boolean;
  notes: string | null;
  updated_at: string;
}

export default function CountryEligibilityEditor() {
  const [countries, setCountries] = useState<CountryEligibility[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingCountry, setEditingCountry] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      const { data, error } = await supabase
        .from("country_eligibility")
        .select("*")
        .order("country_name", { ascending: true });

      if (error) throw error;
      setCountries(data || []);
    } catch (error) {
      console.error("Error fetching countries:", error);
      toast.error("Failed to load country eligibility data");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEligibility = async (countryCode: string, currentValue: boolean) => {
    setSaving(countryCode);
    try {
      const { error } = await supabase
        .from("country_eligibility")
        .update({
          connect_eligible: !currentValue,
          updated_at: new Date().toISOString(),
        })
        .eq("country_code", countryCode);

      if (error) throw error;

      setCountries(prev =>
        prev.map(c =>
          c.country_code === countryCode
            ? { ...c, connect_eligible: !currentValue, updated_at: new Date().toISOString() }
            : c
        )
      );

      toast.success(`${countryCode} is now ${!currentValue ? "Stripe Connect eligible" : "MoR only"}`);
    } catch (error) {
      console.error("Error updating eligibility:", error);
      toast.error("Failed to update country eligibility");
    } finally {
      setSaving(null);
    }
  };

  const handleSaveNotes = async (countryCode: string) => {
    setSaving(countryCode);
    try {
      const { error } = await supabase
        .from("country_eligibility")
        .update({
          notes: editNotes,
          updated_at: new Date().toISOString(),
        })
        .eq("country_code", countryCode);

      if (error) throw error;

      setCountries(prev =>
        prev.map(c =>
          c.country_code === countryCode
            ? { ...c, notes: editNotes, updated_at: new Date().toISOString() }
            : c
        )
      );

      setEditingCountry(null);
      toast.success("Notes saved");
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes");
    } finally {
      setSaving(null);
    }
  };

  const filteredCountries = countries.filter(
    c =>
      c.country_name.toLowerCase().includes(search.toLowerCase()) ||
      c.country_code.toLowerCase().includes(search.toLowerCase())
  );

  const connectCount = countries.filter(c => c.connect_eligible).length;
  const morCount = countries.filter(c => !c.connect_eligible).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Globe className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{countries.length}</p>
                <p className="text-sm text-muted-foreground">Total Countries</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Check className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{connectCount}</p>
                <p className="text-sm text-muted-foreground">Stripe Connect</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <X className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{morCount}</p>
                <p className="text-sm text-muted-foreground">MoR Only</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Country Eligibility</CardTitle>
          <CardDescription>
            Manage which countries can use Stripe Connect vs Platform MoR (Merchant of Record) mode.
            Toggle eligibility to change how sellers in each country receive payouts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search countries..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Code</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead className="w-40">Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCountries.map(country => (
                  <TableRow key={country.country_code}>
                    <TableCell className="font-mono text-sm">
                      {country.country_code}
                    </TableCell>
                    <TableCell className="font-medium">{country.country_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={country.connect_eligible}
                          onCheckedChange={() =>
                            handleToggleEligibility(country.country_code, country.connect_eligible)
                          }
                          disabled={saving === country.country_code}
                        />
                        <Badge
                          variant={country.connect_eligible ? "default" : "secondary"}
                          className={
                            country.connect_eligible
                              ? "bg-green-500/10 text-green-500 border-green-500/20"
                              : "bg-orange-500/10 text-orange-500 border-orange-500/20"
                          }
                        >
                          {country.connect_eligible ? "Connect" : "MoR"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {editingCountry === country.country_code ? (
                        <div className="flex items-center gap-2">
                          <Textarea
                            value={editNotes}
                            onChange={e => setEditNotes(e.target.value)}
                            className="min-h-[60px] text-sm"
                            placeholder="Add notes..."
                          />
                          <div className="flex flex-col gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleSaveNotes(country.country_code)}
                              disabled={saving === country.country_code}
                            >
                              {saving === country.country_code ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setEditingCountry(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {country.notes || "—"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingCountry !== country.country_code && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingCountry(country.country_code);
                            setEditNotes(country.notes || "");
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
