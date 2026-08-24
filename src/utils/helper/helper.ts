import { createHash } from 'crypto';

export function hashPayload(data: any): string {
    // // Exclude idempotencyKey itself from the hash — only hash the actual job content
    // const { idempotencyKey, ...payload } = data;
    return createHash('sha256').update(JSON.stringify(data)).digest('hex');
}