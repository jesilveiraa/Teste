import "dotenv/config";
import { execSync } from "node:child_process";
import { Client as NotionClient } from "@notionhq/client";

const notion = new NotionClient({ auth: process.env.NOTION_TOKEN });

console.log("Iniciando smoke test...");
console.log("NOTION_TOKEN presente:", !!process.env.NOTION_TOKEN);

// 1. Verifica se o claude CLI está instalado e logado
console.log("\n--- Testando Claude Code CLI ---");
try {
  const version = execSync("claude --version", { encoding: "utf8" }).trim();
  console.log("claude CLI:", version);
} catch (e) {
  console.error(
    "❌ claude CLI não encontrado. Instale com: sudo npm install -g @anthropic-ai/claude-code",
  );
  process.exit(1);
}

// 2. Testa conexão com Notion diretamente
console.log("\n--- Testando Notion API ---");
const searchResult = await notion.search({
  query: "Ações",
  filter: { property: "object", value: "data_source" },
  page_size: 3,
});

console.log("Resultados encontrados:", searchResult.results.length);
if (searchResult.results.length === 0) {
  console.error(
    "⚠️  Nenhum resultado. A integration 'Revisao Diaria' está conectada à página Ações - Master? (menu ... → Connections)",
  );
  process.exit(1);
}
for (const r of searchResult.results) {
  const title =
    r.object === "data_source"
      ? r.name ?? r.title?.[0]?.plain_text ?? "(sem título)"
      : r.properties?.title?.title?.[0]?.plain_text ?? "(sem título)";
  console.log(" -", r.object, ":", title);
}

console.log("\n✅ Smoke test concluído com sucesso!");
console.log("Pronto para rodar: npm start");
