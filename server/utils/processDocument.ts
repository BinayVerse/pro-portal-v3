import { CustomError } from './custom.error';
import axios, { AxiosError } from 'axios';
import { logger } from './logger';

export async function processDocument(
    bucketName: string,
    folderName: string,
    orgName: string,
    orgId: string,
    userId: string,
    documents: { id: string; name: string; type: string; link: string }[],
    authToken: string,
    departments: string[],
): Promise<any> {
    const config = useRuntimeConfig();
    const botEndpoint = config.public.botEndpoint;

    const apiUrl = `${botEndpoint}process-document`;

    const payload = {
        bucketName,
        folderName,
        orgName,
        industry: "HR",
        orgId,
        userId,
        documents,
        departments,
    };

    // console.log('Process payload:', payload);

    try {
        const response = await axios.post(apiUrl, payload, {
            headers: {
                Authorization: `Bearer ${authToken}`,
                'Content-Type': 'application/json',
            },
            // timeout: 10000,
        });

        if (response.status == 200) {
            return response.data;
        } else {
            throw new Error(`Unexpected response status: ${response.status}`);
        }
    } catch (error: any) {
        // If the error is an axios error
        if (error.response) {
            const errorMessage = error.response.data?.message || 'Failed to process document';
            logger.error({ status: error.response.status, message: errorMessage, orgId }, 'Error processing document');
            throw new CustomError(errorMessage, error.response.status);
        } else {
            // Network or other unexpected errors
            logger.error({ error: error?.message || error, orgId }, 'Error processing document');
            throw new CustomError(error.message || 'An unexpected error occurred', 500);
        }
    }
}
