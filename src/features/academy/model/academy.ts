import { z } from 'zod';

export const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type Level = (typeof LEVELS)[number];
export const CATEGORIES = ['data', 'design', 'engineering', 'product', 'leadership'] as const;
export type Category = (typeof CATEGORIES)[number];
export const LESSON_TYPES = ['video', 'reading', 'quiz', 'lab'] as const;
export type LessonType = (typeof LESSON_TYPES)[number];
export const SORTS = ['popular', 'rating', 'newest', 'shortest'] as const;
export type CourseSort = (typeof SORTS)[number];
export const PRICES = ['any', 'free', 'paid'] as const;
export type PriceFilter = (typeof PRICES)[number];
export const SESSION_KINDS = ['live', 'office-hours', 'workshop', 'exam'] as const;
export type SessionKind = (typeof SESSION_KINDS)[number];

export const courseSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  category: z.enum(CATEGORIES),
  level: z.enum(LEVELS),
  color: z.string(),
  tags: z.array(z.string()),
  price: z.number(),
  durationMin: z.number(),
  lessonCount: z.number(),
  rating: z.number(),
  reviewCount: z.number(),
  students: z.number(),
  instructor: z.object({ id: z.string(), name: z.string(), title: z.string() }),
  enrolled: z.boolean(),
  progress: z.number(),
  updatedAt: z.string(),
});
export type CourseSummary = z.infer<typeof courseSummarySchema>;

export const lessonSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(LESSON_TYPES),
  durationMin: z.number(),
  completed: z.boolean(),
  preview: z.boolean(),
});
export type Lesson = z.infer<typeof lessonSchema>;

export const moduleSchema = z.object({
  id: z.string(),
  title: z.string(),
  lessons: z.array(lessonSchema),
});
export type CourseModule = z.infer<typeof moduleSchema>;

export const instructorSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string(),
  bio: z.string(),
  topics: z.array(z.string()),
  rating: z.number(),
  students: z.number(),
});

export const courseDetailSchema = courseSummarySchema.extend({
  modules: z.array(moduleSchema),
  instructor: instructorSchema,
  outcomes: z.array(z.string()),
  requirements: z.array(z.string()),
  reviews: z.array(
    z.object({
      id: z.string(),
      author: z.string(),
      rating: z.number(),
      body: z.string(),
      createdAt: z.string(),
    }),
  ),
});
export type CourseDetail = z.infer<typeof courseDetailSchema>;

export const catalogSchema = z.object({
  courses: z.array(courseSummarySchema),
  facets: z.object({
    levels: z.array(z.object({ value: z.enum(LEVELS), count: z.number() })),
    categories: z.array(z.object({ value: z.enum(CATEGORIES), count: z.number() })),
  }),
});
export type Catalog = z.infer<typeof catalogSchema>;

export type CatalogFilters = {
  q: string;
  levels: Level[];
  categories: Category[];
  price: PriceFilter;
  sort: CourseSort;
};

export const homeSchema = z.object({
  learner: z.object({
    streakDays: z.number(),
    weeklyGoalMin: z.number(),
    weeklyDoneMin: z.number(),
    xp: z.number(),
    level: z.number(),
  }),
  continueLearning: z.array(
    z.object({
      courseId: z.string(),
      title: z.string(),
      color: z.string(),
      category: z.enum(CATEGORIES),
      progress: z.number(),
      nextLessonId: z.string().nullable(),
      nextLessonTitle: z.string().nullable(),
      minutesLeft: z.number(),
    }),
  ),
  activity: z.array(z.array(z.number())),
  upcoming: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      instructor: z.string(),
      kind: z.enum(SESSION_KINDS),
      startsAt: z.string(),
      durationMin: z.number(),
    }),
  ),
  achievements: z.array(
    z.object({ id: z.string(), name: z.string(), description: z.string(), progress: z.number() }),
  ),
  recommended: z.array(courseSummarySchema),
});
export type AcademyHome = z.infer<typeof homeSchema>;

export const noteSchema = z.object({
  id: z.string(),
  atSec: z.number(),
  body: z.string(),
  createdAt: z.string(),
});
export type Note = z.infer<typeof noteSchema>;

export const questionSchema = z.object({
  id: z.string(),
  author: z.string(),
  body: z.string(),
  votes: z.number(),
  answers: z.number(),
  createdAt: z.string(),
});
export type Question = z.infer<typeof questionSchema>;

export const lessonPageSchema = z.object({
  course: z.object({ id: z.string(), title: z.string(), instructor: z.string() }),
  lesson: lessonSchema.extend({
    transcript: z.array(z.object({ atSec: z.number(), text: z.string() })),
    resources: z.array(z.object({ name: z.string(), size: z.string() })),
  }),
  modules: z.array(moduleSchema),
  notes: z.array(noteSchema),
  questions: z.array(questionSchema),
});
export type LessonPage = z.infer<typeof lessonPageSchema>;

export const scheduleSchema = z.object({
  weekStart: z.string(),
  sessions: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      instructor: z.string(),
      location: z.string(),
      kind: z.enum(SESSION_KINDS),
      startsAt: z.string(),
      durationMin: z.number(),
      attendees: z.number(),
    }),
  ),
});
export type Schedule = z.infer<typeof scheduleSchema>;

export const STUDENT_STATUSES = ['on-track', 'at-risk', 'completed'] as const;
export const studentSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  courseId: z.string(),
  courseTitle: z.string(),
  progress: z.number(),
  grade: z.number(),
  lastActive: z.string(),
  status: z.enum(STUDENT_STATUSES),
});
export type Student = z.infer<typeof studentSchema>;

export const certificateSchema = z.object({
  id: z.string(),
  courseTitle: z.string(),
  instructor: z.string(),
  issuedAt: z.string(),
  credentialId: z.string(),
  hours: z.number(),
  grade: z.number(),
});
export type Certificate = z.infer<typeof certificateSchema>;

export const instructorWithCoursesSchema = instructorSchema.extend({
  courses: z.array(z.object({ id: z.string(), title: z.string() })),
});
export type Instructor = z.infer<typeof instructorWithCoursesSchema>;

export const studentProfileSchema = z.object({
  student: studentSchema,
  joinedAt: z.string(),
  enrollments: z.array(
    z.object({
      courseId: z.string(),
      title: z.string(),
      color: z.string(),
      category: z.enum(CATEGORIES),
      progress: z.number(),
      grade: z.number(),
      lastActive: z.string(),
    }),
  ),
  grades: z.array(
    z.object({
      assignmentId: z.string(),
      title: z.string(),
      courseTitle: z.string(),
      points: z.number(),
      score: z.number().nullable(),
      submittedAt: z.string(),
    }),
  ),
  /** Minutes per day: rows Monday → Sunday, columns the last 12 weeks. */
  activity: z.array(z.array(z.number())),
  streakDays: z.number(),
  longestStreak: z.number(),
  totalMinutes: z.number(),
  certificates: z.array(certificateSchema.omit({ instructor: true, hours: true })),
});
export type StudentProfile = z.infer<typeof studentProfileSchema>;

export const assignmentSchema = z.object({
  id: z.string(),
  title: z.string(),
  courseId: z.string(),
  courseTitle: z.string(),
  dueAt: z.string(),
  points: z.number(),
  enrolled: z.number(),
  submitted: z.number(),
  graded: z.number(),
  /** Average graded score as a percentage of `points`. */
  averageScore: z.number().nullable(),
});
export type Assignment = z.infer<typeof assignmentSchema>;

export const submissionSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  studentName: z.string(),
  studentEmail: z.string(),
  submittedAt: z.string(),
  late: z.boolean(),
  score: z.number().nullable(),
  feedback: z.string(),
  attachment: z.object({ name: z.string(), size: z.string() }),
});
export type Submission = z.infer<typeof submissionSchema>;

export const assignmentDetailSchema = assignmentSchema.extend({
  brief: z.string(),
  submissions: z.array(submissionSchema),
});
export type AssignmentDetail = z.infer<typeof assignmentDetailSchema>;

export const quizSchema = z.object({
  courseId: z.string(),
  courseTitle: z.string(),
  timeLimitSec: z.number(),
  passingScore: z.number(),
  attempts: z.number(),
  bestScore: z.number().nullable(),
  questions: z.array(
    z.object({
      id: z.string(),
      prompt: z.string(),
      options: z.array(z.object({ id: z.string(), text: z.string() })),
    }),
  ),
});
export type Quiz = z.infer<typeof quizSchema>;

export const quizResultSchema = z.object({
  score: z.number(),
  correct: z.number(),
  total: z.number(),
  passed: z.boolean(),
  review: z.array(
    z.object({
      questionId: z.string(),
      selectedId: z.string().nullable(),
      correctId: z.string(),
      explanation: z.string(),
    }),
  ),
});
export type QuizResult = z.infer<typeof quizResultSchema>;

export const THREAD_FILTERS = ['all', 'unanswered', 'mine'] as const;
export type ThreadFilter = (typeof THREAD_FILTERS)[number];

export const threadSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  courseId: z.string(),
  courseTitle: z.string(),
  author: z.string(),
  createdAt: z.string(),
  lastActivityAt: z.string(),
  votes: z.number(),
  replyCount: z.number(),
  answered: z.boolean(),
  mine: z.boolean(),
});
export type Thread = z.infer<typeof threadSchema>;

export const replySchema = z.object({
  id: z.string(),
  author: z.string(),
  role: z.enum(['student', 'instructor']),
  body: z.string(),
  createdAt: z.string(),
  accepted: z.boolean(),
});
export type Reply = z.infer<typeof replySchema>;

export const threadListSchema = z.object({
  threads: z.array(threadSchema),
  counts: z.record(z.enum(THREAD_FILTERS), z.number()),
  courses: z.array(z.object({ id: z.string(), title: z.string() })),
});
export type ThreadList = z.infer<typeof threadListSchema>;

export const threadDetailSchema = threadSchema.extend({ replies: z.array(replySchema) });
export type ThreadDetail = z.infer<typeof threadDetailSchema>;

export const ASSIGNMENT_STATUSES = ['open', 'grading', 'closed'] as const;
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];
export const assignmentStatus = (a: Assignment): AssignmentStatus =>
  new Date(a.dueAt).getTime() > Date.now() ? 'open' : a.graded < a.submitted ? 'grading' : 'closed';
