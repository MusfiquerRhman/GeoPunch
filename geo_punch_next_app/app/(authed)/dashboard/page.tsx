const DashboardPage = () => {
    return (
        <div className="flex min-h-[calc(100vh-2rem)] items-center justify-center p-6">
            <div className="w-full max-w-3xl rounded-2xl border border-gray-200 bg-white px-8 py-14 text-center shadow-sm">
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">GeoPunch</p>
                <h1 className="text-3xl font-semibold text-gray-900 sm:text-4xl">Welcome to the Dashboard</h1>
                <p className="mt-3 text-gray-500">Your attendance workspace is ready.</p>
            </div>
        </div>
    );
}

export default DashboardPage;
