/**
 * CloudFlare Worker for Decap CMS GitHub OAuth
 * Implements proper Decap OAuth protocol with state/origin handling
 * Based on: https://github.com/i40west/netlify-cms-oauth-provider-go
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // OAuth initiation - redirect to GitHub
    // Decap passes: ?provider=github&origin=<cms-origin>&state=<random>
    if (url.pathname === '/auth') {
      const provider = url.searchParams.get('provider') || 'github';
      const origin = url.searchParams.get('origin');

      if (provider !== 'github') {
        return new Response('Only GitHub provider is supported', { status: 400 });
      }

      // Generate state that includes origin for roundtrip
      const state = JSON.stringify({
        origin: origin,
        csrf: crypto.randomUUID(),
      });
      const stateParam = btoa(state);

      const clientId = env.GITHUB_CLIENT_ID;
      const redirectUri = `${url.origin}/callback`;
      const scope = 'repo,user';

      const githubAuthUrl = `https://github.com/login/oauth/authorize?` +
        `client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${scope}` +
        `&state=${stateParam}`;

      return Response.redirect(githubAuthUrl, 302);
    }

    // OAuth callback - exchange code for token
    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      const stateParam = url.searchParams.get('state');

      if (!code) {
        return new Response('No code provided', { status: 400 });
      }

      // Decode state to get origin
      let origin = '*';
      try {
        const state = JSON.parse(atob(stateParam));
        origin = state.origin || '*';
      } catch (e) {
        console.error('Failed to parse state:', e);
      }

      // Exchange code for access token
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code: code,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        return new Response(`GitHub OAuth error: ${tokenData.error_description}`, { status: 400 });
      }

      // Return success page that posts message to the correct origin
      const token = tokenData.access_token;
      const escapedToken = token.replace(/'/g, "\\'");
      const escapedOrigin = origin.replace(/'/g, "\\'");

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authorization Successful</title>
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
            h1 { color: #2ea44f; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✓ Authorization Successful</h1>
            <p>Redirecting back to CMS...</p>
          </div>
          <script>
            (function() {
              function postAuthMessage() {
                var message = 'authorization:github:success:' + JSON.stringify({
                  token: '${escapedToken}',
                  provider: 'github'
                });

                console.log('Posting message to origin:', '${escapedOrigin}');
                console.log('Message:', message);

                if (window.opener) {
                  window.opener.postMessage(message, '${escapedOrigin}');
                  setTimeout(function() {
                    window.close();
                  }, 1000);
                } else {
                  console.error('No window.opener available');
                  document.body.innerHTML = '<div class="container"><h1>⚠️ Error</h1><p>Unable to communicate with CMS. Please close this window.</p></div>';
                }
              }

              postAuthMessage();
            })();
          </script>
        </body>
        </html>
      `;

      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache',
        },
      });
    }

    return new Response('Decap CMS OAuth Provider\n\nEndpoints:\n- /auth?provider=github&origin=<origin>\n- /callback', {
      headers: { 'Content-Type': 'text/plain' },
    });
  },
};
