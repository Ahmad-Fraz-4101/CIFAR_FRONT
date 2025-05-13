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
                console.error('No file received in request');
                return res.status(400).json({ error: 'No file uploaded' });
            }

            // Log received file details
            console.log('Received file:', {
                originalName: req.file.originalname,
                mimeType: req.file.mimetype,
                size: req.file.size
            });

            // Create form data for CIFAR-10 API
            const formData = new FormData();
            formData.append('file', req.file.buffer, {
                filename: req.file.originalname,
                contentType: req.file.mimetype
            });

            // Log the request being sent
            console.log('Sending request to CIFAR-10 API...');

            try {
                // Send request to CIFAR-10 API
                const response = await axios.post('https://cifar10-api.onrender.com/predict', formData, {
                    headers: {
                        ...formData.getHeaders()
                    }
                });

                // Log the API response
                console.log('CIFAR-10 API Response:', response.data);

                // Send response back to client
                res.json(response.data);
            } catch (apiError) {
                console.error('CIFAR-10 API Error:', {
                    message: apiError.message,
                    response: apiError.response?.data
                });

                if (apiError.response) {
                    res.status(apiError.response.status).json({
                        error: 'Error from CIFAR-10 API',
                        details: apiError.response.data
                    });
                } else {
                    res.status(500).json({
                        error: 'Error communicating with CIFAR-10 API',
                        details: apiError.message
                    });
                }
            }
        });
    } catch (error) {
        console.error('Server error:', {
            message: error.message,
            stack: error.stack
        });

        res.status(500).json({
            error: 'Server error',
            details: error.message
        });
    }
}; 
