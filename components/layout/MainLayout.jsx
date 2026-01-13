const MainLayout = ({ children, className, styles = {} }) => {
    return (
        <div className={className + ' !max-w-[1200px] mx-auto px-4 xl:px-0'} style={{ ...styles }}>
            {children}
        </div>
    );
};

export default MainLayout;
