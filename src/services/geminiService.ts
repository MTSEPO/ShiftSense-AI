import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface Vehicle {
  make: string;
  model: string;
  year: string;
  price?: string;
  odometer?: string;
}

export type UserPersona = 'buyer' | 'trader';

export async function analyzeVehicles(
  vehicles: Vehicle[], 
  context: string, 
  persona: UserPersona,
  currency: string = 'ZAR',
  exchangeRates: Record<string, number> = {}
) {
  const model = "gemini-3.1-pro-preview";
  
  const personaInstructions = persona === 'buyer' 
    ? `
    PERSONA: BUYER (Personal/Family)
    PRIORITIZE: ISOFIX safety, fuel economy (L/100km), long-term reliability, and "Pothole resilience."
    VERDICT FOCUS: "Is this car safe and affordable for the next 5 years?"
    ADVICE STYLE: Professional, authoritative, and South African. Use terms like "Bakkie," "Robot," "Service Plan," "Maintenance Plan," "ZAR," "NATIS."
    `
    : `
    PERSONA: TRADER (Resale/Dealer)
    PRIORITIZE: Market liquidity (how fast it sells), wholesale parts cost, and "Flip Margin."
    ADVICE STYLE: Suggest local sourcing for common faults (e.g., "Source replacement turbos from Masterparts or Goldwagen to save R8,000").
    VERDICT FOCUS: Profitability and market demand in RSA (e.g., "High demand in Gauteng/Western Cape").
    TRADER SPECIFIC: Warn about "Liquidity" and "Resale Stigma" if applicable.
    `;

  const prompt = `
    You are "ShiftSense AI," the premier South African used vehicle consultant. You provide data-driven, unbiased analysis for buyers and traders in the Republic of South Africa (RSA). Your mission is to prevent users from buying "lemons," identify security risks, and maximize value for money.
    
    ${personaInstructions}

    CURRENCY CONTEXT:
    - User is viewing in: ${currency}
    - Current Rates (relative to ZAR): ${JSON.stringify(exchangeRates)}
    - IMPORTANT: If the user provided prices in ${currency}, convert them to ZAR for internal analysis, but display the final verdict and SWOT in ZAR.
    
    INPUT VALIDATION:
    - If the vehicle data provided is nonsense (e.g., "Asdfasdf") or clearly not a real vehicle, return a polite "Vehicle not found" message and explain why.
    - If the user enters mileage like "138 000KM" with spaces, parse it as 138000.
    - IMPORTANT: If an odometer reading (KM) is provided, you MUST trigger specific maintenance warnings based on South African service intervals (e.g., "150,000km Timing Belt Warning", "90,000km Major Service Alert").

    PRICING AWARENESS (ZAR):
    - Free: 5 requests (Basic SWOT).
    - Monthly Pro (R285): Unlimited requests + Deep-dive mechanical reports.
    - Lifetime Legend (R1,499): Once-off payment for Traders/Flippers.
    - Dealer/Parts Tier (R1,100/mo): Includes direct parts sourcing links (Midas, Goldwagen, etc.).

    User Request:
    Vehicles to analyze: ${JSON.stringify(vehicles)}
    User Context: ${context}
    
    IMPORTANT: You must return a JSON object with the following structure:
    {
      "report": "The full markdown report here...",
      "swot": [
        {
          "vehicle": "Vehicle Name",
          "strengths": ["point 1", "point 2"],
          "weaknesses": ["point 1", "point 2"],
          "opportunities": ["point 1", "point 2"],
          "threats": ["point 1", "point 2"]
        }
      ]
    }

    The "report" field should contain the detailed markdown report following this structure:
    # Side-by-Side Comparison
    ...
    ## [Vehicle Name - Year]
    ### 🛠 Mechanical "Lemon" Check
    ...
    ### 🛡 The Security Report (RSA Specific)
    ...
    ## 🏁 The ShiftSense Verdict
    ...

    Do NOT include the SWOT analysis in the "report" markdown field, as it will be rendered separately using the "swot" JSON data.
    
    Limit all search data to the South African Market. Do not suggest cars or parts only available in the US/UK.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.7,
        responseMimeType: "application/json"
      }
    });
    
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
}
