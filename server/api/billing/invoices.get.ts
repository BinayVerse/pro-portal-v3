// server/api/billing/invoices.get.ts
import { defineEventHandler, getQuery, setResponseStatus } from 'h3'
import jwt from 'jsonwebtoken'
import { query } from '~/server/utils/db'
import { getAllSubscriptionInvoices, getCustomerInvoices } from '~/server/utlis/chargebee'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween.js' 

dayjs.extend(isBetween)

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  // Get query parameters for filters
  const queryParams = getQuery(event)
  
  // Get date range parameters
  const startDateParam = queryParams.startDate as string
  const endDateParam = queryParams.endDate as string
  const dateRangeLabel = queryParams.dateRange as string || 'All Time'
  const selectedPlan = queryParams.selectedPlan as string || 'All Plans'
  
  // Get token from Authorization header
  const authHeader = event.node.req.headers['authorization']
  const token = authHeader?.split(' ')[1]
  
  if (!token) {
    setResponseStatus(event, 401)
    return { success: false, error: 'Unauthorized' }
  }

  // Verify token
  let userId: string
  try {
    const decoded = jwt.verify(token, config.jwtToken as string) as { user_id: string }
    userId = decoded.user_id
  } catch {
    setResponseStatus(event, 401)
    return { success: false, error: 'Invalid token' }
  }

  // Get user info
  const userRes = await query(
    `SELECT u.user_id, u.org_id, u.role_id, o.chargebee_subscription_id, o.chargebee_customer_id 
     FROM users u 
     LEFT JOIN organizations o ON o.org_id = u.org_id 
     WHERE u.user_id = $1`,
    [userId]
  )

  if (!userRes.rows.length) {
    setResponseStatus(event, 404)
    return { success: false, error: 'User not found' }
  }

  const user = userRes.rows[0]
  const subscriptionId = user.chargebee_subscription_id
  const customerId = user.chargebee_customer_id

  try {
    let invoices: any[] = []

    //  Try to get invoices by invoice by customer id
    if (customerId) {
      const result = await getCustomerInvoices(customerId)
      if (result.status === 'Success') {
        if ('data' in result) {
          invoices = result.data || []
        }
      }
    }

    // Get organization's current plan name from database
    let orgPlanName = 'Unknown Plan'
    if (user.org_id) {
      const planRes = await query(
        `SELECT p.title as plan_name 
         FROM organizations o 
         JOIN plans p ON p.id = o.plan_id 
         WHERE o.org_id = $1`,
        [user.org_id]
      )
      
      if (planRes.rows.length > 0) {
        orgPlanName = planRes.rows[0].plan_name || 'Unknown Plan'
      }
    }

    // Format invoices for frontend
    let formattedInvoices = invoices.map(invoice => {
      // Handle amount - it might be undefined
      const amountInCents = invoice.amount || 0
      const amountInDollars = amountInCents / 100
      
      // Format amount to 2 decimal places
      const formattedAmount = amountInDollars.toFixed(2)
      
      // Handle invoice number
      const invoiceNumber = invoice.invoice_number || `INV-${invoice.id}`
      
      // Check if it's a free invoice
      const isFree = amountInCents === 0
      // Determine plan name
      let planName = invoice.plan_name || orgPlanName
      
      // If plan name is still "Unknown Plan", try to extract from line items
      if ((!planName || planName === 'Unknown Plan') && invoice.line_items && invoice.line_items.length > 0) {
        planName = extractPlanName(invoice.line_items)
      }
      
      return {
        id: invoice.id,
        invoiceNumber: invoiceNumber,
        planName: planName,
        invoiceDate: invoice.formatted_date || 
               (invoice.date ? dayjs.unix(invoice.date).format('MMM D, YYYY') : null),
        billing_period: invoice.billing_period || null,
        amount: parseFloat(formattedAmount), // Formatted with 2 decimal places
        currency: invoice.currency_code || 'USD',
        status: formatInvoiceStatus(invoice.status),
        frequency: extractBillingFrequency(invoice.line_items || []),
        pdfUrl: invoice.pdf_url,
        isFree: isFree
      }
    })

    // Apply date range filter on server side
    if (startDateParam || dateRangeLabel !== 'All Time') {
      let startDate: dayjs.Dayjs | null = null
      let endDate: dayjs.Dayjs | null = null
      
      // If specific dates are provided, use them
      if (startDateParam) {
        startDate = dayjs(startDateParam)
      }
      if (endDateParam) {
        endDate = dayjs(endDateParam)
      }
      
      // If no specific dates but a date range label is provided
      if (!startDateParam && dateRangeLabel !== 'All Time') {
        const now = dayjs()
        
        switch (dateRangeLabel) {
          case 'Last 30 Days':
            startDate = now.subtract(30, 'day')
            endDate = now
            break
          case 'Last 90 Days':
            startDate = now.subtract(90, 'day')
            endDate = now
            break
          case 'This Year':
            startDate = dayjs().startOf('year')
            endDate = dayjs().endOf('year')
            break
          case 'Last Year':
            startDate = dayjs().subtract(1, 'year').startOf('year')
            endDate = dayjs().subtract(1, 'year').endOf('year')
            break
        }
      }
      
      // Apply date filter
      if (startDate) {
        formattedInvoices = formattedInvoices.filter(invoice => {
          if (!invoice.invoiceDate) return false
          
          const invoiceDate = dayjs(invoice.invoiceDate)
          
          if (endDate) {
            // Filter between start and end dates (inclusive)
            return invoiceDate.isBetween(startDate, endDate, 'day', '[]')
          } else {
            // Filter after start date
            return invoiceDate.isAfter(startDate) || invoiceDate.isSame(startDate, 'day')
          }
        })
      }
    }

    // Apply plan filter on server side
    if (selectedPlan !== 'All Plans') {
      formattedInvoices = formattedInvoices.filter(invoice => 
        invoice.planName === selectedPlan
      )
    }

    // Sort by date descending
    formattedInvoices.sort((a, b) => 
      new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()
    )

    return {
      success: true,
      data: formattedInvoices,
    }

  } catch (error: any) {
    console.error('Error fetching invoices:', error)
    setResponseStatus(event, 500)
    return {
      success: false,
      error: 'Failed to fetch invoices'
    }
  }
})


function formatInvoiceStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'paid': 'Paid',
    'payment_due': 'Payment Due',
    'not_paid': 'Unpaid',
    'voided': 'Voided',
    'pending': 'Pending'
  }
  return statusMap[status] || status
}

function extractBillingFrequency(
  lineItems: any[]
): string | null {
  if (!Array.isArray(lineItems)) return null

  let subscriptionFrequency: 'Monthly' | 'Yearly' | null = null
  let addonName: string | null = null

  for (const item of lineItems) {
    const entityType = item?.entity_type || ''
    const entityDesc = item?.entity_description?.toLowerCase() || ''
    const entityId = item?.entity_id?.toLowerCase() || ''
    const description = item?.description || ''

    const src = `${entityDesc} ${entityId}`

    // Subscription plan (highest priority)
    if (entityType === 'plan_item_price' || entityType === 'plan') {
      if (src.includes('yearly') || src.includes('annual')) {
        subscriptionFrequency = 'Yearly'
      } else if (src.includes('monthly')) {
        subscriptionFrequency = 'Monthly'
      }
    }

    // Small Add-on detection (store real name)
    if (entityType === 'charge_item_price') {
      addonName = description || 'Small Add-On'
    }
  }

  // Prefer subscription frequency
  if (subscriptionFrequency) return subscriptionFrequency

  // Only add-ons → return dynamic name
  if (addonName) return addonName

  return null
}



// Enhanced plan name extraction function
function extractPlanName(lineItems: any[]): string {
  if (!lineItems || !Array.isArray(lineItems)) {
    return 'Unknown Plan'
  }
    
  for (const item of lineItems) {
    const description = item.description || ''
    const entityType = item.entity_type || ''
    
    if (entityType === 'plan' || 
        entityType === 'plan_item_price' || 
        entityType === 'item_price' ||
        entityType.includes('plan')) {
      
      if (description.trim().length === 0) {
        return 'Subscription Plan'
      }
      
      return description
    }
    
    const descLower = description.toLowerCase()
    if (descLower.includes('subscription') || 
        descLower.includes('plan') ||
        descLower.includes('monthly') ||
        descLower.includes('yearly') ||
        descLower.includes('billing')) {
      
      return description || 'Subscription'
    }
  }
  
  if (lineItems.length > 0 && lineItems[0].description) {
    return lineItems[0].description
  }
  
  return 'Unknown Plan'
}