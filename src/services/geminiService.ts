import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface Vehicle {
  make: string;
  model: string;
  year: string;
  price?: string;
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

    PRICING AWARENESS (ZAR):
    - Free: 5 requests (Basic SWOT).
    - Monthly Pro (R285): Unlimited requests + Deep-dive mechanical reports.
    - Lifetime Legend (R1,499): Once-off payment for Traders/Flippers.
    - Dealer/Parts Tier (R1,100/mo): Includes direct parts sourcing links (Midas, Goldwagen, etc.).

    User Request:
    Vehicles to analyze: ${JSON.stringify(vehicles)}
    User Context: ${context}
    
    Please provide a detailed report in Markdown format following this structure:

    # Side-by-Side Comparison
    [Table: Engine, Torque, Fuel Economy (L/100km), Safety Rating]

    For EACH vehicle:
    ## [Vehicle Name - Year]
    
    ### 🛠 Mechanical "Lemon" Check
    [Identify common SA failures (e.g., Ford cooling systems, BMW oil leaks, Toyota injector issues). Bullet points of what to check physically before buying.]

    ### 🛡 The Security Report (RSA Specific)
    [RISK: EXTREME/HIGH/MODERATE/LOW]
    - **Target Level:** Rate 1-10 "Theft Desirability Scale" (e.g., VW Polo, Toyota Hilux, and Ford Ranger are 9/10).
    - **Methodology Alerts:** 
        - Relay/Keyless Attacks (for high-end SUVs/Bakkies).
        - CAN-bus Hacking (specifically warn VW Polo/Venter owners about headlight-access entry).
        - Remote Jamming (vulnerability at SA shopping malls/petrol stations).
        - Parts Stripping (targeted for mirrors, lights, tailgates e.g., Polo, Hilux, NP200).
    - **Insurance & Tracking:** Advise if Level 4 Tracking or Dual-Trackers are typically required. Mention "High-Premium" status for high-theft models.
    - **Anti-Cloning Warning:** Remind user to verify VIN against Engine Number and check with SAPS clearance.

    ### ⚖️ SWOT Analysis
    - **Strengths**: ...
    - **Weaknesses**: ...
    - **Opportunities**: ...
    - **Threats**: ...

    ## 🏁 The ShiftSense Verdict
    [WINNER: Vehicle Name]
    [SCORE: X.X]
    [QUOTE: A short, punchy summary quote]
    [Detailed recommendation based on the user's context and persona. Use South African localization and terminology.]
    
    Limit all search data to the South African Market. Do not suggest cars or parts only available in the US/UK.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });
    
    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
}
