/**
 * Decap CMS OAuth Proxy for CloudFlare Workers
 * Based on: https://github.com/sterlingwes/decap-proxy
 */

const encoder = new TextEncoder();

async function sha256(message) {
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function renderBody(status, content) {
  const script = `
    <script>
      const receiveMessage = (message) => {
        window.opener.postMessage(
          'authorization:github:${status}:${JSON.stringify(content)}',
          message.origin
        );
        window.removeEventListener("message", receiveMessage, false);
      };
      window.addEventListener("message", receiveMessage, false);

      window.opener.postMessage("authorizing:github", "*");
    </script>
  `;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${status === 'success' ? 'Success' : 'Error'}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          background: #f5f5f5;
        }
        .container {
          text-align: center;
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        h1 { color: ${status === 'success' ? '#2ea44f' : '#d73a49'}; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>${status === 'success' ? '✓ Authorization Successful!' : '⚠️ Authorization Failed'}</h1>
        <p>${status === 'success' ? 'Closing window...' : content.message || 'An error occurred'}</p>
      </div>
      ${script}
    </body>
    </html>
  `;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS handling
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Auth endpoint - initiate OAuth flow
    if (url.pathname === '/auth') {
      const state = await sha256(crypto.randomUUID());
      const authUrl = new URL('https://github.com/login/oauth/authorize');

      authUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', `${url.origin}/callback`);
      authUrl.searchParams.set('scope', 'repo,user');
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('allow_signup', 'false');

      return Response.redirect(authUrl.toString(), 302);
    }

    // Callback endpoint - exchange code for token
    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');

      if (!code) {
        return new Response(
          renderBody('error', { message: 'No authorization code received' }),
          { headers: { 'Content-Type': 'text/html' }, status: 400 }
        );
      }

      try {
        // Exchange code for token
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            client_id: env.GITHUB_CLIENT_ID,
            client_secret: env.GITHUB_CLIENT_SECRET,
            code,
          }),
        });

        const data = await tokenResponse.json();

        if (data.error) {
          console.error('GitHub OAuth error:', data);
          return new Response(
            renderBody('error', { message: data.error_description || data.error }),
            { headers: { 'Content-Type': 'text/html' }, status: 400 }
          );
        }

        if (!data.access_token) {
          console.error('No access token in response:', data);
          return new Response(
            renderBody('error', { message: 'No access token received' }),
            { headers: { 'Content-Type': 'text/html' }, status: 400 }
          );
        }

        // Success - return token to CMS
        return new Response(
          renderBody('success', {
            token: data.access_token,
            provider: 'github',
          }),
          {
            headers: {
              'Content-Type': 'text/html',
              'Cache-Control': 'no-cache',
            },
          }
        );

      } catch (error) {
        console.error('OAuth callback error:', error);
        return new Response(
          renderBody('error', { message: 'Internal server error' }),
          { headers: { 'Content-Type': 'text/html' }, status: 500 }
        );
      }
    }

    return new Response('Decap CMS OAuth Provider for CloudFlare Workers', {
      headers: { 'Content-Type': 'text/plain' },
    });
  },
};
