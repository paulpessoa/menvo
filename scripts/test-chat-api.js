require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// This simulates the logic in lib/chat/chat-service.ts
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getOrCreateConversation(mentorId, menteeId) {
  // Logic from chat-service
  const { data, error } = await supabase
    .from('conversations')
    .select('id')
    .or(`and(mentor_id.eq.${mentorId},mentee_id.eq.${menteeId}),and(mentor_id.eq.${menteeId},mentee_id.eq.${mentorId})`)
    .maybeSingle();
  
  if (error) throw error;
  return data?.id;
}

async function getMessages(conversationId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data;
}

async function run() {
  const paulId = '0737122a-0579-4981-9802-41883d6563a3';
  // Test with one of the provided mentor IDs (based on conversations check)
  // fb9a0736-11fe-4b3c-95fe-a28a27788f15 -> mentor b64b6a94-6a52-47c4-944f-960d1dc9f570
  const otherUserId = 'b64b6a94-6a52-47c4-944f-960d1dc9f570'; 
  
  try {
    const convId = await getOrCreateConversation(otherUserId, paulId);
    console.log('Conversation ID found:', convId);
    
    if (convId) {
      const messages = await getMessages(convId);
      console.log('Messages count:', messages.length);
      console.log('First 2 messages:', messages.slice(0, 2));
    } else {
      console.log('No conversation found.');
    }
  } catch (err) {
    console.error(err);
  }
}

run();
