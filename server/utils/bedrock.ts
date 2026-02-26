import {
    BedrockRuntimeClient,
    InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

const config = useRuntimeConfig();

const bedrock = new BedrockRuntimeClient({
    region: config.awsRegion,
    credentials: {
        accessKeyId: config.awsAccessKeyId,
        secretAccessKey: config.awsSecretAccessKey,
    },
});

// Simple in-memory cache for embeddings per text
const EMBED_CACHE_TTL = 1000 * 60 * 60; // 1 hour
const embedCache: Map<string, { embedding: number[]; ts: number }> = new Map();

export async function getEmbeddings(texts: string[]) {
    if (!texts.length) return [];

    // Prepare arrays for uncached and result mapping
    const uncachedIndexes: number[] = [];
    const uncachedTexts: string[] = [];
    const results: Array<number[] | null> = new Array(texts.length).fill(null);
    const now = Date.now();

    for (let i = 0; i < texts.length; i++) {
        const t = texts[i];
        if (!t) {
            results[i] = null;
            continue;
        }
        const c = embedCache.get(t);
        if (c && now - c.ts < EMBED_CACHE_TTL) {
            results[i] = c.embedding;
        } else {
            uncachedIndexes.push(i);
            uncachedTexts.push(t);
        }
    }

    if (uncachedTexts.length > 0) {
        // Call Bedrock for uncached texts
        const command = new InvokeModelCommand({
            modelId: "cohere.embed-english-v3",
            contentType: "application/json",
            accept: "application/json",
            body: JSON.stringify({
                texts: uncachedTexts,
                input_type: "search_document",
                embedding_types: ["float"],
            }),
        });

        const response = await bedrock.send(command);
        const body = await response.body.transformToString();
        const parsed = JSON.parse(body);

        if (!parsed.embeddings?.float || !Array.isArray(parsed.embeddings.float)) {
            throw new Error("Cohere did not return embeddings");
        }

        const returned: number[][] = parsed.embeddings.float;
        if (returned.length !== uncachedTexts.length) {
            // If mismatch, still attempt to align by index but warn
            console.warn('Embedding service returned different number of embeddings than requested', returned.length, uncachedTexts.length);
        }

        // Fill results and cache
        for (let k = 0; k < uncachedIndexes.length; k++) {
            const idx = uncachedIndexes[k];
            const emb = returned[k] || null;
            if (emb) {
                results[idx] = emb;
                // store in cache
                try {
                    embedCache.set(texts[idx], { embedding: emb, ts: Date.now() });
                } catch (e) {
                    // ignore cache failures
                }
            } else {
                results[idx] = null;
            }
        }
    }

    // Convert any nulls to empty embedding arrays to avoid downstream crashes
    return results.map((r) => (r || []));
}
