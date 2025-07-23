export interface IProject {
  name: string;
  topic: string;
  status?: "approved" | "rejected" | "submitted";
  stage: string;
  file: string;
}
