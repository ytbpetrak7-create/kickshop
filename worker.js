export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { code, codeVerifier } = await request.json();

      const tokenRes = await fetch('https://id.kick.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: env.KICKCLIENTID,
          code: code,
          redirect_uri: env.REDIRECTURI,
          code_verifier: codeVerifier
        }).toString()
      });

      if (!tokenRes.ok) {
        const err = await tokenRes.text();
        return new Response(JSON.stringify({ error: 'Token exchange failed', details: err }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      const tokenData = await tokenRes.json();

      const userRes = await fetch('https://api.kick.com/public/v1/users', {
        headers: { 'Authorization': 'Bearer ' + tokenData.access_token }
      });

      if (!userRes.ok) {
        return new Response(JSON.stringify({ error: 'User fetch failed' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      const userData = await userRes.json();
      const username = userData.data?.username || userData.data?.name || null;

      return new Response(JSON.stringify({ username }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });

    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }
};
