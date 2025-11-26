export async function generateLeadScore(opportunity: any) {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simple heuristic-based scoring (simulating AI)
    let score = 50;
    const reasons: string[] = [];

    // Value-based scoring
    if (opportunity.value > 10000) {
        score += 20;
        reasons.push("High deal value");
    } else if (opportunity.value > 5000) {
        score += 10;
        reasons.push("Moderate deal value");
    }

    // Stage-based scoring (simulated)
    if (opportunity.stage?.name?.toLowerCase().includes('won')) {
        score = 100;
        reasons.push("Deal won");
    } else if (opportunity.stage?.name?.toLowerCase().includes('negotiation')) {
        score += 15;
        reasons.push("Advanced stage (Negotiation)");
    }

    // Contact completeness (simulated)
    if (opportunity.contact?.email && opportunity.contact?.phone) {
        score += 10;
        reasons.push("Complete contact info");
    }

    // Cap score at 100
    score = Math.min(score, 100);

    return {
        score,
        reasoning: reasons.join(", ") || "Standard opportunity"
    };
}

export async function generateContent(prompt: string, context: any) {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Template-based generation (simulating AI)
    if (prompt.includes("summary")) {
        return `
**Opportunity Summary**
- **Deal:** ${context.title}
- **Value:** $${context.value}
- **Client:** ${context.contact?.name || 'Unknown'}

**Key Insights:**
This opportunity shows strong potential due to ${context.value > 5000 ? 'high value' : 'consistent engagement'}. 
Recommended next step: Follow up within 24 hours to address any pending questions.
        `.trim();
    }

    return "Content generation not supported for this prompt type.";
}
