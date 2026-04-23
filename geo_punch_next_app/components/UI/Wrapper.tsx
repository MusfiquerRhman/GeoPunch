interface WrapperProps {
    children: React.ReactNode;
    heading?: string;
}

const Wrapper = ({ children, heading }: WrapperProps) => {
    return (
        <div className="w-full h-full flex m-4 flex-col">
            {heading && <h1 className="text-2xl font-semibold mb-4">{heading}</h1>}
            {children}
        </div>
    )
}

export default Wrapper;