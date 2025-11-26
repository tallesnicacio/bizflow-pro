/**
 * Email Templates for BizFlow Pro
 * Provides reusable HTML templates for common email scenarios
 */

interface WelcomeEmailData {
    userName: string;
    companyName?: string;
    loginUrl: string;
}

interface NewLeadEmailData {
    leadName: string;
    leadEmail: string;
    formName: string;
    submissionData: Record<string, any>;
    viewUrl: string;
}

interface OpportunityStageChangeData {
    opportunityTitle: string;
    oldStage: string;
    newStage: string;
    contactName: string;
    value: number;
    viewUrl: string;
}

interface FormSubmissionConfirmationData {
    contactName: string;
    formName: string;
    message?: string;
}

export const emailTemplates = {
    /**
     * Welcome email for new users
     */
    welcome({ userName, companyName, loginUrl }: WelcomeEmailData): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bem-vindo ao BizFlow Pro</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Bem-vindo ao BizFlow Pro!</h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Olá <strong>${userName}</strong>,
                            </p>

                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                ${companyName ? `Sua conta no <strong>${companyName}</strong> foi criada com sucesso!` : 'Sua conta foi criada com sucesso!'}
                                Estamos muito felizes em tê-lo conosco.
                            </p>

                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                O BizFlow Pro é sua plataforma completa de CRM e automação de negócios.
                                Comece a gerenciar seus leads, oportunidades e processos de vendas agora mesmo.
                            </p>

                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <a href="${loginUrl}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                                            Acessar Plataforma
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                            <p style="color: #6c757d; font-size: 14px; margin: 0;">
                                © ${new Date().getFullYear()} BizFlow Pro. Todos os direitos reservados.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `.trim();
    },

    /**
     * Notification email for new leads
     */
    newLead({ leadName, leadEmail, formName, submissionData, viewUrl }: NewLeadEmailData): string {
        const dataRows = Object.entries(submissionData)
            .map(([key, value]) => `
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e9ecef; font-weight: bold; color: #495057;">${key}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #e9ecef; color: #6c757d;">${value}</td>
                </tr>
            `)
            .join('');

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Novo Lead Recebido</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px 20px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🎯 Novo Lead Recebido!</h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 30px;">
                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Um novo lead foi capturado através do formulário <strong>${formName}</strong>.
                            </p>

                            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                                <h3 style="color: #495057; margin: 0 0 10px 0; font-size: 18px;">Informações do Lead</h3>
                                <p style="margin: 5px 0; color: #6c757d;"><strong>Nome:</strong> ${leadName}</p>
                                <p style="margin: 5px 0; color: #6c757d;"><strong>Email:</strong> ${leadEmail}</p>
                            </div>

                            <h3 style="color: #495057; margin: 0 0 15px 0; font-size: 18px;">Dados Submetidos</h3>
                            <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e9ecef; border-radius: 6px;">
                                ${dataRows}
                            </table>

                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                                <tr>
                                    <td align="center">
                                        <a href="${viewUrl}" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">
                                            Ver no CRM
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                            <p style="color: #6c757d; font-size: 14px; margin: 0;">
                                BizFlow Pro - Sistema de CRM
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `.trim();
    },

    /**
     * Notification for opportunity stage changes
     */
    opportunityStageChange({ opportunityTitle, oldStage, newStage, contactName, value, viewUrl }: OpportunityStageChangeData): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mudança de Estágio</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); padding: 30px 20px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">📊 Oportunidade Atualizada</h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 30px;">
                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                A oportunidade <strong>${opportunityTitle}</strong> mudou de estágio no pipeline.
                            </p>

                            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td width="50%" style="padding: 10px; text-align: center;">
                                            <div style="color: #dc3545; font-size: 14px; font-weight: bold; margin-bottom: 5px;">De:</div>
                                            <div style="background-color: #fff; padding: 10px; border-radius: 4px; border: 2px solid #dc3545;">
                                                ${oldStage}
                                            </div>
                                        </td>
                                        <td width="50%" style="padding: 10px; text-align: center;">
                                            <div style="color: #28a745; font-size: 14px; font-weight: bold; margin-bottom: 5px;">Para:</div>
                                            <div style="background-color: #fff; padding: 10px; border-radius: 4px; border: 2px solid #28a745;">
                                                ${newStage}
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <div style="background-color: #e7f3ff; padding: 20px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #007bff;">
                                <p style="margin: 5px 0; color: #495057;"><strong>Contato:</strong> ${contactName}</p>
                                <p style="margin: 5px 0; color: #495057;"><strong>Valor:</strong> R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>

                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <a href="${viewUrl}" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">
                                            Ver Oportunidade
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                            <p style="color: #6c757d; font-size: 14px; margin: 0;">
                                BizFlow Pro - Sistema de CRM
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `.trim();
    },

    /**
     * Confirmation email for form submissions
     */
    formSubmissionConfirmation({ contactName, formName, message }: FormSubmissionConfirmationData): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Formulário Recebido</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">✅ Formulário Recebido!</h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Olá <strong>${contactName}</strong>,
                            </p>

                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Recebemos seu formulário <strong>${formName}</strong> com sucesso!
                            </p>

                            ${message ? `
                            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #667eea;">
                                <p style="color: #495057; font-size: 15px; line-height: 1.6; margin: 0;">
                                    ${message}
                                </p>
                            </div>
                            ` : ''}

                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0;">
                                Nossa equipe entrará em contato em breve. Obrigado pelo seu interesse!
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                            <p style="color: #6c757d; font-size: 14px; margin: 0;">
                                Este é um email automático, por favor não responda.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `.trim();
    },
};
