"use client"

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ArrowRight, Store, User, X } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const [signupModalOpen, setSignupModalOpen] = useState(false);

  return (
    <div className="h-screen max-h-screen w-screen overflow-hidden bg-[#F0F0EE] text-neutral-900 flex flex-col justify-between selection:bg-neutral-900 selection:text-white">
      {/* Top Navbar */}
      <header className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pt-6 pb-4 flex items-center justify-between shrink-0">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <svg
            className="w-6 h-6 text-black transition-transform group-hover:scale-105"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            {/* Geometric origami delivery mark matching reference */}
            <path d="M4 3.5l14 8.5-14 8.5 4-8.5-4-8.5z" />
          </svg>
          <span className="text-xl font-bold tracking-tight text-neutral-900 font-sans">
            Deliverly
          </span>
        </Link>

        {/* Right Auth Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-5 py-2 rounded-full border border-neutral-300 text-xs sm:text-sm font-medium text-neutral-800 hover:bg-neutral-200/50 transition-colors"
          >
            Log In
          </Link>

          <button
            onClick={() => setSignupModalOpen(true)}
            className="px-5 py-2 rounded-full bg-black text-white text-xs sm:text-sm font-medium hover:bg-neutral-800 transition-colors cursor-pointer shadow-xs"
          >
            Sign Up
          </button>
        </div>
      </header>

      {/* Hero Body (Single viewport, no scroll) */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 flex items-center justify-between gap-8 pb-8">
        {/* Left Typography & CTAs */}
        <div className="max-w-xl lg:max-w-2xl py-6 flex flex-col justify-center shrink-0">
          <p className="text-xs sm:text-sm font-medium text-neutral-400 mb-4 sm:mb-5">
            Multi Vendor Delivery Management
          </p>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-neutral-950 leading-[1.08]">
            One Platform.
            <br />
            All Your Vendors.
            <br />
            Every Delivery.
          </h1>

          <p className="mt-5 sm:mt-6 text-sm sm:text-base text-neutral-500 max-w-md leading-relaxed">
            Manage orders, track deliveries, and coordinate with multiple vendors — all in one simple platform.
          </p>

          <div className="mt-8 sm:mt-10 flex items-center gap-4">
            <button
              onClick={() => setSignupModalOpen(true)}
              className="px-6 sm:px-7 py-3 rounded-full bg-black text-white text-xs sm:text-sm font-medium hover:bg-neutral-800 transition-colors flex items-center gap-2 group cursor-pointer shadow-sm"
            >
              <span>Sign Up</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <Link
              href="/login"
              className="px-6 sm:px-7 py-3 rounded-full border border-neutral-300 bg-transparent text-neutral-800 text-xs sm:text-sm font-medium hover:bg-neutral-200/50 transition-colors"
            >
              Log In
            </Link>
          </div>
        </div>

        {/* Right Artwork (Mockup & Courier on Scooter) */}
        <div className="hidden md:flex relative flex-1 items-center justify-end h-full max-h-[580px] pointer-events-none select-none">
          <div className="relative w-full h-full max-w-[640px] aspect-[1200/896]">
            <Image
              src="/hero-delivery-hd.jpg"
              alt="Deliverly Mobile Tracking & Driver"
              fill
              priority
              className="object-contain object-right [mask-image:radial-gradient(ellipse_at_52%_50%,black_75%,transparent_99%)]"
              sizes="(max-width: 1200px) 50vw, 640px"
            />
          </div>
        </div>
      </main>

      {/* Sign Up Modal: Offers Vendor Signup & Customer Signup Button */}
      <Dialog open={signupModalOpen} onOpenChange={setSignupModalOpen}>
        <DialogContent className="sm:max-w-md bg-white text-neutral-900 border-neutral-200 p-6 rounded-2xl shadow-xl">
          <DialogHeader className="text-left pb-2">
            <DialogTitle className="text-xl font-bold tracking-tight text-neutral-900">
              Create an Account
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500 pt-1">
              Select how you would like to join the Deliverly platform.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            {/* Vendor Option (Active) */}
            <Link
              href="/signup/vendor"
              onClick={() => setSignupModalOpen(false)}
              className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 hover:border-black hover:bg-neutral-50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center text-black group-hover:bg-black group-hover:text-white transition-colors">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-neutral-900">Register as Vendor</h3>
                  <p className="text-xs text-neutral-500">Sell products & fulfill delivery orders</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
            </Link>

            {/* Customer Option */}
            <Link
              href="/signup"
              onClick={() => setSignupModalOpen(false)}
              className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 hover:border-black hover:bg-neutral-50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center text-black group-hover:bg-black group-hover:text-white transition-colors">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-neutral-900">Customer Account</h3>
                  <p className="text-xs text-neutral-500">Order from local vendors & track delivery</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>

          <div className="pt-2 text-center text-xs text-neutral-400">
            Already have an account?{" "}
            <Link
              href="/login"
              onClick={() => setSignupModalOpen(false)}
              className="text-black font-semibold hover:underline"
            >
              Log in
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
