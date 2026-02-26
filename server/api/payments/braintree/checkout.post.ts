import { defineEventHandler, readBody, setResponseStatus } from 'h3' // uses chargebee-typescript wrapper
import { cancelSubscription, createChargebeeCustomer, createSubscription } from '~/server/utlis/chargebee'
import { z } from 'zod'
import { ChargeBee } from 'chargebee-typescript'

const CheckoutValidation = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional().nullable().or(z.literal('')),
  country: z.string().min(1),
  countryCode: z.string().min(2).max(4),
  region: z.string().min(1),
  city: z.string().min(1),
  zipcode: z.string().min(1),
  addressLine1: z.string().min(1),
  addressLine2: z.string().min(1),
  phoneNumber: z.string().min(1),
  amount: z.number().min(1),
  email: z.string().email(),
  subscriptionTypeId: z.string().min(1),
  orgId: z.string().min(1),
  planType: z.enum(['monthly', 'yearly', 'addon']),
  currencyCode: z.enum(['INR', 'EUR', 'USD']),
  gstNumber: z.string().optional().nullable().or(z.literal('')),
  couponCode: z.string().optional().nullable().or(z.literal('')),
  paidAmount: z.number().min(1).optional(),
  couponDurationType: z.string().optional().nullable().or(z.literal('')),
  gwToken: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const merchantId = config.braintreeMerchantId
  const publicKey = config.braintreePublicKey
  const privateKey = config.braintreePrivateKey
  const envName = config.braintreeEnvironment || 'sandbox'

  if (!merchantId || !publicKey || !privateKey) {
    return { success: false, error: 'Braintree not configured on server (missing keys)' }
  }

  const body = await readBody(event)
  const chargebee = new ChargeBee()
  chargebee.configure({
    site: config.chargebeeSite,
    api_key: config.chargebeeApiKey,
  })


  // Normalize incoming payload: convert numeric-like strings to numbers and strip explicit nulls for optional numeric fields
  const params: any = { ...body }
  if (params.amount != null) params.amount = Number(params.amount)
  if (Object.prototype.hasOwnProperty.call(params, 'paidAmount')) {
    if (params.paidAmount == null) delete params.paidAmount
    else params.paidAmount = Number(params.paidAmount)
  }

  // Remove other empty string fields set to null that would fail strict zod checks
  for (const k of Object.keys(params)) {
    if (params[k] === '') params[k] = undefined
  }

  // const parsed = CheckoutValidation.safeParse(params)
  // if (!parsed.success) {
  //   const msg = parsed.error.errors
  //     .map((e) => `${(e.path && e.path.length ? e.path.join('.') : 'value')}: ${e.message}`)
  //     .join('; ')
  //   throw new CustomError(`Invalid input: ${msg}`, 400)
  // }

  const orderDetails = params
  const purchaseType = orderDetails.purchaseType || null
  const quantity = Number(orderDetails.quantity || 1)


  console.log('Processing Braintree checkout with data:', orderDetails)

  try {
    let effectivePurchaseType: any
    try {
      const site = config.chargebeeSite
      const apiKey = config.chargebeeApiKey

      if (!site || !apiKey) {
        console.warn('Chargebee configuration missing — skipping Chargebee sync')
      }

      // console.log(`Chargebee integration active for site: ${site}`)

      // ✅ Step 1: Create Customer in Chargebee
      const { customerId, status, error: errorMessage, statusCode: charStatusCode } = await createChargebeeCustomer(orderDetails)

      if (status === 'Error') {
        console.warn('Error while trying to create customer details:', JSON.stringify(errorMessage, null, 2))
        throw new CustomError(`Error while trying to create customer details: ${errorMessage}`, charStatusCode)
      }

      orderDetails.customerId = customerId
      if (status === 'Success') {
        //  ✅ update customer with GST on DB
        const { error } = await updateOrganizationCustomer(event, customerId, orderDetails.gstNumber)
        if (error)
          throw new CustomError(`Error while trying to update customer details: ${error}`, 400)
        // console.log('✅ Chargebee customer created:', customerId)

        // Attach Braintree card to Chargebee customer
        const existingCards = await chargebee.payment_source
          .list({
            customer_id: orderDetails.customerId,
            type: { is: 'card' },
            limit: 1,
          })
          .request()

        if (!existingCards.list.length) {
          await chargebee.payment_source
            .create_using_temp_token({
              customer_id: orderDetails.customerId,
              type: 'card',
              tmp_token: orderDetails.gwToken,
            })
            .request()

          // console.log('✅ Payment method attached to Chargebee customer')
        } else {
          // console.log('ℹ️ Card already exists for customer, skipping attach')
        }


      }
      else { throw new CustomError(`Error while trying to create customer on chargbee: ${errorMessage.message}`, 404) }

      // ✅ Step 2: Create Subscription via chargebee-typescript
      const planRes = await query(
        `
          SELECT
            id,
            plan_type,
            chargebee_plan_id,
            users,
            limit_requests,
            storage_limit_gb,
            artefacts
          FROM plans
          WHERE id = $1
          LIMIT 1
        `,
        [orderDetails.subscriptionTypeId]
      )

      if (!planRes.rows.length)
        throw new CustomError('Invalid plan selected', 404)

      const plan = planRes.rows[0]

      // normalize purchase type (DB is source of truth)
      effectivePurchaseType = plan.plan_type === 'addon' ? 'addon' : 'subscription'

      const cbPlanId = orderDetails.subscriptionTypeId ? String(orderDetails.subscriptionTypeId) : null
      if (cbPlanId) {
        let subscriptionObj: any

        if (effectivePurchaseType === 'subscription') {
          // 🔵 BASE PLAN (existing behavior)
          subscriptionObj = {
            itemPriceId: plan.chargebee_plan_id,
            amount: Math.round(Number(orderDetails.amount) * 100),
            gwToken: params.gwToken,
          }

          if (orderDetails.couponCode)
            subscriptionObj.couponCode = orderDetails.couponCode

          if (orderDetails.planType)
            subscriptionObj.planType = orderDetails.planType

        }

        if (subscriptionObj) {
          if (orderDetails.couponCode) subscriptionObj.couponCode = orderDetails.couponCode
          if (orderDetails.paidAmount) subscriptionObj.paidAmount = orderDetails.paidAmount
          if (orderDetails.currencyCode) subscriptionObj.currencyCode = orderDetails.currencyCode
          if (orderDetails.planType) subscriptionObj.planType = orderDetails.planType
        }

        // insert billing details in DB
        const { error: errorInsertBilling } = await upsertBillingAddress(event, orderDetails)
        if (errorInsertBilling) {
          throw new CustomError(`Error while trying to insert billing address: ${errorInsertBilling}`, 400)
        }

        let chargebeeSubscriptionId: string | null = null

        if (effectivePurchaseType === 'addon' && subscriptionObj) {
          throw new Error('Invariant violation: subscriptionObj should never exist for addon')
        }

        // 🔁 Fetch existing active Chargebee subscription (if any)
        const existingSubRes = await query(
          `
            SELECT chargebee_subscription_id
            FROM organizations
            WHERE org_id = $1
            LIMIT 1
          `,
          [orderDetails.orgId]
        )

        const existingChargebeeSubscriptionId =
          existingSubRes.rows[0]?.chargebee_subscription_id || null


        if (effectivePurchaseType === 'subscription') {
          // ⛔ Cancel old subscription first (IMMEDIATE)
          if (existingChargebeeSubscriptionId) {
            // console.log(
            //   '⛔ Cancelling existing Chargebee subscription immediately:',
            //   existingChargebeeSubscriptionId
            // )

            await cancelSubscription(existingChargebeeSubscriptionId, false)
          }

          // ✅ Create new subscription
          // console.log('[SUBSCRIPTION] Creating base plan for customer:', orderDetails.customerId)

          const {
            subscription: chargebeeSubscription,
            error: errorMessage,
            status: subStatus,
            statusCode: subStatusCode,
          } = await createSubscription(subscriptionObj, orderDetails.customerId)

          if (subStatus === 'Error') {
            throw new CustomError(
              `Error while trying to create subscription details: ${errorMessage.message}`,
              subStatusCode
            )
          }

          chargebeeSubscriptionId = chargebeeSubscription.subscription.id
          // console.log('✅ Chargebee base subscription created:', chargebeeSubscriptionId)
        } else {
          // 🟣 ADD-ON → ONE-TIME INVOICE ONLY
          // console.log('Creating one-time add-on invoice...')
          // console.log('[ADDON] Creating one-time invoice for customer:', orderDetails.customerId)

          // const priceCheck = await chargebee.item_price
          //   .retrieve(plan.chargebee_plan_id)
          //   .request()

          // console.log('[DEBUG] Chargebee price details:', priceCheck.item_price)

          // 🔥 FORCE attach & make primary for ADDONS
          await chargebee.payment_source.create_using_temp_token({
            customer_id: orderDetails.customerId,
            type: 'card',
            tmp_token: orderDetails.gwToken,
            replace_primary_payment_source: true,
          }).request()


          const invoiceRes = await chargebee.invoice
            .create_for_charge_item({
              customer_id: orderDetails.customerId,
              auto_collection: 'on',
              item_price: {
                item_price_id: plan.chargebee_plan_id,
                quantity,
              },
            } as any)
            .request()

          // console.log('✅ One-time add-on invoice created:', invoiceRes.invoice.id)


          const invoiceId = invoiceRes.invoice.id
          // console.log('✅ One-time add-on invoice created:', invoiceId)

          // 🔒 Never set subscription ID for add-ons
          chargebeeSubscriptionId = null
        }

        // 🔁 Update DB (common for both)
        const { error: errorUpdateSubscription } =
          await updateOrganizationSubscription(
            event,
            plan.id,                    // DB plan UUID
            chargebeeSubscriptionId,    // Chargebee subscription ID
            orderDetails,
            effectivePurchaseType,
            quantity
          )

        if (errorUpdateSubscription) {
          throw new CustomError(
            `Error while trying to update subscription details: ${errorUpdateSubscription}`,
            400
          )
        }


      } else {
        console.warn('Missing Chargebee plan ID, skipping subscription creation')
        throw new CustomError('Missing Chargebee plan ID, skipping subscription creation', 500)
      }
    } catch (err: any) {
      if (effectivePurchaseType === 'subscription') {
        console.warn('[SUBSCRIPTION] Error while creating subscription:', err)
      } else {
        console.warn('[ADDON] Error while processing addon purchase:', err)
      }

      if (err instanceof CustomError) {
        throw err
      }

      throw new CustomError(
        err?.message || 'Checkout processing failed',
        err?.statusCode || 500
      )
    }


    setResponseStatus(event, 201)
    return {
      statusCode: 201,
      status: 'success',
      message: 'Payment processing completed successfully',
      data: orderDetails,
    }
  } catch (err: any) {
    console.error('Braintree checkout error:', err)
    if (err instanceof CustomError) {
      setResponseStatus(event, err.statusCode)
      return {
        statusCode: err.statusCode,
        status: 'error',
        message: err.message,
      }
    }
    setResponseStatus(event, 500)
    throw new CustomError(err?.message || 'Payment processing failed', 500)
  }
})
