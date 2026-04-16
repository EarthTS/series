import type { Series } from "./types";

export const SEED_SERIES: Series[] = [
  {
    id: "s1",
    title: "ยอดกุ๊กแดนมังกร",
    description:
      "เชฟตำนานหายตัว ลูกศิษย์ออกเดินทางตามหาและเติบโตเป็นเชฟมือทองรุ่นใหม่",
    coverUrl:
      "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&q=80",
    views: 787800,
    createdAt: "2025-09-03",
    tags: ["จีนแผ่นดินใหญ่", "ติดเทรนด์"],
    episodes: [
      {
        id: "s1e1",
        title: "บทที่ 1",
        url: "https://www.bilibili.tv/th/play/2232650",
        order: 1,
      },
      {
        id: "s1e2",
        title: "บทที่ 2",
        url: "https://www.bilibili.tv/th/play/2232650",
        order: 2,
      },
    ],
  },
  {
    id: "s2",
    title: "รักเมื่อสายไป",
    description: "แรงบันดาลใจและความรักที่มาถึงในจังหวะที่ไม่คาดคิด",
    coverUrl:
      "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&q=80",
    views: 595400,
    createdAt: "2025-08-20",
    tags: ["แรงบันดาลใจ"],
    episodes: [
      {
        id: "s2e1",
        title: "ตอนที่ 1",
        url: "https://example.com/video.mp4",
        order: 1,
      },
    ],
  },
  {
    id: "s3",
    title: "พรหมลิขิต",
    description: "เรื่องราวแห่งโชคชะตาและหัวใจที่เชื่อมกัน",
    coverUrl:
      "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=600&q=80",
    views: 691400,
    createdAt: "2025-08-01",
    tags: ["ความรัก"],
    episodes: [
      {
        id: "s3e1",
        title: "ตอนที่ 1",
        url: "https://example.com/ep1.mp4",
        order: 1,
      },
      {
        id: "s3e2",
        title: "ตอนที่ 2",
        url: "https://example.com/ep2.mp4",
        order: 2,
      },
    ],
  },
];
