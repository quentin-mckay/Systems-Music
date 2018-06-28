const SAMPLE_LIBRARY = {
    'Grand Piano': [
        { note: 'A', octave: 4, file: 'Samples/Grand Piano/piano-f-a4.wav' },
        { note: 'A', octave: 5, file: 'Samples/Grand Piano/piano-f-a5.wav' },
        { note: 'A', octave: 6, file: 'Samples/Grand Piano/piano-f-a6.wav' },
        { note: 'C', octave: 4, file: 'Samples/Grand Piano/piano-f-c4.wav' },
        { note: 'C', octave: 5, file: 'Samples/Grand Piano/piano-f-c5.wav' },
        { note: 'C', octave: 6, file: 'Samples/Grand Piano/piano-f-c6.wav' },
        { note: 'D#', octave: 4, file: 'Samples/Grand Piano/piano-f-d#4.wav' },
        { note: 'D#', octave: 5, file: 'Samples/Grand Piano/piano-f-d#5.wav' },
        { note: 'D#', octave: 6, file: 'Samples/Grand Piano/piano-f-d#6.wav' },
        { note: 'F#', octave: 4, file: 'Samples/Grand Piano/piano-f-f#4.wav' },
        { note: 'F#', octave: 5, file: 'Samples/Grand Piano/piano-f-f#5.wav' },
        { note: 'F#', octave: 6, file: 'Samples/Grand Piano/piano-f-f#6.wav' }
    ]
}

// the function we worked up to (built from everything else)
// return a Promise object { audioBuffer, distance }
function getSample(instrument, noteAndOctave) {
    let [, requestedNote, requestedOctave] = /^(\w[#b]?)(\d)$/.exec(noteAndOctave)
    requestedOctave = parseInt(requestedOctave, 10)
    requestedNote = flatToSharp(requestedNote)

    let sampleBank = SAMPLE_LIBRARY[instrument]
    let sample = getNearestSample(sampleBank, requestedNote, requestedOctave)
    let distance = getNoteDistance(requestedNote, requestedOctave, sample.note, sample.octave)

    return fetchSample(sample.file).then(audioBuffer => ({
        audioBuffer: audioBuffer,
        distance: distance
    }))
}


function flatToSharp(note) {
    switch(note) {
        case 'Bb': return 'A#'
        case 'Db': return 'C#'
        case 'Eb': return 'D#'
        case 'Gb': return 'F#'
        case 'Ab': return 'G#'
        default:   return note
    }
}



// in order to determine the interval between 2 notes (for sampler pitchshifting)
// we need to convert them into numerical values
const OCTAVE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function noteValue(note, octave) {
    return octave * 12 + OCTAVE.indexOf(note)
}


// return distance + or - to other (note, octave)
function getNoteDistance(note1, octave1, note2, octave2) {
    return noteValue(note1, octave1) - noteValue(note2, octave2)
}

// return the instument sample object closest to the (note, octave)
// ex. getNearestSample(SAMPLE_LIBRARY['Grand Piano'], 'C#', '5')
// => { note: 'C', octave: 5, file: 'Samples/Grand Piano/piano-f-c5.wav' }
function getNearestSample(sampleBank, note, octave) {
    let sortedBank = sampleBank.slice().sort((sampleA, sampleB) => {
        let distToA = Math.abs(getNoteDistance(note, octave, sampleA.note, sampleA.octave))
        let distToB = Math.abs(getNoteDistance(note, octave, sampleB.note, sampleB.octave))
        return distToA - distToB
    })
    return sortedBank[0]
}




const audioContext = new AudioContext()

function fetchSample(path) {
    return fetch(encodeURIComponent(path))
           .then(response => response.arrayBuffer())
           .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
}


function playSample(instrument, note, destination, delaySeconds = 0) {
    getSample(instrument, note).then(({audioBuffer, distance}) => {
        let playbackRate = Math.pow(2, distance / 12)
        let bufferSource = audioContext.createBufferSource()
        bufferSource.buffer = audioBuffer
        bufferSource.playbackRate.value = playbackRate

        bufferSource.connect(destination)

        bufferSource.start(audioContext.currentTime + delaySeconds)
    })
}

// === test ===
// setTimeout(() => playSample('Grand Piano', 'F4'),  1000)
// setTimeout(() => playSample('Grand Piano', 'Ab4'), 2000)
// setTimeout(() => playSample('Grand Piano', 'C5'),  3000)
// setTimeout(() => playSample('Grand Piano', 'Db5'), 4000)
// setTimeout(() => playSample('Grand Piano', 'Eb5'), 5000)
// setTimeout(() => playSample('Grand Piano', 'F5'),  6000)
// setTimeout(() => playSample('Grand Piano', 'Ab5'), 7000)

function startLoop(instrument, note, destination, loopLengthSeconds, delaySeconds) {
    playSample(instrument, note, destination, delaySeconds)
    setInterval(
        () => playSample(instrument, note, destination, delaySeconds),
        loopLengthSeconds * 1000
    )
}



function playSong() {
    fetchSample('AirportTerminal.wav').then(convolverBuffer => {
        let convolver = audioContext.createConvolver();
        convolver.buffer = convolverBuffer;
        convolver.connect(audioContext.destination);
        startLoop('Grand Piano', 'F4', convolver, 19.7, 4.0);
        startLoop('Grand Piano', 'Ab4', convolver, 17.8, 2.1);
        startLoop('Grand Piano', 'C5', convolver, 21.3, 5.6);
        startLoop('Grand Piano', 'Db5', convolver, 22.1, 12.6);
        startLoop('Grand Piano', 'Eb5', convolver, 18.4, 9.2);
        startLoop('Grand Piano', 'F5', convolver, 20.0, 14.1);
        startLoop('Grand Piano', 'Ab5', convolver, 17.7, 8.1);
    });
}


playSong()