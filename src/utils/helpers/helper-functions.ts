

export function getTimeoutPromise(
    fn: any,
    timeoutMs: number
): (...args) => Promise<any> {
    return async function (...args): Promise<any> {
        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
        );

        const resultPromise = (async () => fn(...args))();

        return Promise.race([resultPromise, timeout]);
    };
}