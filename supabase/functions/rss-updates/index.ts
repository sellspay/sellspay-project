import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/atom+xml; charset=utf-8',
};

interface PlatformUpdate {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  updated_at: string;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(dateString: string): string {
  return new Date(dateString).toISOString();
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the latest updates
    const { data: updates, error } = await supabase
      .from('platform_updates')
      .select('id, title, content, category, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching updates:', error);
      throw error;
    }

    // Get the most recent update date for the feed
    const lastUpdated = updates && updates.length > 0 
      ? formatDate(updates[0].updated_at || updates[0].created_at)
      : new Date().toISOString();

    // Base URL for the site
    const siteUrl = 'https://sellspay.com';
    const feedUrl = `${supabaseUrl}/functions/v1/rss-updates`;

    // Generate Atom feed
    const entries = (updates || []).map((update: PlatformUpdate) => `
    <entry>
      <title>${escapeXml(update.title)}</title>
      <link href="${siteUrl}/community/updates#update-${update.id}" rel="alternate" type="text/html"/>
      <id>urn:uuid:${update.id}</id>
      <published>${formatDate(update.created_at)}</published>
      <updated>${formatDate(update.updated_at || update.created_at)}</updated>
      <category term="${escapeXml(update.category)}"/>
      <summary type="text">${escapeXml(update.content.slice(0, 200))}${update.content.length > 200 ? '...' : ''}</summary>
      <content type="html"><![CDATA[<p>${update.content.replace(/\n/g, '<br/>')}</p><p><strong>Category:</strong> ${update.category}</p>]]></content>
      <author>
        <name>SellsPay</name>
      </author>
    </entry>`).join('');

    const atomFeed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>SellsPay Platform Updates</title>
  <subtitle>Official announcements and updates from SellsPay</subtitle>
  <link href="${siteUrl}/community/updates" rel="alternate" type="text/html"/>
  <link href="${feedUrl}" rel="self" type="application/atom+xml"/>
  <id>urn:uuid:sellspay-platform-updates</id>
  <updated>${lastUpdated}</updated>
  <author>
    <name>SellsPay</name>
    <uri>${siteUrl}</uri>
  </author>
  <rights>© ${new Date().getFullYear()} SellsPay. All rights reserved.</rights>
  <icon>${siteUrl}/favicon.ico</icon>
  <logo>${siteUrl}/logo.png</logo>
  ${entries}
</feed>`;

    return new Response(atomFeed, {
      headers: corsHeaders,
      status: 200,
    });
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate RSS feed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
