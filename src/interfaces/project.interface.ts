export interface IProject {
  description: string;
  topic: string;
  status?: "Approved" | "Rejected" | "Submitted";
  stage?: "Chapter 1" | "Chapter 2" | "Chapter 3" | "Chapter 4" | "Chapter 5"; // Stage should be an enum like 1,2,3,4,5
  file?: string;
  userId: any;
  groupId: any;
}
