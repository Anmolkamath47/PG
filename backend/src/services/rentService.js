import { RentInvoice } from '../models/RentInvoice.js';
import { BedAllocation } from '../models/BedAllocation.js';
import { Payment } from '../models/Payment.js';
import { getTodayIST } from '../utils/dateUtils.js';
import { logAudit } from './auditService.js';
import { sendNotification } from './notificationService.js';

export class RentService {
  /**
   * Generate monthly invoice for an active bed allocation for a given month (e.g. '2026-11')
   */
  static async generateInvoiceForAllocation(allocation, billingMonth) {
    // Check if invoice already exists
    const existing = await RentInvoice.findOne({
      tenant: allocation.tenant,
      billingMonth,
    });

    if (existing) {
      return existing;
    }

    const [year, month] = billingMonth.split('-').map(Number);
    // Due date calculated based on rentDueDay
    const dueDay = allocation.rentDueDay || 5;
    const dueDate = new Date(Date.UTC(year, month - 1, dueDay, 18, 29, 59));

    const invoiceCount = await RentInvoice.countDocuments();
    const invoiceNumber = `INV-${billingMonth.replace('-', '')}-${String(invoiceCount + 1).padStart(4, '0')}`;

    const totalAmount = allocation.monthlyRent; // Base rent
    const invoice = await RentInvoice.create({
      invoiceNumber,
      tenant: allocation.tenant,
      bedAllocation: allocation._id,
      building: allocation.building,
      owner: allocation.owner,
      billingMonth,
      dueDate,
      baseRent: allocation.monthlyRent,
      electricityCharges: 0,
      maintenanceCharges: 0,
      otherCharges: 0,
      discount: 0,
      totalAmount,
      amountPaid: 0,
      balanceDue: totalAmount,
      status: 'pending',
    });

    // Notify tenant
    await sendNotification({
      recipientId: allocation.tenant,
      role: 'tenant',
      title: `Rent Due for ${billingMonth}`,
      message: `Your rent invoice of ₹${totalAmount.toLocaleString('en-IN')} for ${billingMonth} is generated. Due date is ${dueDate.toLocaleDateString('en-IN')}.`,
      type: 'rent',
      relatedEntity: { entityType: 'RentInvoice', entityId: invoice._id },
    });

    return invoice;
  }

  /**
   * Automatically generate invoices for all active allocations for a specific PG owner / month
   */
  static async generateMonthlyInvoicesForOwner(ownerId, billingMonth) {
    const allocations = await BedAllocation.find({
      owner: ownerId,
      status: 'active',
    });

    const generated = [];
    for (const alloc of allocations) {
      try {
        const inv = await this.generateInvoiceForAllocation(alloc, billingMonth);
        generated.push(inv);
      } catch (err) {
        console.error(`Failed to generate invoice for allocation ${alloc._id}:`, err.message);
      }
    }

    return generated;
  }

  /**
   * Apply payment to a rent invoice
   */
  static async applyPaymentToInvoice({
    invoiceId,
    paymentId,
    amount,
    paymentMethod,
    transactionId,
    req = null,
  }) {
    const invoice = await RentInvoice.findById(invoiceId).populate('tenant', 'name email phone');
    if (!invoice) throw new Error('Invoice not found');

    const newAmountPaid = invoice.amountPaid + amount;
    const newBalanceDue = Math.max(0, invoice.totalAmount - newAmountPaid);
    const newStatus = newBalanceDue === 0 ? 'paid' : 'partially_paid';

    invoice.amountPaid = newAmountPaid;
    invoice.balanceDue = newBalanceDue;
    invoice.status = newStatus;
    invoice.lastPaymentDate = new Date();
    if (newStatus === 'paid') {
      invoice.paidAt = new Date();
    }

    await invoice.save();

    // Notify tenant and owner
    await sendNotification({
      recipientId: invoice.tenant._id,
      role: 'tenant',
      title: 'Rent Payment Successful',
      message: `Payment of ₹${amount.toLocaleString('en-IN')} received for invoice ${invoice.invoiceNumber}. Remaining balance: ₹${newBalanceDue.toLocaleString('en-IN')}.`,
      type: 'rent',
      relatedEntity: { entityType: 'RentInvoice', entityId: invoice._id },
    });

    await sendNotification({
      recipientId: invoice.owner,
      role: 'owner',
      title: 'Rent Collected',
      message: `Received ₹${amount.toLocaleString('en-IN')} from ${invoice.tenant.name} for invoice ${invoice.invoiceNumber}.`,
      type: 'rent',
      relatedEntity: { entityType: 'Payment', entityId: paymentId },
    });

    return invoice;
  }
}
