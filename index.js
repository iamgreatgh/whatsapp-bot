// This is your WhatsApp bot code!
// Don't worry about understanding everything - just follow along

const express = require('express');
const axios = require('axios');

// Create our web server
const app = express();
const port = process.env.PORT || 3000;

// These are your secret keys from Facebook
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'my_secret_token_123';

// This lets our server understand JSON messages
app.use(express.json());

// STEP 1: This is what Facebook calls to verify our bot is real
app.get('/webhook', (req, res) => {
    console.log('Facebook is trying to verify our webhook!');
    
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Check if Facebook sent the right password
    if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
        console.log('✅ Webhook verified successfully!');
        res.status(200).send(challenge);
    } else {
        console.log('❌ Webhook verification failed');
        res.status(403).send('Forbidden');
    }
});

// STEP 2: This receives messages from WhatsApp
app.post('/webhook', (req, res) => {
    console.log('📱 Received a message from WhatsApp!');
    
    const body = req.body;

    // Check if this is a WhatsApp message
    if (body.object === 'whatsapp_business_account') {
        // Look through all the messages we received
        body.entry.forEach(entry => {
            entry.changes.forEach(change => {
                if (change.field === 'messages') {
                    const messages = change.value.messages;
                    if (messages) {
                        messages.forEach(message => {
                            handleIncomingMessage(message);
                        });
                    }
                }
            });
        });
    }

    res.status(200).send('OK');
});

// STEP 3: This function decides how to reply to messages
async function handleIncomingMessage(message) {
    const from = message.from; // Who sent the message
    const messageText = message.text?.body || ''; // What they said
    
    console.log(`💬 Message from ${from}: "${messageText}"`);

    // Decide what to reply based on what they said
    let replyMessage = '';
    
    if (messageText.toLowerCase().includes('hello') || messageText.toLowerCase().includes('hi')) {
        replyMessage = '👋 Hello! Welcome to our business. How can I help you today?';
    } 
    else if (messageText.toLowerCase().includes('help')) {
        replyMessage = `🤖 I'm a bot that can help you with:
• Say "hello" to get started
• Say "hours" for business hours  
• Say "location" for our address
• Say "contact" to speak with a human`;
    }
    else if (messageText.toLowerCase().includes('hours')) {
        replyMessage = '🕐 Our business hours are:\nMonday-Friday: 9AM-6PM\nSaturday: 10AM-4PM\nSunday: Closed';
    }
    else if (messageText.toLowerCase().includes('location')) {
        replyMessage = '📍 We are located at:\n123 Business Street\nCity, State 12345';
    }
    else if (messageText.toLowerCase().includes('contact')) {
        replyMessage = '📞 To speak with a human, call us at (555) 123-4567 or email info@business.com';
    }
    else {
        replyMessage = '🤖 Thanks for your message! Type "help" to see what I can do, or someone will get back to you soon.';
    }

    // Send our reply back to WhatsApp
    await sendWhatsAppMessage(from, replyMessage);
}

// STEP 4: This function sends messages back to WhatsApp
async function sendWhatsAppMessage(to, message) {
    try {
        console.log(`📤 Sending reply to ${to}: "${message}"`);
        
        const response = await axios.post(
            `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: 'whatsapp',
                to: to,
                text: { body: message }
            },
            {
                headers: {
                    'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Message sent successfully!');
    } catch (error) {
        console.error('❌ Error sending message:', error.response?.data || error.message);
    }
}

// STEP 5: A simple webpage to test if our bot is working
app.get('/', (req, res) => {
    res.send(`
        <h1>🤖 WhatsApp Bot is Running!</h1>
        <p>Your bot is working and ready to receive messages.</p>
        <p>Webhook URL: <code>${req.protocol}://${req.get('host')}/webhook</code></p>
    `);
});

// STEP 6: Start our server
app.listen(port, () => {
    console.log(`🚀 WhatsApp bot server is running on port ${port}`);
    console.log(`📡 Webhook URL: http://localhost:${port}/webhook`);
});

// Export our app (needed for hosting)
module.exports = app;
