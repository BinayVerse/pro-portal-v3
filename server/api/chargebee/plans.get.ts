import { query } from '../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const q = `
      SELECT id, title, price_currency, price_amount, duration, users, limit_requests, features, created_at, updated_at, chargebee_plan_id, active, public, trial_period_days, storage_limit_gb, support_level, contact_sales, display_order, recommended, metadata
      FROM public.plans
      WHERE active = true AND public = true
      ORDER BY display_order ASC, price_amount ASC
    `

    const res = await query(q, [])
    const rows = res.rows || []

    // Debug raw flag
    const queryParams = getQuery(event) as any
    if (queryParams.raw === '1' || queryParams.raw === 'true' || queryParams.debug === '1' || queryParams.debug === 'true') {
      return { success: true, data: rows }
    }

    const familyParam = (queryParams.family || '').toString().trim().toLowerCase()

    const mapped = rows
      .map((r: any) => {
        const metadata = r.metadata || {}
        let features: string[] = []
        try {
          if (Array.isArray(r.features)) features = r.features
          else if (typeof r.features === 'string') features = JSON.parse(r.features)
        } catch (e) {
          // fallback: if features is a JSON-string or text
          try {
            const parsed = JSON.parse(String(r.features))
            if (Array.isArray(parsed)) features = parsed
          } catch {
            // ignore
          }
        }

        if ((!features || features.length === 0) && metadata && metadata.features) {
          if (Array.isArray(metadata.features)) features = metadata.features
          else if (typeof metadata.features === 'string') features = String(metadata.features).split(/\r?\n|[,;]+/).map((s) => s.trim()).filter(Boolean)
        }

        const productFamily = metadata?.product_family || metadata?.product_family_name || metadata?.family || null

        const interval = (String(r.duration || '').toLowerCase().includes('year') ? 'year' : 'month')

        return {
          id: r.id,
          chargebee_plan_id: r.chargebee_plan_id,
          name: r.title,
          description: metadata?.description || '',
          price: Number(r.price_amount) || 0,
          currency: r.price_currency || 'USD',
          interval,
          features,
          popular: !!r.recommended,
          createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
          product_family: productFamily || null,
          _raw: r,
        }
      })
      .filter(Boolean)

    const out = familyParam ? mapped.filter((p: any) => (p.product_family || '').toString().toLowerCase() === familyParam) : mapped

    return { success: true, data: out }
  } catch (err: any) {
    console.error('DB plans fetch error:', err?.message || err)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch plans from DB' })
  }
})
