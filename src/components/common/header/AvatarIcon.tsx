export interface AvatarIconProps {
  name?: string;
  size?: number;
  src?: string;
}

// Generate a color from a string
function getColorFromName(name: string, colors: string[]) {
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name?.length; i++) {
    hash = name?.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math?.abs(hash) % colors?.length];
}

const bgColors = [
  '#EF4444', // red
  '#22C55E', // green
  '#3B82F6', // blue
  '#FACC15', // yellow
  '#A855F7', // purple
  '#EC4899', // pink
  '#6366F1', // indigo
];

const textColors = [
  '#FFFFFF', // white
  '#000000', // black
  '#F3F4F6', // gray-100
  '#1F2937', // gray-800
];

const AvatarIcon: React.FC<AvatarIconProps> = ({ name = '', size = 32, src }) => {
  const getInitial = (fullName: string) =>
    fullName ? fullName[0]?.toUpperCase() : '?';

  const bgColor = getColorFromName(name, bgColors);
  const textColor = getColorFromName(name, textColors);

  if (!src) {
    return (
      <img
        src={src}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
        }}
      />
    );
  }

  return (
    <div
      className="font-bold user"
      style={{
        width: size,
        height: size,
        fontSize: size / 2,
        borderRadius: '50%',
        background: bgColor,
        color: textColor,
      }}
    >
      <h1> {getInitial(name)}</h1>
    </div>
  );
};

export default AvatarIcon;
