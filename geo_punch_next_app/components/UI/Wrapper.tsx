interface WrapperProps {
    children: React.ReactNode;
    heading?: string;
}

const Wrapper = ({ children, heading }: WrapperProps) => {
    return (
        <div className="m-4 flex h-full w-[calc(100%-2rem)] flex-col">
            {heading && <h1 className="mb-5 mt-6 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">{heading}</h1>}
            {children}
        </div>
    )
}

export default Wrapper;
