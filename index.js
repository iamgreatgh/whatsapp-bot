// Railway-optimized WhatsApp Bot
const express = require('express');
const app = express();

// Railway sets the PORT automatically - we just need to use it
const port = process.env.PORT || 8080;

app.use(express.json());

// Add this to help with Railway's health checks
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Webhook verification for Facebook
app.get('/webhook', (req, res) => {
    console.log('🔍 Webhook verification request received!');
    console.log('Full URL:', req.url);
    console.log('Query params:', req.query);
    
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    console.log(`Mode: ${mode}`);
    console.log(`Token received: ${token}`);
    console.log(`Challenge: ${challenge}`);
    
    // Check if Facebook sent the right info
    if (mode === 'subscribe' && token === 'my_secret_token_123') {
        console.log('✅ Webhook verified successfully!');
        res.status(200).send(challenge);
    } else {
        console.log('❌ Webhook verification failed');
        console.log('Expected token: my_secret_token_123');
        console.log('Received token:', token);
        res.status(403).send('Verification failed');
    }
});

// Home page - this should work when you visit your Railway URL
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>WhatsApp Bot</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .status { color: green; }
                .url { background: #f0f0f0; padding: 10px; border-radius: 5px; }
            </style>
        </head>
        <body>
            <h1>🤖 WhatsApp Bot is Running!</h1>
            <p class="status">✅ Server is online and ready</p>
            <p><strong>Webhook URL:</strong></p>
            <div class="url">${req.protocol}://${req.get('host')}/webhook</div>
            <p><strong>Test webhook manually:</strong></p>
            <div class="url">
                <a href="/webhook?hub.mode=subscribe&hub.verify_token=my_secret_token_123&hub.challenge=test123">
                    Click here to test webhook
                </a>
            </div>
            <p><strong>Server Info:</strong></p>
            <ul>
                <li>Port: ${port}</li>
                <li>Host: ${req.get('host')}</li>
                <li>Time: ${new Date().toISOString()}</li>
            </ul>
        </body>
        </html>
    `);
});

// Handle incoming WhatsApp messages
app.post('/webhook', (req, res) => {
    console.log('📱 Received webhook POST request');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    // For now, just acknowledge receipt
    res.status(200).send('OK');
});

// Health check endpoint (Railway sometimes uses this)
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        port: port
    });
});

// Catch-all route for debugging
app.use('*', (req, res) => {
    console.log(`🔍 Unhandled request: ${req.method} ${req.originalUrl}`);
    res.status(404).send(`
        <h1>404 - Not Found</h1>
        <p>Path: ${req.originalUrl}</p>
        <p><a href="/">Go back to home</a></p>
    `);
});

// Start the server
app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`🌐 Server should be accessible at your Railway URL`);
    console.log(`📡 Webhook endpoint: /webhook`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('👋 Received SIGTERM, shutting down gracefully');
    process.exit(0);
});

module.exports = app;
