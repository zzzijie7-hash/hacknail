export default function PageLayout({ children, bg = '#FAFAFA', innerBg = 'white', className = '' }) {
  return (
    <div
      className={`min-h-screen flex flex-col items-center ${className}`}
      style={{
        background: bg,
        fontFamily: "-apple-system, 'PingFang SC', sans-serif",
      }}
    >
      <div
        className="w-full max-w-[393px] min-h-screen flex flex-col"
        style={{ background: innerBg }}
      >
        {children}
      </div>
    </div>
  )
}
