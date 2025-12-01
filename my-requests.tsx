import { Link, useLoaderData, useNavigate } from "react-router";
import type { Route } from "./+types/my-requests";
import styles from "./my-requests.module.css";
import { Button } from "~/components/ui/button/button";
import { Badge } from "~/components/ui/badge/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table/table";
import { ArrowLeft, Plus, FileText } from "lucide-react";

export async function loader({ request }: Route.LoaderArgs) {
  const { requireUser } = await import("~/lib/auth.server");
  const { db } = await import("~/lib/db.server");
  const user = await requireUser(request);
  const requests = await db.getRequestsByUserId(user.id);
  return { requests };
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Мои заявки - Домовой" }];
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

export default function MyRequests() {
  const { requests } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

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
            <h1 className={styles.headerTitle}>Мои заявки</h1>
          </div>
          <Button asChild>
            <Link to="/submit">
              <Plus style={{ width: "20px", height: "20px", marginRight: "8px" }} />
              Создать заявку
            </Link>
          </Button>
        </div>
      </header>

      <main className={styles.content}>
        <div className={styles.tableContainer}>
          {requests.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Тип проблемы</TableHead>
                  <TableHead>Описание</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Приоритет</TableHead>
                  <TableHead>Дата создания</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow
                    key={request.id}
                    className={styles.tableRow}
                    onClick={() => navigate(`/request/${request.id}`)}
                  >
                    <TableCell style={{ fontWeight: 600, color: "var(--color-accent-9)" }}>#{request.id.slice(4, 12)}</TableCell>
                    <TableCell>{getCategoryLabel(request.category)}</TableCell>
                    <TableCell style={{ maxWidth: "300px" }}>{request.description}</TableCell>
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
          ) : (
            <div className={styles.emptyState}>
              <FileText className={styles.emptyIcon} />
              <h3 className={styles.emptyTitle}>Заявок пока нет</h3>
              <p className={styles.emptyText}>Создайте свою первую заявку, и она появится здесь</p>
              <Button asChild>
                <Link to="/submit">Создать заявку</Link>
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
