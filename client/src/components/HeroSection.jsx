import { memo } from 'react'

const HeroSection = memo(() => {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <h1 className="hero-title">NEW ARRIVALS</h1>
        <p className="hero-subtitle">Discover the latest trends and express your unique style</p>
        <button className="hero-cta">SHOP NOW</button>
      </div>
    </section>
  )
})

HeroSection.displayName = 'HeroSection'

export default HeroSection
