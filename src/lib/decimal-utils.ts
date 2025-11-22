// Helper function to convert Prisma Decimal types to numbers for client serialization
export function convertDecimalToNumber(obj: any): any {
    if (obj === null || obj === undefined) {
        return obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
        return obj.map(convertDecimalToNumber);
    }

    // Handle objects
    if (typeof obj === 'object') {
        // Check if it's a Decimal object
        if (obj.constructor && obj.constructor.name === 'Decimal') {
            return obj.toNumber();
        }

        // Recursively convert all properties
        const converted: any = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                converted[key] = convertDecimalToNumber(obj[key]);
            }
        }
        return converted;
    }

    return obj;
}
