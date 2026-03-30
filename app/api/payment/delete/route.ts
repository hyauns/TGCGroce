export const dynamic = 'force-dynamic'

import { type NextRequest, NextResponse } from "next/server"
import { securePaymentDatabase } from "@/lib/payment-database"
import { createAuditLog } from "@/lib/payment-security"

/**
 * Delete payment method securely
 * DELETE /api/payment/delete
 */
export async function DELETE(request: NextRequest) {
  let body
  try {
    body = await request.json()
    const { customerId, paymentMethodId, adminUserId } = body

    if (!customerId || !paymentMethodId) {
      return NextResponse.json({ error: "Customer ID and Payment Method ID are required" }, { status: 400 })
    }

    // Verify payment method exists and belongs to customer
    const paymentMethod = await securePaymentDatabase.getPaymentMethod(paymentMethodId, request)
    if (!paymentMethod) {
      return NextResponse.json({ error: "Payment method not found" }, { status: 404 })
    }

    if (paymentMethod.customerId !== customerId) {
      return NextResponse.json({ error: "Unauthorized access to payment method" }, { status: 403 })
    }

    // Check if this is the customer's only payment method
    const customerPaymentMethods = await securePaymentDatabase.getCustomerPaymentMethods(customerId, request)
    const isOnlyPaymentMethod = customerPaymentMethods.length === 1

    // Delete payment method with secure overwrite
    const deleted = await securePaymentDatabase.deletePaymentMethod(paymentMethodId, request, adminUserId)

    if (!deleted) {
      return NextResponse.json({ error: "Failed to delete payment method" }, { status: 500 })
    }

    // Create success audit log
    const auditLog = createAuditLog(customerId, "DELETE", "PAYMENT_METHOD", paymentMethodId, request, true, adminUserId)
    await securePaymentDatabase.storeAuditLog(auditLog)

    return NextResponse.json({
      success: true,
      message: "Payment method deleted successfully",
      paymentMethodId,
      wasOnlyMethod: isOnlyPaymentMethod,
    })
  } catch (error) {
    console.error("Error deleting payment method:", error)

    // Create error audit log
    try {
      const auditLog = createAuditLog(
        body?.customerId || "unknown",
        "DELETE",
        "PAYMENT_METHOD",
        body?.paymentMethodId || "unknown",
        request,
        false,
        body?.adminUserId,
        error instanceof Error ? error.message : "Unknown error",
      )
      await securePaymentDatabase.storeAuditLog(auditLog)
    } catch (auditError) {
      console.error("Audit log error:", auditError)
    }

    return NextResponse.json({ error: "Failed to delete payment method" }, { status: 500 })
  }
}
