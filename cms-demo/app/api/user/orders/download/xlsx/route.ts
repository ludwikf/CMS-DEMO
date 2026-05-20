
export async function POST() {
  return new Response(
    "This endpoint has been moved to /api/user/orders/download/xlsx",
    {
      status: 410,
      headers: { "Content-Type": "text/plain" },
    }
  );
}
