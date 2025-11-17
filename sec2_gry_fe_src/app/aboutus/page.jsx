"use client";

import Navbar from "../components/Navbar";
import { Instagram } from "lucide-react";

export default function AboutUs() {
    const teamMembers = [
        {
            surname: "ทิพย์วารีรัตนะ",
            firstName: "ธนกร",
            roleDescription: "ตำแหน่ง: ผู้ดูแลระบบ",
            instagramHandle: "bbank_16",
            instagramUrl: "https://www.instagram.com/bbank_16?igsh=MTJiZmFvdW9iZjZxZQ==",
            imgPlaceholderUrl: "https://img.freepik.com/free-photo/3d-cartoon-character_23-2151021986.jpg?semt=ais_hybrid&w=740&q=80",
        },
        {
            surname: "จิรานันทวงศ์",
            firstName: "พิมพ์วิภา",
            roleDescription: "ตำแหน่ง: UX/UI",
            instagramHandle: "_aapptk_",
            instagramUrl: "https://www.instagram.com/_aapptk_?igsh=YWp4MjFrNzc5Z3U2",
            imgPlaceholderUrl: "https://img.freepik.com/free-photo/cute-ai-generated-cartoon-bunny_23-2150288872.jpg?semt=ais_hybrid&w=740&q=80",
        },
        {
            surname: "บุรีมาต",
            firstName: "จิดาภา",
            roleDescription: "ตำแหน่ง: นักพัฒนา",
            instagramHandle: "drrrrx__",
            instagramUrl: "https://www.instagram.com/drrrrx__?igsh=Y2NwZHQwOTQ1YjRp",
            imgPlaceholderUrl: "https://img.freepik.com/free-photo/adorable-mushroom-illustration_23-2151700697.jpg?semt=ais_hybrid&w=740&q=80",
        },
        {
            surname: "แก้วชิงดวง",
            firstName: "อัญมณี",
            roleDescription: "ตำแหน่ง: UX/UI",
            instagramHandle: "baeyemrn",
            instagramUrl: "https://www.instagram.com/baeyemrn?igsh=MTU5dHpueXdwaWdkcQ==",
            imgPlaceholderUrl: "https://easydrawingguides.com/wp-content/uploads/2024/06/how-to-draw-an-easy-spider-man-featured-image-1200.png",
        },
    ];

    return (
        <div>
    
            
            <style>
                {`
                    .team-header {
                        text-align: center;
                        padding: 4.5rem 0;
                    }
    
                    .team-header h1 {
                        font-size: 3.75rem;
                        font-weight: bold;
                        font-family: sans-serif;
                    }
    
                    .member-card {
                        background: rgba(209, 250, 229, 0.5);
                        border: 2px solid rgb(110, 231, 183);
                        padding: 1.5rem;
                        border-radius: 1.5rem;
                        text-align: center;
                        max-width: 16rem;
                        transition: 0.3s;
                    }
    
                    .member-card:hover {
                        transform: scale(1.05);
                        box-shadow: 0 10px 25px rgba(52, 211, 153, 0.4);
                    }
                `}
            </style>
    
            <Navbar />
    
            <header className="team-header">
                <h1>LINEGIRL TEAM</h1>
            </header>
    
            <section className="max-w-6xl mx-auto px-4 pt-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 place-items-center">
    
                    {teamMembers.map((member, index) => (
                        <article
                            key={index}
                            className="member-card"
                        >
                            <div className="w-48 h-48 overflow-hidden rounded-xl border border-emerald-500 mx-auto">
                                <img
                                    src={member.imgPlaceholderUrl}
                                    alt={member.firstName}
                                    className="w-full h-full object-cover"
                                />
                            </div>
    
                            <div className="mt-4 space-y-1 text-[17px]">
                                <p>ชื่อ: {member.firstName}</p>
                                <p>นามสกุล: {member.surname}</p>
                                <p>{member.roleDescription}</p>
                            </div>
    
                            <a
                                href={member.instagramUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 text-pink-500 font-semibold mt-3 hover:text-pink-600"
                            >
                                <Instagram size={18} /> @{member.instagramHandle}
                            </a>
                        </article>
                    ))}
    
                </div>
            </section>
        </div>
    );
    
}
