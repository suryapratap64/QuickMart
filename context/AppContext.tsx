// 'use client';

'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { productsDummyData, userDummyData } from "@/assets/assets";
import { useRouter } from "next/navigation";
import type { UserResource } from "@clerk/types";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "react-toastify";
import axios from "axios";

// Types
interface ProductType {
  _id: string;
  name: string;
  description: string;
  price: number;
  offerPrice: number;
  category: string;
  image: string[];
}

interface UserType {
  name: string;
  email: string;
  [key: string]: any;
}

interface CartItemsType {
  [key: string]: number;
}

interface AppContextType {
  user: UserResource | null | undefined;
  currency: string;
  getToken: () => Promise<string>;
  router: ReturnType<typeof useRouter>;
  isSeller: boolean;
  setIsSeller: (val: boolean) => void;
  userData: UserType | false;
  fetchUserData: () => Promise<void>;
  products: ProductType[];
  fetchProductData: () => Promise<void>;
  cartItems: CartItemsType;
  setCartItems: React.Dispatch<React.SetStateAction<CartItemsType>>;
  addToCart: (itemId: string | number) => Promise<void>;
  updateCartQuantity: (itemId: string | number, quantity: number) => Promise<void>;
  getCartCount: () => number;
  getCartAmount: () => number;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppContextProvider");
  return context;
};

interface ProviderProps {
  children: ReactNode;
}

export const AppContextProvider: React.FC<ProviderProps> = ({ children }) => {
  const currency = process.env.NEXT_PUBLIC_CURRENCY || "₹";
  const router = useRouter();
  const { user } = useUser();
  const { getToken } = useAuth();

  const [products, setProducts] = useState<ProductType[]>([]);
  const [userData, setUserData] = useState<UserType | false>(false);
  const [isSeller, setIsSeller] = useState<boolean>(false);
  const [cartItems, setCartItems] = useState<CartItemsType>({});

  const fetchProductData = async () => {
   
    try {
      const { data } = await axios.get('/api/product/list');
      if (data.success) {
        setProducts(data.products);
      } else {
        toast.error(data.message);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const fetchUserData = async () => {
    setUserData(userDummyData);
    try {
      if (user?.publicMetadata?.role === 'seller') {
        setIsSeller(true);
      }
      const token = await getToken();
      const { data } = await axios.get('/api/user/data', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setUserData(data.user);
        setCartItems(data.user.cartItems);
      } else {
        toast.error(data.message);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const addToCart = async (itemId: string | number) => {
    const cartData = structuredClone(cartItems);
    const key = String(itemId);
    cartData[key] = cartData[key] ? cartData[key] + 1 : 1;
    setCartItems(cartData);

    if (user) {
      try {
        const token = await getToken();
        await axios.post('/api/cart/update', { cartData }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Item added to cart');
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const updateCartQuantity = async (itemId: string | number, quantity: number) => {
    const cartData = structuredClone(cartItems);
    const key = String(itemId);
    if (quantity === 0) delete cartData[key];
    else cartData[key] = quantity;
    setCartItems(cartData);

    if (user) {
      try {
        const token = await getToken();
        await axios.post('/api/cart/update', { cartData }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Cart updated');
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const getCartCount = () => {
    return Object.values(cartItems).reduce((acc, qty) => acc + qty, 0);
  };
const safeGetToken = async (): Promise<string> => {
  const token = await getToken();
  if (!token) throw new Error("Token is null");
  return token;
};
  const getCartAmount = () => {
    let totalAmount = 0;
    for (const itemId in cartItems) {
      const product = products.find(p => p._id === itemId);
      if (product) totalAmount += product.offerPrice * cartItems[itemId];
    }
    return Math.floor(totalAmount * 100) / 100;
  };

  useEffect(() => {
    fetchProductData();
    fetchUserData();
  }, []);

  useEffect(() => {
    if (user) fetchUserData();
  }, [user]);

  const value: AppContextType = {
    user,
    getToken: safeGetToken,
    currency,
    router,
    isSeller,
    setIsSeller,
    userData,
    fetchUserData,
    products,
    fetchProductData,
    cartItems,
    setCartItems,
    addToCart,
    updateCartQuantity,
    getCartCount,
    getCartAmount,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};


// import React from "react";
// import { productsDummyData, userDummyData } from "@/assets/assets";
// import { useRouter } from "next/navigation";
// import type { UserResource } from "@clerk/types";
// import { toast } from "react-toastify";
// import axios from "axios";
// import {

//   createContext,
//   useContext,
//   useEffect,
//   useState,
//   ReactNode,
// } from "react";
// import { useAuth, useUser } from "@clerk/nextjs";
// import { User } from "@clerk/nextjs/server";


// // Types
// interface ProductType {
//   _id: string;
//   name: string;
//   description: string;
//   price: number;
//   offerPrice: number;
//   category: string;
//   image: string[];
// }

// interface UserType {
//   name: string;
//   email: string;
//   [key: string]: any; // Extend as needed
// }

// interface CartItemsType {
//   [key: string]: number;
// }

// interface AppContextType {
//    user: User | null;
//   currency: string | undefined;
//   getToken: () => Promise<string>;
//   router: ReturnType<typeof useRouter>;
//   isSeller: boolean;
//   setIsSeller: (val: boolean) => void;
//   userData: UserType | false;
//   fetchUserData: () => Promise<void>;
//   products: ProductType[];
//   fetchProductData: () => Promise<void>;
//   cartItems: CartItemsType;
//   setCartItems: React.Dispatch<React.SetStateAction<CartItemsType>>;
//   addToCart: (itemId: string | number) => Promise<void>;
//   updateCartQuantity: (itemId: string | number, quantity: number) => Promise<void>;
//   getCartCount: () => number;
//   getCartAmount: () => number;
// }

// export const AppContext = createContext<AppContextType | undefined>(undefined);

// export const useAppContext = () => {
//   const context = useContext(AppContext);
//   if (!context) throw new Error("useAppContext must be used within AppContextProvider");
//   return context;
// };

// interface ProviderProps {
//   children: ReactNode;
// }

// export const AppContextProvider: React.FC<ProviderProps> = ({ children }) => {
//   const currency = process.env.NEXT_PUBLIC_CURRENCY;
//   const router = useRouter();
//   const {user}= useUser();
// const {getToken}=useAuth();
//   const [products, setProducts] = useState<ProductType[]>([]);
//   const [userData, setUserData] = useState<UserType | false>(false);
//   const [isSeller, setIsSeller] = useState(true);
//   const [cartItems, setCartItems] = useState<CartItemsType>({});

//   const fetchProductData = async () => {
//     setProducts(productsDummyData);
//     try {
//       const {data}=await axios.get('/api/product/list')
//       if(data.success){
//         setProducts(data.products)
//       }else{
//         toast.error(data.message)     }
//     } catch (error) {
//       toast.error(error.message)
      
//     }


//   };

//   const fetchUserData = async () => {
//     setUserData(userDummyData);
//     try{
//       if(user.publicMetadata.role==='seler'){
//         setIsSeller(true)
//       }
//       const token =await getToken()
//       const {data}=await  axios.get('/api/user/data',{headers:{Authorization:`Bearer ${token}`}})
//       if(data.succcess)
// {
//   setUserData(data.user);
//   setCartItems(data.user.cartItems)
// }else{
//   toast.error(data.message)
// }



//     } catch(error){
// toast.error(error.message)
//     }
//   };

//   const addToCart = async (itemId: string | number) => {
//     const cartData = structuredClone(cartItems);
//     const key = String(itemId);
//     cartData[key] = cartData[key] ? cartData[key] + 1 : 1;
//     setCartItems(cartData);
   
//     if(user){
//       try {
//         const token=await getToken()

//         await axios.post('/api/cart/update',{cartData},{headers:{Authorization:`Bearer ${token}`}})
//          toast.success('Items added to cart');
//       } catch (error) {
//         toast.error(error.message)
        
//       }
//     }
//   };

//   const updateCartQuantity = async (itemId: string | number, quantity: number) => {
//     const cartData = structuredClone(cartItems);
//     const key = String(itemId);
//     if (quantity === 0) delete cartData[key];
//     else cartData[key] = quantity;
//     setCartItems(cartData);
//     if(user){
//       try {
//         const token=await getToken()

//         await axios.post('/api/cart/update',{cartData},{headers:{Authorization:`Bearer ${token}`}})
//          toast.success('cart Updated');
//       } catch (error) {
//         toast.error(error.message)
        
//       }
//     }
//   };

//   const getCartCount = () => {
//     return Object.values(cartItems).reduce((acc, qty) => acc + qty, 0);
//   };

//   const getCartAmount = () => {
//     let totalAmount = 0;
//     for (const itemId in cartItems) {
//       const product = products.find(p => p._id === itemId);
//       if (product) totalAmount += product.offerPrice * cartItems[itemId];
//     }
//     return Math.floor(totalAmount * 100) / 100;
//   };

//   useEffect(() => {
//     fetchProductData();
//     fetchUserData();

//   },);
  
//   useEffect(() => {
//    if(user){
// fetchUserData();
//    }
   

//   },[user]);
// //value that used in any files
//   const value: AppContextType = {
//     user,getToken,
//     currency,
//     router,
//     isSeller,
//     setIsSeller,
//     userData,
//     fetchUserData,
//     products,
//     fetchProductData,
//     cartItems,
//     setCartItems,
//     addToCart,
//     updateCartQuantity,
//     getCartCount,
//     getCartAmount,
//   };

//   return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
// };
