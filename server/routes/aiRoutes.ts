import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { db } from '../db.ts';

const router = Router();

// POST /api/ai/symptom-checker - AI Symptom Assessment & Doctor Specialist Recommendation
router.post('/symptom-checker', async (req, res) => {
  try {
    const { symptoms, age, gender, duration } = req.body;

    if (!symptoms || symptoms.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Please describe your symptoms.' });
    }

    const availableSpecializations = [
      'Cardiology',
      'Dermatology',
      'Neurology',
      'Orthopedics',
      'Pediatrics',
      'Gynecology',
      'ENT',
      'Dentistry',
      'General Medicine',
      'Emergency',
    ];

    let aiRecommendation: any = null;

    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `You are a clinical AI medical triage assistant for the MediCare hospital appointment platform.
A patient has described their symptoms. Provide a structured, helpful preliminary assessment, suggest the most appropriate medical specialist/department from this list: [${availableSpecializations.join(', ')}], suggest urgency level ('Routine', 'Priority', 'Emergency'), and provide 3-4 actionable homecare or preparatory questions for their doctor visit.

Patient Info:
- Symptoms: "${symptoms}"
- Age: ${age || 'Not specified'}
- Gender: ${gender || 'Not specified'}
- Duration: ${duration || 'Recent'}

Respond ONLY with valid JSON in this exact structure without markdown formatting or code fences:
{
  "recommendedDepartment": "Exact name from available specializations list",
  "urgency": "Routine" | "Priority" | "Emergency",
  "assessmentSummary": "Brief, clear 2-3 sentence overview in empathetic language",
  "possibleCauses": ["Possible cause 1", "Possible cause 2", "Possible cause 3"],
  "recommendedAction": "Clear recommendation regarding appointment scheduling or urgent care",
  "questionsForDoctor": ["Question 1 to ask the doctor", "Question 2", "Question 3"],
  "disclaimer": "This is an automated preliminary guidance tool and does not substitute professional clinical diagnosis. In case of severe chest pain, shortness of breath, or trauma, contact emergency 108 immediately."
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        if (response.text) {
          try {
            aiRecommendation = JSON.parse(response.text.trim());
          } catch (pErr) {
            console.warn('Failed to parse Gemini JSON, falling back:', pErr);
          }
        }
      } catch (geminiError) {
        console.warn('Gemini API call warning:', geminiError);
      }
    }

    // Heuristic Fallback if Gemini key is unset or error occurs
    if (!aiRecommendation) {
      const symLower = symptoms.toLowerCase();
      let dept = 'General Medicine';
      let urgency: 'Routine' | 'Priority' | 'Emergency' = 'Routine';

      if (symLower.includes('chest') || symLower.includes('heart') || symLower.includes('palpitation') || symLower.includes('pulse')) {
        dept = 'Cardiology';
        urgency = 'Priority';
      } else if (symLower.includes('skin') || symLower.includes('rash') || symLower.includes('acne') || symLower.includes('itch') || symLower.includes('hair')) {
        dept = 'Dermatology';
      } else if (symLower.includes('headache') || symLower.includes('migraine') || symLower.includes('dizzy') || symLower.includes('nerve') || symLower.includes('numb')) {
        dept = 'Neurology';
        urgency = 'Priority';
      } else if (symLower.includes('bone') || symLower.includes('joint') || symLower.includes('knee') || symLower.includes('back') || symLower.includes('fracture') || symLower.includes('spine')) {
        dept = 'Orthopedics';
      } else if (symLower.includes('child') || symLower.includes('baby') || symLower.includes('infant') || symLower.includes('vaccin')) {
        dept = 'Pediatrics';
      } else if (symLower.includes('period') || symLower.includes('pregnancy') || symLower.includes('pcos') || symLower.includes('cramp')) {
        dept = 'Gynecology';
      } else if (symLower.includes('ear') || symLower.includes('throat') || symLower.includes('nose') || symLower.includes('sinus') || symLower.includes('tonsil')) {
        dept = 'ENT';
      } else if (symLower.includes('tooth') || symLower.includes('gum') || symLower.includes('teeth') || symLower.includes('dental')) {
        dept = 'Dentistry';
      }

      aiRecommendation = {
        recommendedDepartment: dept,
        urgency: urgency,
        assessmentSummary: `Based on your reported symptoms of ${symptoms.slice(0, 80)}, consultation with a ${dept} specialist is advised for thorough physical assessment and targeted treatment.`,
        possibleCauses: ['Environmental or physical factors', 'Mild inflammatory response', 'Clinical presentation requiring diagnostic examination'],
        recommendedAction: `Schedule a consultation with our verified ${dept} specialists.`,
        questionsForDoctor: [
          'What diagnostic tests or investigations would help confirm the cause?',
          'Are there any immediate lifestyle or dietary modifications recommended?',
          'What warning signs should prompt an emergency hospital visit?',
        ],
        disclaimer: 'This is an AI-powered preliminary evaluation and does not replace medical diagnosis. For severe or sudden life-threatening symptoms, immediately visit the nearest emergency room or call 108.',
      };
    }

    // Match Top Doctors for this recommended specialization
    const matchingDoctors = db.doctors
      .filter((d) => d.approvalStatus === 'approved' && d.specialization.toLowerCase() === aiRecommendation.recommendedDepartment.toLowerCase())
      .slice(0, 3);

    return res.json({
      success: true,
      assessment: aiRecommendation,
      recommendedDoctors: matchingDoctors,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to process symptom assessment.' });
  }
});

export default router;
