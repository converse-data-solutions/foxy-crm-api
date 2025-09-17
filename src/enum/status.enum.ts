export enum TicketStatus {
  Open = 'open',
  InProgress = 'in progress',
  Resolved = 'resolved',
  Closed = 'closed',
}

export enum TaskStatus {
  Pending = 'pending',
  Completed = 'completed',
  OverDue = 'overdue',
}

export enum LeadStatus {
  New = 'new',
  Qualified = 'qualified',
  Disqualified = 'disqualified',
  InProgress = 'in progress',
  Converted = 'converted',
}

export enum OpportunityStatus {
  Qualified = 'qualified',
  Proposal = 'proposal',
  Negotiation = 'negotiation',
  Accepted = 'accepted',
  Declined = 'declined',
}
