'use client'
import Navbar from "./Navbar";
import Header from "./Header";
import ProtectedRoute from "../auth/ProtectedRoute";
import { usePathname } from "next/navigation";

const Layout = ({ children }) => {
  const pathname = usePathname();
  
  // Define auth pages that don't need protection
  const authPages = ['/login', '/register', '/forgot-password'];
  const isAuthPage = authPages.includes(pathname);
  
  if (isAuthPage) {
    // Auth pages - no protection needed
    return (
      <div className="flex h-screen !w-full">
        {children}
      </div>
    );
  }

  // Protected pages - require admin authentication
  return (
    <ProtectedRoute>
      <div className="flex h-screen !w-full">
        <Navbar />
        <div className="overflow-y-auto !w-full">
          <Header />
          {children}
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default Layout;