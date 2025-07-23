export interface IProject {
  name: string;
  topic: string;
  status?: "Approved" | "Rejected" | "Submitted";
  stage?: "Chapter 1" | "Chapter 2" | "Chapter 3" | "Chapter 4" | "Chapter 5";
  file: string;
  user: any;
}
