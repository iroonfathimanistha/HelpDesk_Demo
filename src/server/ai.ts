import { GoogleGenAI } from '@google/genai';

export interface AIClassificationResult {
  suggestedCategoryName: string;
  suggestedCategoryId: string;
  problemSummary: string;
  suggestedDetailsToProvide: string[];
  urgency: 'NORMAL' | 'EMERGENCY';
  safetyWarning: string;
  explanation: string;
  isAiGenerated: boolean;
}

export interface ProjectPlanResult {
  projectTitle: string;
  recommendedTrades: {
    category: string;
    stage: number;
    tasks: string[];
    importance: string;
  }[];
  estimatedSequenceNotes: string;
  safetyAndPermitTips: string[];
}

const CATEGORY_MAP: Record<string, string> = {
  'Plumbing': 'cat-plumbing',
  'Electrical': 'cat-electrical',
  'AC & Refrigeration': 'cat-ac',
  'AC and Refrigeration': 'cat-ac',
  'Carpentry': 'cat-carpentry',
  'Masonry': 'cat-masonry',
  'Painting': 'cat-painting',
  'Appliance Repair': 'cat-appliance',
  'Cleaning': 'cat-cleaning',
  'Gardening & Landscaping': 'cat-gardening',
  'Gardening': 'cat-gardening',
  'Other Home Services': 'cat-other'
};

export class AIService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    if (process.env.GEMINI_API_KEY) {
      try {
        this.ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build'
            }
          }
        });
      } catch (e) {
        console.warn('Failed to initialize GoogleGenAI client:', e);
      }
    }
  }

  public async classifyProblem(problemDescription: string, imageBase64?: string): Promise<AIClassificationResult> {
    if (!problemDescription || problemDescription.trim().length === 0) {
      return this.fallbackClassifier('General maintenance request');
    }

    if (this.ai && process.env.GEMINI_API_KEY) {
      try {
        const prompt = `You are the AI triage specialist for "HelpDesk", an on-demand skilled home services platform in Sri Lanka.
Analyze the user's reported household problem and return a JSON object with:
- "suggestedCategoryName": Must be ONE of ["Plumbing", "Electrical", "AC & Refrigeration", "Carpentry", "Masonry", "Painting", "Appliance Repair", "Cleaning", "Gardening & Landscaping", "Other Home Services"]
- "problemSummary": A crisp, professional 1-sentence summary of the issue.
- "suggestedDetailsToProvide": Array of 2-3 specific helpful details or measurements the user should provide to the technician (e.g. pipe diameter, appliance model number, whether power trips immediately or after 5 mins).
- "urgency": "EMERGENCY" if there is imminent danger of water flooding, fire risk, electrical shock, gas leak, or severe structural compromise; otherwise "NORMAL".
- "safetyWarning": Concrete immediate safety advice (e.g. "Do not touch switch with wet hands", "Turn off main water stopcock"). If none, output a friendly reminder to leave technical diagnosis to the qualified professional.
- "explanation": 1-2 sentence rationale explaining why this category and urgency were chosen.

Important safety guidelines:
Do not advise the user to perform dangerous electrical wiring, high-voltage, structural, or gas plumbing repairs themselves. Always encourage hiring a verified professional.

User Problem Description:
"""${problemDescription}"""`;

        const parts: any[] = [];
        if (imageBase64) {
          const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
          parts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          });
        }
        parts.push({ text: prompt });

        const response = await this.ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: parts.length > 1 ? { parts } : prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        const rawText = response.text || '';
        const parsed = JSON.parse(rawText);

        const categoryName = parsed.suggestedCategoryName || 'Other Home Services';
        const categoryId = CATEGORY_MAP[categoryName] || 'cat-other';

        return {
          suggestedCategoryName: categoryName,
          suggestedCategoryId: categoryId,
          problemSummary: parsed.problemSummary || problemDescription.slice(0, 100),
          suggestedDetailsToProvide: Array.isArray(parsed.suggestedDetailsToProvide) ? parsed.suggestedDetailsToProvide : ['Photo of the issue', 'Access details'],
          urgency: parsed.urgency === 'EMERGENCY' ? 'EMERGENCY' : 'NORMAL',
          safetyWarning: parsed.safetyWarning || 'Please stay safe and let the verified professional handle technical repairs.',
          explanation: parsed.explanation || 'Matched based on keywords and household repair guidelines.',
          isAiGenerated: true
        };
      } catch (err) {
        console.warn('Gemini API call failed, using intelligent rule-based fallback:', err);
      }
    }

    return this.fallbackClassifier(problemDescription);
  }

  public async generateProjectPlan(projectOverview: string): Promise<ProjectPlanResult> {
    if (this.ai && process.env.GEMINI_API_KEY) {
      try {
        const prompt = `You are a professional construction and home renovation planning consultant for Sri Lankan residential projects.
Analyze this renovation or multi-trade project request and generate a structured JSON plan:
- "projectTitle": Clean title
- "recommendedTrades": Array of trade stages [{ "category": "Masonry/Plumbing/etc", "stage": 1, "tasks": ["Task 1", "Task 2"], "importance": "Crucial first step" }]
- "estimatedSequenceNotes": Explanation of why the work order matters (e.g. plumbing rough-in before tile laying and painting).
- "safetyAndPermitTips": 2-3 local safety reminders (e.g. check local municipal permits, turn off main lines, wear PPE).

Project description:
"""${projectOverview}"""`;

        const response = await this.ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        const parsed = JSON.parse(response.text || '{}');
        return {
          projectTitle: parsed.projectTitle || 'Home Renovation Plan',
          recommendedTrades: parsed.recommendedTrades || [],
          estimatedSequenceNotes: parsed.estimatedSequenceNotes || 'Complete rough-in trades before finishes.',
          safetyAndPermitTips: parsed.safetyAndPermitTips || ['Ensure qualified technicians verify wiring before sealing walls.']
        };
      } catch (e) {
        console.warn('Gemini project plan failed, using fallback:', e);
      }
    }

    return {
      projectTitle: 'Multi-Stage Home Improvement Plan',
      recommendedTrades: [
        {
          category: 'Masonry & Waterproofing',
          stage: 1,
          tasks: ['Demolition of old tiles', 'Wall surface leveling', 'Waterproof membrane coating'],
          importance: 'Foundational stage to avoid future water leakage.'
        },
        {
          category: 'Plumbing',
          stage: 2,
          tasks: ['PPR pipe rough-in', 'Concealed mixer valve placement', 'Drain trap leveling'],
          importance: 'Must be completed and pressure-tested before tiling.'
        },
        {
          category: 'Electrical',
          stage: 3,
          tasks: ['Conduit routing', 'Waterproof IP-rated socket wiring', 'Exhaust fan point'],
          importance: 'Ensure proper grounding before moisture-prone rooms are closed up.'
        },
        {
          category: 'Carpentry & Finishing',
          stage: 4,
          tasks: ['Door frame installation', 'Cabinetry fittings', 'Final paint touch-up'],
          importance: 'Final cosmetic and functional touches.'
        }
      ],
      estimatedSequenceNotes: 'Follow the classic construction rule: rough-ins (wet and electrical infrastructure) first, followed by structural waterproofing, tile work, and finally delicate fixtures and paint.',
      safetyAndPermitTips: [
        'Always verify with CEB or a certified wireman for main breaker capacity.',
        'Pressure-test all plumbing lines for at least 24 hours before covering with plaster or tile.',
        'Review the plan with your verified HelpDesk contractors before procuring raw materials.'
      ]
    };
  }

  private fallbackClassifier(text: string): AIClassificationResult {
    const lower = text.toLowerCase();

    // Check emergency indicators
    const isEmergency = lower.includes('flood') || 
      lower.includes('spark') || 
      lower.includes('burning') || 
      lower.includes('smoke') || 
      lower.includes('burst pipe') || 
      lower.includes('shock') ||
      lower.includes('urgent') ||
      lower.includes('danger');

    if (lower.includes('water') || lower.includes('leak') || lower.includes('tap') || lower.includes('pipe') || lower.includes('sink') || lower.includes('toilet') || lower.includes('drain') || lower.includes('tank') || lower.includes('pump') || lower.includes('cistern')) {
      return {
        suggestedCategoryName: 'Plumbing',
        suggestedCategoryId: 'cat-plumbing',
        problemSummary: 'Water supply or drainage system leakage issue.',
        suggestedDetailsToProvide: ['Is the water leak continuous or only when using the tap?', 'Can you access the nearest stopcock valve?', 'Is the pipe plastic (PVC/PPR) or metal?'],
        urgency: isEmergency ? 'EMERGENCY' : 'NORMAL',
        safetyWarning: isEmergency 
          ? 'Shut off the main stopcock water supply valve immediately to stop flooding and protect electrical points.'
          : 'Place a bucket underneath the leak and avoid using corrosive chemical drain unblockers.',
        explanation: 'Identified plumbing and water fixtures terminology in your description.',
        isAiGenerated: false
      };
    }

    if (lower.includes('electric') || lower.includes('spark') || lower.includes('wire') || lower.includes('breaker') || lower.includes('trip') || lower.includes('switch') || lower.includes('light') || lower.includes('fan') || lower.includes('socket') || lower.includes('power')) {
      return {
        suggestedCategoryName: 'Electrical',
        suggestedCategoryId: 'cat-electrical',
        problemSummary: 'Electrical circuit breaker, wiring, or fixture malfunction.',
        suggestedDetailsToProvide: ['Does the trip switch turn off immediately or after several minutes?', 'Did you smell any burning plastic or ozone?', 'What appliances were running when it occurred?'],
        urgency: isEmergency ? 'EMERGENCY' : 'NORMAL',
        safetyWarning: 'Do not touch exposed wires, charred outlets, or switches with wet hands. Keep the main circuit breaker tripped until a licensed wireman arrives.',
        explanation: 'Identified electrical components and power circuitry in your description.',
        isAiGenerated: false
      };
    }

    if (lower.includes('ac') || lower.includes('air cond') || lower.includes('cool') || lower.includes('gas') || lower.includes('fridge') || lower.includes('refrigerat') || lower.includes('freezer')) {
      return {
        suggestedCategoryName: 'AC & Refrigeration',
        suggestedCategoryId: 'cat-ac',
        problemSummary: 'Air conditioning or refrigeration cooling system fault.',
        suggestedDetailsToProvide: ['Make and capacity (e.g. 12000 BTU, 18000 BTU)?', 'Is the indoor or outdoor unit making unusual noises?', 'When was the unit last chemically serviced?'],
        urgency: 'NORMAL',
        safetyWarning: 'Switch off the unit at the dedicated wall isolator to avoid damaging the inverter compressor.',
        explanation: 'Identified air conditioning or cooling appliance keywords.',
        isAiGenerated: false
      };
    }

    if (lower.includes('door') || lower.includes('lock') || lower.includes('wood') || lower.includes('drawer') || lower.includes('hinge') || lower.includes('table') || lower.includes('chair') || lower.includes('cupboard') || lower.includes('wardrobe')) {
      return {
        suggestedCategoryName: 'Carpentry',
        suggestedCategoryId: 'cat-carpentry',
        problemSummary: 'Timber, furniture, door alignment, or lock fixture repair.',
        suggestedDetailsToProvide: ['Is the door solid wood or engineered board?', 'Do you have the replacement lock cylinder or need the carpenter to supply it?', 'Is there water swelling in the wood?'],
        urgency: 'NORMAL',
        safetyWarning: 'Take care around loose hinges or sticking heavy doors to avoid finger pinch injuries.',
        explanation: 'Detected woodwork, furniture, and cabinetry references.',
        isAiGenerated: false
      };
    }

    if (lower.includes('clean') || lower.includes('dust') || lower.includes('wash') || lower.includes('sofa') || lower.includes('stain') || lower.includes('mould') || lower.includes('mold') || lower.includes('deep clean')) {
      return {
        suggestedCategoryName: 'Cleaning',
        suggestedCategoryId: 'cat-cleaning',
        problemSummary: 'Deep cleaning, sanitization, or upholstery cleaning request.',
        suggestedDetailsToProvide: ['Approximate floor area or number of bedrooms/bathrooms?', 'Are water and electricity points readily accessible?'],
        urgency: 'NORMAL',
        safetyWarning: 'Ensure good room ventilation if there are heavy dust or mould spores.',
        explanation: 'Matched housekeeping and deep cleaning terminology.',
        isAiGenerated: false
      };
    }

    if (lower.includes('tile') || lower.includes('wall') || lower.includes('crack') || lower.includes('plaster') || lower.includes('cement') || lower.includes('mason') || lower.includes('waterproof')) {
      return {
        suggestedCategoryName: 'Masonry',
        suggestedCategoryId: 'cat-masonry',
        problemSummary: 'Masonry, wall plastering, or tile repair needed.',
        suggestedDetailsToProvide: ['Is the crack hair-line or wider than 5mm?', 'Is there dampness or water seeping through the wall?'],
        urgency: 'NORMAL',
        safetyWarning: 'Do not remove load-bearing elements or peel deep loose plaster without a pro inspection.',
        explanation: 'Detected masonry and structural surface terms.',
        isAiGenerated: false
      };
    }

    // Default
    return {
      suggestedCategoryName: 'Other Home Services',
      suggestedCategoryId: 'cat-other',
      problemSummary: 'General home maintenance and service request.',
      suggestedDetailsToProvide: ['Describe the location and what tools or ladders might be required', 'Preferred time window for inspection'],
      urgency: 'NORMAL',
      safetyWarning: 'A qualified HelpDesk professional will inspect and provide an itemized quote before starting work.',
      explanation: 'We have categorized this under general skilled home services.',
      isAiGenerated: false
    };
  }
}

export const aiService = new AIService();
