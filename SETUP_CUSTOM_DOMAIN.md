# Setting Up Custom Local Domain

To use `ai-comparison.local` instead of `localhost:3000` in your URL bar:

## Step 1: Add Hosts File Entry

Run this command in your terminal (you'll be prompted for your password):

```bash
sudo sh -c 'echo "127.0.0.1    ai-comparison.local" >> /etc/hosts'
```

Or manually edit the file:
1. Run: `sudo nano /etc/hosts`
2. Add this line at the end:
   ```
   127.0.0.1    ai-comparison.local
   ```
3. Save (Ctrl+O, Enter, Ctrl+X)

## Step 2: Run Dev Server with Custom Hostname

```bash
npm run dev:custom
```

## Step 3: Access Your Site

Open your browser and go to: `http://ai-comparison.local:3000`

The URL bar will now show `ai-comparison.local:3000` instead of `localhost:3000`.

## Alternative: Use a Different Port

If you want to use port 80 (so you can access it as just `ai-comparison.local`):

1. Run: `sudo npm run dev:custom -- -p 80`
2. Access: `http://ai-comparison.local`

Note: Using port 80 requires admin privileges.

