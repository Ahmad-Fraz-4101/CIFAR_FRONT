const axios = require('axios');
const FormData = require('form-data');
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Create a middleware function to handle the file upload
const uploadMiddleware = upload.single('file');

module.exports = async (req, res) => {
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
        // Handle file upload
        uploadMiddleware(req, res, async (err) => {
            if (err) {
                console.error('Multer error:', err);
                return res.status(400).json({ error: 'Error processing file upload' });
            }

            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            // Create form data for CIFAR-10 API
            const formData = new FormData();
            formData.append('file', req.file.buffer, {
                filename: req.file.originalname,
                contentType: req.file.mimetype
            });

            // Send request to CIFAR-10 API
            const response = await axios.post('https://cifar10-api.onrender.com/predict', formData, {
                headers: {
                    ...formData.getHeaders()
                }
            });

            // Send response back to client
            res.json(response.data);
        });
    } catch (error) {
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            response: error.response?.data
        });

        if (error.response) {
            res.status(error.response.status).json({
                error: 'Error from CIFAR-10 API',
                details: error.response.data
            });
        } else if (error.request) {
            res.status(500).json({
                error: 'No response from CIFAR-10 API',
                details: error.message
            });
        } else {
            res.status(500).json({
                error: 'Error setting up request',
                details: error.message
            });
        }
    }
}; 
