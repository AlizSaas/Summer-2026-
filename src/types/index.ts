export interface BookEntry {
  id: string
  title: string
  author: string
  dateFinished: string
  summary: string
  knowledgeRating: number
  learningDepth: number
  practicalValue: number
  overallRating: number
  genre: string
  notes: string
  createdAt: string | null
}

export interface ProjectEntry {
  id: string
  title: string
  type: 'project' | 'open-source'
  description: string
  link: string
  techStack: string
  status: 'in-progress' | 'completed' | 'abandoned'
  impact: string
  lessonsLearned: string
  startDate: string
  endDate: string
  createdAt: string | null
}

export interface Goal {
  id: string
  title: string
  category: string
  description: string
  status: 'not-started' | 'in-progress' | 'completed' | 'paused'
  priority: 'low' | 'medium' | 'high'
  targetDate: string
  progress: number
  notes: string
  createdAt: string | null
}
