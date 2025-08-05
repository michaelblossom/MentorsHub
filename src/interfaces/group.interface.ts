export interface IGroup {
  name: string;
  users?: string[];
  supervisor?: any;
  archive?: boolean;
  maximumGroupSize: number;
}
