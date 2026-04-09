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

// 2. Acessa Ações - Master direto pelo ID e consulta o data source
console.log("\n--- Testando Notion API (Ações - Master) ---");
const acoesMasterDbId = "7f15aad5-243d-4192-951f-f8495748a53d";
const acoesMasterDsId = "267b0342-ff4c-4e14-bfe0-67e10e2318df";

try {
  const db = await notion.databases.retrieve({ database_id: acoesMasterDbId });
  console.log("Database:", db.title?.[0]?.plain_text ?? "(sem título)");
  console.log("Data sources:", db.data_sources?.map((ds) => ds.name).join(", "));
} catch (e) {
  console.error("❌ Erro ao acessar database:", e.message);
  console.error("   → A integration 'Claude Code' está conectada à página Ações - Master?");
  process.exit(1);
}

try {
  const q = await notion.dataSources.query({
    data_source_id: acoesMasterDsId,
    page_size: 3,
  });
  console.log(`Query retornou ${q.results.length} páginas de exemplo`);
  for (const r of q.results.slice(0, 3)) {
    const title =
      r.properties?.Atividade?.title?.[0]?.plain_text ??
      r.properties?.Name?.title?.[0]?.plain_text ??
      "(sem título)";
    console.log(` - ${title}`);
  }
} catch (e) {
  console.error("❌ Erro ao consultar data source:", e.message);
  process.exit(1);
}

console.log("\n✅ Smoke test concluído com sucesso!");
console.log("Pronto para rodar: npm start");
