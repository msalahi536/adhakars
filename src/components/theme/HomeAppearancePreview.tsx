import type { CSSProperties } from 'react';
import { Sun, Moon, Settings, Volume2, BookOpen, ChevronLeft, ChevronRight, Ellipsis, Hand, CircleDot } from 'lucide-react';
import { morningAdhkar, eveningAdhkar } from '@/data/adhkar';
import { paletteTokens, type Palette, type AppearancePhase } from '@/lib/custom-appearance';

export function HomeAppearancePreview({ palette, phase, image }: { palette: Palette; phase: AppearancePhase; image: string }) {
  const list = phase === 'morning' ? morningAdhkar : eveningAdhkar;
  const dhikr = list[1] ?? list[0];
  if (!dhikr) return null;
  const reading = dhikr.arabicMulti?.[0] ?? dhikr;
  return <div className="home-appearance-preview" role="img" aria-label={`${phase} home screen preview`} style={{ ...paletteTokens(palette, phase), '--personal-photo': `url("${image}")` } as CSSProperties}>
    <div className="hap-header"><small>{phase === 'morning' ? 'BETWEEN FAJR & SUNRISE' : 'BETWEEN ASR & MAGHRIB'}</small><h3>{phase === 'morning' ? 'Morning' : 'Evening'} Adhkar</h3><Settings className="hap-settings" /><span className="hap-index">2 / {list.length}</span></div>
    <div className="hap-card"><div className="hap-card-heading"><span><Volume2 /></span><strong>{dhikr.title}</strong></div>
      <div className="hap-reading">{'label' in reading && <small>{reading.label}</small>}<p lang="ar" dir="rtl">{reading.arabic}</p><em>{reading.transliteration}</em><div>{reading.translation}</div></div>
      <div className="hap-card-footer"><span><BookOpen />Hadith details</span><div className="hap-counter">0<small>/ {dhikr.target}</small></div></div>
    </div>
    <div className="hap-pagination"><ChevronLeft /><span>{list.map((item, index) => <i key={item.id} data-active={index === 1} />)}</span><ChevronRight /></div>
    <div className="hap-nav">{[{ label: 'Morning', Icon: Sun }, { label: 'Evening', Icon: Moon }, { label: 'Salah', Icon: Hand }, { label: 'Tasbih', Icon: CircleDot }, { label: 'More', Icon: Ellipsis }].map(({ label, Icon }) => <span key={label} data-active={label.toLowerCase() === phase}><Icon />{label}</span>)}</div>
  </div>;
}