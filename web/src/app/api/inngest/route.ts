import { serve } from 'inngest/next';
import { inngest } from '../../../inngest/client';
import { processCsvUpload } from '../../../inngest/functions';
import { discoverScholarships, processScholarshipLink } from '../../../inngest/crawler';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processCsvUpload, discoverScholarships, processScholarshipLink],
  servePath: '/api/inngest/',
});
