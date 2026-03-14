const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain } = await req.json();

    if (!domain) {
      return new Response(
        JSON.stringify({ success: false, error: 'Domain is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract base domain (remove subdomains for RDAP lookup)
    const parts = domain.split('.');
    const baseDomain = parts.length > 2 ? parts.slice(-2).join('.') : domain;

    console.log('Looking up domain:', baseDomain);

    const response = await fetch(`https://rdap.org/domain/${baseDomain}`, {
      headers: { 'Accept': 'application/rdap+json' },
    });

    if (!response.ok) {
      console.error('RDAP lookup failed:', response.status);
      return new Response(
        JSON.stringify({ success: false, error: `RDAP lookup failed (${response.status})` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    // Extract registration date from RDAP events
    let registrationDate: string | null = null;
    let expirationDate: string | null = null;
    let lastChanged: string | null = null;

    if (data.events && Array.isArray(data.events)) {
      for (const event of data.events) {
        if (event.eventAction === 'registration') {
          registrationDate = event.eventDate;
        } else if (event.eventAction === 'expiration') {
          expirationDate = event.eventDate;
        } else if (event.eventAction === 'last changed') {
          lastChanged = event.eventDate;
        }
      }
    }

    // Calculate domain age
    let domainAge: string | null = null;
    if (registrationDate) {
      const regDate = new Date(registrationDate);
      const now = new Date();
      const diffMs = now.getTime() - regDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays < 1) domainAge = 'Less than a day';
      else if (diffDays < 30) domainAge = `${diffDays} days`;
      else if (diffDays < 365) domainAge = `${Math.floor(diffDays / 30)} months`;
      else {
        const years = Math.floor(diffDays / 365);
        const months = Math.floor((diffDays % 365) / 30);
        domainAge = months > 0 ? `${years} years, ${months} months` : `${years} years`;
      }
    }

    // Extract nameservers
    const nameservers = data.nameservers?.map((ns: any) => ns.ldhName) || [];

    // Extract registrar
    let registrar: string | null = null;
    if (data.entities && Array.isArray(data.entities)) {
      for (const entity of data.entities) {
        if (entity.roles?.includes('registrar')) {
          registrar = entity.vcardArray?.[1]?.find((v: any) => v[0] === 'fn')?.[3] || entity.handle || null;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          domain: baseDomain,
          registrationDate,
          expirationDate,
          lastChanged,
          domainAge,
          nameservers,
          registrar,
          status: data.status || [],
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in domain lookup:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
