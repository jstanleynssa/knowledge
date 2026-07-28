import { createClient } from '@supabase/supabase-js';
async function main() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { count: total } = await sb.from('source_chunks').select('*', { count: 'exact', head: true });
  console.log('Total chunks in DB:', total?.toLocaleString());

  // How many CMSPDF docs already have chunks?
  // Paginate alreadyChunked set (same as the embed script)
  const alreadyChunked = new Set<string>();
  let offset = 0;
  while (true) {
    const { data } = await sb.from('source_chunks').select('source_document_id').range(offset, offset + 999);
    if (!data || data.length === 0) break;
    data.forEach(r => alreadyChunked.add(r.source_document_id));
    if (data.length < 1000) break;
    offset += 1000;
  }
  console.log('Unique doc IDs with chunks:', alreadyChunked.size.toLocaleString());

  // Get all CMSPDF doc IDs
  const cmsPdfIds: string[] = [];
  let docOffset = 0;
  while (true) {
    const { data } = await sb.from('source_documents')
      .select('id').eq('source_type','cms').eq('doc_kind','rule')
      .is('superseded_at', null).like('section_number','CMSPDF:%')
      .range(docOffset, docOffset + 999);
    if (!data || data.length === 0) break;
    cmsPdfIds.push(...data.map(r => r.id));
    if (data.length < 1000) break;
    docOffset += 1000;
  }
  console.log('Total CMSPDF docs:', cmsPdfIds.length.toLocaleString());

  const alreadyEmbedded = cmsPdfIds.filter(id => alreadyChunked.has(id));
  const notYet = cmsPdfIds.filter(id => !alreadyChunked.has(id));
  console.log('CMSPDF already embedded:', alreadyEmbedded.length.toLocaleString());
  console.log('CMSPDF not yet embedded:', notYet.length.toLocaleString());
}
main().catch(console.error);
