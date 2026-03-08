// ─── Accounting Service (Scaffold) ──────────────────────
// TODO: Implementar cuando se creen tablas invoices, payments, budgets

export class AccountingService {
    static async getInvoices(query: any) { return { data: [], pagination: { page: 1, total: 0 } }; }
    static async getInvoiceById(id: string) { return { id, items: [], total: 0 }; }
    static async createInvoice(input: any) { return { id: 'TODO', ...input }; }

    static async getPayments(query: any) { return { data: [], pagination: { page: 1, total: 0 } }; }
    static async createPayment(input: any) { return { id: 'TODO', ...input }; }

    static async getBudgets(query: any) { return { data: [], pagination: { page: 1, total: 0 } }; }
    static async getBudgetById(id: string) { return { id, items: [], total: 0 }; }
    static async createBudget(input: any) { return { id: 'TODO', ...input }; }
    static async approveBudget(id: string) { return { id, status: 'approved' }; }

    static async getPatientBalance(patientId: string) { return { patientId, invoiced: 0, paid: 0, pending: 0 }; }
}
