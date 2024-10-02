export function replacer(_key: string, value: any): string {
    return typeof value === 'bigint' ? value.toString() : value;
}
