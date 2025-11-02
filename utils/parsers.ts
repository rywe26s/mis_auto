
export function parseRequestParams(paramsString: string): Record<string, string> {
    const result: Record<string, string> = {};

    if (!paramsString) {
        return result;
    }

    paramsString.split(', ').forEach(part => {
        const delimiterIndex = part.indexOf(': ');

        if (delimiterIndex === -1) return;
        const key = part.substring(0, delimiterIndex);
        const value = part.substring(delimiterIndex + 2);

        if (key) {
            result[key] = value;
        }
    });

    return result;
}