# NextChat Setup Guide

NextChat is an advanced chat interface that supports multiple AI models, including OpenAI GPT, Google Gemini, Claude, and more. This guide will show you how to set it up with Pollinations API.

## Setup Steps

1. **Clone the NextChat Repository**
   ```
   git clone https://github.com/Yidadaa/ChatGPT-Next-Web.git nextchat
   cd nextchat
   ```

2. **Create Configuration File**
   Create a file named `.env.local` in the nextchat directory with the following content:
   ```
   # NextChat Environment Configuration

   # Basic settings
   NEXT_PUBLIC_SITE_URL=http://localhost:3002

   # API access - Use Pollinations direct access
   NEXT_PUBLIC_POLLINATIONS_ENABLED=true
   NEXT_PUBLIC_POLLINATIONS_API_URL=https://text.pollinations.ai/openai

   # Optional OpenAI - we're using Pollinations instead
   OPENAI_API_KEY=pollinations-no-key-needed
   CODE=qandu

   # No Google, Azure, Anthropic keys needed with Pollinations

   # Disable access control
   # NEXT_PUBLIC_ACCESS_CONTROL=false
   ```

3. **Install Dependencies**
   ```
   npm install
   ```

4. **Start NextChat**
   ```
   npm run dev -- --port 3002
   ```

5. **Access NextChat**
   You can access NextChat from your QanDu application through the sidebar navigation link.

## How It Works

- NextChat is configured to use the Pollinations API directly
- The QanDu application proxy routes the NextChat requests through `/nextchat-app/`
- You can use both chat systems side by side without conflicts

## Features

- **Multiple Model Support**: Access various AI models including Llama, Mistral, and others
- **Advanced Prompt Templates**: Create and save complex prompts
- **Plugins Support**: Use web search, calculators, and other tools
- **Vision Support**: Upload and analyze images with compatible models
- **Customizable Interface**: Adjust settings for your workflow

## Troubleshooting

If you encounter any issues:

1. Make sure NextChat is running on port 3002
2. Check that the environment variables are correctly set
3. Restart both NextChat and QanDu applications 