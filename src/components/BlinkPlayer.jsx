import { useCallback, useEffect, useRef, useState } from 'react'
import { Activity, Maximize2, Pause, Play, ScanLine } from 'lucide-react'

function drawField(canvas, target, epoch, mode) {
  const bounds = canvas.getBoundingClientRect()
  const ratio = window.devicePixelRatio || 1
  const width = Math.max(1, bounds.width)
  const height = Math.max(1, bounds.height)
  canvas.width = width * ratio
  canvas.height = height * ratio
  const context = canvas.getContext('2d')
  context.scale(ratio, ratio)

  const background = context.createLinearGradient(0, 0, width, height)
  background.addColorStop(0, '#08121d')
  background.addColorStop(0.52, '#070b13')
  background.addColorStop(1, '#10101a')
  context.fillStyle = background
  context.fillRect(0, 0, width, height)

  const seed = target.id.split('').reduce((value, char) => value + char.charCodeAt(0), 0)
  for (let index = 0; index < 190; index += 1) {
    const x = ((index * 127.1 + seed * 31.7) % 997) / 997 * width
    const y = ((index * 311.7 + seed * 17.3) % 991) / 991 * height
    const radius = ((index * 7 + seed) % 21) / 10 + 0.3
    const alpha = 0.2 + ((index * 13 + seed) % 65) / 100
    context.beginPath()
    context.arc(x, y, radius, 0, Math.PI * 2)
    context.fillStyle = index % 17 === 0 ? `rgba(111, 202, 223, ${alpha})` : `rgba(219, 232, 247, ${alpha})`
    context.fill()
  }

  const centerX = width * (0.5 + (((seed % 11) - 5) * 0.008))
  const centerY = height * (0.49 + (((seed % 7) - 3) * 0.009))
  const shift = (epoch - 2) * (mode === 'difference' ? 8 : 3)
  const colors = target.color || '#f5a46f'
  context.save()
  context.globalCompositeOperation = mode === 'difference' ? 'screen' : 'source-over'
  const glow = context.createRadialGradient(centerX + shift, centerY, 1, centerX + shift, centerY, 62)
  glow.addColorStop(0, `${colors}99`)
  glow.addColorStop(0.18, `${colors}52`)
  glow.addColorStop(1, `${colors}00`)
  context.fillStyle = glow
  context.fillRect(centerX - 70 + shift, centerY - 70, 140, 140)
  context.beginPath()
  context.arc(centerX + shift, centerY, 5 + ((seed + epoch) % 3), 0, Math.PI * 2)
  context.fillStyle = '#fff4df'
  context.shadowColor = colors
  context.shadowBlur = 20
  context.fill()
  context.shadowBlur = 0
  if (mode === 'difference') {
    context.beginPath()
    context.arc(centerX - shift * 1.4, centerY, 7, 0, Math.PI * 2)
    context.strokeStyle = 'rgba(248, 105, 117, 0.9)'
    context.lineWidth = 1.4
    context.stroke()
  }
  context.restore()

  context.strokeStyle = 'rgba(104, 173, 194, 0.16)'
  context.lineWidth = 1
  context.setLineDash([3, 5])
  context.beginPath()
  context.moveTo(centerX - 38, centerY)
  context.lineTo(centerX + 38, centerY)
  context.moveTo(centerX, centerY - 38)
  context.lineTo(centerX, centerY + 38)
  context.stroke()
  context.setLineDash([])
  context.strokeStyle = 'rgba(255,255,255,0.07)'
  context.strokeRect(18, 18, width - 36, height - 36)
}

export default function BlinkPlayer({ target }) {
  const canvasRef = useRef(null)
  const [epoch, setEpoch] = useState(2)
  const [playing, setPlaying] = useState(true)
  const [hovering, setHovering] = useState(false)
  const [fps, setFps] = useState(2)
  const [mode, setMode] = useState('blink')
  const isPlaying = playing && !hovering
  const epochs = target.epochs || ['2023-08-14', '2023-11-02', '2024-02-18', '2024-05-21', '2024-08-09']

  const paint = useCallback(() => {
    if (canvasRef.current) drawField(canvasRef.current, target, epoch, mode)
  }, [target, epoch, mode])

  useEffect(() => {
    paint()
    const observer = new ResizeObserver(paint)
    if (canvasRef.current) observer.observe(canvasRef.current)
    return () => observer.disconnect()
  }, [paint])

  useEffect(() => {
    if (!isPlaying || mode !== 'blink') return undefined
    const timer = window.setInterval(() => setEpoch((current) => (current + 1) % epochs.length), 1000 / fps)
    return () => window.clearInterval(timer)
  }, [isPlaying, mode, fps, epochs.length])

  const toggleMode = (nextMode) => {
    setMode(nextMode)
    if (nextMode === 'difference') setPlaying(false)
  }

  return (
    <section className="panel viewer-panel">
      <div className="viewer-heading">
        <div className="viewer-title">
          <div className="heading-icon"><ScanLine size={16} /></div>
          <div>
            <span className="eyebrow">MULTI-EPOCH VIEWER <span className="live-dot" /></span>
            <h2>{target.name}</h2>
          </div>
        </div>
        <div className="viewer-tools">
          <span className="frame-counter">FRAME {String(epoch + 1).padStart(2, '0')} / {String(epochs.length).padStart(2, '0')}</span>
          <button className="icon-button" aria-label="Toggle fullscreen" onClick={() => canvasRef.current?.parentElement?.requestFullscreen?.()}><Maximize2 size={15} /></button>
        </div>
      </div>
      <div
        className="sky-viewport"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        aria-label={`Infrared sky image for ${target.name}`}
      >
        <canvas ref={canvasRef} />
        <div className="viewport-coordinate">RA {target.ra}<br />DEC {target.dec}</div>
        <div className="viewport-state"><Activity size={12} /> {mode === 'difference' ? 'DIFFERENCE' : hovering ? 'HOLD FRAME' : 'BLINK ACTIVE'}</div>
        {hovering && playing && <div className="pause-notice">PLAYBACK HELD</div>}
        <span className="corner-mark top-left" /><span className="corner-mark top-right" />
        <span className="corner-mark bottom-left" /><span className="corner-mark bottom-right" />
      </div>
      <div className="epoch-line">
        <span>OBSERVATION EPOCH</span>
        <strong>{epochs[epoch]}</strong>
        <span className="epoch-band">SPHEREx / 3.2 μm</span>
      </div>
      <div className="timeline">
        <button className={`play-button ${isPlaying ? 'is-playing' : ''}`} onClick={() => setPlaying((current) => !current)} aria-label={playing ? 'Pause playback' : 'Start playback'}>
          {playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
        </button>
        <div className="scrubber-wrap">
          <div className="scrubber-labels"><span>{epochs[0]}</span><span>{epochs[epochs.length - 1]}</span></div>
          <input aria-label="Observation epoch" type="range" min="0" max={epochs.length - 1} step="1" value={epoch} onChange={(event) => setEpoch(Number(event.target.value))} />
          <div className="epoch-ticks">{epochs.map((date, index) => <button key={date} className={index === epoch ? 'active' : ''} onClick={() => setEpoch(index)} aria-label={`Show epoch ${date}`} />)}</div>
        </div>
        <label className="speed-control"><span>FPS</span><input aria-label="Playback speed in frames per second" type="range" min="1" max="6" step="1" value={fps} onChange={(event) => setFps(Number(event.target.value))} /><b>{fps}</b></label>
      </div>
      <div className="mode-row">
        <span className="field-label">VIEW MODE</span>
        <div className="mode-switch">
          <button className={mode === 'blink' ? 'selected' : ''} onClick={() => toggleMode('blink')}>BLINK MODE</button>
          <button className={mode === 'difference' ? 'selected' : ''} onClick={() => toggleMode('difference')}>DIFFERENCE / SUBTRACT</button>
        </div>
      </div>
    </section>
  )
}
