// Script de migração — rode localmente: node migrate_crm.mjs
import { createClient } from '@supabase/supabase-js';

const src = createClient(
  'https://debexbvujauikjosmtqx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYmV4YnZ1amF1aWtqb3NtdHF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwMjIzNjQsImV4cCI6MjA2MDU5ODM2NH0.D1yDHNFFiFMy6DkNFhLiUWMFMJAFJKFJ0B3fxGEOWK0'
);

const dst = createClient(
  'https://jfogpofhrbzjwgsbxyuv.supabase.co',
  'sb_publishable_U9oYnGamRl_nVOmseQUn_A_SN3peIWq'
);

async function migrate(srcTable, dstTable, batchSize = 200) {
  let from = 0, total = 0;
  while (true) {
    const { data, error } = await src.from(srcTable).select('*').range(from, from + batchSize - 1);
    if (error) { console.error(`✗ ${srcTable}:`, error.message); break; }
    if (!data?.length) break;
    const { error: e2 } = await dst.from(dstTable).upsert(data, { onConflict: 'id' });
    if (e2) { console.error(`✗ insert ${dstTable}:`, e2.message); break; }
    total += data.length;
    process.stdout.write(`\r  ${dstTable}: ${total}...`);
    if (data.length < batchSize) break;
    from += batchSize;
  }
  console.log(`\n  ✓ ${dstTable}: ${total} rows`);
}

console.log('Migrando CRM...\n');
await migrate('empresas',        'crm_empresas');
await migrate('contatos',        'crm_contatos');
await migrate('leads',           'crm_leads');
await migrate('atividades',      'crm_atividades');
await migrate('tarefas',         'crm_tarefas');
await migrate('lead_servicos',   'crm_lead_servicos');
await migrate('realizado_mensal','crm_realizado_mensal');
console.log('\n✅ Pronto!');
