export const dynamic = 'force-dynamic'

import { type NextRequest, NextResponse } from "next/server"
import { securePaymentDatabase } from "@/lib/payment-database"
import { createAuditLog } from "@/lib/payment-security"

/**
 * Get customer payment methods and billing addresses
 * GET /api/payment/customer/[customerId]
 */
export async function GET(request: NextRequest, { params }: { params: { customerId: string } }) {
  try {
    const { customerId } = params

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 })
    }

    // Retrieve customer payment methods (encrypted data)
    const paymentMethods = await securePaymentDatabase.getCustomerPaymentMethods(customerId, request)

    // Retrieve billing addresses for each payment method
    const paymentMethodsWithBilling = await Promise.all(
      paymentMethods.map(async (method) => {
        const billingAddress = await securePaymentDatabase.getBillingAddress(method.billingAddressId, request)

        return {
          id: method.id,
          last4: method.last4,
          brand: method.brand,
          expiryMonth: method.expiryMonth,
          expiryYear: method.expiryYear,
          isDefault: method.isDefault,
          createdAt: method.createdAt,
          lastUsed: method.lastUsed,
          billingAddress: billingAddress
            ? {
                id: billingAddress.id,
                firstName: billingAddress.firstName,
                lastName: billingAddress.lastName,
                addressLine1: billingAddress.addressLine1,
                addressLine2: billingAddress.addressLine2,
                city: billingAddress.city,
                state: billingAddress.state,
                postalCode: billingAddress.postalCode,
                country: billingAddress.country,
                // Never return encrypted phone number
                hasPhone: !!billingAddress.encryptedPhone,
              }
            : null,
        }
      }),
    )

    // Create audit log for customer data access
    const auditLog = createAuditLog(customerId, "ACCESS", "PAYMENT_METHOD", "customer_data", request, true)
    await securePaymentDatabase.storeAuditLog(auditLog)

    return NextResponse.json({
      success: true,
      customerId,
      paymentMethods: paymentMethodsWithBilling,
      totalMethods: paymentMethodsWithBilling.length,
    })
  } catch (error) {
    console.error("Error retrieving customer payment data:", error)

    // Create error audit log
    try {
      const auditLog = createAuditLog(
        params.customerId || "unknown",
        "ACCESS",
        "PAYMENT_METHOD",
        "customer_data",
        request,
        false,
        undefined,
        error instanceof Error ? error.message : "Unknown error",
      )
      await securePaymentDatabase.storeAuditLog(auditLog)
    } catch (auditError) {
      console.error("Audit log error:", auditError)
    }

    return NextResponse.json({ error: "Failed to retrieve customer payment data" }, { status: 500 })
  }
}

/**
 * Delete customer payment method
 * DELETE /api/payment/customer/[customerId]
 */
export async function DELETE(request: NextRequest, { params }: { params: { customerId: string } }) {
  try {
    const { customerId } = params
    const body = await request.json()
    const { paymentMethodId } = body

    if (!customerId || !paymentMethodId) {
      return NextResponse.json({ error: "Customer ID and Payment Method ID are required" }, { status: 400 })
    }

    // Verify payment method belongs to customer
    const paymentMethod = await securePaymentDatabase.getPaymentMethod(paymentMethodId, request)
    if (!paymentMethod) {
      return NextResponse.json({ error: "Payment method not found" }, { status: 404 })
    }

    if (paymentMethod.customerId !== customerId) {
      return NextResponse.json({ error: "Unauthorized access to payment method" }, { status: 403 })
    }

    // Delete payment method securely
    const deleted = await securePaymentDatabase.deletePaymentMethod(paymentMethodId, request)

    if (!deleted) {
      return NextResponse.json({ error: "Failed to delete payment method" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Payment method deleted successfully",
      paymentMethodId,
    })
  } catch (error) {
    console.error("Error deleting payment method:", error)

    // Create error audit log
    try {
      const auditLog = createAuditLog(
        params.customerId || "unknown",
        "DELETE",
        "PAYMENT_METHOD",
        "unknown",
        request,
        false,
        undefined,
        error instanceof Error ? error.message : "Unknown error",
      )
      await securePaymentDatabase.storeAuditLog(auditLog)
    } catch (auditError) {
      console.error("Audit log error:", auditError)
    }

    return NextResponse.json({ error: "Failed to delete payment method" }, { status: 500 })
  }
}
