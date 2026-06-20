type ButtonProps = {
  text: string;
  color: "blue" | "yellow";
  onClick: () => void;
};

export default function Button({
  text,
  color,
  onClick,
}: ButtonProps) {
  const bgColor =
    color === "blue"
      ? "bg-blue-500"
      : "bg-yellow-500";

  return (
    <button
      onClick={onClick}
      className={`
        rounded-full
        px-8
        py-4
        text-xl
        font-bold
        text-white
        transition-all
        duration-300
        hover:scale-105
        shadow-lg
        hover:shadow-xl
        ${bgColor}
      `}
    >
      {text}
    </button>
  );
}