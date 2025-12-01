interface SuggestedRoute {
  title: string;
  uri: string;
}

interface RouteDescription {
  suggestedRoutes: SuggestedRoute[];
  itemTitle: string;
}

export function getRouteDescription(): RouteDescription {
  // Sample request IDs from the in-memory database
  // In production, these would be fetched from your real database
  const sampleRequests = [
    {
      id: "req-1705311000000-abc123xyz",
      title: "Заявка #1705311000000",
      description: "Протечка воды в ванной",
    },
    {
      id: "req-1705310900000-def456uvw",
      title: "Заявка #1705310900000",
      description: "Неисправность лифта",
    },
    {
      id: "req-1705310800000-ghi789rst",
      title: "Заявка #1705310800000",
      description: "Проблемы с отоплением",
    },
  ];

  return {
    suggestedRoutes: sampleRequests.map((req) => ({
      title: req.title,
      uri: `/request/${req.id}`,
    })),
    itemTitle: "Заявка",
  };
}
