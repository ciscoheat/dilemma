import App from './App.svelte'
import { debug } from 'debug'

debug.enable('')

///////////////////////////////////////////////////////////

// Browser console debugging
debug.log = console.log.bind(console)

// Hack to get immer.js working
// https://github.com/immerjs/immer/issues/557
if (typeof window === 'object') {
	((window.process ??= <any>{}).env ??= {}).NODE_ENV ??= "production"
}

const app = new App({
	target: document.getElementById('svelte')
});

export default app