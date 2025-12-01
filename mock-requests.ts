export interface ServiceRequest {
  id: string;
  residentName: string;
  apartmentNumber: string;
  problemType: "leak" | "elevator" | "heating" | "electrical" | "plumbing" | "other";
  description: string;
  status: "pending" | "in-progress" | "resolved";
  priority: "low" | "medium" | "high" | "critical";
  createdAt: Date;
  updatedAt: Date;
  aiConversation: Array<{
    role: "user" | "ai";
    message: string;
    timestamp: Date;
  }>;
  staffNotes?: string;
}

export const mockRequests: ServiceRequest[] = [
  {
    id: "REQ-001",
    residentName: "Анна Петрова",
    apartmentNumber: "42",
    problemType: "leak",
    description: "Протечка воды из потолка в ванной комнате",
    status: "in-progress",
    priority: "high",
    createdAt: new Date("2024-01-15T09:30:00"),
    updatedAt: new Date("2024-01-15T10:15:00"),
    aiConversation: [
      {
        role: "user",
        message: "У меня течет вода из потолка в ванной",
        timestamp: new Date("2024-01-15T09:30:00"),
      },
      {
        role: "ai",
        message: "Понимаю, это серьезная ситуация. Скажите, пожалуйста, как давно началась протечка?",
        timestamp: new Date("2024-01-15T09:30:15"),
      },
      {
        role: "user",
        message: "Около часа назад",
        timestamp: new Date("2024-01-15T09:30:45"),
      },
      {
        role: "ai",
        message: "Насколько интенсивная протечка? Это капли или сильный поток?",
        timestamp: new Date("2024-01-15T09:31:00"),
      },
      {
        role: "user",
        message: "Довольно сильная, вода капает постоянно",
        timestamp: new Date("2024-01-15T09:31:30"),
      },
    ],
    staffNotes: "Связались с сантехником, выезд запланирован на сегодня",
  },
  {
    id: "REQ-002",
    residentName: "Иван Смирнов",
    apartmentNumber: "15",
    problemType: "elevator",
    description: "Лифт застрял между этажами",
    status: "resolved",
    priority: "critical",
    createdAt: new Date("2024-01-14T14:20:00"),
    updatedAt: new Date("2024-01-14T15:45:00"),
    aiConversation: [
      {
        role: "user",
        message: "Лифт не работает!",
        timestamp: new Date("2024-01-14T14:20:00"),
      },
      {
        role: "ai",
        message: "Понял. Есть ли кто-то внутри лифта?",
        timestamp: new Date("2024-01-14T14:20:10"),
      },
      {
        role: "user",
        message: "Нет, он просто застрял между этажами",
        timestamp: new Date("2024-01-14T14:20:30"),
      },
    ],
    staffNotes: "Лифт отремонтирован, проблема с датчиком была устранена",
  },
  {
    id: "REQ-003",
    residentName: "Мария Козлова",
    apartmentNumber: "28",
    problemType: "heating",
    description: "Отсутствует отопление в квартире",
    status: "pending",
    priority: "high",
    createdAt: new Date("2024-01-16T08:00:00"),
    updatedAt: new Date("2024-01-16T08:00:00"),
    aiConversation: [
      {
        role: "user",
        message: "В квартире холодно, батареи не греют",
        timestamp: new Date("2024-01-16T08:00:00"),
      },
      {
        role: "ai",
        message: "Понимаю вашу проблему. Батареи совсем холодные или чуть теплые?",
        timestamp: new Date("2024-01-16T08:00:15"),
      },
      {
        role: "user",
        message: "Совсем холодные",
        timestamp: new Date("2024-01-16T08:00:45"),
      },
      {
        role: "ai",
        message: "Это во всех комнатах или только в некоторых?",
        timestamp: new Date("2024-01-16T08:01:00"),
      },
      {
        role: "user",
        message: "Во всех комнатах",
        timestamp: new Date("2024-01-16T08:01:20"),
      },
    ],
  },
  {
    id: "REQ-004",
    residentName: "Дмитрий Волков",
    apartmentNumber: "7",
    problemType: "electrical",
    description: "Не работает освещение в коридоре",
    status: "pending",
    priority: "medium",
    createdAt: new Date("2024-01-16T11:30:00"),
    updatedAt: new Date("2024-01-16T11:30:00"),
    aiConversation: [
      {
        role: "user",
        message: "Не горит свет в коридоре",
        timestamp: new Date("2024-01-16T11:30:00"),
      },
      {
        role: "ai",
        message: "Понял. Вы проверили, не выбило ли автомат в электрощитке?",
        timestamp: new Date("2024-01-16T11:30:15"),
      },
      {
        role: "user",
        message: "Да, все автоматы включены",
        timestamp: new Date("2024-01-16T11:30:45"),
      },
    ],
  },
  {
    id: "REQ-005",
    residentName: "Елена Новикова",
    apartmentNumber: "33",
    problemType: "plumbing",
    description: "Засор в раковине на кухне",
    status: "resolved",
    priority: "low",
    createdAt: new Date("2024-01-13T16:00:00"),
    updatedAt: new Date("2024-01-14T09:30:00"),
    aiConversation: [
      {
        role: "user",
        message: "Не уходит вода в раковине",
        timestamp: new Date("2024-01-13T16:00:00"),
      },
      {
        role: "ai",
        message: "Понимаю. Вода совсем не уходит или уходит медленно?",
        timestamp: new Date("2024-01-13T16:00:15"),
      },
      {
        role: "user",
        message: "Очень медленно",
        timestamp: new Date("2024-01-13T16:00:40"),
      },
    ],
    staffNotes: "Засор устранен, рекомендовано использовать сетку",
  },
];
