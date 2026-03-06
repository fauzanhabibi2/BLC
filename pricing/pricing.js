document.addEventListener('DOMContentLoaded', () => {
  const loader = document.getElementById('page-loader')
  let audioCtxLoad
  function soundPref() {
    const v = localStorage.getItem('blc_sound')
    return v === null || v === '1'
  }
  async function playLoadStart() {
    if (!soundPref()) return
    try {
      audioCtxLoad = audioCtxLoad || new (window.AudioContext || window.webkitAudioContext)()
      if (audioCtxLoad.state === 'suspended') await audioCtxLoad.resume()
      const t = audioCtxLoad.currentTime
      const o = audioCtxLoad.createOscillator()
      const g = audioCtxLoad.createGain()
      o.type = 'sine'
      o.frequency.setValueAtTime(520, t)
      o.frequency.exponentialRampToValueAtTime(720, t + 0.12)
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(0.18, t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22)
      o.connect(g); g.connect(audioCtxLoad.destination)
      o.start(t); o.stop(t + 0.24)
    } catch {}
  }
  async function playLoadEnd() {
    if (!soundPref()) return
    try {
      audioCtxLoad = audioCtxLoad || new (window.AudioContext || window.webkitAudioContext)()
      if (audioCtxLoad.state === 'suspended') await audioCtxLoad.resume()
      const t = audioCtxLoad.currentTime
      const o = audioCtxLoad.createOscillator()
      const g = audioCtxLoad.createGain()
      o.type = 'triangle'
      o.frequency.setValueAtTime(820, t)
      o.frequency.linearRampToValueAtTime(660, t + 0.12)
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(0.22, t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22)
      o.connect(g); g.connect(audioCtxLoad.destination)
      o.start(t); o.stop(t + 0.24)
    } catch {}
  }
  if (loader) {
    playLoadStart()
    setTimeout(() => { loader.classList.add('hide'); playLoadEnd() }, 600)
    setTimeout(() => { try { loader.remove() } catch {} }, 1300)
  }

  const input = document.getElementById('subjectsInput')
  const cards = Array.from(document.querySelectorAll('.plan-card'))
  const fmt = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })

  function clamp(n, min, max) {
    if (Number.isNaN(n)) return min
    return Math.max(min, Math.min(max, n))
  }

  function updateTotals() {
    const subjects = clamp(parseInt(input.value, 10), parseInt(input.min || '1', 10), parseInt(input.max || '999', 10))
    if (String(subjects) !== input.value) input.value = String(subjects)
    cards.forEach(card => {
      const per = parseInt(card.getAttribute('data-per-subject') || '0', 10)
      const total = per * subjects
      const el = card.querySelector('.total-value')
      if (el) el.textContent = fmt.format(total)
    })
  }

  if (input) {
    input.addEventListener('input', updateTotals)
    input.addEventListener('wheel', e => e.preventDefault(), { passive: false })
    input.addEventListener('keydown', e => {
      if (['ArrowUp','ArrowDown','PageUp','PageDown','+','-'].includes(e.key)) e.preventDefault()
    })
    let chosenPlan = ''
    function updateWA() {
      const subjects = clamp(parseInt(input.value, 10), parseInt(input.min || '1', 10), parseInt(input.max || '999', 10))
      const link = document.querySelector('.consult-wa')
      if (link) {
        const text = `Halo, saya ingin konsultasi pemilihan paket BLC.%0A` +
          `Paket: ${chosenPlan || '-'}%0A` +
          `Jumlah mata pelajaran: ${subjects}%0A` +
          `Mohon rekomendasinya.`
        link.setAttribute('href', `https://wa.me/?text=${text}`)
      }
    }
    const consultToggle = document.querySelector('.consult-toggle')
    const consultPanel = document.getElementById('consult-panel')
    if (consultToggle && consultPanel) {
      let audioCtx
      let soundEnabled = true
      const stored = localStorage.getItem('blc_sound')
      if (stored !== null) soundEnabled = stored === '1'
      const soundToggle = document.getElementById('soundToggle')
      if (soundToggle) {
        soundToggle.checked = soundEnabled
        soundToggle.addEventListener('change', () => {
          soundEnabled = soundToggle.checked
          localStorage.setItem('blc_sound', soundEnabled ? '1' : '0')
        })
      }
      async function playNotify() {
        if (!soundEnabled) return
        try {
          audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)()
          if (audioCtx.state === 'suspended') await audioCtx.resume()
          const t = audioCtx.currentTime
          const o = audioCtx.createOscillator()
          const g = audioCtx.createGain()
          o.type = 'triangle'
          o.frequency.setValueAtTime(820, t)
          o.frequency.exponentialRampToValueAtTime(1200, t + 0.08)
          g.gain.setValueAtTime(0, t)
          g.gain.linearRampToValueAtTime(0.22, t + 0.02)
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22)
          o.connect(g)
          g.connect(audioCtx.destination)
          o.start(t)
          o.stop(t + 0.24)
        } catch {}
      }
      const openPanel = () => {
        consultToggle.setAttribute('aria-expanded', 'true')
        consultPanel.hidden = false
        // ensure transition
        requestAnimationFrame(() => consultPanel.classList.add('show'))
        updateWA()
        playNotify()
      }
      const closePanel = () => {
        consultToggle.setAttribute('aria-expanded', 'false')
        consultPanel.classList.remove('show')
        setTimeout(() => { consultPanel.hidden = true }, 220)
      }
      consultToggle.addEventListener('click', () => {
        const open = consultToggle.getAttribute('aria-expanded') === 'true'
        open ? closePanel() : openPanel()
      })
      document.querySelectorAll('.consult-quick .quick').forEach(btn => {
        btn.addEventListener('click', () => {
          chosenPlan = btn.getAttribute('data-plan') || ''
          btn.classList.remove('pulse')
          // restart animation
          void btn.offsetWidth
          btn.classList.add('pulse')
          updateWA()
        })
      })
      setTimeout(() => {
        const isOpen = consultToggle.getAttribute('aria-expanded') === 'true'
        if (!isOpen && consultPanel.hidden) openPanel()
      }, 10000)
    }
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const h = card.querySelector('h3')
        chosenPlan = h ? h.textContent.trim() : ''
        updateWA()
      })
    })
    const plans = document.querySelector('.plans')
    const rain = document.querySelector('.money-rain')
    const isMobile = window.matchMedia('(max-width: 680px)').matches
    if (plans && rain && !isMobile) {
      rain.classList.add('physics')
      const symbols = ['💵','💸','🪙']
      const bills = []
      const count = 28
      let W = 0, H = 0
      function measure() {
        const r = plans.getBoundingClientRect()
        W = r.width
        H = r.height
      }
      measure()
      window.addEventListener('resize', measure)
      function spawn(b) {
        b.x = Math.random() * W
        b.y = Math.random() * H
        b.vx = (Math.random() * 2 - 1) * 30
        b.vy = (Math.random() * 2 - 1) * 20
        b.scale = .9 + Math.random() * .5
        b.angle = Math.random() * 20 - 10
        b.spin = (Math.random() * 2 - 1) * 20
        b.el.style.opacity = '.85'
        b.r = 14 * b.scale
        b.m = 0.6 + b.scale
      }
      for (let i = 0; i < count; i++) {
        const el = document.createElement('span')
        el.className = 'bill'
        el.textContent = symbols[i % symbols.length]
        rain.appendChild(el)
        const b = { el, x: 0, y: 0, vx: 0, vy: 0, scale: 1, angle: 0, spin: 0 }
        spawn(b)
        bills.push(b)
      }
      let mx = -9999, my = -9999, pmx = -9999, pmy = -9999
      let mvx = 0, mvy = 0
      plans.addEventListener('mousemove', (e) => {
        const r = plans.getBoundingClientRect()
        pmx = mx; pmy = my
        mx = e.clientX - r.left
        my = e.clientY - r.top
        mvx = isFinite(pmx) ? mx - pmx : 0
        mvy = isFinite(pmy) ? my - pmy : 0
      })
      plans.addEventListener('mouseleave', () => { mx = -9999; my = -9999; mvx = 0; mvy = 0 })
      let last = performance.now()
      function tick(t) {
        const dt = Math.min((t - last) / 1000, 0.033)
        last = t
        const windX = Math.sin(t * 0.00025) * 6
        const windY = Math.cos(t * 0.00018) * 3
        for (const b of bills) {
          if (mx > -1000) {
            const dx = b.x - mx
            const dy = b.y - my
            const d2 = dx * dx + dy * dy
            const r = 110
            if (d2 < r * r) {
              const d = Math.max(Math.sqrt(d2), 1)
              const nx = dx / d, ny = dy / d
              const strength = 1600 / (d + 30)
              b.vx += (nx * strength + mvx * 0.18) * dt
              b.vy += (ny * strength + mvy * 0.18) * dt
              const boost = 1 + Math.max(0, (r - d) / r) * 0.8
              b.vx *= boost
              b.vy *= boost
            }
          }
          b.vx += windX * dt
          b.vy += windY * dt
          b.vx *= 0.985
          b.vy *= 0.985
          b.x += b.vx * dt
          b.y += b.vy * dt
          b.angle += b.spin * dt
          const sp = Math.hypot(b.vx, b.vy)
          const maxV = 260
          if (sp > maxV) {
            const k = maxV / sp
            b.vx *= k
            b.vy *= k
          }
          if (b.x < -20) b.x = W + 20
          if (b.x > W + 20) b.x = -20
          if (b.y < -20) b.y = H + 20
          if (b.y > H + 20) b.y = -20
          b.el.style.transform = `translate(${b.x}px, ${b.y}px) rotate(${b.angle}deg) scale(${b.scale})`
        }
        for (let i = 0; i < bills.length; i++) {
          for (let j = i + 1; j < bills.length; j++) {
            const a = bills[i], b = bills[j]
            const dx = b.x - a.x
            const dy = b.y - a.y
            const dist2 = dx * dx + dy * dy
            const rad = a.r + b.r
            if (dist2 > 0 && dist2 < rad * rad) {
              const dist = Math.sqrt(dist2)
              const nx = dx / dist
              const ny = dy / dist
              const overlap = rad - dist
              const total = a.m + b.m
              a.x -= nx * overlap * (b.m / total)
              a.y -= ny * overlap * (b.m / total)
              b.x += nx * overlap * (a.m / total)
              b.y += ny * overlap * (a.m / total)
              const rvx = b.vx - a.vx
              const rvy = b.vy - a.vy
              const rvn = rvx * nx + rvy * ny
              if (rvn < 0) {
                const e = 0.84
                const imp = -(1 + e) * rvn / (1 / a.m + 1 / b.m)
                a.vx -= (imp * nx) / a.m
                a.vy -= (imp * ny) / a.m
                b.vx += (imp * nx) / b.m
                b.vy += (imp * ny) / b.m
              }
            }
          }
        }
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }
    const stepper = document.querySelector('.stepper')
    if (stepper) {
      const min = parseInt(input.min || '1', 10)
      const max = parseInt(input.max || '999', 10)
      stepper.querySelectorAll('.stepper-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const step = parseInt(btn.getAttribute('data-step') || '0', 10)
          const current = clamp(parseInt(input.value, 10), min, max)
          const next = clamp(current + step, min, max)
          input.value = String(next)
          updateTotals()
        })
      })
    }
    updateTotals()
    updateWA()
  }
  const bubbleBtn = document.querySelector('.bubble-toggle')
  const bubblePanel = document.querySelector('.bubble-panel')
  if (bubbleBtn && bubblePanel) {
    const toggle = (open) => {
      bubbleBtn.setAttribute('aria-expanded', String(open))
      bubblePanel.classList.toggle('open', open)
    }
    bubbleBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      const open = bubbleBtn.getAttribute('aria-expanded') !== 'true'
      toggle(open)
    })
    document.addEventListener('click', () => toggle(false))
  }
})
