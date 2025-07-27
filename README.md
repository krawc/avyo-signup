# Welcome to the AVYO In-Gathering project

## How can I edit this code?

There are several ways of editing your application.

**Use your preferred IDE**

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

### 🚀 Deployment on Netlify

To deploy the `avyo-signup` React app on Netlify:

#### 1. **Push to GitHub**

Make sure the latest code is pushed to a GitHub repository.

#### 2. **Connect to Netlify**

1. Log in to [Netlify](https://www.netlify.com/)
2. Click **"Add new site"** → **"Import an existing project"**
3. Select your GitHub repository

#### 3. **Set Build Configuration**

In the Netlify dashboard, use the following settings:

```
Base directory: /
Package directory: (leave empty)
Build command: bun run build
Publish directory: dist
```

#### 4. **Deploy**

Click **Deploy Site**. Netlify will install dependencies using Bun, build the project, and publish from the `dist` directory.

#### 5. **Environment Variables (optional)**

If your app depends on environment variables, set them in:
**Site Settings → Environment Variables**

#### 6. **Custom Domain & HTTPS (optional)**

After deployment:
- Set up a custom domain under **Domain Settings**
- Enable HTTPS using Let's Encrypt
