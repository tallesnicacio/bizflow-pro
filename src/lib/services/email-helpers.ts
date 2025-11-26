'use server';

import { emailService } from './email-service';
import { emailTemplates } from './email-templates';

/**
 * Email Helper Functions
 * High-level functions that combine templates with the email service
 */

export async function sendWelcomeEmail(
    to: string,
    data: {
        userName: string;
        companyName?: string;
        loginUrl: string;
    }
) {
    const html = emailTemplates.welcome(data);

    return await emailService.sendEmail(
        to,
        'Bem-vindo ao BizFlow Pro!',
        html
    );
}

export async function sendNewLeadNotification(
    to: string | string[],
    data: {
        leadName: string;
        leadEmail: string;
        formName: string;
        submissionData: Record<string, any>;
        viewUrl: string;
    }
) {
    const html = emailTemplates.newLead(data);

    return await emailService.sendEmail(
        to,
        `🎯 Novo Lead: ${data.leadName}`,
        html
    );
}

export async function sendOpportunityStageChangeNotification(
    to: string | string[],
    data: {
        opportunityTitle: string;
        oldStage: string;
        newStage: string;
        contactName: string;
        value: number;
        viewUrl: string;
    }
) {
    const html = emailTemplates.opportunityStageChange(data);

    return await emailService.sendEmail(
        to,
        `📊 Oportunidade Atualizada: ${data.opportunityTitle}`,
        html
    );
}

export async function sendFormSubmissionConfirmation(
    to: string,
    data: {
        contactName: string;
        formName: string;
        message?: string;
    }
) {
    const html = emailTemplates.formSubmissionConfirmation(data);

    return await emailService.sendEmail(
        to,
        `Confirmação: ${data.formName}`,
        html
    );
}

/**
 * Generic email sender with custom HTML
 */
export async function sendCustomEmail(
    to: string | string[],
    subject: string,
    htmlContent: string,
    from?: string
) {
    return await emailService.sendEmail(to, subject, htmlContent, from);
}
