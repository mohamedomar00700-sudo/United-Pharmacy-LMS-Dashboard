export enum CourseType {
  Mandatory = 'Mandatory',
  Optional = 'Optional',
}

export interface TrainingRecord {
  id: number;
  traineeName: string;
  email: string;
  branch: string;
  districtHead: string;
  supervisor: string;
  courseTitle: string;
  completionRate: number;
  preAssessmentScore: number;
  postAssessmentScore: number;
  averageQuizScore: number;
  courseType: CourseType;
  completionDate: Date;
  trainingHours: number;
}
