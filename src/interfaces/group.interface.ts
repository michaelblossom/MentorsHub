export interface IGroup {
  name: string;
  users?: string[];
  supervisor: any;
  maximunGroupSize: number;
}
