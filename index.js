// Railway-optimized WhatsApp Bot with Enhancements
const express = require('express');
const rateLimit = require('express-rate-limit');
const app = express();

// Configuration - hardcoded as requested
const PHONE_ID = '733754553150508';
const VERIFY_TOKEN = 'my_secret_token_123';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN; // Still need this from environment for security

// Railway sets the PORT automatically - we just need to use it
const port = process.env.PORT || 8080;

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);
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
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ Webhook verified successfully!');
        res.status(200).send(challenge);
    } else {
        console.log('❌ Webhook verification failed');
        console.log(`Expected token: ${VERIFY_TOKEN}`);
        console.log('Received token:', token);
        res.status(403).send('Verification failed');
    }
});

// Function to send WhatsApp message
async function sendWhatsAppMessage(to, message) {
    if (!WHATSAPP_TOKEN) {
        console.error('❌ WHATSAPP_TOKEN not set in environment variables');
        return false;
    }

    const url = `https://graph.facebook.com/v18.0/${PHONE_ID}/messages`;
    
    const data = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: {
            body: message
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            console.log('✅ Message sent successfully');
            return true;
        } else {
            const error = await response.text();
            console.error('❌ Failed to send message:', error);
            return false;
        }
    } catch (error) {
        console.error('❌ Error sending message:', error);
        return false;
    }
}

// Function to process incoming messages
function processMessage(message) {
    console.log('📱 Processing message:', message);
    
    const messageText = message.text?.body?.toLowerCase() || '';
    const from = message.from;
    
    // Simple bot responses
    let response = '';
    
    if (messageText.includes('hello') || messageText.includes('hi')) {
        response = 'Hello! 👋 How can I help you today?';
    } else if (messageText.includes('help')) {
        response = 'I can help you with:\n• General questions\n• Information about our services\n• Support requests\n\nJust send me a message!';
    } else if (messageText.includes('time')) {
        response = `The current time is: ${new Date().toLocaleString()}`;
    } else if (messageText.includes('weather')) {
        response = 'I wish I could check the weather for you, but I need to be connected to a weather service first! 🌤️';
    } else {
        response = 'Thanks for your message! I\'m a simple bot, but I\'m here to help. Type "help" to see what I can do.';
    }
    
    // Send response
    sendWhatsAppMessage(from, response);
}

// Handle incoming WhatsApp messages
app.post('/webhook', (req, res) => {
    console.log('📱 Received webhook POST request');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    try {
        const body = req.body;
        
        if (body.object === 'whatsapp_business_account') {
            body.entry?.forEach(entry => {
                entry.changes?.forEach(change => {
                    if (change.field === 'messages') {
                        const value = change.value;
                        
                        // Process messages
                        if (value.messages) {
                            value.messages.forEach(message => {
                                console.log('📥 Incoming message:', message);
                                processMessage(message);
                            });
                        }
                        
                        // Handle message status updates
                        if (value.statuses) {
                            value.statuses.forEach(status => {
                                console.log('📊 Message status:', status);
                            });
                        }
                    }
                });
            });
        }
        
        res.status(200).send('OK');
    } catch (error) {
        console.error('❌ Error processing webhook:', error);
        res.status(500).send('Internal Server Error');
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
                body { 
                    font-family: Arial, sans-serif; 
                    padding: 20px; 
                    background: #f5f5f5;
                    max-width: 800px;
                    margin: 0 auto;
                }
                .container { 
                    background: white; 
                    padding: 20px; 
                    border-radius: 10px; 
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .status { color: green; font-weight: bold; }
                .url { 
                    background: #f0f0f0; 
                    padding: 10px; 
                    border-radius: 5px; 
                    margin: 10px 0;
                    font-family: monospace;
                }
                .config { 
                    background: #e8f4f8; 
                    padding: 15px; 
                    border-radius: 5px;
                    margin: 15px 0;
                }
                .warning {
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    padding: 10px;
                    border-radius: 5px;
                    margin: 15px 0;
                }
                a { color: #007bff; text-decoration: none; }
                a:hover { text-decoration: underline; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🤖 WhatsApp Bot is Running!</h1>
                <p class="status">✅ Server is online and ready</p>
                
                <div class="config">
                    <h3>📋 Configuration</h3>
                    <p><strong>Phone ID:</strong> ${PHONE_ID}</p>
                    <p><strong>Verify Token:</strong> ${VERIFY_TOKEN}</p>
                    <p><strong>WhatsApp Token:</strong> ${WHATSAPP_TOKEN ? '✅ Set' : '❌ Not set'}</p>
                </div>
                
                ${!WHATSAPP_TOKEN ? `
                <div class="warning">
                    <strong>⚠️ Warning:</strong> WHATSAPP_TOKEN environment variable is not set. 
                    The bot can receive messages but cannot send responses.
                </div>
                ` : ''}
                
                <p><strong>Webhook URL:</strong></p>
                <div class="url">${req.protocol}://${req.get('host')}/webhook</div>
                
                <p><strong>Test webhook manually:</strong></p>
                <div class="url">
                    <a href="/webhook?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=test123">
                        Click here to test webhook verification
                    </a>
                </div>
                
                <h3>🤖 Bot Features</h3>
                <ul>
                    <li>Responds to greetings (hello, hi)</li>
                    <li>Provides help information</li>
                    <li>Shows current time</li>
                    <li>Basic weather query handling</li>
                    <li>Rate limiting protection</li>
                    <li>Error handling and logging</li>
                </ul>
                
                <p><strong>Server Info:</strong></p>
                <ul>
                    <li>Port: ${port}</li>
                    <li>Host: ${req.get('host')}</li>
                    <li>Time: ${new Date().toISOString()}</li>
                    <li>Environment: ${process.env.NODE_ENV || 'development'}</li>
                </ul>
            </div>
        </body>
        </html>
    `);
});

// Health check endpoint (Railway sometimes uses this)
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        port: port,
        phoneId: PHONE_ID,
        hasWhatsAppToken: !!WHATSAPP_TOKEN
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('❌ Unhandled error:', error);
    res.status(500).json({
        error: 'Internal Server Error',
        message: 'Something went wrong on our end'
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
    console.log(`📱 Phone ID: ${PHONE_ID}`);
    console.log(`🔑 Verify Token: ${VERIFY_TOKEN}`);
    console.log(`🎯 WhatsApp Token: ${WHATSAPP_TOKEN ? 'Set ✅' : 'Not set ❌'}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('👋 Received SIGTERM, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('👋 Received SIGINT, shutting down gracefully');
    process.exit(0);
});

module.exports = app;
