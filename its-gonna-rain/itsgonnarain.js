let audioContext = new AudioContext()

// pick loop start and end (seconds)
let startTime = 3.4
let endTime = 4.9


fetch('itsgonnarain-long.wav')
    // we want the incoming data as a binary ArrayBuffer object 
    .then(res => res.arrayBuffer())
    // when browser has finished receiving every last bit of the (binary) data
    // turn our mp3 ArrayBuffer into a decoded AudioBuffer
    .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
    .then(audioBuffer => {
        // play our loops

        // startloop(audioBuffer, pan=-1, rate=1)
        // startloop(audioBuffer, pan=1, rate=1.01)
    })
    .catch(err => console.error(err))


function startloop(audioBuffer, pan = 0, rate = 1) {
    // create graph nodes
    let sourceNode = audioContext.createBufferSource()
    let pannerNode = audioContext.createStereoPanner()

    // set properties nodes
    sourceNode.buffer = audioBuffer
    sourceNode.loop = true
    sourceNode.loopStart = startTime
    sourceNode.loopEnd = endTime

    sourceNode.playbackRate.value = rate
    pannerNode.pan.value = pan

    // connect nodes
    sourceNode.connect(pannerNode)
    pannerNode.connect(audioContext.destination)

    // delay(seconds), offset(seconds), duration(seconds)
    sourceNode.start(0, startTime)
}