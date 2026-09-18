/**
 * TEMPORARY internal route — opt-in device split analysis.
 * Created by Nina 2026-09-18. Remove after use.
 *
 * GET /api/internal/optin-device-split
 *
 * Returns:
 *  - form_complete event counts (last 7d) to verify GTM fix
 *  - /opt-in-10-mistakes sessions + users by deviceCategory (last 7d)
 */

import { NextResponse } from 'next/server';
import { ga4RunReport } from '../../../../lib/ga4';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. form_complete events (last 7d) — confirm GTM tag is firing
    const formCompleteReport = await ga4RunReport({
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'eventName' }, { name: 'date' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: { matchType: 'CONTAINS', value: 'form_complete' },
        },
      },
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    });

    // 2. All events on /opt-in-10-mistakes (last 7d) by device — for form_complete
    const optinEventsByDevice = await ga4RunReport({
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'deviceCategory' }, { name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        andGroup: {
          expressions: [
            {
              filter: {
                fieldName: 'pagePath',
                stringFilter: { matchType: 'BEGINS_WITH', value: '/opt-in-10-mistakes' },
              },
            },
          ],
        },
      },
    });

    // 3. Sessions + users on /opt-in-10-mistakes by deviceCategory (last 7d)
    const optinSessionsByDevice = await ga4RunReport({
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: { matchType: 'BEGINS_WITH', value: '/opt-in-10-mistakes' },
        },
      },
    });

    // 4. form_complete events on /opt-in-10-mistakes by device (last 7d)
    const optinConvByDevice = await ga4RunReport({
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        andGroup: {
          expressions: [
            {
              filter: {
                fieldName: 'pagePath',
                stringFilter: { matchType: 'BEGINS_WITH', value: '/opt-in-10-mistakes' },
              },
            },
            {
              filter: {
                fieldName: 'eventName',
                stringFilter: { matchType: 'EXACT', value: 'form_complete' },
              },
            },
          ],
        },
      },
    });

    // 5. Thank-you page hits by device (last 7d) as secondary conversion signal
    const thankYouByDevice = await ga4RunReport({
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: { matchType: 'BEGINS_WITH', value: '/opt-in-10-mistakes-thank-you' },
        },
      },
    });

    // Also try common thank-you path variants
    const thankYouVariants = await ga4RunReport({
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'sessions' }],
      dimensionFilter: {
        orGroup: {
          expressions: [
            {
              filter: {
                fieldName: 'pagePath',
                stringFilter: { matchType: 'CONTAINS', value: 'opt-in-10' },
              },
            },
            {
              filter: {
                fieldName: 'pagePath',
                stringFilter: { matchType: 'CONTAINS', value: 'thank-you' },
              },
            },
            {
              filter: {
                fieldName: 'pagePath',
                stringFilter: { matchType: 'CONTAINS', value: 'thankyou' },
              },
            },
          ],
        },
      },
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 20,
    });

    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      formCompleteByDay: formCompleteReport.rows ?? [],
      optinEventsByDevice: optinEventsByDevice.rows ?? [],
      optinSessionsByDevice: optinSessionsByDevice.rows ?? [],
      optinConvByDevice: optinConvByDevice.rows ?? [],
      thankYouByDevice: thankYouByDevice.rows ?? [],
      thankYouVariants: thankYouVariants.rows ?? [],
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
