export default function PageLayout({ children, bg = '#FAFAFA', innerBg = 'white', className = '' }) {
  return (
    <div
      className={`flex flex-col items-center ${className}`}
      style={{
        background: bg,
        fontFamily: "-apple-system, 'PingFang SC', sans-serif",
        minHeight: '100%',
        height: '100%',
      }}
    >
      <div
        className="w-full max-w-[393px] flex flex-col"
        style={{ background: innerBg, minHeight: '100%', height: '100%' }}
      >
        {children}
      </div>
    </div>
  )
}
