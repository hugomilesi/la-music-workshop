import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface EmailRequest {
  to: string
  subject: string
  html: string
  text?: string
  templateName?: string
  userId?: string
}

interface EmailResponse {
  success: boolean
  message: string
  messageId?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client for logging
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Function to log email in database
async function logEmail(data: {
  userId?: string
  recipientEmail: string
  templateName: string
  subject: string
  status: string
  messageId?: string
  errorMessage?: string
}) {
  try {
    const { error } = await supabase
      .from('email_logs')
      .insert({
        user_id: data.userId,
        recipient_email: data.recipientEmail,
        template_name: data.templateName,
        subject: data.subject,
        status: data.status,
        message_id: data.messageId,
        error_message: data.errorMessage,
        sent_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('Erro ao registrar email no banco:', error)
    }
  } catch (err) {
    console.error('Erro ao registrar email:', err)
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, text, templateName, userId }: EmailRequest = await req.json()

    // Validate required fields
    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ success: false, message: 'Missing required fields: to, subject, html' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Use Resend API with correct credentials
    const resendApiKey = Deno.env.get('RESEND_API_KEY') || 're_2GeEPSNF_Ks8GZt547KLnXEE7NugjnKHC'
    const senderEmail = 'team@latecnology.com'
    const senderName = 'LA-Music'

    console.log('📧 Enviando email para:', to)
    console.log('📧 Assunto:', subject)
    console.log('📧 Remetente:', `${senderName} <${senderEmail}>`)

    // Send email via Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${senderName} <${senderEmail}>`,
        to: [to],
        subject: subject,
        html: html,
        text: text || html.replace(/<[^>]*>/g, '') // Strip HTML tags for text version
      })
    })

    const resendResult = await resendResponse.json()
    
    if (resendResponse.ok) {
      console.log('✅ Email enviado via Resend:', resendResult.id)
      
      // Log successful email in database
      await logEmail({
        userId,
        recipientEmail: to,
        templateName: templateName || 'custom',
        subject,
        status: 'sent',
        messageId: resendResult.id
      })

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email enviado com sucesso',
          messageId: resendResult.id 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      console.error('❌ Erro ao enviar email via Resend:', resendResult)
      
      // Log failed email in database
      await logEmail({
        userId,
        recipientEmail: to,
        templateName: templateName || 'custom',
        subject,
        status: 'failed',
        errorMessage: JSON.stringify(resendResult)
      })

      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Erro ao enviar email',
          error: resendResult 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('❌ Erro na Edge Function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})