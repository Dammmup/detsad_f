export interface OrganolepticRecord {
  _id?: string;
  date: string;
  dish: string;
  group: string;
  appearance: string;
  taste: string;
  smell: string;
  decision: string;
  responsibleSignature?: string;
  createdAt?: string;
  updatedAt?: string;
}
