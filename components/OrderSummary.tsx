"use client";

import React, { useEffect, useState } from "react";
import { addressDummyData } from "@/assets/assets";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import axios from "axios";
import Razorpay from "razorpay";

// Type definitions
interface Address {
  _id: string;
  fullName: string;
  area: string;
  city: string;
  state: string;
  phoneNumber?: string;
}

interface CartItem {
  product: string;
  quantity: number;
}

const OrderSummary = () => {
  const {
    currency,
    router,
    getCartCount,
    getCartAmount,
    getToken,
    userData,
    cartItems,
    setCartItems,
    user,
  } = useAppContext();

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [userAddresses, setUserAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchUserAddresses = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/user/get-address", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setUserAddresses(data.addresses);
        if (data.addresses.length > 0) {
          setSelectedAddress(data.addresses[0]);
        } else {
          toast.error(data.message);
        }
      }
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
      else toast.error("Failed to fetch addresses.");
    }
  };

  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
    setIsDropdownOpen(false);
  };
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") return resolve(false);
      if (window.Razorpay) return resolve(true); // Already loaded

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };
  const createOrder = async () => {
    try {
      setIsLoading(true);
      if (!selectedAddress) {
        setIsLoading(false);
        return toast.error("Please select an address");
      }

      let cartItemsArray: CartItem[] = Object.keys(cartItems)
        .map((key) => ({
          product: key,
          quantity: cartItems[key],
        }))
        .filter((item) => item.quantity > 0);

      if (cartItemsArray.length === 0) {
        return toast.error("Cart is empty");
      }

      const token = await getToken();

      // ✅ Step 1: Create order on backend
      const { data } = await axios.post(
        "/api/order/create",
        {
          address: selectedAddress, // or selectedAddress._id based on backend
          items: cartItemsArray,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!data.success) {
        return toast.error(data.message || "Order creation failed");
      }

      // ✅Step 2: Load Razorpay safely
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || typeof window.Razorpay === "undefined") {
        return toast.error(
          "Razorpay SDK failed to load. Please refresh and try again."
        );
      }
      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      if (!razorpayKey) {
        toast.error("Missing Razorpay public key");
        return;
      }

      const options = {
        key: razorpayKey, // ensure this is defined
        amount: data.amount,
        currency: data.currency,
        name: "Your Store Name",
        description: "Order Payment",
        order_id: data.orderId,
        handler: async function (response: any) {
          toast.success("Payment Successful 🎉");

          await axios.post("/api/order/verify", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });

          setCartItems({});
          router.push("/order-placed");
        },
        prefill: {
          name: selectedAddress.fullName,
          contact: selectedAddress.phoneNumber,
        },
        theme: {
          color: "#F37254",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error(error);
      toast.error("Payment process failed.");
    } finally {
      setIsLoading(false);
    }
  };

  // const createOrder = async () => {
  //   try {
  //     if (!selectedAddress) {
  //       return toast.error("Please select an address");
  //     }

  //     let cartItemsArray: CartItem[] = Object.keys(cartItems).map((key) => ({
  //       product: key,
  //       quantity: cartItems[key],
  //     }));
  //     cartItemsArray = cartItemsArray.filter((item) => item.quantity > 0);

  //     if (cartItemsArray.length === 0) {
  //       return toast.error("Cart is empty");
  //     }

  //     const token = await getToken();
  //     const { data } = await axios.post(
  //       "/api/order/create",
  //       {
  //         address: selectedAddress._id,
  //         items: cartItemsArray,
  //       },
  //       { headers: { Authorization: `Bearer ${token}` } }
  //     );

  //     if (data.success) {
  //       toast.success(data.message);
  //       setCartItems({});
  //       router.push("/order-placed");
  //     } else {
  //       toast.error(data.message);
  //     }
  //   } catch (error) {
  //     if (error instanceof Error) toast.error(error.message);
  //     else toast.error("Order creation failed.");
  //   }
  // };

  useEffect(() => {
    if (user) {
      fetchUserAddresses();
    }
  }, [user]);

  return (
    <div className="w-full md:w-96 bg-gray-500/5 p-5">
      <h2 className="text-xl md:text-2xl font-medium text-gray-700">
        Order Summary
      </h2>
      <hr className="border-gray-500/30 my-5" />
      <div className="space-y-6">
        <div>
          <label className="text-base font-medium uppercase text-gray-600 block mb-2">
            Select Address
          </label>
          <div className="relative inline-block w-full text-sm border">
            <button
              className="peer w-full text-left px-4 pr-2 py-2 bg-white text-gray-700 focus:outline-none"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span>
                {selectedAddress
                  ? `${selectedAddress.fullName}, ${selectedAddress.area}, ${selectedAddress.city}, ${selectedAddress.state}`
                  : "Select Address"}
              </span>
              <svg
                className={`w-5 h-5 inline float-right transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-0" : "-rotate-90"
                }`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="#6B7280"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isDropdownOpen && (
              <ul className="absolute w-full bg-white border shadow-md mt-1 z-10 py-1.5">
                {userAddresses.map((address, index) => (
                  <li
                    key={index}
                    className="px-4 py-2 hover:bg-gray-500/10 cursor-pointer"
                    onClick={() => handleAddressSelect(address)}
                  >
                    {address.fullName}, {address.area}, {address.city},{" "}
                    {address.state}
                  </li>
                ))}
                <li
                  onClick={() => router.push("/add-address")}
                  className="px-4 py-2 hover:bg-gray-500/10 cursor-pointer text-center"
                >
                  + Add New Address
                </li>
              </ul>
            )}
          </div>
        </div>

        <div>
          <label className="text-base font-medium uppercase text-gray-600 block mb-2">
            Promo Code
          </label>
          <div className="flex flex-col items-start gap-3">
            <input
              type="text"
              placeholder="Enter promo code"
              className="flex-grow w-full outline-none p-2.5 text-gray-600 border"
            />
            <button className="bg-orange-600 text-white px-9 py-2 hover:bg-orange-700">
              Apply
            </button>
          </div>
        </div>

        <hr className="border-gray-500/30 my-5" />

        <div className="space-y-4">
          <div className="flex justify-between text-base font-medium">
            <p className="uppercase text-gray-600">Items {getCartCount()}</p>
            <p className="text-gray-800">
              {currency}
              {getCartAmount()}
            </p>
          </div>
          <div className="flex justify-between">
            <p className="text-gray-600">Shipping Fee</p>
            <p className="font-medium text-gray-800">Free</p>
          </div>
          <div className="flex justify-between">
            <p className="text-gray-600">Tax (2%)</p>
            <p className="font-medium text-gray-800">
              {currency}
              {Math.floor(getCartAmount() * 0.02)}
            </p>
          </div>
          <div className="flex justify-between text-lg md:text-xl font-medium border-t pt-3">
            <p>Total</p>
            <p>
              {currency}
              {getCartAmount() + Math.floor(getCartAmount() * 0.02)}
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={createOrder}
        disabled={isLoading}
        className={`w-full bg-orange-600 text-white py-3 mt-5 hover:bg-orange-700 relative ${
          isLoading ? "opacity-70 cursor-not-allowed" : ""
        }`}
      >
        {isLoading ? (
          <>
            <span className="opacity-0">Place Order</span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          </>
        ) : (
          "Place Order"
        )}
      </button>
    </div>
  );
};

export default OrderSummary;
