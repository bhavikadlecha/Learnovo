import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import HeroSlider from './Hero';

function Home() {
  const location = useLocation();

  useEffect(() => {
    if (location.state?.scrollToHero) {
      const hero = document.getElementById('hero');
      if (hero) {
        hero.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location]);

  return (
    <div>
      <HeroSlider />
    </div>
  );
}

export default Home;
