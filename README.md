# Wild Woodwork Portfolio

A beautiful, minimal portfolio website for Wild Woodwork's handcrafted wooden products.

## Tech Stack

- **Astro** - Fast, SEO-friendly static site generator
- **Decap CMS** - Git-based content management (no database needed!)
- **CloudFlare Pages** - Free, fast hosting with automatic deployments

## Features

- 📸 Product gallery with featured items
- ✏️ Easy content management for non-technical users
- 📱 Fully responsive design
- 🔒 Secure (no database, no attack vectors)
- ⚡ Lightning fast (static site)
- 💰 Ready for future Stripe integration

## Local Development

### First Time Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the dev server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:4321](http://localhost:4321) in your browser

### Using the CMS Locally

1. Install Decap CMS local backend:
   ```bash
   npx decap-server
   ```

2. In another terminal, start Astro:
   ```bash
   npm run dev
   ```

3. Access the CMS at [http://localhost:4321/admin](http://localhost:4321/admin)

## Deploying to CloudFlare Pages

### Step 1: Push to GitHub

1. Initialize git repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Wild Woodwork portfolio"
   ```

2. Create a new GitHub repository at [github.com/new](https://github.com/new)

3. Push your code:
   ```bash
   git remote add origin https://github.com/YOUR-USERNAME/wild-woodwork.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy to CloudFlare Pages

1. Go to [CloudFlare Pages](https://pages.cloudflare.com/)
2. Click "Create a project" > "Connect to Git"
3. Select your `wild-woodwork` repository
4. Configure build settings:
   - **Framework preset**: Astro
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Click "Save and Deploy"

Your site will be live in ~1 minute! CloudFlare will automatically redeploy whenever you push to GitHub.

### Step 3: Set Up the CMS for Production

1. Enable Netlify Identity (free auth service that works with CloudFlare):
   - Go to [Netlify](https://app.netlify.com/)
   - Create a new site (can be a placeholder)
   - Enable Identity in Site Settings
   - Enable Git Gateway

2. Update `public/admin/config.yml` - remove `local_backend: true` line

3. Add Identity widget to your site (already configured in the admin HTML)

4. Invite your brother as a user through Netlify Identity

### Managing Content (For Your Brother)

1. Go to `https://your-site.pages.dev/admin`
2. Log in with email (set up via Netlify Identity)
3. Add/Edit products:
   - Click "Products" > "New Product"
   - Fill in details (title, description, price, etc.)
   - Upload images
   - Click "Publish"
4. Changes will automatically trigger a rebuild (takes ~1 min)

## Project Structure

```
wild-woodwork/
├── public/
│   ├── admin/           # Decap CMS admin interface
│   │   ├── index.html
│   │   └── config.yml
│   └── images/          # Product images
│       └── products/
├── src/
│   ├── content/
│   │   ├── config.ts    # Content collection schemas
│   │   ├── products/    # Product markdown files
│   │   └── settings/    # Site settings
│   ├── layouts/
│   │   └── Layout.astro # Base layout component
│   └── pages/
│       └── index.astro  # Homepage
├── astro.config.mjs     # Astro configuration
└── package.json
```

## Commands

| Command | Action |
| :------------------------ | :----------------------------------------------- |
| `npm install` | Installs dependencies |
| `npm run dev` | Starts local dev server at `localhost:4321` |
| `npm run build` | Build your production site to `./dist/` |
| `npm run preview` | Preview your build locally, before deploying |
| `npx decap-server` | Run local CMS backend for testing |

## Adding New Features

### Future: Stripe Integration

When you're ready to add payments:

1. Install Stripe:
   ```bash
   npm install stripe @stripe/stripe-js
   ```

2. Add Stripe fields to product schema
3. Create checkout page
4. Add Stripe webhook handling

## Troubleshooting

**CMS not loading locally?**
- Make sure `npx decap-server` is running
- Check that you're accessing `http://localhost:4321/admin` (not https)

**Images not showing?**
- Images should be in `public/images/products/`
- Image paths in products should be `/images/products/filename.jpg`

**Build failing?**
- Run `npm run build` locally to see errors
- Check that all product markdown files have valid frontmatter

## Support

For questions or issues, check:
- [Astro Docs](https://docs.astro.build)
- [Decap CMS Docs](https://decapcms.org/docs)
- [CloudFlare Pages Docs](https://developers.cloudflare.com/pages)
