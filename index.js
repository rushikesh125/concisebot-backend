const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const fs = require("fs");
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Initialize Google Generative AI client with API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
// console.log(Object.keys(model));
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: { fileSize: 10 * 1024 * 1024 },
// });


const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, '/tmp'),
      filename: (req, file, cb) => cb(null, file.originalname),
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
  });


// Endpoint to handle PDF upload, text extraction, and summarization
// app.post("/upload-pdf", upload.single("pdf"), async (req, res) => {
    
//   if (!req.file) {
//     return res.status(400).send("No file uploaded.");
//   }

//   try {
//     // Extract text from PDF
//     const pdfData = req.file.buffer;
//     const data = await pdfParse(pdfData);
//     const extractedText = data.text;

//     const customPrompt = req.body.customPrompt;
//     console.log(customPrompt);

//     // Save extracted text to a file (optional)
//     const outputPath = path.join(__dirname, "output.txt");
//     fs.writeFileSync(outputPath, extractedText, "utf-8");

//     // Use the model to generate a summary of the text
//     const prompt = `${
//       customPrompt
//         ? `${customPrompt} from following content`
//         : "Summarize the following content:"
//     }\n\n${extractedText}`;
//     const summaryResponse = await model.generateContent(prompt);

//     const summarizedText = await summaryResponse.response.text();

//     res.send({ summary: summarizedText });
//   } catch (error) {
//     console.error("Error processing PDF or summarizing text:", error);
//     res.status(500).send("Failed to process PDF file or summarize text.");
//   }
// });


app.post("/upload-pdf", upload.single("pdf"), async (req, res) => {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }
  
    try {
      console.log("Starting PDF extraction...");
      const pdfData = req.file.buffer;
      const data = await pdfParse(pdfData);
      console.log("PDF extracted successfully");
  
      const extractedText = data.text;
      const customPrompt = req.body.customPrompt || "Summarize the following content:";
      const prompt = `${customPrompt}\n\n${extractedText}`;
  
      console.log("Generating summary with Google AI...");
      const summaryResponse = await model.generateContent(prompt);
      const summarizedText = await summaryResponse.response.text();
      console.log("Summary generated successfully");
  
      res.send({ summary: summarizedText });
    } catch (error) {
      console.error("Error processing PDF or summarizing text:", error.message);
      res.status(500).send("Failed to process PDF file or summarize text.");
    }
  });
  


app.get('/',(req,res)=>{
    res.send("Hello From Server")
  })

app.post("/generate", async (req, res) => {
  try {
    const prompt = req.body.prompt;
    if (!prompt) {
      return res.status(400).send({ error: "Prompt is required" });
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.send({ response: text });
  } catch (error) {
    console.error("Error generating content:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
