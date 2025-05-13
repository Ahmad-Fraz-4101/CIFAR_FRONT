const axios = require('axios');
const FormData = require('form-data');
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Create a middleware function to handle the file upload
const uploadMiddleware = upload.single('file');

module.exports = async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

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
                console.error('No file received');
                return res.status(400).json({ error: 'No file uploaded' });
            }

            try {
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
                return res.json(response.data);
            } catch (apiError) {
                console.error('CIFAR-10 API Error:', {
                    message: apiError.message,
                    response: apiError.response?.data
                });

                if (apiError.response) {
                    return res.status(apiError.response.status).json({
                        error: 'Error from CIFAR-10 API',
                        details: apiError.response.data
                    });
                } else {
                    return res.status(500).json({
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

        return res.status(500).json({
            error: 'Server error',
            details: error.message
        });
    }
}; 
