"use client";
import React from "react";
import { assets, BagIcon, BoxIcon, CartIcon, HomeIcon } from "@/assets/assets";
import Link from "next/link";
import { useAppContext } from "../context/AppContext";
import Image from "next/image";
import { useClerk, UserButton } from "@clerk/nextjs";

const Navbar = () => {
  const { isSeller, router, user } = useAppContext();
  const { openSignIn } = useClerk();
  const handleSignIn = () => {
    if (!user) {
      openSignIn();
    } else {
      console.log("User is already signed in");
    }
  };

  return (
    <nav className="flex items-center  justify-between px-6 md:px-16 lg:px-32 py-3 border-b border-gray-300 text-gray-700">
      {/* <Image
      
        onClick={() => router.push("/")}
        src={assets.logo}
        alt="logo"
      /> */}
      <h1
        onClick={() => {
          window.location.href = "/"; // This will cause a full page refresh
        }}
        className="cursor-pointer text-orange-600 text-2xl font-serif  w-28 md:w-32"
      >
        QuickMart
      </h1>
      <div className="flex items-center gap-4 lg:gap-8 max-md:hidden">
        <Link href="/" className="hover:text-gray-900 transition">
          Home
        </Link>
        <Link href="/all-products" className="hover:text-gray-900 transition">
          Shop
        </Link>
        <Link href="/" className="hover:text-gray-900 transition">
          About Us
        </Link>
        <Link href="/" className="hover:text-gray-900 transition">
          Contact
        </Link>

        {/* {isSeller && (
          <button
            onClick={() => router.push("/seller")}
            className="text-xs border cursor-pointer px-4 py-1.5 rounded-full"
          >
            Seller Dashboard
          </button>
        )} */}

        {/* Allow for all that they see the feature; */}

        <button
          onClick={() => router.push("/seller")}
          className="text-xs border cursor-pointer px-4 py-1.5 rounded-full"
        >
          Seller Dashboard
        </button>
      </div>

      <ul className="hidden md:flex items-center gap-4 ">
        <Image className="w-4 h-4" src={assets.search_icon} alt="search icon" />
        {user ? (
          <>
            <UserButton>
              <UserButton.MenuItems>
                <UserButton.Action
                  label="cart"
                  labelIcon={<CartIcon />}
                  onClick={() => router.push("/cart")}
                />
              </UserButton.MenuItems>
              <UserButton.MenuItems>
                <UserButton.Action
                  label="my -order"
                  labelIcon={<BagIcon />}
                  onClick={() => router.push("/my-orders")}
                />
              </UserButton.MenuItems>
            </UserButton>
          </>
        ) : (
          <button
            onClick={() => handleSignIn()}
            className="flex items-center gap-2 hover:text-gray-900 transition"
          >
            <Image src={assets.user_icon} alt="user icon" />
            Account
          </button>
        )}
      </ul>

      <div className="flex items-center md:hidden gap-3">
        {isSeller && (
          <button
            onClick={() => router.push("/seller")}
            className="text-xs border px-4 py-1.5 rounded-full"
          >
            Seller Dashboard
          </button>
        )}
        {user ? (
          <>
            <UserButton>
              <UserButton.MenuItems>
                <UserButton.Action
                  label="Home"
                  labelIcon={<HomeIcon />}
                  onClick={() => router.push("/")}
                />
              </UserButton.MenuItems>
              <UserButton.MenuItems>
                <UserButton.Action
                  label="Products"
                  labelIcon={<BoxIcon />}
                  onClick={() => router.push("/all-products")}
                />
              </UserButton.MenuItems>
              <UserButton.MenuItems>
                <UserButton.Action
                  label="Cart"
                  labelIcon={<CartIcon />}
                  onClick={() => router.push("/cart")}
                />
              </UserButton.MenuItems>
              <UserButton.MenuItems>
                <UserButton.Action
                  label="My Orders"
                  labelIcon={<BagIcon />}
                  onClick={() => router.push("/my-orders")}
                />
              </UserButton.MenuItems>
            </UserButton>
          </>
        ) : (
          <button
            onClick={() => handleSignIn()}
            className="flex items-center gap-2 hover:text-gray-900 transition"
          >
            <Image src={assets.user_icon} alt="user icon" />
            Account
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
