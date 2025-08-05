export interface IGroup {
  name: string;
  users?: string[];
  supervisor?: string;
  maximumGroupSize: number;
}
