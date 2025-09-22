"use client";

import Navbar from "../../components/seller/Navbar";
import Sidebar from "../../components/seller/Sidebar";
import React, { ReactNode, useEffect, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { usePathname } from "next/navigation";
import { toast } from "react-toastify";

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user } = useAppContext();
  const pathname = usePathname();
  const [isRestricted, setIsRestricted] = useState(false);

  useEffect(() => {
    const isProductPage =
      pathname?.includes("/seller/product-list") || pathname === "/seller";
    const isNotAdmin = !(user && (user as any).role === "admin");

    if (isProductPage && isNotAdmin) {
      setIsRestricted(true);
      toast.warning("You don't have permission to access product management.");
    } else {
      setIsRestricted(false);
    }
  }, [pathname, user]);

  return (
    <div>
      <Navbar />
      <div className="flex w-full">
        <Sidebar />
        <div
          className={`flex-1 relative ${
            isRestricted ? "pointer-events-none" : ""
          }`}
        >
          {isRestricted && (
            <div className="absolute inset--1 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-red-600 font-medium">Access Restricted</p>
                <p className="text-gray-600">Only admins can manage products.</p>
              </div>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;


// 'use client'
// import Navbar from '@/components/seller/Navbar'
// import Sidebar from '@/components/seller/Sidebar'
// import React from 'react'

// const Layout = ({ children }) => {
//   return (
//     <div>
//       <Navbar />
//       <div className='flex w-full'>
//         <Sidebar />
//         {children}
//       </div>
//     </div>
//   )
// }

// export default Layout
