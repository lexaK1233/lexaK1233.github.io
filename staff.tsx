import { useState } from "react";
import { Link, useLoaderData, useNavigate } from "react-router";
import type { Route } from "./+types/staff";
import styles from "./staff.module.css";
import { Button } from "~/components/ui/button/button";
import { Badge } from "~/components/ui/badge/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table/table";
import { ArrowLeft, FileText, AlertCircle, CheckCircle, Clock } from "lucide-react";

export async function loader({ request }: Route.LoaderArgs) {
  const { requireStaffUser } = await import("~/lib/auth.server");
  const { db } = await import("~/lib/db.server");

  await requireStaffUser(request);
  const requests = await db.getAllRequests();
  const stats = await db.getRequestStats();

  // Get user names for requests
  const requestsWithUsers = await Promise.all(
    requests.map(async (req) => {
      const user = await db.getUserById(req.userId);
      return {
        ...req,
        residentName: user?.name || "Unknown",
      };
    })
  );

  return { requests: requestsWithUsers, stats };
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Панель персонала - Домовой" }];
}

const getPriorityVariant = (priority: string) => {
  switch (priority) {
    case "urgent":
    case "high":
      return "destructive";
    case "medium":
      return "default";
    case "low":
      return "secondary";
    default:
      return "default";
  }
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case "resolved":
    case "closed":
      return "default";
    case "in_progress":
      return "secondary";
    case "new":
      return "outline";
    default:
      return "outline";
  }
};

const getPriorityLabel = (priority: string) => {
  const labels: Record<string, string> = {
    urgent: "Срочно",
    high: "Высокий",
    medium: "Средний",
    low: "Низкий",
  };
  return labels[priority] || priority;
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    new: "Новая",
    in_progress: "В работе",
    resolved: "Решена",
    closed: "Закрыта",
  };
  return labels[status] || status;
};

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    leak: "Протечка",
    elevator: "Лифт",
    heating: "Отопление",
    electrical: "Электрика",
    plumbing: "Сантехника",
    other: "Другое",
  };
  return labels[category] || category;
};

export default function Staff() {
  const { requests, stats } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const filteredRequests = requests.filter((request) => {
    if (statusFilter !== "all" && request.status !== statusFilter) return false;
    if (priorityFilter !== "all" && request.priority !== priorityFilter) return false;
    return true;
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <Button asChild variant="link">
              <Link to="/">
                <ArrowLeft style={{ width: "20px", height: "20px", marginRight: "8px" }} />
                Назад
              </Link>
            </Button>
            <h1 className={styles.headerTitle}>Панель персонала</h1>
          </div>
        </div>
      </header>

      <main className={styles.content}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel}>Всего заявок</span>
              <FileText className={styles.statIcon} />
            </div>
            <p className={styles.statValue}>{stats.total}</p>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel}>Новые</span>
              <Clock className={styles.statIcon} />
            </div>
            <p className={styles.statValue}>{stats.new}</p>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel}>В работе</span>
              <AlertCircle className={styles.statIcon} />
            </div>
            <p className={styles.statValue}>{stats.inProgress}</p>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel}>Решены</span>
              <CheckCircle className={styles.statIcon} />
            </div>
            <p className={styles.statValue}>{stats.resolved}</p>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel}>Срочные</span>
              <AlertCircle className={styles.statIcon} />
            </div>
            <p className={styles.statValue}>{stats.urgent}</p>
          </div>
        </div>

        <div className={styles.filters}>
          <span className={styles.filterLabel}>Фильтры:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger style={{ width: "200px" }}>
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="new">Новая</SelectItem>
              <SelectItem value="in_progress">В работе</SelectItem>
              <SelectItem value="resolved">Решена</SelectItem>
              <SelectItem value="closed">Закрыта</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger style={{ width: "200px" }}>
              <SelectValue placeholder="Приоритет" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все приоритеты</SelectItem>
              <SelectItem value="urgent">Срочно</SelectItem>
              <SelectItem value="high">Высокий</SelectItem>
              <SelectItem value="medium">Средний</SelectItem>
              <SelectItem value="low">Низкий</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className={styles.tableContainer}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Жилец</TableHead>
                <TableHead>Квартира</TableHead>
                <TableHead>Тип проблемы</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Приоритет</TableHead>
                <TableHead>Дата</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow
                  key={request.id}
                  className={styles.tableRow}
                  onClick={() => navigate(`/request/${request.id}`)}
                >
                  <TableCell style={{ fontWeight: 600, color: "var(--color-accent-9)" }}>#{request.id.slice(4, 12)}</TableCell>
                  <TableCell>{request.residentName}</TableCell>
                  <TableCell>{request.apartment}</TableCell>
                  <TableCell>{getCategoryLabel(request.category)}</TableCell>
                  <TableCell style={{ maxWidth: "250px" }}>{request.description}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(request.status)}>{getStatusLabel(request.status)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityVariant(request.priority)}>{getPriorityLabel(request.priority)}</Badge>
                  </TableCell>
                  <TableCell>{new Date(request.createdAt).toLocaleDateString("ru-RU")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
