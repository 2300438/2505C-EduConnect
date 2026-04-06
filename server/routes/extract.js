const express = require('express');
const router = express.Router();
const PDFParser = require("pdf2json");
const { sequelize } = require("../models"); // Ensure this is imported!

router.post('/api/courses/extract', async (req, res) => {
    const { contentId, blobUrl, contentType } = req.body;
    console.log(">>> [1/4] Request received for Subtopic ID:", contentId);

    try {
        // 1. Download the file
        const response = await fetch(blobUrl);
        const buffer = Buffer.from(await response.arrayBuffer());

        let extractedText = "";

        // 2. Extraction Logic (PDF)
        if (contentType === 'application/pdf' || blobUrl.toLowerCase().endsWith('.pdf')) {
            extractedText = await new Promise((resolve, reject) => {
                const pdfParser = new PDFParser(null, 1);
                pdfParser.on("pdfParser_dataError", err => reject(err));
                pdfParser.on("pdfParser_dataReady", () => {
                    try {
                        const raw = pdfParser.getRawTextContent();
                        resolve(decodeURIComponent(raw));
                    } catch (e) {
                        // Fallback for malformed URIs
                        resolve(raw.replace(/%20/g, ' ')); 
                    }
                });
                pdfParser.parseBuffer(buffer);
            });
        }

        const cleanText = extractedText.replace(/\s+/g, ' ').trim();
        console.log(">>> [2/4] Extraction complete. Length:", cleanText.length);

        if (cleanText.length < 5) {
            return res.status(400).json({ success: false, message: "No readable text found." });
        }

        // 3. Database Update with explicit Error Catching
        try {
            console.log(">>> [3/4] Attempting DB Update...");
            
            // Raw SQL bypasses any Sequelize model sync issues
            const [results, metadata] = await sequelize.query(
                "UPDATE subtopics SET extracted_text = ?, is_ai_trained = 1 WHERE id = ?",
                {
                    replacements: [cleanText, contentId],
                    type: sequelize.QueryTypes.UPDATE
                }
            );

            console.log(">>> [4/4] DB SUCCESS. Rows affected:", metadata);

            // Send the final response to the frontend
            return res.json({ 
                success: true, 
                message: "AI has successfully learned the material!",
                length: cleanText.length 
            });

        } catch (dbError) {
            console.error(">>> CRITICAL DATABASE ERROR:", dbError);
            return res.status(500).json({ 
                success: false, 
                message: "The text was extracted, but the database rejected it. Check terminal for SQL errors." 
            });
        }

    } catch (error) {
        console.error(">>> EXTRACTION PROCESS CRASHED:", error);
        return res.status(500).json({ success: false, message: "Extraction failed before reaching the database." });
    }
});

module.exports = router;