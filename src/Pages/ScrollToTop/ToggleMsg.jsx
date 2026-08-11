import React, { useEffect, useState } from "react";
import { FaArrowUp } from "react-icons/fa";
import { Phone, MessageSquare, Mail, MessageCircle, X } from "lucide-react"; // Using Lucide for clean icons

const ToggleMsg = () => {
  const [isOpen, setIsOpen] = useState(false);

  const channels = [
    {
      id: "whatsapp",
      label: "WhatsApp",
      color: "bg-[#25D366]",
      link: "https://wa.me/8375076646",
      // Standardized 24x24 path for perfect centering
      svg: (
        <path
          d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 0 5.414 0 12.05c0 2.123.552 4.197 1.603 6.02L0 24l6.135-1.61a11.802 11.802 0 005.911 1.603h.005c6.635 0 12.05-5.414 12.05-12.051a11.818 11.818 0 00-3.489-8.522z"
          fill="currentColor"
        />
      ),
    },
    {
      id: "call",
      label: "Call",
      color: "bg-[#66a559]",
      link: "tel:+918375076646",
      svg: (
        <path
          d="M6.62 10.79a15.15 15.15 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.27 11.72 11.72 0 003.7.59 1 1 0 011 1V20a1 1 0 01-1 1A15 15 0 013 6a1 1 0 011-1h3.41a1 1 0 011 1 11.72 11.72 0 00.59 3.7 1 1 0 01-.27 1.11z"
          fill="currentColor"
        />
      ),
    },
    {
      id: "email",
      label: "Email",
      color: "bg-[#ff6c5c]",
      link: "mailto:hgptools@rediffmail.com",

      svg: (
        <path
          d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
          fill="currentColor"
        />
      ),
    },
  ];

  return (
    <>
      <div className="fixed bottom-26 right-6 flex flex-col items-center z-[9999] w-20">
        {/* Sub-buttons Stack: Positioned directly ABOVE the main button */}
        <div
          className={`flex flex-col mb-4 gap-4 transition-all duration-300 ease-in-out ${isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"}`}
        >
          
          {channels.map((channel, index) => (
            <div
              key={channel.id}
              className="relative flex flex-col items-center group"
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              {/* Tooltip Label: Now positioned to the LEFT of each small button to keep the center clear */}
              <span className="absolute right-full mr-3 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap top-1/2 -translate-y-1/2">
                {channel.label}
              </span>

              {/* Sub-button Icon */}
              <a
                href={channel.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`${channel.color} text-white w-11 h-11 flex items-center justify-center rounded-full shadow-lg hover:scale-110 transition-transform`}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  {channel.svg}
                </svg>
              </a>
            </div>
          ))}
        </div>

        {/* Main Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all duration-300 transform active:scale-90 ${isOpen ? "bg-white text-gray-400 rotate-90" : "bg-blue-800 text-white"}`}
        >
          {isOpen ? (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg viewBox="-496 507.7 54 54" className="h-9 w-9">
              <path
                className="fill-white"
                d="M-459.9,523.7h-20.3c-1.9,0-3.4,1.5-3.4,3.4v15.3c0,1.9,1.5,3.4,3.4,3.4h11.4l5.9,4.9c0.2,0.2,0.3,0.2,0.5,0.2 h0.3c0.3-0.2,0.5-0.5,0.5-0.8v-4.2h1.7c1.9,0,3.4-1.5,3.4-3.4v-15.3C-456.5,525.2-458,523.7-459.9,523.7z"
              />
              <path
                fill="#808080"
                d="M-477.7,530.5h11.9c0.5,0,0.8,0.4,0.8,0.8l0,0c0,0.5-0.4,0.8-0.8,0.8h-11.9c-0.5,0-0.8-0.4-0.8-0.8l0,0C-478.6,530.8-478.2,530.5-477.7,530.5z"
              />
              <path
                fill="#808080"
                d="M-477.7,533.5h7.9c0.5,0,0.8,0.4,0.8,0.8l0,0c0,0.5-0.4,0.8-0.8,0.8h-7.9c-0.5,0-0.8-0.4-0.8-0.8l0,0C-478.6,533.9-478.2,533.5-477.7,533.5z"
              />
            </svg>
          )}
        </button>
      </div>
    </>
  );
};

export default ToggleMsg;
