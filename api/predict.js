const axios = require('axios');
const FormData = require('form-data');

module.exports = async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get the file from the request
        const file = req.body;
        console.log('Received request body:', req.body);

        if (!file) {
            console.error('No file in request body');
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Create form data for CIFAR-10 API
        const formData = new FormData();
        
        // Convert the file data to a Buffer if it's not already
        const fileBuffer = Buffer.isBuffer(file) ? file : Buffer.from(file);
        
        formData.append('file', fileBuffer, {
            filename: 'image.jpg',
            contentType: 'image/jpeg'
        });

        console.log('Sending request to CIFAR-10 API...');

        // Send request to CIFAR-10 API
        const response = await axios.post('https://cifar10-api.onrender.com/predict', formData, {
            headers: {
                ...formData.getHeaders()
            }
        });

        console.log('Received response from CIFAR-10 API:', response.data);

        // Send response back to client
        res.json(response.data);
    } catch (error) {
        console.error('Error:', {
            message: error.message,
            response: error.response?.data
        });

        if (error.response) {
            res.status(error.response.status).json({
                error: 'Error from CIFAR-10 API',
                details: error.response.data
            });
        } else {
            res.status(500).json({
                error: 'Error processing request',
                details: error.message
            });
        }
    }
}; 
