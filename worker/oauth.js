/**
 * CloudFlare Worker for GitHub OAuth with Decap CMS
 * Handles OAuth flow between Decap CMS and GitHub
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
    if (url.pathname === '/auth') {
      const clientId = env.GITHUB_CLIENT_ID;
      const redirectUri = `${url.origin}/callback`;
      const scope = 'repo,user';

      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;

      return Response.redirect(githubAuthUrl, 302);
    }

    // OAuth callback - exchange code for token
    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');

      if (!code) {
        return new Response('No code provided', { status: 400 });
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

      // Return success page that sends token back to CMS
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
              function receiveMessage(e) {
                console.log("Received message:", e);
                window.opener.postMessage(
                  'authorization:github:success:${JSON.stringify({
                    token: tokenData.access_token,
                    provider: 'github'
                  })}',
                  e.origin
                );
                window.removeEventListener("message", receiveMessage, false);
              }
              window.addEventListener("message", receiveMessage, false);

              console.log("Posting message:", ${JSON.stringify(tokenData)});
              window.opener.postMessage(
                'authorization:github:success:${JSON.stringify({
                  token: tokenData.access_token,
                  provider: 'github'
                })}',
                window.location.origin
              );

              setTimeout(function() {
                window.close();
              }, 1000);
            })();
          </script>
        </body>
        </html>
      `;

      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return new Response('Not Found', { status: 404 });
  },
};
