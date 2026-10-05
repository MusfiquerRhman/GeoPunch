import PageLoading from "@/components/UI/PageLoading";

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-3xl">
        <PageLoading />
      </div>
    </main>
  );
}
