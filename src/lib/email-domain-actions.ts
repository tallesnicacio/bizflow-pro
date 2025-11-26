'use server';

import { prisma } from './prisma';
import { resendService } from './services/resend-service';
import { revalidatePath } from 'next/cache';

export async function getEmailDomains(tenantId: string) {
    try {
        const domains = await prisma.emailDomain.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
        });
        return domains;
    } catch (error) {
        console.error('Error fetching email domains:', error);
        return [];
    }
}

export async function addEmailDomain(tenantId: string, domain: string) {
    try {
        // Check if domain already exists
        const existing = await prisma.emailDomain.findUnique({
            where: { tenantId_domain: { tenantId, domain } }
        });

        if (existing) {
            return { success: false, error: 'Domain already added' };
        }

        // Add domain to Resend
        const resendResult = await resendService.addDomain(domain);

        if (!resendResult.success) {
            return { success: false, error: resendResult.error };
        }

        // Save to database
        const emailDomain = await prisma.emailDomain.create({
            data: {
                domain,
                tenantId,
                resendDomainId: resendResult.domainId,
                dkimRecord: resendResult.simulated ? 'SIMULATED' : JSON.stringify(resendResult.dnsRecords),
                status: 'PENDING',
            }
        });

        revalidatePath('/settings');
        return { success: true, domain: emailDomain, dnsRecords: resendResult.dnsRecords };
    } catch (error: any) {
        console.error('Error adding email domain:', error);
        return { success: false, error: error.message };
    }
}

export async function verifyEmailDomain(domainId: string, tenantId: string) {
    try {
        const domain = await prisma.emailDomain.findFirst({
            where: { id: domainId, tenantId }
        });

        if (!domain) {
            return { success: false, error: 'Domain not found' };
        }

        if (!domain.resendDomainId) {
            return { success: false, error: 'No Resend domain ID' };
        }

        // Verify with Resend
        const verifyResult = await resendService.verifyDomain(domain.resendDomainId);

        if (!verifyResult.success) {
            return { success: false, error: verifyResult.error };
        }

        // Update database
        await prisma.emailDomain.update({
            where: { id: domainId },
            data: {
                isVerified: verifyResult.verified,
                status: verifyResult.verified ? 'VERIFIED' : 'FAILED',
            }
        });

        revalidatePath('/settings');
        return { success: true, verified: verifyResult.verified };
    } catch (error: any) {
        console.error('Error verifying email domain:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteEmailDomain(domainId: string, tenantId: string) {
    try {
        await prisma.emailDomain.delete({
            where: { id: domainId, tenantId }
        });

        revalidatePath('/settings');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting email domain:', error);
        return { success: false, error: error.message };
    }
}
