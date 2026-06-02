import { ACCOUNTS_BASE, safeRequest, strictRequest } from './accountsApi';

const normalizeInvoice = (invoice = {}) => ({
  id: invoice.id,
  invoiceNumber: invoice.invoiceNumber || invoice.invoice_number || invoice.id,
  account: invoice.account || invoice.customer_name || '-',
  category: invoice.category || 'Billing',
  amount: Number(invoice.total ?? invoice.amount ?? 0),
  currency: invoice.currency || 'INR',
  status: invoice.status || 'pending',
  issueDate: invoice.issueDate || invoice.created_at || null,
  dueDate: invoice.dueDate || invoice.due_date || null
});

export const getInvoices = async () =>
  safeRequest({
    path: `${ACCOUNTS_BASE}/invoices`,
    emptyData: [],
    extract: (payload) => (payload?.invoices || []).map(normalizeInvoice)
  });

export const updateInvoiceStatus = async (invoiceId, status) =>
  strictRequest({
    path: `${ACCOUNTS_BASE}/invoices/${invoiceId}/status`,
    options: { method: 'PATCH', body: JSON.stringify({ status }) },
    extract: (payload) => payload?.invoice || payload
  });
