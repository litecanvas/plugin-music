/*! Music plugin for litecanvas v0.3.2 by Luiz Bills | MIT Licensed */
window.pluginMusic = plugin

export default function plugin(engine) {
  const zzfx = engine.sfx

  /**
   * Use the index to play a note
   * e.g: 1 is C4
   *
   * use a -0.5 to indicate flat or +0.5 to indicate sharp (semitones)
   * e.g: 2.5 is D#4 and -8.5 is Cb5
   *
   * @var {number[]} notes
   */

  // prettier-ignore
  const notes = [
        0,      // silence = 0

        261.63, // C4 =  1 = Dó
        293.66, // D4 =  2 = Ré
        329.63, // E4 =  3 = Mi
        349.23, // F4 =  4 = Fá
        392,    // G4 =  5 = Sol
        440,    // A4 =  6 = Lá
        493.88, // B4 =  7 = Si

        523.25, // C5 =  8 = Dó
        587.33, // D5 =  9 = Ré
        659.25, // E5 = 10 = Mi
        698.46, // F5 = 11 = Fá
        783.99, // G5 = 12 = Sol
        880,    // A5 = 13 = Lá
        987.77, // B5 = 14 = Si
    ]

  // prettier-ignore
  const DEFAULT_INSTRUMENT = [1.03,0,523.2511,.06,.2,.09,,1.22,,,,,.4,,,,,.25,.07,.22]
  const SHARP_RATIO = Math.pow(2, 1 / 12)
  const FLAT_RATIO = 1 / SHARP_RATIO
  const songs = []

  engine.listen("update", _updateAll)

  function music(bpm, notes, instrument = null) {
    let _playing = false
    let i = 0
    let wait = 0
    let accumulator = 0
    let beattime = 0
    let length = notes.length
    let _loop = false
    let _volume = 1

    const instance = {
      update(dt) {
        if (!_playing) return
        accumulator += dt

        if (accumulator < wait) return
        accumulator = 0

        notes[i] = Array.isArray(notes[i]) ? notes[i] : [notes[i]]
        let [note, time] = notes[i]
        time = time * beattime || beattime
        wait = time

        if (note) _play(note, time, _volume, instrument)

        i++
        if (i === length) {
          if (!_loop) return this.pause()
          i = 0
        }
      },
      get playing() {
        return _playing
      },
      get progress() {
        return engine.clamp(i / length, 0, 1)
      },
      play(loop = false) {
        wait = 0
        i = 0
        _loop = loop
        _playing = true
        if (!beattime) this.bpm(bpm)
      },
      pause() {
        _playing = false
      },
      resume() {
        if (this.progress % 1 === 0) {
          // restart
          return this.play()
        }
        _playing = true // or just resume
      },
      volume(value) {
        _volume = value
      },
      bpm(value) {
        beattime = Math.abs(60 / (~~value || 60))
        return beattime
      },
    }

    songs.push(instance)

    return instance
  }

  function _play(note, time = 1, volume = 1, instrument = null) {
    note = Number(note) || 0

    const index = Math.abs(Math.floor(note)) || 0
    let frequency = notes[index]

    if (0 === index || !frequency) return

    const decimal = note % 1
    if (decimal !== 0) {
      frequency *= decimal > 0 ? SHARP_RATIO : FLAT_RATIO
    }

    instrument = instrument || DEFAULT_INSTRUMENT
    const z = [...instrument]
    z[0] = z[0] * volume || instrument[0]
    z[2] = frequency
    z[4] = time
    zzfx(z)
  }

  function _updateAll(dt) {
    for (let i = 0; i < songs.length; i++) {
      if (!songs[i].playing) continue
      songs[i].update(dt)
    }
  }

  return {
    music,
  }
}
