import { useEffect, useState } from 'react'
import { Check, Crosshair, LocateFixed } from 'lucide-react'

export default function TargetSelector({ targets, target, onSelect, loading }) {
  const [ra, setRa] = useState(target.ra)
  const [dec, setDec] = useState(target.dec)
  const [validation, setValidation] = useState('')

  useEffect(() => {
    setRa(target.ra)
    setDec(target.dec)
  }, [target.ra, target.dec])

  const selectPreset = (next) => {
    setValidation('')
    onSelect(next, true)
  }

  const loadCoordinates = (event) => {
    event.preventDefault()
    if (!ra.trim() || !dec.trim()) {
      setValidation('Enter both right ascension and declination.')
      return
    }
    setValidation('')
    onSelect({ id: 'custom', name: 'Custom sky patch', ra: ra.trim(), dec: dec.trim(), type: 'User-defined coordinates', distance: 'Uncatalogued', constellation: 'Field of view', color: '#70d7e8', epochs: target.epochs }, false)
  }

  return (
    <section className="panel target-panel">
      <div className="panel-heading">
        <div className="heading-icon"><Crosshair size={16} /></div>
        <div>
          <span className="eyebrow">MISSION CATALOG</span>
          <h2>Select a target</h2>
        </div>
        {loading && <span className="subtle-label">SYNCING</span>}
      </div>
      <div className="target-card-list">
        {targets.map((item, index) => {
          const selected = item.id === target.id
          return (
            <button type="button" className={`target-card ${selected ? 'selected' : ''}`} onClick={() => selectPreset(item)} key={item.id} aria-pressed={selected}>
              <span className="target-index">0{index + 1}</span>
              <span className="target-card-copy"><strong>{item.name}</strong><small>{item.ra} <i>/</i> {item.dec}</small></span>
              <span className="target-select-mark">{selected && <Check size={13} />}</span>
            </button>
          )
        })}
      </div>
      <form className="coordinate-form" onSubmit={loadCoordinates}>
        <div className="coordinate-title">
          <span className="field-label">CUSTOM COORDINATES</span>
          <span className="coordinate-system">J2000 / ICRS</span>
        </div>
        <div className="coordinate-inputs">
          <label>
            <span>RA</span>
            <input aria-label="Right ascension" value={ra} onChange={(event) => setRa(event.target.value)} placeholder="hh:mm:ss" />
          </label>
          <label>
            <span>DEC</span>
            <input aria-label="Declination" value={dec} onChange={(event) => setDec(event.target.value)} placeholder="±dd:mm:ss" />
          </label>
        </div>
        {validation && <p className="validation-message" role="alert">{validation}</p>}
        <button className="load-button" type="submit"><LocateFixed size={15} /> LOAD SKY PATCH</button>
      </form>
    </section>
  )
}
