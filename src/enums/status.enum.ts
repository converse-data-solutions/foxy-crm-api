export enum TicketStatus {
  Open = 'open',
  InProgress = 'in progress',
  Resolved = 'resolved',
  Closed = 'closed',
}

export enum TaskStatus {
  Pending = 'pending',
  Completed = 'completed',
  InProgress = 'in progress',
}

export enum LeadStatus {
  New = 'new',
  Qualified = 'qualified',
  Disqualified = 'disqualified',
  InProgress = 'in progress',
  Converted = 'converted',
}

export enum DealStage {
  Qualified = 'qualified',
  Proposal = 'proposal',
  Negotiation = 'negotiation',
  Accepted = 'accepted',
  Declined = 'declined',
  Completed = 'completed',
}

export enum StatusCause {
  Plan_Limit = 'plan limit',
  Admin_Disabled = 'admin disabled',
}
