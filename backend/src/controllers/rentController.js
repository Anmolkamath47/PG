import { RentInvoice } from '../models/RentInvoice.js';
import { BedAllocation } from '../models/BedAllocation.js';
import { Payment } from '../models/Payment.js';
import { Building } from '../models/Building.js';
import { RentService } from '../services/rentService.js';
import { sendNotification } from '../services/notificationService.js';
import { logAudit } from '../services/auditService.js';
import { getTodayIST } from '../utils/dateUtils.js';

// Owner Rent Summary & List
export const getRentDashboard = async (req, res, next) => {
  try {
    const { buildingId, month = getTodayIST().slice(0, 7), status, search } = req.query;

    const query = { owner: req.user._id, billingMonth: month };
    if (buildingId) query.building = buildingId;
    if (status) query.status = status;

    const invoices = await RentInvoice.find(query)
      .populate('tenant', 'name email phone avatar')
      .populate('building', 'name')
      .populate({
        path: 'bedAllocation',
        populate: [
          { path: 'room', select: 'roomNumber' },
          { path: 'bed', select: 'bedNumber' },
        ]
      })
      .sort('-createdAt');

    // Aggregate statistics
    const allOwnerInvoicesThisMonth = await RentInvoice.find({
      owner: req.user._id,
      billingMonth: month,
      ...(buildingId ? { building: buildingId } : {}),
    });

    const totalActiveTenants = await BedAllocation.countDocuments({
      owner: req.user._id,
      status: 'active',
      ...(buildingId ? { building: buildingId } : {}),
    });

    const expectedRent = allOwnerInvoicesThisMonth.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const collectedRent = allOwnerInvoicesThisMonth.reduce((acc, curr) => acc + curr.amountPaid, 0);
    const pendingRent = Math.max(0, expectedRent - collectedRent);
    const overdueCount = allOwnerInvoicesThisMonth.filter(
      inv => inv.status !== 'paid' && new Date() > new Date(inv.dueDate)
    ).length;

    let filteredInvoices = invoices;
    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      filteredInvoices = invoices.filter(
        i =>
          i.tenant?.name?.toLowerCase().includes(q) ||
          i.tenant?.phone?.includes(q) ||
          i.invoiceNumber.toLowerCase().includes(q)
      );
    }

    res.status(200).json({
      success: true,
      billingMonth: month,
      summary: {
        totalActiveTenants,
        expectedRent,
        collectedRent,
        pendingRent,
        overdueCount,
        collectionRate: expectedRent > 0 ? Math.round((collectedRent / expectedRent) * 100) : 0,
      },
      invoices: filteredInvoices,
    });
  } catch (error) {
    next(error);
  }
};

// Generate monthly invoices for all active allocations
export const generateMonthlyInvoices = async (req, res, next) => {
  try {
    const { month = getTodayIST().slice(0, 7) } = req.body;

    const generated = await RentService.generateMonthlyInvoicesForOwner(req.user._id, month);

    res.status(200).json({
      success: true,
      message: `Invoices generated/verified for ${generated.length} active tenants for ${month}.`,
      count: generated.length,
      invoices: generated,
    });
  } catch (error) {
    next(error);
  }
};

// Record manual offline payment (cash / direct UPI / bank transfer)
export const recordManualPayment = async (req, res, next) => {
  try {
    const { invoiceId, amount, paymentMethod = 'manual_cash', notes = '' } = req.body;

    const invoice = await RentInvoice.findById(invoiceId);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    if (invoice.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const payAmount = Number(amount);
    if (payAmount <= 0 || payAmount > invoice.balanceDue) {
      return res.status(400).json({
        success: false,
        message: `Invalid amount. Maximum payable balance is ₹${invoice.balanceDue}.`,
      });
    }

    const paymentNumber = `PAY-MANUAL-${Date.now()}`;
    const transactionId = `TXN_OFFLINE_${Date.now()}`;
    const idempotencyKey = `MANUAL_${invoice._id}_${Date.now()}`;

    const payment = await Payment.create({
      paymentNumber,
      rentInvoice: invoice._id,
      tenant: invoice.tenant,
      owner: req.user._id,
      amount: payAmount,
      currency: 'INR',
      paymentMethod,
      transactionId,
      idempotencyKey,
      status: 'success',
      signatureVerified: true,
      metadata: { notes, recordedBy: req.user.name },
      auditTrail: [
        {
          timestamp: new Date(),
          status: 'success',
          message: `Manual offline payment of ₹${payAmount} recorded by owner (${paymentMethod}).`,
        }
      ]
    });

    await RentService.applyPaymentToInvoice({
      invoiceId: invoice._id,
      paymentId: payment._id,
      amount: payAmount,
      paymentMethod,
      transactionId,
      req,
    });

    await logAudit({
      actor: req.user._id,
      actorRole: 'owner',
      action: 'PAYMENT_RECORDED_MANUAL',
      entityType: 'Payment',
      entityId: payment._id,
      details: { invoiceId: invoice._id, amount: payAmount, paymentMethod },
      req,
    });

    res.status(200).json({
      success: true,
      message: `Manual payment of ₹${payAmount} recorded successfully.`,
      payment,
    });
  } catch (error) {
    next(error);
  }
};

// Send rent reminder notification to tenant
export const sendRentReminder = async (req, res, next) => {
  try {
    const { invoiceId } = req.params;

    const invoice = await RentInvoice.findById(invoiceId).populate('tenant', 'name email phone');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    await sendNotification({
      recipientId: invoice.tenant._id,
      role: 'tenant',
      title: 'Gentle Rent Reminder',
      message: `Dear ${invoice.tenant.name}, a friendly reminder that your rent of ₹${invoice.balanceDue.toLocaleString('en-IN')} for ${invoice.billingMonth} is pending. Due date: ${new Date(invoice.dueDate).toLocaleDateString('en-IN')}. Please pay online via PGmate.`,
      type: 'rent',
      relatedEntity: { entityType: 'RentInvoice', entityId: invoice._id },
    });

    res.status(200).json({
      success: true,
      message: `Rent reminder notification sent to ${invoice.tenant.name}.`,
    });
  } catch (error) {
    next(error);
  }
};

// Tenant: Get my rent invoices & pending balance
export const getMyInvoices = async (req, res, next) => {
  try {
    const invoices = await RentInvoice.find({ tenant: req.user._id })
      .populate('building', 'name address')
      .sort('-createdAt');

    const totalOutstanding = invoices
      .filter(i => i.status !== 'paid')
      .reduce((sum, i) => sum + i.balanceDue, 0);

    const currentInvoice = invoices[0] || null;

    res.status(200).json({
      success: true,
      totalOutstanding,
      currentInvoice,
      invoices,
    });
  } catch (error) {
    next(error);
  }
};
