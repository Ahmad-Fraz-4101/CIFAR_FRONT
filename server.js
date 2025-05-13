const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Enable CORS for all routes
app.use(cors());

// Serve static files from the current directory
app.use(express.static(__dirname));

// Proxy endpoint for the CIFAR-10 API
app.post('/predict', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log('Received file:', {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        });

        const formData = new FormData();
        formData.append('file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });

        console.log('Sending request to CIFAR-10 API...');
        const response = await axios.post('https://cifar-production.up.railway.app/predict', formData, {
            headers: {
                ...formData.getHeaders()
            }
        });

        console.log('API Response:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            res.status(error.response.status).json({
                error: 'API Error',
                details: error.response.data
            });
        } else if (error.request) {
            // The request was made but no response was received
            res.status(500).json({
                error: 'No response from API',
                details: error.message
            });
        } else {
            // Something happened in setting up the request that triggered an Error
            res.status(500).json({
                error: 'Request Error',
                details: error.message
            });
        }
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
}); 
