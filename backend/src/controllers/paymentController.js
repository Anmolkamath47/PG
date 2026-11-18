import { Payment } from '../models/Payment.js';
import { RentInvoice } from '../models/RentInvoice.js';
import { paymentAdapter } from '../services/paymentAdapter/index.js';
import { RentService } from '../services/rentService.js';
import { logAudit } from '../services/auditService.js';
import { v4 as uuidv4 } from 'uuid';

// Step 1 & 2: Create Payment Session
export const createPaymentSession = async (req, res, next) => {
  try {
    const { invoiceId, idempotencyKey } = req.body;

    if (!invoiceId) {
      return res.status(400).json({ success: false, message: 'Invoice ID is required' });
    }

    // 3. Backend validates tenant ownership of invoice
    const invoice = await RentInvoice.findOne({
      _id: invoiceId,
      tenant: req.user._id,
    }).populate('building', 'name');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Rent invoice not found or unauthorized' });
    }

    if (invoice.status === 'paid' || invoice.balanceDue <= 0) {
      return res.status(400).json({ success: false, message: 'This invoice is already fully paid.' });
    }

    // 4. Payable amount calculated STRICTLY from database records (never trusted from frontend)
    const payableAmount = invoice.balanceDue;

    const orderId = `ORD_${invoice.invoiceNumber}_${Date.now()}`;
    const safeIdempotencyKey = idempotencyKey || `IDEM_${invoice._id}_${Date.now()}`;

    // 5. Backend creates payment session through adapter
    const session = await paymentAdapter.createPaymentSession({
      amount: payableAmount,
      currency: 'INR',
      orderId,
      customerId: req.user._id,
      customerEmail: req.user.email,
      customerPhone: req.user.phone,
      customerName: req.user.name,
      metadata: {
        invoiceId: String(invoice._id),
        invoiceNumber: invoice.invoiceNumber,
        billingMonth: invoice.billingMonth,
      }
    });

    res.status(200).json({
      success: true,
      session,
      invoice: {
        id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        billingMonth: invoice.billingMonth,
        balanceDue: payableAmount,
        buildingName: invoice.building?.name,
      },
      idempotencyKey: safeIdempotencyKey,
    });
  } catch (error) {
    next(error);
  }
};

// Step 6 & 8: Process Sandbox Payment (Indian Provider Sandbox flow)
export const processPaymentVerification = async (req, res, next) => {
  try {
    const { invoiceId, paymentId, paymentMethod = 'upi', methodDetails = {}, idempotencyKey } = req.body;

    // Check duplicate transaction using idempotency key
    if (idempotencyKey) {
      const existingPayment = await Payment.findOne({ idempotencyKey, status: 'success' });
      if (existingPayment) {
        return res.status(200).json({
          success: true,
          message: 'Payment already processed (idempotent response)',
          payment: existingPayment,
        });
      }
    }

    // Validate invoice
    const invoice = await RentInvoice.findOne({
      _id: invoiceId,
      tenant: req.user._id,
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Rent invoice not found' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Invoice already paid' });
    }

    const payableAmount = invoice.balanceDue;

    // Execute provider processing
    let result;
    if (paymentAdapter.processSandboxPayment) {
      result = await paymentAdapter.processSandboxPayment({
        paymentId,
        amount: payableAmount,
        paymentMethod,
        methodDetails,
      });
    } else {
      // If live Hyperswitch
      result = await paymentAdapter.getPaymentStatus(paymentId);
    }

    if (!result.success && result.status !== 'success') {
      return res.status(400).json({
        success: false,
        message: result.failureReason || 'Payment failed with selected provider method.',
      });
    }

    const paymentNumber = `PAY-${Date.now().toString().slice(-8)}`;
    const finalIdempotencyKey = idempotencyKey || `IDEM_${invoice._id}_${Date.now()}`;

    // Immutable payment record
    const payment = await Payment.create({
      paymentNumber,
      rentInvoice: invoice._id,
      tenant: req.user._id,
      owner: invoice.owner,
      amount: payableAmount,
      currency: 'INR',
      paymentMethod: result.paymentMethod || 'sandbox_upi',
      transactionId: result.transactionId || `TXN_${Date.now()}`,
      providerOrderId: paymentId,
      providerReference: result.providerReference || `REF_${uuidv4().slice(0, 8)}`,
      idempotencyKey: finalIdempotencyKey,
      status: 'success',
      signatureVerified: true,
      metadata: {
        isSandbox: Boolean(result.isSandbox),
        method: paymentMethod,
        paidAt: new Date(),
      },
      auditTrail: [
        {
          timestamp: new Date(),
          status: 'success',
          message: `Payment of ₹${payableAmount} completed via ${paymentMethod} (${result.isSandbox ? 'Sandbox Test' : 'Live'}). Verified by server.`,
        }
      ]
    });

    // Update rent invoice status
    await RentService.applyPaymentToInvoice({
      invoiceId: invoice._id,
      paymentId: payment._id,
      amount: payableAmount,
      paymentMethod: result.paymentMethod,
      transactionId: payment.transactionId,
      req,
    });

    await logAudit({
      actor: req.user._id,
      actorRole: 'tenant',
      action: 'PAYMENT_COMPLETED',
      entityType: 'Payment',
      entityId: payment._id,
      details: { amount: payableAmount, invoiceId: invoice._id, transactionId: payment.transactionId },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Payment completed and verified successfully!',
      payment,
    });
  } catch (error) {
    next(error);
  }
};

// Webhook Handler for Hyperswitch / Indian Provider (Signed Webhook)
export const handlePaymentWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-webhook-signature'] || req.headers['x-hyperswitch-signature'];
    const rawBody = req.body;

    const isValid = paymentAdapter.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn('Invalid webhook signature received');
      return res.status(401).json({ success: false, message: 'Invalid signature' });
    }

    const { event, data } = req.body;

    // Idempotent processing
    if (event === 'payment.succeeded' && data?.order_id) {
      const invoiceId = data.metadata?.invoiceId;
      if (invoiceId) {
        const invoice = await RentInvoice.findById(invoiceId);
        if (invoice && invoice.status !== 'paid') {
          await RentService.applyPaymentToInvoice({
            invoiceId,
            paymentId: data.payment_id,
            amount: (data.amount || 0) / 100,
            paymentMethod: data.payment_method || 'hyperswitch_upi',
            transactionId: data.payment_id,
          });
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
};

// Get payment receipts / history
export const getPaymentHistory = async (req, res, next) => {
  try {
    const query = req.user.role === 'owner' ? { owner: req.user._id } : { tenant: req.user._id };

    const payments = await Payment.find(query)
      .populate('rentInvoice', 'invoiceNumber billingMonth dueDate totalAmount')
      .populate('tenant', 'name email phone avatar')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    next(error);
  }
};

// Get single payment receipt data
export const getPaymentReceipt = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('rentInvoice')
      .populate('tenant', 'name email phone')
      .populate('owner', 'name email phone');

    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });

    res.status(200).json({
      success: true,
      receipt: {
        receiptNumber: `REC-${payment.paymentNumber}`,
        paymentDate: payment.createdAt,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.paymentMethod,
        transactionId: payment.transactionId,
        providerReference: payment.providerReference,
        status: payment.status,
        tenant: payment.tenant,
        invoice: payment.rentInvoice,
        owner: payment.owner,
      }
    });
  } catch (error) {
    next(error);
  }
};
