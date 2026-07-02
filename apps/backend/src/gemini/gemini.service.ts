import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, Type } from '@google/genai';

export interface ExtractedOrder {
  confidence: 'HIGH' | 'LOW';
  customerName?: string;
  itemDescription?: string;
  quantity?: number;
  amountNaira?: number;
  clarifyingQuestion?: string;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private ai: GoogleGenAI | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    } else {
      this.logger.warn(
        'GEMINI_API_KEY missing. Gemini extraction will run in fallback mock mode.',
        'GeminiService',
      );
    }
  }

  async parseMessage(messageText: string): Promise<ExtractedOrder> {
    this.logger.log(
      `Parsing message with Gemini: "${messageText}"`,
      'GeminiService',
    );

    if (!this.ai) {
      // Local fallback parsing logic if API key is absent
      const amountMatch = messageText.match(/(\d+(?:\.\d{1,2})?k?|\d{3,})/i);
      let amountNaira = 1000;
      if (amountMatch) {
        const val = amountMatch[1].toLowerCase();
        if (val.endsWith('k')) {
          amountNaira = parseFloat(val.replace('k', '')) * 1000;
        } else {
          amountNaira = parseFloat(val);
        }
      }
      return {
        confidence: 'HIGH',
        customerName: 'Customer',
        itemDescription: messageText,
        quantity: 1,
        amountNaira,
      };
    }

    try {
      const systemPrompt = `You are TradeChat AI, an assistant helping Nigerian market traders create instant payment links on WhatsApp.
Analyze the user message and extract order details.
If the message contains clear or inferable product/service details and an amount in Naira (e.g., "50k", "4500", "25,000", "2.5k"), set confidence to "HIGH".
Note: 1k = 1000 Naira. Extract amountNaira as a numeric value in Naira (e.g. 50k = 50000).
If the amount or product description is completely missing or ambiguous, set confidence to "LOW" and provide a natural, friendly Nigerian English/Pidgin clarifyingQuestion (e.g., "Abeg how much be the total amount?" or "Wetin be the customer name?").`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: `${systemPrompt}\n\nUser Message: "${messageText}"`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              confidence: { type: Type.STRING, enum: ['HIGH', 'LOW'] },
              customerName: { type: Type.STRING },
              itemDescription: { type: Type.STRING },
              quantity: { type: Type.INTEGER },
              amountNaira: { type: Type.NUMBER },
              clarifyingQuestion: { type: Type.STRING },
            },
            required: ['confidence'],
          },
        },
      });

      const responseText = response.text || '{}';
      const parsed: ExtractedOrder = JSON.parse(responseText);
      this.logger.log(
        `Parsed result: ${JSON.stringify(parsed)}`,
        'GeminiService',
      );
      return parsed;
    } catch (error: any) {
      this.logger.error(
        `Gemini extraction error: ${error.message}`,
        error.stack,
        'GeminiService',
      );
      return {
        confidence: 'LOW',
        clarifyingQuestion:
          'Sorry, I no too catch that order details well. Abeg send am like: "2 shirts for Tunde 15000"',
      };
    }
  }
}
