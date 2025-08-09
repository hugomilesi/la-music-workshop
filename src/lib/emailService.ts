// Usar as instâncias já criadas no supabase.ts para evitar múltiplas instâncias
import { supabase, supabaseAdmin } from './supabase';

// Usar supabaseAdmin para operações de email (tem service_role_key)
const supabaseEmail = supabaseAdmin;

interface EmailTemplate {
  name: string;
  subject: string;
  html_content: string;
  text_content?: string;
  variables: Record<string, string>;
}

interface SendEmailParams {
  to: string;
  templateName: string;
  variables: Record<string, string>;
  userId?: string;
}

class EmailService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = window.location.origin;
  }

  /**
   * Busca um template de email pelo nome
   */
  async getTemplate(name: string): Promise<EmailTemplate | null> {
    try {
      const { data, error } = await supabaseEmail
        .from('email_templates')
        .select('*')
        .eq('name', name)
        .eq('active', true)
        .single();

      if (error) {
        console.error('Erro ao buscar template:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar template:', error);
      return null;
    }
  }

  /**
   * Substitui variáveis no conteúdo do template
   */
  private replaceVariables(content: string, variables: Record<string, string>): string {
    let result = content;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    });

    return result;
  }



  /**
   * Confirma email usando token
   */
  async confirmEmail(token: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.rpc('confirm_email_with_token', {
        token_param: token
      });

      if (error) {
        console.error('Erro ao confirmar email:', error);
        return {
          success: false,
          message: 'Erro ao confirmar email'
        };
      }

      return data;
    } catch (error) {
      console.error('Erro ao confirmar email:', error);
      return {
        success: false,
        message: 'Erro ao confirmar email'
      };
    }
  }

  /**
   * Envia email de confirmação (desabilitado completamente)
   */
  async sendConfirmationEmail(
    userId: string, 
    email: string, 
    userName: string, 
    confirmationUrl?: string
  ): Promise<{ success: boolean; error?: string }> {
    console.log('📧 Email de confirmação desabilitado - não enviando para:', email);
    return { success: true }; // Retorna success para não quebrar o fluxo
  }



  /**
   * Verifica se o envio de emails está habilitado (sempre retorna false para desabilitar completamente)
   */
  private async isEmailEnabled(): Promise<boolean> {
    // Emails completamente desabilitados por solicitação do usuário
    console.log('📧 Envio de emails está completamente desabilitado');
    return false;
  }

  /**
   * Envia email de boas-vindas (desabilitado completamente)
   */
  async sendWelcomeEmail(userId: string, email: string, userName: string, unitName: string): Promise<boolean> {
    console.log('📧 Email de boas-vindas desabilitado - não enviando para:', email);
    return true; // Retorna true para não quebrar o fluxo
  }

  /**
   * Envia email de recuperação de senha (desabilitado completamente)
   */
  async sendPasswordResetEmail(email: string, userName: string): Promise<boolean> {
    console.log('📧 Email de recuperação de senha desabilitado - não enviando para:', email);
    return true; // Retorna true para não quebrar o fluxo
  }

  /**
   * Envia email (desabilitado completamente)
   */
  private async sendEmail(params: SendEmailParams): Promise<boolean> {
    console.log('📧 Envio de email desabilitado - não enviando para:', params.to);
    return true; // Retorna true para não quebrar o fluxo
  }

  /**
   * Método original de envio de email (mantido para referência)
   */
  private async sendEmailOriginal(params: SendEmailParams): Promise<boolean> {
    try {
      const template = await this.getTemplate(params.templateName);
      if (!template) {
        console.error('Template não encontrado:', params.templateName);
        return false;
      }

      const htmlContent = this.replaceVariables(template.html_content, params.variables);
      const textContent = template.text_content 
        ? this.replaceVariables(template.text_content, params.variables)
        : '';
      const subject = this.replaceVariables(template.subject, params.variables);

      // Enviar via Edge Function
      return await this.sendViaEdgeFunction({
        to: params.to,
        subject,
        html: htmlContent,
        text: textContent,
        templateName: params.templateName,
        userId: params.userId
      });
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      return false;
    }
  }

  /**
   * Envia email via API do Resend
   */
  private async sendViaEdgeFunction(params: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    templateName: string;
    userId?: string;
  }): Promise<boolean> {
    try {
      console.log('📧 Enviando email via Resend API...');
      console.log('   Para:', params.to);
      console.log('   Assunto:', params.subject);
      console.log('   Template:', params.templateName);
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
          from: 'LA Music Week <onboarding@resend.dev>',
          to: ['hugogmilesi@gmail.com'], // Temporariamente usando email verificado para testes
          subject: `[TESTE] ${params.subject} - Para: ${params.to}`,
          html: `<p><strong>Email destinado para:</strong> ${params.to}</p><hr>${params.html}`,
          text: `Email destinado para: ${params.to}\n\n${params.text || ''}`
        })
      });

      const result = await response.json();

      if (response.ok && result.id) {
        console.log('✅ Email enviado com sucesso via Resend:', result.id);
        
        // Registrar log de sucesso
        await this.logEmail({
          user_id: params.userId,
          recipient_email: params.to,
          template_name: params.templateName,
          subject: params.subject,
          status: 'sent',
          message_id: result.id
        });
        
        return true;
      } else {
        console.error('❌ Erro ao enviar email via Resend:', result);
        
        // Registrar log de erro
        await this.logEmail({
          user_id: params.userId,
          recipient_email: params.to,
          template_name: params.templateName,
          subject: params.subject,
          status: 'failed',
          error_message: result.message || 'Erro desconhecido'
        });
        
        return false;
      }
    } catch (error) {
      console.error('❌ Erro na requisição para Resend API:', error);
      
      // Registrar log de erro
      await this.logEmail({
        user_id: params.userId,
        recipient_email: params.to,
        template_name: params.templateName,
        subject: params.subject,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      
      return false;
    }
  }

  /**
   * Registra log de email enviado
   */
  async logEmail(logData: {
    user_id?: string;
    recipient_email: string;
    template_name: string;
    subject: string;
    status: string;
    error_message?: string;
    message_id?: string;
  }): Promise<void> {
    try {
      const { error } = await supabaseEmail
        .from('email_logs')
        .insert({
          ...logData,
          sent_at: logData.status === 'sent' ? new Date().toISOString() : null
        });

      if (error) {
        console.error('Erro ao registrar log de email:', error);
      }
    } catch (error) {
      console.error('Erro ao registrar log de email:', error);
    }
  }

  /**
   * Busca logs de email de um usuário
   */
  async getUserEmailLogs(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabaseEmail
        .from('email_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar logs de email:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar logs de email:', error);
      return [];
    }
  }
}

export const emailService = new EmailService();
export default emailService;