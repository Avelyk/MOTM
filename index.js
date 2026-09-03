import 'dotenv/config';
import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
const PORT = process.env.PORT || 3000;
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

app.post('/api/format-minutes', async (req, res) => {
  try {
    const { rawText } = req.body;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      config: {
        systemInstruction: 'You are an executive assistant formatting messy meeting notes into structured minutes. If details like facilitators, note takers, mode, or adjournment time are omitted from the text, return "—" for those values.',
        responseMimeType: 'application/json',
        responseSchema: minutesSchema
      },
      contents: `Parse these notes:\n\n${rawText}`
    });

    const parsedData = JSON.parse(response.text);

    // Apply safe defaults for unreturned optional fields
    const formattedResult = {
      meetingTitle: parsedData.meetingTitle || 'Meeting Minutes',
      date: parsedData.date || '—',
      time: parsedData.time || '—',
      mode: parsedData.mode || '—',
      attendees: parsedData.attendees || '—',
      absentees: parsedData.absentees || '—',
      facilitator: parsedData.facilitator || '—',
      noteTaker: parsedData.noteTaker || '—',
      timeAllotted: parsedData.timeAllotted || '—',
      discussion: parsedData.discussion || [],
      actionItems: parsedData.actionItems || [],
      adjournedAt: parsedData.adjournedAt || '—'
    };

    res.json(formattedResult);
  } catch (error) {
    console.error("Error generating minutes:", error);
    res.status(500).json({ error: "Failed to format minutes" });
  }
});
