/**
 * Test JSON Response Format với OpenRouter
 */

import { AIO } from "../src/index.js";
import dotenv from "dotenv";

dotenv.config();

const aio = new AIO({
  providers: [
    {
      provider: "openrouter",
      apiKeys: [{ key: process.env.OPENROUTER_API_KEY || "" }],
      models: [{ modelId: "arcee-ai/trinity-large-preview:free" }],
    },
  ],
});

async function testJSONResponse() {
  console.log("=== TEST 1: JSON Object Mode (Basic JSON) ===");
  try {
    const response1 = await aio.chatCompletion({
      provider: "openrouter",
      model: "arcee-ai/trinity-large-preview:free",
      messages: [
        {
          role: "user",
          content: "Return a JSON object with name, age, and city for a person named John who is 25 years old and lives in New York",
        },
      ],
      response_format: { type: "json_object" },
    });
    console.log("✅ Response:", response1.choices[0].message.content);
    console.log("✅ Parsed:", JSON.parse(response1.choices[0].message.content));
  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }

  console.log("\n=== TEST 2: JSON Schema Mode (Structured Output) ===");
  try {
    const response2 = await aio.chatCompletion({
      provider: "openrouter",
      model: "arcee-ai/trinity-large-preview:free",
      messages: [
        {
          role: "user",
          content: "Extract information about the product: 'iPhone 15 Pro - Amazing camera, great battery life, but expensive. Rating: 4.5/5'",
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "product_review",
          strict: true,
          schema: {
            type: "object",
            properties: {
              product_name: { type: "string" },
              rating: { type: "number" },
              sentiment: {
                type: "string",
                enum: ["positive", "negative", "neutral"],
              },
              key_features: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["product_name", "rating", "sentiment", "key_features"],
            additionalProperties: false,
          },
        },
      },
    });
    console.log("✅ Response:", response2.choices[0].message.content);
    const parsed = JSON.parse(response2.choices[0].message.content);
    console.log("✅ Parsed:");
    console.log("  - Product:", parsed.product_name);
    console.log("  - Rating:", parsed.rating);
    console.log("  - Sentiment:", parsed.sentiment);
    console.log("  - Features:", parsed.key_features);
  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }

  console.log("\n=== TEST 3: Complex Schema with Nested Objects ===");
  try {
    const response3 = await aio.chatCompletion({
      provider: "openrouter",
      model: "arcee-ai/trinity-large-preview:free",
      messages: [
        {
          role: "user",
          content: "Create a movie recommendation: Inception (2010) directed by Christopher Nolan, starring Leonardo DiCaprio",
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "movie_info",
          strict: true,
          schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              year: { type: "number" },
              director: { type: "string" },
              cast: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    role: { type: "string" },
                  },
                  required: ["name", "role"],
                  additionalProperties: false,
                },
              },
              genres: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["title", "year", "director", "cast", "genres"],
            additionalProperties: false,
          },
        },
      },
    });
    console.log("✅ Response:", response3.choices[0].message.content);
    const parsed = JSON.parse(response3.choices[0].message.content);
    console.log("✅ Parsed:");
    console.log("  - Title:", parsed.title);
    console.log("  - Year:", parsed.year);
    console.log("  - Director:", parsed.director);
    console.log("  - Cast:", parsed.cast);
    console.log("  - Genres:", parsed.genres);
  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }

  console.log("\n=== TEST 4: Plain Text (No JSON) ===");
  try {
    const response4 = await aio.chatCompletion({
      provider: "openrouter",
      model: "arcee-ai/trinity-large-preview:free",
      messages: [{ role: "user", content: "Say hello in a friendly way" }],
      // Không có response_format = plain text
    });
    console.log("✅ Response:", response4.choices[0].message.content);
  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }
}

testJSONResponse();
