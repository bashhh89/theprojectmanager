# Troubleshooting Guide

This document provides solutions for common issues you might encounter with the Chat Application.

## Common Issues

### Application Won't Start

**Symptoms:**
- Error messages when running `npm run dev`
- Blank screen or application crashes immediately

**Solutions:**
1. **Port in use:**
   - If you see `Port 3000 is in use`, the app will try alternative ports automatically
   - You can explicitly specify a port with `npm run dev -- -p 3002`

2. **Missing dependencies:**
   - Run `npm install` to ensure all dependencies are installed
   - Check that your Node.js version is 18.0.0 or higher

3. **Environment variables:**
   - Verify that you have a proper `.env.local` file with required API keys
   - Make sure there are no syntax errors in your `.env.local` file

### API Connection Issues

**Symptoms:**
- "Error connecting to API" messages
- Models not loading
- Timeouts when sending messages

**Solutions:**
1. **API keys:**
   - Check that your API keys are correctly set in `.env.local`
   - Verify that the API keys are not expired or rate-limited

2. **Network issues:**
   - Ensure your internet connection is stable
   - Check if a proxy or firewall is blocking API connections

3. **Provider status:**
   - Check the status page of the relevant AI provider
   - Temporarily switch to a different model provider

### Linter Errors

**Symptoms:**
- Errors about duplicate variable declarations
- Syntax errors in components
- Type errors

**Solutions:**
1. **handleKeyDown redeclaration:**
   - In `src/components/chat/chat-input.tsx`, there are duplicate declarations of `handleKeyDown`
   - Look for multiple instances of `const handleKeyDown = ...` and remove duplicates
   - Ensure you're only modifying existing functions rather than redefining them

2. **chat-interface.tsx syntax errors:**
   - There may be syntax errors in the JSX template
   - Check for missing or mismatched closing tags
   - Ensure proper nesting of components

3. **Type errors:**
   - Make sure the types defined in interfaces match the actual data structures
   - Add proper type annotations where needed

### Hydration Errors

**Symptoms:**
- Console warnings about hydration mismatch
- UI elements behaving incorrectly on first load
- Components appearing differently on server vs client

**Solutions:**
1. **useLayoutEffect warnings:**
   - Replace `useLayoutEffect` with `useEffect` for server-rendered components
   - Add client-side detection: `useEffect(() => { /* client-only code */ }, [])`

2. **Theme/dark mode issues:**
   - Use dynamic imports with `next/dynamic` for components that depend on browser APIs
   - Implement `useIsomorphicLayoutEffect` for effects that need to run on both client and server

3. **Initial state mismatch:**
   - Use `useEffect` with an empty dependency array to set initial state only on client
   - For dark mode specifically, set initial theme state using a `useEffect` hook

### Performance Issues

**Symptoms:**
- Slow response times
- Lag when typing or scrolling
- High memory usage

**Solutions:**
1. **Message list optimization:**
   - Implement virtualization for long message lists
   - Use `React.memo` for message components
   - Limit number of messages loaded at once

2. **Large model responses:**
   - Consider using smaller models for faster responses
   - Implement proper message streaming instead of waiting for complete responses
   - Add a timeout mechanism for very long responses

3. **Memory leaks:**
   - Clean up event listeners and subscriptions in useEffect
   - Implement proper cancellation of API requests when components unmount

## Specific Error Messages

### "Module parse failed: Identifier 'handleKeyDown' has already been declared"

This occurs when there are multiple declarations of the same function in `chat-input.tsx`.

**Solution:**
1. Open `src/components/chat/chat-input.tsx`
2. Search for all occurrences of `const handleKeyDown =`
3. Keep only one declaration and merge functionality if needed
4. If adding new functionality, modify the existing function instead of creating a new one

### "Unexpected token 'div'. Expected jsx identifier"

This syntax error in `chat-interface.tsx` indicates a problem with JSX structure.

**Solution:**
1. Open `src/components/chat/chat-interface.tsx`
2. Check for mismatched opening/closing tags
3. Ensure all JSX elements are properly nested
4. Look for missing parentheses or brackets in the return statement

### "Error: ENOENT: no such file or directory, open 'route.js'"

This indicates a problem with the API route files.

**Solution:**
1. Ensure the API route directory structure is correct
2. Verify that all route files have the proper exports
3. Restart the development server with `npm run dev`
4. If necessary, run `rm -rf .next` to clear the build cache and then restart

## Still Having Issues?

If you're still encountering problems after trying these solutions:

1. Check the browser console (F12) for detailed error messages
2. Look at the terminal where you're running `npm run dev` for server-side errors
3. Try running in production mode with `npm run build && npm start` to see if issues persist
4. Consult the Next.js documentation for specific framework issues
5. Search for similar issues in the project repository 