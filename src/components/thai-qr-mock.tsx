/** QR จำลองสำหรับ POC — ไม่ใช่พร้อมเพย์จริง */
export function ThaiQrMock({ size = 200 }: { size?: number }) {
  const cells = 29;
  const pattern: boolean[][] = [];
  for (let y = 0; y < cells; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < cells; x++) {
      const v =
        (x * 7 + y * 13 + (x % 5) * (y % 3)) % 5 === 0 ||
        (x < 7 && y < 7) ||
        (x > cells - 8 && y < 7) ||
        (x < 7 && y > cells - 8);
      row.push(v);
    }
    pattern.push(row);
  }
  const cs = size / cells;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="rounded-lg bg-white text-[#1a2433]"
      aria-hidden
    >
      <rect width={size} height={size} fill="white" />
      {pattern.map((row, y) =>
        row.map((on, x) =>
          on ? (
            <rect
              key={`${x}-${y}`}
              x={x * cs}
              y={y * cs}
              width={cs - 0.5}
              height={cs - 0.5}
              fill="currentColor"
            />
          ) : null
        )
      )}
    </svg>
  );
}
