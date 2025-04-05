@echo off
echo Cleaning Next.js cache and starting app...

echo Killing any running Next.js processes...
taskkill /F /IM node.exe >nul 2>&1

echo Removing .next directory...
rmdir /S /Q .next >nul 2>&1
mkdir .next

echo Starting Next.js app on port 5500...
npm run dev

echo Done. 