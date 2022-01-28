import App from './App.svelte'
import { debug } from 'debug'

///// Debugging /////////////

debug.enable('')

///// Hacks /////////////////

// Browser console debugging
if (typeof window === 'object') {
	debug.log = console.log.bind(console)
}

// Hack to get immer.js working
// https://github.com/immerjs/immer/issues/557
if (typeof window === 'object') {
	((window.process ??= <any>{}).env ??= {}).NODE_ENV ??= "production"
}

///// Start app /////////////

const app = new App({
	target: document.getElementById('svelte') ?? document.body
});

export default app