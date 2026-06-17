"use client";

interface ToastProps {
  message: string;
  visible: boolean;
}

export default function Toast({ message, visible }: ToastProps) {
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1A1A1A] text-white px-5 py-[11px] rounded-full text-[13px] whitespace-nowrap max-w-[90%] z-[999] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {message}
    </div>
  );
}
