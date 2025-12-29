
import { GoogleGenAI, Type } from "@google/genai";
import { SalesOrder } from "../types.ts";
import { PRODUCT_CATALOG } from "../constants.ts";

const productNames = PRODUCT_CATALOG.join(", ");

export const parseOrderFromText = async (text: string): Promise<Partial<SalesOrder>> => {
  // Create a new instance right before making an API call to ensure it uses the most up-to-date API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Use gemini-3-flash-preview for high-speed extraction tasks
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are a professional data entry assistant for IFCG, a food distribution company. 
    Your job is to extract sales order details from informal text messages.
    
    The available products in our catalog are:
    ${productNames}

    Rules:
    1. Match the item name in the text to the closest exact match in the catalog. 
    2. If an item is clearly not in the catalog, extract its name as written.
    3. Extract the numeric quantity for each item.
    4. Extract the Client Name and Location (Area).
    5. For "orderDate", use today's date (${new Date().toISOString().split('T')[0]}) if not specified.
    6. Return the data strictly in the requested JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: text,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            customerName: { type: Type.STRING },
            areaLocation: { type: Type.STRING },
            orderDate: { type: Type.STRING, description: "The intended delivery or receiving date mentioned" },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  itemName: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  notes: { type: Type.STRING }
                },
                required: ["itemName", "quantity"]
              }
            }
          },
          required: ["customerName", "items"]
        }
      }
    });

    // Access the text property directly (not a method) as per @google/genai guidelines
    const resultText = response.text;
    if (resultText) {
      return JSON.parse(resultText.trim()) as Partial<SalesOrder>;
    }
    throw new Error("No data returned from AI");
  } catch (error) {
    console.error("Error parsing order with Gemini:", error);
    throw error;
  }
};
