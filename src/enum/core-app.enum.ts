export enum LeadStatus {
  New = 'new',
  Qualified = 'qualified',
  Disqualified = 'disqualified',
  InProgress = 'in progress',
  Converted = 'converted',
}

export enum OpportunityStage {
  Qualified = 'qualified',
  Proposal = 'proposal',
  Negotiation = 'negotiation',
  Accepted = 'accepted',
  Declined = 'declined',
}

export enum TaskType {
  Call = 'call',
  Email = 'email',
  Meeting = 'meeting',
}

export enum TaskStatus {
  Pending = 'pending',
  Completed = 'completed',
  OverDue = 'overdue',
}

export enum TaskPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}

export enum TicketStatus {
  Open = 'open',
  InProgress = 'in progress',
  Resolved = 'resolved',
  Closed = 'closed',
}

export enum EntityName {
  Opportunity = 'opportunity',
  Ticket = 'ticket',
}
