export default function NavBar({ title, onBack, right }) {
  return (
    <div className="flex items-center h-[52px] px-[16px] shrink-0">
      <button
        onClick={onBack}
        className="shrink-0 active:scale-90 transition-transform w-[32px] h-[32px] flex items-center justify-center"
      >
        <img src="/icons/back.svg" width={24} height={24} alt="back" />
      </button>
      <div className="flex-1 text-center">
        <span className="text-[rgba(0,0,0,0.8)] text-[17px] font-semibold">{title}</span>
      </div>
      <div className="w-[32px] shrink-0 flex items-center justify-end">
        {right || null}
      </div>
    </div>
  )
}
