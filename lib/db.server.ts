// Database module - currently using in-memory store
// Replace with your preferred database (PostgreSQL, MySQL, MongoDB, etc.)

export interface User {
  id: string;
  email: string;
  password: string; // hashed
  name: string;
  role: "resident" | "staff";
  apartment?: string;
  createdAt: Date;
}

export interface Request {
  id: string;
  userId: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "new" | "in_progress" | "resolved" | "closed";
  apartment: string;
  description: string;
  conversation: Array<{ role: "user" | "assistant"; content: string }>;
  photos: string[];
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
  resolvedAt?: Date;
  staffNotes?: string;
}

// In-memory storage (replace with real database)
const users: Map<string, User> = new Map();
const requests: Map<string, Request> = new Map();

// Initialize with demo users
const demoUsers: User[] = [
  {
    id: "user-1",
    email: "resident@demo.com",
    password: "$2a$10$rZGqhZxHxKxQxJxQxJxQxOYvY.vY.vY.vY.vY.vY.vY.vY.vY.vY.", // "password123"
    name: "Мария Петрова",
    role: "resident",
    apartment: "42",
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "user-2",
    email: "staff@demo.com",
    password: "$2a$10$rZGqhZxHxKxQxJxQxJxQxOYvY.vY.vY.vY.vY.vY.vY.vY.vY.vY.", // "password123"
    name: "Иван Сидоров",
    role: "staff",
    createdAt: new Date("2023-06-01"),
  },
];

demoUsers.forEach((user) => users.set(user.id, user));

// Database operations
export const db = {
  // Users
  async getUserByEmail(email: string): Promise<User | null> {
    return Array.from(users.values()).find((u) => u.email === email) || null;
  },

  async getUserById(id: string): Promise<User | null> {
    return users.get(id) || null;
  },

  async createUser(userData: Omit<User, "id" | "createdAt">): Promise<User> {
    const user: User = {
      ...userData,
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };
    users.set(user.id, user);
    return user;
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const user = users.get(id);
    if (!user) return null;
    const updated = { ...user, ...updates };
    users.set(id, updated);
    return updated;
  },

  // Requests
  async getRequestById(id: string): Promise<Request | null> {
    return requests.get(id) || null;
  },

  async getRequestsByUserId(userId: string): Promise<Request[]> {
    return Array.from(requests.values())
      .filter((r) => r.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async getAllRequests(): Promise<Request[]> {
    return Array.from(requests.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async createRequest(requestData: Omit<Request, "id" | "createdAt" | "updatedAt">): Promise<Request> {
    const request: Request = {
      ...requestData,
      id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    requests.set(request.id, request);
    return request;
  },

  async updateRequest(id: string, updates: Partial<Request>): Promise<Request | null> {
    const request = requests.get(id);
    if (!request) return null;
    const updated = { ...request, ...updates, updatedAt: new Date() };
    requests.set(id, updated);
    return updated;
  },

  async deleteRequest(id: string): Promise<boolean> {
    return requests.delete(id);
  },

  // Stats
  async getRequestStats() {
    const allRequests = Array.from(requests.values());
    return {
      total: allRequests.length,
      new: allRequests.filter((r) => r.status === "new").length,
      inProgress: allRequests.filter((r) => r.status === "in_progress").length,
      resolved: allRequests.filter((r) => r.status === "resolved").length,
      urgent: allRequests.filter((r) => r.priority === "urgent").length,
    };
  },
};
