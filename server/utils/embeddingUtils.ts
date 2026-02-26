import { cleanText } from './cleanText';
import { getEmbeddings } from './bedrock';
import { cosineSimilarity } from './cosine';

export async function groupSimilarTexts(
    texts: string[],
    threshold = 0.85,
    maxGroups?: number,
    options?: { fuzzyMerge?: boolean; maxEditDistance?: number; relativeEditDistance?: number }
): Promise<{ representative: string; similar_questions: string[]; total_count: number }[]> {
    // Map cleaned text -> array of original texts (preserve all occurrences)
    const cleanedMap = new Map<string, string[]>();
    const frequencyMap = new Map<string, number>();

    texts.forEach((text) => {
        const cleaned = cleanText(text);
        if (!cleaned) return;

        const arr = cleanedMap.get(cleaned) || [];
        arr.push(text);
        cleanedMap.set(cleaned, arr);

        frequencyMap.set(cleaned, (frequencyMap.get(cleaned) || 0) + 1);
    });

    const cleanedTexts = Array.from(frequencyMap.keys());
    if (cleanedTexts.length === 0) return [];

    const embeddings = await getEmbeddings(cleanedTexts);
    const used = new Set<number>();
    const clusters: { [key: string]: string[] } = {};

    // Helper to normalize spacing before punctuation (e.g., "foo ?" -> "foo?")
    const normalizeSpacingPunctuation = (s: string) => (s || '').replace(/\s+([?.!,;:])/g, '$1').trim();

    const mostFrequent = (arr: string[]) => {
        const freq = new Map<string, number>();
        for (const a of arr) {
            const v = (a || '').toString();
            freq.set(v, (freq.get(v) || 0) + 1);
        }
        let best = arr[0] || '';
        let bestCount = 0;
        for (const [k, c] of freq.entries()) {
            if (c > bestCount) {
                best = k;
                bestCount = c;
            }
        }
        return normalizeSpacingPunctuation(best);
    };

    for (let i = 0; i < embeddings.length; i++) {
        if (used.has(i)) continue;

        // Start group with all original occurrences for this cleaned text
        const group: string[] = [...(cleanedMap.get(cleanedTexts[i]) || [])];
        used.add(i);

        for (let j = i + 1; j < embeddings.length; j++) {
            if (used.has(j)) continue;
            const sim = cosineSimilarity(embeddings[i], embeddings[j]);
            if (sim >= threshold) {
                // Append all occurrences for this similar cleaned text
                group.push(...(cleanedMap.get(cleanedTexts[j]) || []));
                used.add(j);
            }
        }

        // Choose a representative that is the most frequent original variant (normalized spacing)
        const repKey = mostFrequent(cleanedMap.get(cleanedTexts[i]) || [cleanedTexts[i]]);
        clusters[repKey] = group.map((g) => normalizeSpacingPunctuation(g));
    }

    let result = Object.entries(clusters).map(([key, group]) => {
        // total_count is sum of frequencies of the cleaned texts that contributed to this group
        // Since group may contain duplicates and different forms, we recompute by cleaning each member
        // Sum frequencies for unique cleaned keys contributed to this group to avoid double-counting
        const uniqueCleaned = new Set<string>();
        for (const q of group) {
            const ck = cleanText(q) || q;
            uniqueCleaned.add(ck);
        }
        let total_count = 0;
        uniqueCleaned.forEach((ck) => {
            total_count += frequencyMap.get(ck) || 0;
        });

        // Choose the representative as the most frequent original variant within this group,
        // normalized for spacing/punctuation
        const representative = mostFrequent(group);

        return {
            representative,
            similar_questions: group.map((g) => normalizeSpacingPunctuation(g)),
            total_count,
        };
    });

    // Optional fuzzy merge step: merge clusters that are edit-distance close
    if (options?.fuzzyMerge) {
        const maxEdit = typeof options.maxEditDistance === 'number' ? options.maxEditDistance : 2;
        const relEdit = typeof options.relativeEditDistance === 'number' ? options.relativeEditDistance : 0.15;

        // simple Levenshtein distance
        const levenshtein = (a: string, b: string) => {
            const m = a.length;
            const n = b.length;
            if (m === 0) return n;
            if (n === 0) return m;
            const dp: number[] = new Array(n + 1);
            for (let j = 0; j <= n; j++) dp[j] = j;
            for (let i = 1; i <= m; i++) {
                let prev = dp[0];
                dp[0] = i;
                for (let j = 1; j <= n; j++) {
                    const temp = dp[j];
                    const cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
                    dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
                    prev = temp;
                }
            }
            return dp[n];
        };

        const normalized = (s: string) => normalizeSpacingPunctuation((s || '').toLowerCase());

        const mergedFlags = new Array(result.length).fill(false);
        for (let i = 0; i < result.length; i++) {
            if (mergedFlags[i]) continue;
            for (let j = i + 1; j < result.length; j++) {
                if (mergedFlags[j]) continue;
                const a = normalized(result[i].representative);
                const b = normalized(result[j].representative);
                if (!a || !b) continue;
                const dist = levenshtein(a, b);
                const rel = dist / Math.max(a.length, b.length);
                if (dist <= maxEdit || rel <= relEdit) {
                    // merge j into i
                    result[i].similar_questions = result[i].similar_questions.concat(result[j].similar_questions);
                    result[i].total_count = (result[i].total_count || 0) + (result[j].total_count || 0);
                    // re-evaluate representative based on combined similar_questions
                    result[i].representative = mostFrequent(result[i].similar_questions);
                    mergedFlags[j] = true;
                }
            }
        }

        result = result.filter((_, idx) => !mergedFlags[idx]);
    }

    result = result.sort((a, b) => b.total_count - a.total_count);

    if (maxGroups) {
        return result.slice(0, maxGroups);
    }

    return result;
}
