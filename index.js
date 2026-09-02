import 'dotenv/config';
import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
const ai = new GoogleGenAI();

app.use(express.json());
app.use(express.static('.')); 

// Define the JSON schema to guarantee structured output matching your UI
const minutesSchema = {
  type: Type.OBJECT,
  properties: {
    meetingTitle: { type: Type.STRING },
    date: { type: Type.STRING },
    time: { type: Type.STRING },
    mode: { type: Type.STRING },
    attendees: { type: Type.STRING },
    absentees: { type: Type.STRING },
    facilitator: { type: Type.STRING },
    noteTaker: { type: Type.STRING },
    timeAllotted: { type: Type.STRING },


    discussion: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          agendaItem: { type: Type.STRING },
          keyPoints: { type: Type.STRING },
          decisions: { type: Type.STRING }
        },
        required: ["agendaItem", "keyPoints", "decisions"]
      }
    },
    actionItems: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          task: { type: Type.STRING },
          person: { type: Type.STRING },
          dueDate: { type: Type.STRING },
          status: { type: Type.STRING }
        },
        required: ["task", "person", "dueDate", "status"]
      }
    },
    adjournedAt: { type: Type.STRING }
  },
  required: ["meetingTitle", "date", "time", "discussion", "actionItems"]
};

app.post('/api/format-minutes', async (req, res) => {
  try {
    const { rawText } = req.body;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      config: {
        //This is what you are prompting into the AI model. You can customize this prompt.
        systemInstruction: 'You are an executive assistant formatting messy meeting notes into structured minutes.',
        responseMimeType: 'application/json',
        responseSchema: minutesSchema
      },
      contents: `Parse these notes:\n\n${rawText}`
    });

    const parsedData = JSON.parse(response.text);
    res.json(parsedData);
  } catch (error) {
    console.error("Error generating minutes:", error);
    res.status(500).json({ error: "Failed to format minutes" });
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});