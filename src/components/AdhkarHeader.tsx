import { HeaderSettingsButton } from "./HeaderSettingsButton";
import { ProgressBar } from "./AdhkarPrimitives";

type Props = {
  title: string;
  subtitle: string;
  completed: number;
  total: number;
  action?: React.ReactNode;
  style?: React.CSSProperties;
  pattern?: React.ReactNode;
};

export function AdhkarHeader({ title, subtitle, completed, total, action, style, pattern }: Props) {
  return (
    <header className="page-header adhkar-header relative shrink-0 overflow-hidden" style={style}>
      {pattern}
      <HeaderSettingsButton />
      {action && <div className="adhkar-header-action absolute z-10">{action}</div>}
      <div className="adhkar-header-content mx-auto max-w-md px-7 text-center">
        <div className="label-caps">{subtitle}</div>
        <h1 className="app-page-title">{title}</h1>
        <ProgressBar value={completed} total={total} />
      </div>
    </header>
  );
}