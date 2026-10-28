interface WrapperProps {
    children: React.ReactNode;
    heading?: string;
    scrollable?: boolean;
}

const Wrapper = ({ children, heading, scrollable = false }: WrapperProps) => {
    return (
        <div className={scrollable
            ? "flex h-full min-h-0 flex-col overflow-y-auto p-4"
            : "m-4 flex h-full w-[calc(100%-2rem)] flex-col"}>
            {heading && <h1 className="mb-5 mt-6 shrink-0 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">{heading}</h1>}
            {children}
        </div>
    )
}

export default Wrapper;
