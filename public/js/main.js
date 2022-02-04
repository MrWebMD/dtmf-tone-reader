function init(){

	var canvas = document.createElement("canvas");

	canvas.width = width = 600;//window.innerWidth;
	canvas.height = height = 500;//window.innerHeight;

	ctx = canvas.getContext("2d");

	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, width, height);

	//document.body.appendChild(canvas);
	document.querySelector("#canvasContainer").appendChild(canvas);
	var analyzeButton = document.querySelector("#analyzeButton");

	toneLengthDelay = 100//380;
	minAmplitude = 130;

	analyzeButton.onclick = analyzeAudio;

	dtmfToneMap = [
		{
			char: "1",
			highGroup: 1209,
			lowGroup: 697,
		},
		{
			char: "2",
			highGroup: 1336,
			lowGroup: 697,
		},
		{
			char: "3",
			highGroup: 1477,
			lowGroup: 697,
		},
		{
			char: "4",
			highGroup: 1209,
			lowGroup: 770,
		},
		{
			char: "5",
			highGroup: 1336,
			lowGroup: 770,
		},
		{
			char: "6",
			highGroup: 1477,
			lowGroup: 770,
		},
		{
			char: "7",
			highGroup: 1209,
			lowGroup: 852,
		},
		{
			char: "8",
			highGroup: 1336,
			lowGroup: 852,
		},
		{
			char: "9",
			highGroup: 1477,
			lowGroup: 852,
		}
	]

}

function analyzeAudio(){

	if(typeof mainInterval != "undefined"){
		clearInterval(mainInterval);
	}

	if(typeof audioCtx == "undefined"){
		audioClip = document.querySelector("#audioClip");

		audioCtx = new AudioContext();

		dest = audioCtx.createMediaStreamDestination();

		analyser = audioCtx.createAnalyser();

		analyser.fftSize = 2048//256//2048;

		bufferLength = analyser.frequencyBinCount;
		audioDataArray = new Uint8Array(bufferLength);
		sourceNode = audioCtx.createMediaElementSource(audioClip);

		sourceNode.connect(analyser);

		sourceNode.connect(dest);
		sourceNode.connect(audioCtx.destination);
	}

	allCharacters = [];
	allowedToRead = true;
	mainInterval = setInterval(() => {
		analyser.getByteFrequencyData(audioDataArray);

		visualize(audioDataArray);

		var condensedAudioDataArray = condenseAudioData(audioDataArray);


		if (allowedToRead){
			var charactersFound = readDTMF(condensedAudioDataArray);

		}
		if(charactersFound != [] && allowedToRead){
			allCharacters = [...allCharacters, ...charactersFound];
			console.log(charactersFound.toString());
			document.querySelector("#output").innerHTML = allCharacters.toString();

			allowedToRead = false;
			setTimeout(function(){
				allowedToRead = true;
			}, toneLengthDelay)
		}


	}, 1000/60)

	audioClip.onended = () => {
		document.querySelector("#output").innerHTML = allCharacters.toString();
		clearInterval(mainInterval)
	}
	audioClip.currentTime = 0;
	audioClip.play();
	//sourceNode.connect(audioCtx.destination);
}
function readDTMF(audioDataArray){

	charsFound = [];

	dtmfToneMap.forEach((toneCharData, dtmfIndex) => {

		var lowGroupFound = false;
		var highGroupFound = false;

		audioDataArray.forEach((dataPoint, audioDataIndex) => {
			if(dataPoint.amplitude < minAmplitude){

				return
			}
			if(toneCharData.highGroup >= dataPoint.minFreqRange && toneCharData.highGroup <= dataPoint.maxFreqRange){



				highGroupFound = true;
			}
			if(toneCharData.lowGroup >= dataPoint.minFreqRange && toneCharData.lowGroup <= dataPoint.maxFreqRange){
				lowGroupFound = true;
			}
		});
		if(lowGroupFound && highGroupFound){
			charsFound.push(toneCharData.char);
		}
	})

	return charsFound;
}
function condenseAudioData(arr){
	var newData = [];
	arr.forEach((dataPoint, index) => {
		if(dataPoint > 0){
			newData.push({
				minFreqRange: (audioCtx.sampleRate / analyser.fftSize) * index,
				maxFreqRange: (audioCtx.sampleRate / analyser.fftSize) * (index + 1),
				index: index,
				amplitude: dataPoint,
			});
		}
	});

	return newData;

}
function visualize(audioData){

	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, width, height);
	//console.log(audioData.toString())

	audioData.forEach((dataPoint, index) => {
		let barWidth = (width/audioData.length);
		let barHeight = dataPoint// + (25 * (index/audioData.length));
		let barColor = `rgba(255, 0, 0, 1)`;
		//${(index/audioData.length) * 255}
		let barX = index * barWidth;
		let barY = height/2//height - barHeight;

		ctx.fillStyle = barColor;
		ctx.fillRect(barX, barY, barWidth, barHeight);
		ctx.fillRect(barX, barY - barHeight, barWidth, barHeight);
	})

}

window.onload = init;
