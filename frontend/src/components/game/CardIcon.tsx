import { CardType, CARD_INFO } from "@/lib/types";
import {
  Bomb,
  Scissors,
  StepForward,
  Swords,
  Shuffle,
  Eye,
  Ban,
  HandHeart,
  Cat,
} from "lucide-react";

interface Props {
  type: CardType;
  size?: number;
  color?: string;
}

export function CardIcon({ type, size = 20, color }: Props) {
  const info = CARD_INFO[type];
  const c = color || info.color;

  switch (type) {
    case CardType.EXPLODING_KITTEN:
      return <Bomb size={size} color={c} />;
    case CardType.DEFUSE:
      return <Scissors size={size} color={c} />;
    case CardType.SKIP:
      return <StepForward size={size} color={c} />;
    case CardType.ATTACK:
      return <Swords size={size} color={c} />;
    case CardType.SHUFFLE:
      return <Shuffle size={size} color={c} />;
    case CardType.SEE_THE_FUTURE:
      return <Eye size={size} color={c} />;
    case CardType.NOPE:
      return <Ban size={size} color={c} />;
    case CardType.FAVOR:
      return <HandHeart size={size} color={c} />;
    default:
      return <Cat size={size} color={c} />;
  }
}
