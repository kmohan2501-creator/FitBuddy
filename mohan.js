import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

app.use(express.json());
app.use(express.static("public"));

const fitnessSchema = {
  type: "object",
  properties: {
    title: {
      type: "string"
    },
    summary: {
      type: "string"
    },
    safetyNote: {
      type: "string"
    },
    weeklyPlan: {
      type: "array",
      items: {
        type: "object",
        properties: {
          day: {
            type: "string"
          },
          focus: {
            type: "string"
          },
          exercises: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: {
                  type: "string"
                },
                sets: {
                  type: "string"
                },
                reps: {
                  type: "string"
                },
                rest: {
                  type: "string"
                },
                instructions: {
                  type: "string"
                }
              },
              required: [
                "name",
                "sets",
                "reps",
                "rest",
                "instructions"
              ]
            }
          }
        },
        required: [
          "day",
          "focus",
          "exercises"
        ]
      }
    },
    nutritionGuidelines: {
      type: "array",
      items: {
        type: "string"
      }
    },
    recoveryTips: {
      type: "array",
      items: {
        type: "string"
      }
    }
  },
  required: [
    "title",
    "summary",
    "safetyNote",
    "weeklyPlan",
    "nutritionGuidelines",
    "recoveryTips"
  ]
};

app.post("/api/generate-plan", async (req, res) => {
  try {
    const {
      age,
      experience,
      goal,
      days,
      equipment,
      duration
    } = req.body;

    if (!age || !experience || !goal || !days) {
      return res.status(400).json({
        error: "Please fill in all required fields."
      });
    }

    const prompt = `
You are FitBuddy, a responsible AI fitness planning assistant.

Create a beginner-friendly, age-appropriate general fitness plan.

User information:
Age: ${age}
Experience level: ${experience}
Goal: ${goal}
Training days per week: ${days}
Available equipment: ${equipment || "No equipment"}
Workout duration: ${duration || "30 minutes"}

Important rules:
- Prioritize safety.
- Do not diagnose medical conditions.
- Do not prescribe extreme dieting or excessive exercise.
- Do not encourage rapid weight loss.
- Avoid unsafe training methods.
- Include rest/recovery.
- Give simple exercise instructions.
- If the user reports pain, injury, dizziness, or another concerning symptom,
  recommend stopping exercise and speaking with a parent/guardian or qualified
  healthcare professional instead of creating an intense plan.
- Nutrition advice should focus on balanced meals, hydration and adequate food
  rather than calorie restriction.
- Make the plan practical for a student.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: fitnessSchema,
        temperature: 0.7
      }
    });

    const plan = JSON.parse(response.text);

    res.json(plan);

  } catch (error) {
    console.error("Gemini Error:", error);

    res.status(500).json({
      error: "Unable to generate the fitness plan."
    });
  }
});

app.listen(PORT, () => {
  console.log(`FitBuddy running at http://localhost:${PORT}`);
});