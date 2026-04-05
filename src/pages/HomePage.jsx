import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function HomePage() {
  const [year, setYear] = useState(new Date().getFullYear());

  return (
    <div className="home-page">
      <div className="year-selector">
        <button className="icon-btn" onClick={() => setYear(y => y - 1)}>
          <ChevronLeft size={20} />
        </button>
        <h1 className="year-title">{year}</h1>
        <button className="icon-btn" onClick={() => setYear(y => y + 1)}>
          <ChevronRight size={20} />
        </button>
      </div>
      <p className="home-subtitle">Selecione um mês para planejar o conteúdo</p>
      <div className="months-grid">
        {MONTH_NAMES.map((name, i) => (
          <Link key={i} to={`/month/${year}/${i}`} className="month-card">
            <Calendar size={24} />
            <span className="month-name">{name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
