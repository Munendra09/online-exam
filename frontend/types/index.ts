/**
 * TypeScript Interfaces
 * Shared types used across the frontend.
 */

export interface User {
  id: number;
  registrationId?: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STUDENT';
  className?: string;

  mobile?: string;
  city?: string;
  state?: string;
  fatherName?: string;
  dob?: string;
  address?: string;
  pincode?: string;
  photo?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  registrationStatus?: 'PENDING' | 'APPROVED' | 'BLOCKED';
}

export interface Exam {
  id: number;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalQuestions: number;

  negativeMarkingEnabled: boolean;
  negativeMarksPerQuestion: number;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  shiftName: string;
  examCenter: string;
  centerLatitude?: number;
  centerLongitude?: number;
  allowedRadiusMeters: number;
  geoCheckEnabled: boolean;
  admitCardReleased: boolean;
  answerKeyReleased: boolean;
  resultReleased: boolean;
  admitCardReleaseDate?: string;
  answerKeyReleaseDate?: string;
  resultReleaseDate?: string;
  registrationDeadline?: string;
  publishAt?: string;
  Questions?: Question[];
  ExamAssignments?: ExamAssignment[];
  assignment?: ExamAssignment;
}

export interface Question {
  id: number;
  examId: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer?: 'A' | 'B' | 'C' | 'D';

}

export interface ExamAssignment {
  id: number;
  userId: number;
  examId: number;
  shiftName: string;
  assignedDate: string;
  startTime: string;
  endTime: string;
  canAttempt: boolean;
  admitCardReleased: boolean;
  answerKeyReleased: boolean;
  resultReleased: boolean;
  User?: User;
  Exam?: Exam;
}

export interface ExamAttempt {
  id: number;
  userId: number;
  examId: number;
  startTime: string;
  endTime?: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'AUTO_SUBMITTED' | 'DISQUALIFIED';
  tabSwitchCount: number;
  disconnectCount: number;
  Answers?: Answer[];
  Exam?: Exam;
}

export interface Answer {
  id: number;
  attemptId: number;
  questionId: number;
  selectedAnswer?: string;
  markForReview: boolean;
  Question?: Question;
}

export interface ExamResult {
  id: number;
  userId: number;
  examId: number;
  score: number;
  correctCount: number;
  wrongCount: number;
  unattemptedCount: number;
  percentage: number;
  grade: string;
  User?: User;
  Exam?: Exam;
}

export interface DashboardStats {
  students: number;
  activeStudents: number;
  exams: number;
  questions: number;
  attempts: number;
}

export interface AdmitCard {
  id: number;
  userId: number;
  examId: number;
  rollNumber: string;
  releaseStatus: boolean;
  student: {
    name: string;
    email: string;
    mobile?: string;
    className?: string;
    fatherName?: string;
    dob?: string;
    registrationId?: string;
    photo?: string;
  };
  exam: Exam;
}
