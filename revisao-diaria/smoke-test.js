import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { Client as NotionClient } from "@notionhq/client";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const notion = new NotionClient({ auth: process.env.NOTION_TOKEN });

console.log("Iniciando smoke test...");
console.log("ANTHROPIC_API_KEY presente:", !!process.env.ANTHROPIC_API_KEY);
console.log("NOTION_TOKEN presente:", !!process.env.NOTION_TOKEN);

// 1. Testa conexão com Notion diretamente
console.log("\n--- Testando Notion API ---");
const searchResult = await notion.search({
  query: "Ações",
  filter: { property: "object", value: "data_source" },
  page_size: 3,
});

console.log("Resultados encontrados:", searchResult.results.length);
for (const r of searchResult.results) {
  const title =
    r.object === "data_source"
      ? r.name ?? r.title?.[0]?.plain_text ?? "(sem título)"
      : r.properties?.title?.title?.[0]?.plain_text ?? "(sem título)";
  console.log(" -", r.object, ":", title);
}

// 2. Testa conexão com Anthropic API
console.log("\n--- Testando Anthropic API ---");
const response = await anthropic.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 100,
  messages: [{ role: "user", content: "Responda apenas: API funcionando." }],
});
console.log("Resposta Claude:", response.content[0].text);

console.log("\n✅ Smoke test concluído com sucesso!");
