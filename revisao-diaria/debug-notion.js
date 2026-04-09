import "dotenv/config";
import { Client as NotionClient } from "@notionhq/client";

const notion = new NotionClient({ auth: process.env.NOTION_TOKEN });

console.log("=== DIAGNÓSTICO NOTION ===\n");

// 1. Busca sem filtro (pega TUDO que a integration consegue ver)
console.log("1. Busca SEM filtro (tudo):");
try {
  const all = await notion.search({ page_size: 10 });
  console.log(`   Total encontrado: ${all.results.length}`);
  for (const r of all.results) {
    const title =
      r.object === "data_source"
        ? r.name ?? r.title?.[0]?.plain_text ?? "(sem título)"
        : r.object === "database"
          ? r.title?.[0]?.plain_text ?? "(sem título)"
          : r.properties?.Name?.title?.[0]?.plain_text ??
            r.properties?.Atividade?.title?.[0]?.plain_text ??
            r.properties?.title?.title?.[0]?.plain_text ??
            "(sem título)";
    console.log(`   - ${r.object}: ${title}`);
    console.log(`     id: ${r.id}`);
    console.log(`     url: ${r.url}`);
  }
} catch (e) {
  console.error(`   ERRO: ${e.message}`);
}

// 2. Tenta acessar o Ações - Master direto pelo ID (sem pelo search)
console.log("\n2. Tentando acessar Ações - Master pelo ID direto:");
const acoesMasterId = "7f15aad5-243d-4192-951f-f8495748a53d";
try {
  const db = await notion.databases.retrieve({ database_id: acoesMasterId });
  console.log(`   ✅ Acesso OK`);
  console.log(`   title: ${db.title?.[0]?.plain_text}`);
  console.log(`   object: ${db.object}`);
  console.log(`   data_sources:`, db.data_sources?.map((ds) => ({ id: ds.id, name: ds.name })));
} catch (e) {
  console.error(`   ❌ ERRO: ${e.message}`);
  console.error(`   → A integration provavelmente não tem acesso a esta página.`);
}

// 3. Verifica os detalhes da integration atual
console.log("\n3. Integration atual:");
try {
  const me = await notion.users.me({});
  console.log(`   bot.id: ${me.id}`);
  console.log(`   bot.name: ${me.name}`);
  console.log(`   bot.type: ${me.type}`);
  if (me.bot) {
    console.log(`   bot.owner: ${JSON.stringify(me.bot.owner)}`);
    console.log(`   bot.workspace_name: ${me.bot.workspace_name}`);
  }
} catch (e) {
  console.error(`   ERRO: ${e.message}`);
}
