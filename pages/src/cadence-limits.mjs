import * as common from '/pages/src/common.mjs';

common.settingsStore.setDefault({
	cadenceLow: 85,
	cadenceHigh: 95
});

let audioState = {
	context: null,
	elementLo: null,
	elementHi: null,
	elementOk: null,
	trackLo: null,
	trackHi: null,
	trackOk: null,
	playing: false,
};

const settings = common.settingsStore.get();

console.log(settings);

let riderState = {
	cadenceTooLow: false,
	cadenceTooHigh: false
}

export async function main() {
	audioState.context = new AudioContext();
	audioState.elementLo = document.querySelector("#cadence-low-sound");
	audioState.elementHi = document.querySelector("#cadence-high-sound");
	audioState.elementOk = document.querySelector("#cadence-ok-sound");
	audioState.trackLo = audioState.context.createMediaElementSource(audioState.elementLo);
	audioState.trackHi = audioState.context.createMediaElementSource(audioState.elementHi);
	audioState.trackOk = audioState.context.createMediaElementSource(audioState.elementOk);

	audioState.trackLo.connect(audioState.context.destination);
	audioState.trackHi.connect(audioState.context.destination);
	audioState.trackOk.connect(audioState.context.destination);

	let eventListener = () => { audioState.playing = false };
	audioState.elementLo.addEventListener("ended", eventListener, false);
	audioState.elementHi.addEventListener("ended", eventListener, false);
	audioState.elementOk.addEventListener("ended", eventListener, false);
	
	common.initInteractionListeners();
	common.subscribe('athlete/watching', checkCadence);

	document.querySelector("#cadence-lower-bound").innerText = settings.cadenceLow;
	document.querySelector("#cadence-upper-bound").innerText = settings.cadenceHigh;
}

async function checkCadence(data) {
	if (audioState.context.state === "suspended")
		audioState.context.resume();

	if (data.state.cadence == 0)
		return;

	if (data.state.cadence < settings.cadenceLow)
	{
		if (audioState.playing || riderState.cadenceTooLow)
			return;

		audioState.playing = true;
		riderState.cadenceTooLow = true;
		riderState.cadenceTooHigh = false;
		audioState.elementLo.play();
	}
	else if (data.state.cadence > settings.cadenceHigh)
	{
		if (audioState.playing || riderState.cadenceTooHigh)
			return;

		audioState.playing = true;
		riderState.cadenceTooHigh = true;
		riderState.cadenceTooLow = true;
		audioState.elementHi.play();
	}
	else
	{
		if (audioState.playing || (!riderState.cadenceTooHigh && !riderState.cadenceTooLow))
			return;

		audioState.playing = true;
		riderState.cadenceTooHigh = false;
		riderState.cadenceTooLow = false;
		audioState.elementOk.play();
	}
}

export async function settingsMain() {
	common.initInteractionListeners();
	await common.initSettingsForm('form')();
}
