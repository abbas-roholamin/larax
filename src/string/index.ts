class Str {
    static contains(str: string, keys: string[] | string, ignoreCase = false): boolean {
        if (typeof keys === "string") {
            keys = [keys];
        }

        const strSet = new Set(ignoreCase ? str.toLowerCase().split('') : str.split(''));

        return keys.some((key) => {
            if (key === "") {
                return false;
            }
            const normalizedKey = ignoreCase ? key.toLowerCase() : key;
            return normalizedKey.split('').some(char => strSet.has(char));
        });
    }
}


export default Str;